"use client";

import { useState, useMemo } from "react";
import {
  Warehouse,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface InventoryProduct {
  id: string;
  name: string;
  sku: string;
  stock: number;
  lowThreshold: number;
  reorderPoint: number;
  reorderQty: number;
  costPerUnit: number;
}

interface StockMovement {
  id: string;
  productId: string;
  type: "in" | "out" | "adjust";
  qty: number;
  note: string;
  date: string;
}

export default function InventoryTrackerPage() {
  const [products, setProducts] = useLocalStorage<InventoryProduct[]>("products-inventory", []);
  const [movements, setMovements] = useLocalStorage<StockMovement[]>("products-inventory-movements", []);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showMovement, setShowMovement] = useState<string | null>(null);
  const [moveType, setMoveType] = useState<"in" | "out" | "adjust">("in");
  const [moveQty, setMoveQty] = useState("");
  const [moveNote, setMoveNote] = useState("");

  const [form, setForm] = useState({
    name: "", sku: "", stock: 0, lowThreshold: 10, reorderPoint: 5, reorderQty: 50, costPerUnit: 0,
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, search]);

  const lowStockItems = useMemo(() => products.filter((p) => p.stock <= p.lowThreshold), [products]);

  const stats = useMemo(() => ({
    total: products.length,
    lowStock: lowStockItems.length,
    totalValue: products.reduce((s, p) => s + p.stock * p.costPerUnit, 0),
    totalUnits: products.reduce((s, p) => s + p.stock, 0),
  }), [products, lowStockItems]);

  function openAdd() {
    setForm({ name: "", sku: "", stock: 0, lowThreshold: 10, reorderPoint: 5, reorderQty: 50, costPerUnit: 0 });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(p: InventoryProduct) {
    setForm({ name: p.name, sku: p.sku, stock: p.stock, lowThreshold: p.lowThreshold, reorderPoint: p.reorderPoint, reorderQty: p.reorderQty, costPerUnit: p.costPerUnit });
    setEditingId(p.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editingId) {
      setProducts((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...form } : p)));
    } else {
      setProducts((prev) => [{ ...form, id: generateId() }, ...prev]);
    }
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setMovements((prev) => prev.filter((m) => m.productId !== id));
  }

  function addMovement() {
    if (!showMovement || !moveQty) return;
    const qty = parseInt(moveQty) || 0;
    if (qty <= 0) return;
    const movement: StockMovement = {
      id: generateId(),
      productId: showMovement,
      type: moveType,
      qty,
      note: moveNote.trim(),
      date: new Date().toISOString(),
    };
    setMovements((prev) => [movement, ...prev]);
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== showMovement) return p;
        let newStock = p.stock;
        if (moveType === "in") newStock += qty;
        else if (moveType === "out") newStock = Math.max(0, newStock - qty);
        else newStock = qty;
        return { ...p, stock: newStock };
      })
    );
    setShowMovement(null);
    setMoveQty("");
    setMoveNote("");
  }

  function getProductMovements(productId: string) {
    return movements.filter((m) => m.productId === productId).slice(0, 10);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Tracker"
        description="Track stock levels, get low stock alerts, calculate reorder points, and log stock movements."
        icon={Warehouse}
        badge="Products"
        replaces="Spreadsheet inventory"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: stats.total, icon: Warehouse },
          { label: "Low Stock Items", value: stats.lowStock, icon: AlertTriangle, color: stats.lowStock > 0 ? "text-amber-600" : undefined },
          { label: "Total Units", value: stats.totalUnits.toLocaleString(), icon: TrendingUp },
          { label: "Inventory Value", value: `$${stats.totalValue.toLocaleString()}`, icon: TrendingUp },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={`h-4 w-4 ${s.color || "text-muted-foreground"}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-amber-600">Low Stock Alerts</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((p) => (
                <Badge key={p.id} variant="outline" className="border-amber-500/30 text-amber-600">
                  {p.name}: {p.stock} left (threshold: {p.lowThreshold})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
          <Plus className="h-4 w-4 mr-2" />Add Product
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Warehouse className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">No inventory items</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((p) => {
            const isLow = p.stock <= p.lowThreshold;
            const needsReorder = p.stock <= p.reorderPoint;
            return (
              <Card key={p.id} className={`border-border/50 hover:border-violet-500/30 transition-colors group ${isLow ? "border-amber-500/30" : ""}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{p.name}</span>
                      {p.sku && <Badge variant="outline" className="text-xs">{p.sku}</Badge>}
                      {isLow && <Badge className="bg-amber-500/10 text-amber-600 border-0 text-xs">Low Stock</Badge>}
                      {needsReorder && <Badge className="bg-red-500/10 text-red-600 border-0 text-xs">Reorder</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Stock: <span className="font-medium">{p.stock}</span> &middot;
                      Threshold: {p.lowThreshold} &middot;
                      Reorder at: {p.reorderPoint} (qty: {p.reorderQty}) &middot;
                      Value: ${(p.stock * p.costPerUnit).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setShowMovement(p.id); setMoveType("in"); }}>
                      <ArrowDownCircle className="h-3.5 w-3.5 text-emerald-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setShowMovement(p.id); setMoveType("out"); }}>
                      <ArrowUpCircle className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Product" : "Add Inventory Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Current Stock</Label><Input type="number" min="0" value={form.stock || ""} onChange={(e) => setForm((f) => ({ ...f, stock: parseInt(e.target.value) || 0 }))} /></div>
              <div className="space-y-1.5"><Label>Low Stock Threshold</Label><Input type="number" min="0" value={form.lowThreshold} onChange={(e) => setForm((f) => ({ ...f, lowThreshold: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Reorder Point</Label><Input type="number" min="0" value={form.reorderPoint} onChange={(e) => setForm((f) => ({ ...f, reorderPoint: parseInt(e.target.value) || 0 }))} /></div>
              <div className="space-y-1.5"><Label>Reorder Qty</Label><Input type="number" min="0" value={form.reorderQty} onChange={(e) => setForm((f) => ({ ...f, reorderQty: parseInt(e.target.value) || 0 }))} /></div>
              <div className="space-y-1.5"><Label>Cost/Unit ($)</Label><Input type="number" min="0" step="0.01" value={form.costPerUnit || ""} onChange={(e) => setForm((f) => ({ ...f, costPerUnit: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              {editingId ? "Save" : "Add Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showMovement} onOpenChange={(o) => !o && setShowMovement(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Stock Movement</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={moveType} onValueChange={(v) => setMoveType(v as typeof moveType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Stock In</SelectItem>
                  <SelectItem value="out">Stock Out</SelectItem>
                  <SelectItem value="adjust">Adjust To</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Quantity</Label><Input type="number" min="1" value={moveQty} onChange={(e) => setMoveQty(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Note</Label><Input value={moveNote} onChange={(e) => setMoveNote(e.target.value)} placeholder="Reason for movement" /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowMovement(null)}>Cancel</Button>
            <Button onClick={addMovement} disabled={!moveQty}>Apply</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
