"use client";

import { useState, useMemo } from "react";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Download,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type ProductStatus = "draft" | "active";

interface Product {
  id: string;
  title: string;
  handle: string;
  price: number;
  comparePrice: number;
  vendor: string;
  type: string;
  tags: string;
  status: ProductStatus;
  createdAt: string;
}

const EMPTY_FORM: Omit<Product, "id" | "createdAt"> = {
  title: "",
  handle: "",
  price: 0,
  comparePrice: 0,
  vendor: "",
  type: "",
  tags: "",
  status: "draft",
};

export default function CatalogManagerPage() {
  const [products, setProducts] = useLocalStorage<Product[]>("products-catalog", []);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | ProductStatus>("all");
  const [filterType, setFilterType] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const types = useMemo(() => {
    const t = new Set(products.map((p) => p.type).filter(Boolean));
    return Array.from(t);
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        p.title.toLowerCase().includes(q) ||
        p.handle.toLowerCase().includes(q) ||
        p.vendor.toLowerCase().includes(q) ||
        p.tags.toLowerCase().includes(q);
      const matchStatus = filterStatus === "all" || p.status === filterStatus;
      const matchType = filterType === "all" || p.type === filterType;
      return matchSearch && matchStatus && matchType;
    });
  }, [products, search, filterStatus, filterType]);

  const stats = useMemo(
    () => ({
      total: products.length,
      active: products.filter((p) => p.status === "active").length,
      draft: products.filter((p) => p.status === "draft").length,
    }),
    [products]
  );

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setForm({
      title: p.title,
      handle: p.handle,
      price: p.price,
      comparePrice: p.comparePrice,
      vendor: p.vendor,
      type: p.type,
      tags: p.tags,
      status: p.status,
    });
    setEditingId(p.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.title.trim()) return;
    const handle =
      form.handle.trim() ||
      form.title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    if (editingId) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...form, handle } : p))
      );
    } else {
      setProducts((prev) => [
        { ...form, handle, id: generateId(), createdAt: new Date().toISOString() },
        ...prev,
      ]);
    }
    setShowForm(false);
    setEditingId(null);
  }

  function handleDelete(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function bulkToggleStatus() {
    setProducts((prev) =>
      prev.map((p) =>
        selectedIds.has(p.id)
          ? { ...p, status: p.status === "active" ? "draft" : "active" }
          : p
      )
    );
    setSelectedIds(new Set());
  }

  function exportCSV() {
    const headers = ["Title", "Handle", "Price", "Compare Price", "Vendor", "Type", "Tags", "Status"];
    const rows = filtered.map((p) => [
      p.title,
      p.handle,
      p.price,
      p.comparePrice,
      p.vendor,
      p.type,
      p.tags,
      p.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Catalog Manager"
        description="Create, edit, and manage your entire product catalog with bulk operations and CSV export."
        icon={Package}
        badge="Products"
        replaces="Shopify Admin / Spreadsheets"
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Products", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Draft", value: stats.draft },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={(v) => setFilterType(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedIds.size > 0 && (
          <Button variant="outline" onClick={bulkToggleStatus}>
            <ToggleLeft className="h-4 w-4 mr-2" />
            Toggle Status ({selectedIds.size})
          </Button>
        )}
        <Button variant="outline" onClick={exportCSV} disabled={filtered.length === 0}>
          <Download className="h-4 w-4 mr-2" />CSV
        </Button>
        <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
          <Plus className="h-4 w-4 mr-2" />Add Product
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">No products found</p>
            {!search && filterStatus === "all" && (
              <Button onClick={openAdd} className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />Add First Product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((p) => (
            <Card key={p.id} className="border-border/50 hover:border-violet-500/30 transition-colors group">
              <CardContent className="p-4 flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedIds.has(p.id)}
                  onChange={() => toggleSelect(p.id)}
                  className="h-4 w-4 rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">{p.title}</span>
                    <Badge variant={p.status === "active" ? "default" : "secondary"}>
                      {p.status}
                    </Badge>
                    {p.type && <Badge variant="outline" className="text-xs">{p.type}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.handle} &middot; {p.vendor || "No vendor"} &middot; ${p.price.toFixed(2)}
                    {p.comparePrice > 0 && (
                      <span className="line-through ml-1">${p.comparePrice.toFixed(2)}</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Product title" />
              </div>
              <div className="space-y-1.5">
                <Label>Handle</Label>
                <Input value={form.handle} onChange={(e) => setForm((f) => ({ ...f, handle: e.target.value }))} placeholder="auto-generated" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price ($)</Label>
                <Input type="number" min="0" step="0.01" value={form.price || ""} onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Compare-at Price ($)</Label>
                <Input type="number" min="0" step="0.01" value={form.comparePrice || ""} onChange={(e) => setForm((f) => ({ ...f, comparePrice: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Vendor</Label>
                <Input value={form.vendor} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))} placeholder="Vendor name" />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Input value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} placeholder="e.g. T-Shirt" />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ProductStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tags (comma separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="summer, sale, new" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              {editingId ? "Save Changes" : "Add Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
