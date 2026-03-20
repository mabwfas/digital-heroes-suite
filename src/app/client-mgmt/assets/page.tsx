"use client";

import { useState, useMemo } from "react";
import {
  FolderOpen,
  Plus,
  Trash2,
  Edit2,
  Search,
  Copy,
  Palette,
  Type,
  FileText,
  Key,
  Image,
  ChevronDown,
  ChevronRight,
  X,
  Check,
} from "lucide-react";
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

interface AssetItem {
  id: string;
  label: string;
  value: string;
  category: "logo" | "color" | "font" | "doc" | "credential";
}

interface ClientAssets {
  id: string;
  clientName: string;
  assets: AssetItem[];
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Image; color: string; bg: string }> = {
  logo: { label: "Logos", icon: Image, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-500/10" },
  color: { label: "Colors", icon: Palette, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
  font: { label: "Fonts", icon: Type, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
  doc: { label: "Brand Docs", icon: FileText, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  credential: { label: "Credentials", icon: Key, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
};

export default function AssetsPage() {
  const [clientAssets, setClientAssets] = useLocalStorage<ClientAssets[]>("client-assets-store", []);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [formClient, setFormClient] = useState("");
  const [formAssets, setFormAssets] = useState<AssetItem[]>([]);

  const filtered = useMemo(() => {
    if (!search) return clientAssets;
    const q = search.toLowerCase();
    return clientAssets.filter((c) =>
      c.clientName.toLowerCase().includes(q) ||
      c.assets.some((a) => a.label.toLowerCase().includes(q) || a.value.toLowerCase().includes(q))
    );
  }, [clientAssets, search]);

  const stats = useMemo(() => ({
    totalClients: clientAssets.length,
    totalAssets: clientAssets.reduce((sum, c) => sum + c.assets.length, 0),
    logos: clientAssets.reduce((sum, c) => sum + c.assets.filter((a) => a.category === "logo").length, 0),
    colors: clientAssets.reduce((sum, c) => sum + c.assets.filter((a) => a.category === "color").length, 0),
  }), [clientAssets]);

  function openAdd() {
    setFormClient("");
    setFormAssets([]);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(client: ClientAssets) {
    setFormClient(client.clientName);
    setFormAssets(client.assets.map((a) => ({ ...a })));
    setEditingId(client.id);
    setShowForm(true);
  }

  function addAsset(category: AssetItem["category"]) {
    setFormAssets((prev) => [...prev, { id: generateId(), label: "", value: "", category }]);
  }

  function updateAsset(id: string, updates: Partial<AssetItem>) {
    setFormAssets((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  }

  function removeAsset(id: string) {
    setFormAssets((prev) => prev.filter((a) => a.id !== id));
  }

  function handleSave() {
    if (!formClient.trim()) return;
    const validAssets = formAssets.filter((a) => a.label.trim() && a.value.trim());
    const now = new Date().toISOString();

    if (editingId) {
      setClientAssets((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, clientName: formClient, assets: validAssets, updatedAt: now }
            : c
        )
      );
    } else {
      setClientAssets((prev) => [
        { id: generateId(), clientName: formClient, assets: validAssets, createdAt: now, updatedAt: now },
        ...prev,
      ]);
    }
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setClientAssets((prev) => prev.filter((c) => c.id !== id));
  }

  function copyValue(value: string, id: string) {
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Asset Manager"
        description="Store and organize brand assets, credentials and documents per client"
        icon={FolderOpen}
        badge="Assets"
        replaces="Google Drive / Notion"
        actions={
          <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Add Client Assets
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Clients", value: stats.totalClients, icon: FolderOpen, color: "text-violet-600 dark:text-violet-400" },
          { label: "Total Assets", value: stats.totalAssets, icon: FileText, color: "text-blue-600 dark:text-blue-400" },
          { label: "Logos", value: stats.logos, icon: Image, color: "text-pink-600 dark:text-pink-400" },
          { label: "Colors", value: stats.colors, icon: Palette, color: "text-emerald-600 dark:text-emerald-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4">
              <s.icon className={`h-4 w-4 ${s.color} mb-2`} />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search clients, assets, values..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Client Assets */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center mb-4">
              <FolderOpen className="h-7 w-7 text-violet-400" />
            </div>
            <p className="font-medium text-muted-foreground mb-1">No client assets stored</p>
            <p className="text-sm text-muted-foreground/70">Add your first client to organize their brand assets</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((client) => {
            const isExpanded = expandedId === client.id;
            const assetsByCategory = Object.entries(CATEGORY_CONFIG).map(([cat, cfg]) => ({
              ...cfg,
              category: cat,
              items: client.assets.filter((a) => a.category === cat),
            })).filter((g) => g.items.length > 0);

            return (
              <Card key={client.id} className="border-border/50">
                <CardHeader
                  className="pb-2 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : client.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                        {client.clientName.charAt(0).toUpperCase()}
                      </div>
                      <CardTitle className="text-base">{client.clientName}</CardTitle>
                      <Badge variant="outline" className="text-[10px]">{client.assets.length} assets</Badge>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(client)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(client.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {assetsByCategory.map((group) => {
                        const GroupIcon = group.icon;
                        return (
                          <div key={group.category}>
                            <div className="flex items-center gap-2 mb-2">
                              <GroupIcon className={`h-3.5 w-3.5 ${group.color}`} />
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group.label}</span>
                            </div>
                            <div className="grid gap-1.5">
                              {group.items.map((asset) => (
                                <div key={asset.id} className="flex items-center justify-between gap-3 bg-muted/30 rounded-lg px-3 py-2 group/item">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {asset.category === "color" && (
                                      <div className="h-5 w-5 rounded border border-border/50 shrink-0" style={{ backgroundColor: asset.value }} />
                                    )}
                                    <span className="text-sm font-medium shrink-0">{asset.label}</span>
                                    <span className="text-sm text-muted-foreground truncate">{asset.value}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                    onClick={() => copyValue(asset.value, asset.id)}
                                  >
                                    {copiedId === asset.id ? (
                                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Client Assets" : "Add Client Assets"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Client Name *</Label>
              <Input value={formClient} onChange={(e) => setFormClient(e.target.value)} placeholder="Client name" />
            </div>

            {/* Add asset buttons */}
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORY_CONFIG).map(([cat, cfg]) => {
                const CatIcon = cfg.icon;
                return (
                  <Button key={cat} variant="outline" size="sm" onClick={() => addAsset(cat as AssetItem["category"])}>
                    <CatIcon className={`h-3.5 w-3.5 mr-1 ${cfg.color}`} />
                    Add {cfg.label.replace(/s$/, "")}
                  </Button>
                );
              })}
            </div>

            {/* Asset list */}
            {formAssets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No assets added yet. Use the buttons above.</p>
            ) : (
              <div className="space-y-2">
                {formAssets.map((asset) => {
                  const cfg = CATEGORY_CONFIG[asset.category];
                  const CatIcon = cfg.icon;
                  return (
                    <div key={asset.id} className="flex items-center gap-2 p-2 bg-muted/20 rounded-lg">
                      <CatIcon className={`h-4 w-4 ${cfg.color} shrink-0`} />
                      <Input
                        value={asset.label}
                        onChange={(e) => updateAsset(asset.id, { label: e.target.value })}
                        placeholder="Label"
                        className="h-8 text-sm flex-1"
                      />
                      <Input
                        value={asset.value}
                        onChange={(e) => updateAsset(asset.id, { value: e.target.value })}
                        placeholder={asset.category === "color" ? "#hex" : "Value"}
                        className="h-8 text-sm flex-[2]"
                      />
                      {asset.category === "color" && (
                        <input
                          type="color"
                          value={asset.value || "#000000"}
                          onChange={(e) => updateAsset(asset.id, { value: e.target.value })}
                          className="h-8 w-8 rounded cursor-pointer shrink-0"
                        />
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeAsset(asset.id)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formClient.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              {editingId ? "Save Changes" : "Save Assets"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
