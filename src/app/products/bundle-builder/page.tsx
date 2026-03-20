"use client";

import { useState, useMemo } from "react";
import { PackagePlus, Plus, Trash2, Edit2, DollarSign, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface BundleProduct {
  name: string;
  price: number;
  cost: number;
}

interface Bundle {
  id: string;
  name: string;
  description: string;
  products: BundleProduct[];
  bundlePrice: number;
  createdAt: string;
}

export default function BundleBuilderPage() {
  const [bundles, setBundles] = useLocalStorage<Bundle[]>("products-bundles", []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [bundlePrice, setBundlePrice] = useState("");
  const [products, setProducts] = useState<BundleProduct[]>([]);
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdCost, setNewProdCost] = useState("");

  function openAdd() {
    setName("");
    setDescription("");
    setBundlePrice("");
    setProducts([]);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(b: Bundle) {
    setName(b.name);
    setDescription(b.description);
    setBundlePrice(String(b.bundlePrice));
    setProducts([...b.products]);
    setEditingId(b.id);
    setShowForm(true);
  }

  function addProductToBundle() {
    if (!newProdName.trim()) return;
    setProducts((prev) => [...prev, { name: newProdName.trim(), price: parseFloat(newProdPrice) || 0, cost: parseFloat(newProdCost) || 0 }]);
    setNewProdName("");
    setNewProdPrice("");
    setNewProdCost("");
  }

  function removeProductFromBundle(idx: number) {
    setProducts((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSave() {
    if (!name.trim() || products.length === 0) return;
    const bundle: Bundle = {
      id: editingId || generateId(),
      name: name.trim(),
      description: description.trim(),
      products,
      bundlePrice: parseFloat(bundlePrice) || 0,
      createdAt: new Date().toISOString(),
    };
    if (editingId) {
      setBundles((prev) => prev.map((b) => (b.id === editingId ? bundle : b)));
    } else {
      setBundles((prev) => [bundle, ...prev]);
    }
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setBundles((prev) => prev.filter((b) => b.id !== id));
  }

  function getIndividualTotal(products: BundleProduct[]) {
    return products.reduce((s, p) => s + p.price, 0);
  }

  function getTotalCost(products: BundleProduct[]) {
    return products.reduce((s, p) => s + p.cost, 0);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bundle Builder"
        description="Create product bundles with pricing, savings display, and profitability calculations."
        icon={PackagePlus}
        badge="Products"
        replaces="Manual bundle pricing"
      />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{bundles.length}</p><p className="text-xs text-muted-foreground">Total Bundles</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{bundles.reduce((s, b) => s + b.products.length, 0)}</p><p className="text-xs text-muted-foreground">Products in Bundles</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">${bundles.reduce((s, b) => s + (b.bundlePrice - getTotalCost(b.products)), 0).toFixed(2)}</p><p className="text-xs text-muted-foreground">Total Profit</p></CardContent></Card>
      </div>

      <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
        <Plus className="h-4 w-4 mr-2" />Create Bundle
      </Button>

      {bundles.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><PackagePlus className="h-10 w-10 text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">No bundles created yet</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bundles.map((b) => {
            const indTotal = getIndividualTotal(b.products);
            const savings = indTotal - b.bundlePrice;
            const savingsPct = indTotal > 0 ? Math.round((savings / indTotal) * 100) : 0;
            const cost = getTotalCost(b.products);
            const profit = b.bundlePrice - cost;
            const profitMargin = b.bundlePrice > 0 ? Math.round((profit / b.bundlePrice) * 100) : 0;

            return (
              <Card key={b.id} className="border-border/50 group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="font-semibold text-lg">{b.name}</span>
                      {b.description && <p className="text-sm text-muted-foreground">{b.description}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <div className="space-y-1 mb-3">
                    {b.products.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>{p.name}</span>
                        <span className="text-muted-foreground">${p.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Individual Total:</span>
                      <span className="line-through">${indTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Bundle Price:</span>
                      <span className="text-violet-600">${b.bundlePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600 font-medium">Customer Saves:</span>
                      <span className="text-emerald-600 font-medium">${savings.toFixed(2)} ({savingsPct}%)</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="p-2 rounded-lg bg-muted/30 border text-center">
                      <p className="text-xs text-muted-foreground">Profit</p>
                      <p className="font-bold text-sm">${profit.toFixed(2)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30 border text-center">
                      <p className="text-xs text-muted-foreground">Margin</p>
                      <p className="font-bold text-sm">{profitMargin}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Bundle" : "Create Bundle"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Bundle Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Bundle Price ($)</Label><Input type="number" min="0" step="0.01" value={bundlePrice} onChange={(e) => setBundlePrice(e.target.value)} /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
            <div className="border rounded-lg p-3 space-y-3">
              <p className="text-sm font-medium">Bundle Products ({products.length})</p>
              {products.map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="flex-1">{p.name}</span>
                  <span>${p.price.toFixed(2)}</span>
                  <span className="text-muted-foreground text-xs">(cost: ${p.cost.toFixed(2)})</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => removeProductFromBundle(i)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              <div className="flex gap-2 items-end">
                <Input value={newProdName} onChange={(e) => setNewProdName(e.target.value)} placeholder="Product name" className="flex-1 h-8" />
                <Input type="number" min="0" step="0.01" value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} placeholder="Price" className="w-20 h-8" />
                <Input type="number" min="0" step="0.01" value={newProdCost} onChange={(e) => setNewProdCost(e.target.value)} placeholder="Cost" className="w-20 h-8" />
                <Button size="sm" onClick={addProductToBundle} disabled={!newProdName.trim()}><Plus className="h-3 w-3" /></Button>
              </div>
              {products.length > 0 && (
                <p className="text-xs text-muted-foreground">Individual total: ${getIndividualTotal(products).toFixed(2)}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!name.trim() || products.length === 0} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              {editingId ? "Save" : "Create Bundle"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
