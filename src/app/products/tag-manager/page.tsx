"use client";

import { useState, useMemo } from "react";
import { Tags, Plus, Trash2, Edit2, Search, AlertCircle, RefreshCw } from "lucide-react";
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
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface TaggedProduct {
  id: string;
  name: string;
  tags: string[];
}

interface TagCategory {
  id: string;
  name: string;
  tags: string[];
}

export default function TagManagerPage() {
  const [products, setProducts] = useLocalStorage<TaggedProduct[]>("products-tag-items", []);
  const [categories, setCategories] = useLocalStorage<TagCategory[]>("products-tag-categories", []);
  const [search, setSearch] = useState("");
  const [bulkAdd, setBulkAdd] = useState("");
  const [bulkRemove, setBulkRemove] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductTags, setNewProductTags] = useState("");
  const [showRename, setShowRename] = useState(false);
  const [renameFrom, setRenameFrom] = useState("");
  const [renameTo, setRenameTo] = useState("");
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState("");
  const [catTags, setCatTags] = useState("");

  const allTags = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => p.tags.forEach((t) => map.set(t, (map.get(t) || 0) + 1)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [products]);

  const orphanTags = useMemo(() => {
    const productTags = new Set(products.flatMap((p) => p.tags));
    const catTags = new Set(categories.flatMap((c) => c.tags));
    return Array.from(productTags).filter((t) => !catTags.has(t));
  }, [products, categories]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)));
  }, [products, search]);

  function addProduct() {
    if (!newProductName.trim()) return;
    const tags = newProductTags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    setProducts((prev) => [{ id: generateId(), name: newProductName.trim(), tags }, ...prev]);
    setNewProductName("");
    setNewProductTags("");
    setShowAddProduct(false);
  }

  function removeProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  function bulkAddTags() {
    if (!bulkAdd.trim() || selectedIds.size === 0) return;
    const newTags = bulkAdd.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    setProducts((prev) =>
      prev.map((p) =>
        selectedIds.has(p.id)
          ? { ...p, tags: [...new Set([...p.tags, ...newTags])] }
          : p
      )
    );
    setBulkAdd("");
  }

  function bulkRemoveTags() {
    if (!bulkRemove.trim() || selectedIds.size === 0) return;
    const removeTags = new Set(bulkRemove.split(",").map((t) => t.trim().toLowerCase()));
    setProducts((prev) =>
      prev.map((p) =>
        selectedIds.has(p.id)
          ? { ...p, tags: p.tags.filter((t) => !removeTags.has(t)) }
          : p
      )
    );
    setBulkRemove("");
  }

  function handleRename() {
    if (!renameFrom.trim() || !renameTo.trim()) return;
    const from = renameFrom.trim().toLowerCase();
    const to = renameTo.trim().toLowerCase();
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        tags: p.tags.map((t) => (t === from ? to : t)),
      }))
    );
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        tags: c.tags.map((t) => (t === from ? to : t)),
      }))
    );
    setShowRename(false);
    setRenameFrom("");
    setRenameTo("");
  }

  function addCategory() {
    if (!catName.trim()) return;
    const tags = catTags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    setCategories((prev) => [...prev, { id: generateId(), name: catName.trim(), tags }]);
    setCatName("");
    setCatTags("");
    setShowCatForm(false);
  }

  function removeCategory(id: string) {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Tag Manager"
        description="Bulk add/remove tags, view usage stats, detect orphan tags, rename tags across products, and organize by categories."
        icon={Tags}
        badge="Products"
        replaces="Manual tag management"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{products.length}</p><p className="text-xs text-muted-foreground">Products</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{allTags.length}</p><p className="text-xs text-muted-foreground">Unique Tags</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{orphanTags.length}</p><p className="text-xs text-muted-foreground">Orphan Tags</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{categories.length}</p><p className="text-xs text-muted-foreground">Categories</p></CardContent></Card>
      </div>

      {allTags.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tag Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {allTags.slice(0, 30).map(([tag, count]) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag} <span className="ml-1 text-muted-foreground">({count})</span>
                </Badge>
              ))}
            </div>
            {orphanTags.length > 0 && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-amber-600 font-medium">Uncategorized:</span>
                {orphanTags.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs border-amber-500/30 text-amber-600">{t}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products or tags..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" onClick={() => setShowRename(true)}>
          <RefreshCw className="h-4 w-4 mr-2" />Rename Tag
        </Button>
        <Button variant="outline" onClick={() => setShowCatForm(true)}>
          <Plus className="h-4 w-4 mr-2" />Category
        </Button>
        <Button onClick={() => setShowAddProduct(true)} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
          <Plus className="h-4 w-4 mr-2" />Add Product
        </Button>
      </div>

      {selectedIds.size > 0 && (
        <Card className="border-violet-500/30">
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <Input value={bulkAdd} onChange={(e) => setBulkAdd(e.target.value)} placeholder="Tags to add..." className="w-48 h-8" />
            <Button size="sm" onClick={bulkAddTags} disabled={!bulkAdd.trim()}>Add Tags</Button>
            <Input value={bulkRemove} onChange={(e) => setBulkRemove(e.target.value)} placeholder="Tags to remove..." className="w-48 h-8" />
            <Button size="sm" variant="outline" onClick={bulkRemoveTags} disabled={!bulkRemove.trim()}>Remove Tags</Button>
          </CardContent>
        </Card>
      )}

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {categories.map((c) => (
            <Card key={c.id} className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{c.name}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => removeCategory(c.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {c.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Tags className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">No products found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((p) => (
            <Card key={p.id} className="border-border/50 group">
              <CardContent className="p-3 flex items-center gap-3">
                <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} className="h-4 w-4 rounded" />
                <span className="font-medium text-sm min-w-0 truncate">{p.name}</span>
                <div className="flex flex-wrap gap-1 flex-1">
                  {p.tags.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive opacity-0 group-hover:opacity-100" onClick={() => removeProduct(p.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Product</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5"><Label>Product Name *</Label><Input value={newProductName} onChange={(e) => setNewProductName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Tags (comma separated)</Label><Input value={newProductTags} onChange={(e) => setNewProductTags(e.target.value)} placeholder="summer, sale" /></div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowAddProduct(false)}>Cancel</Button><Button onClick={addProduct} disabled={!newProductName.trim()}>Add</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRename} onOpenChange={setShowRename}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Rename Tag</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5"><Label>Current Tag Name</Label><Input value={renameFrom} onChange={(e) => setRenameFrom(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>New Tag Name</Label><Input value={renameTo} onChange={(e) => setRenameTo(e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowRename(false)}>Cancel</Button><Button onClick={handleRename} disabled={!renameFrom.trim() || !renameTo.trim()}>Rename</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCatForm} onOpenChange={setShowCatForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Tag Category</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1.5"><Label>Category Name</Label><Input value={catName} onChange={(e) => setCatName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Tags (comma separated)</Label><Input value={catTags} onChange={(e) => setCatTags(e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowCatForm(false)}>Cancel</Button><Button onClick={addCategory} disabled={!catName.trim()}>Add</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
