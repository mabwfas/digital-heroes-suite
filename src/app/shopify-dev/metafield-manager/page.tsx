"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Database,
  Plus,
  Trash2,
  Search,
  Download,
  Upload,
  Copy,
  Check,
  Edit2,
  X,
  Save,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type MetafieldType =
  | "single_line_text"
  | "multi_line_text"
  | "number_integer"
  | "number_decimal"
  | "boolean"
  | "date"
  | "json"
  | "color"
  | "url";

type OwnerType = "product" | "collection" | "customer" | "order" | "shop";

interface MetafieldDef {
  id: string;
  namespace: string;
  key: string;
  type: MetafieldType;
  description: string;
  owner: OwnerType;
  createdAt: string;
}

const METAFIELD_TYPES: { value: MetafieldType; label: string }[] = [
  { value: "single_line_text", label: "Single Line Text" },
  { value: "multi_line_text", label: "Multi Line Text" },
  { value: "number_integer", label: "Integer" },
  { value: "number_decimal", label: "Decimal" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "json", label: "JSON" },
  { value: "color", label: "Color" },
  { value: "url", label: "URL" },
];

const OWNER_TYPES: { value: OwnerType; label: string }[] = [
  { value: "product", label: "Product" },
  { value: "collection", label: "Collection" },
  { value: "customer", label: "Customer" },
  { value: "order", label: "Order" },
  { value: "shop", label: "Shop" },
];

const TYPE_COLORS: Record<MetafieldType, string> = {
  single_line_text: "bg-blue-500/10 text-blue-600",
  multi_line_text: "bg-blue-500/10 text-blue-600",
  number_integer: "bg-orange-500/10 text-orange-600",
  number_decimal: "bg-orange-500/10 text-orange-600",
  boolean: "bg-purple-500/10 text-purple-600",
  date: "bg-emerald-500/10 text-emerald-600",
  json: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  color: "bg-pink-500/10 text-pink-600",
  url: "bg-cyan-500/10 text-cyan-600",
};

const OWNER_COLORS: Record<OwnerType, string> = {
  product: "bg-violet-500/10 text-violet-600",
  collection: "bg-emerald-500/10 text-emerald-600",
  customer: "bg-blue-500/10 text-blue-600",
  order: "bg-orange-500/10 text-orange-600",
  shop: "bg-pink-500/10 text-pink-600",
};

export default function MetafieldManagerPage() {
  const [definitions, setDefinitions] = useLocalStorage<MetafieldDef[]>(
    "shopify-metafield-manager",
    []
  );
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<MetafieldType | "all">("all");
  const [filterOwner, setFilterOwner] = useState<OwnerType | "all">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkJson, setBulkJson] = useState("");
  const [bulkError, setBulkError] = useState("");
  const [copied, setCopied] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<MetafieldDef>>({
    namespace: "custom",
    key: "",
    type: "single_line_text",
    description: "",
    owner: "product",
  });

  const filtered = useMemo(() => {
    return definitions.filter((d) => {
      const matchSearch =
        !search ||
        d.namespace.toLowerCase().includes(search.toLowerCase()) ||
        d.key.toLowerCase().includes(search.toLowerCase()) ||
        d.description.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === "all" || d.type === filterType;
      const matchOwner = filterOwner === "all" || d.owner === filterOwner;
      return matchSearch && matchType && matchOwner;
    });
  }, [definitions, search, filterType, filterOwner]);

  const handleAdd = useCallback(() => {
    if (!form.namespace || !form.key) return;
    const newDef: MetafieldDef = {
      id: generateId(),
      namespace: form.namespace || "custom",
      key: form.key || "",
      type: (form.type as MetafieldType) || "single_line_text",
      description: form.description || "",
      owner: (form.owner as OwnerType) || "product",
      createdAt: new Date().toISOString(),
    };
    setDefinitions((prev) => [newDef, ...prev]);
    setForm({ namespace: "custom", key: "", type: "single_line_text", description: "", owner: "product" });
    setShowAdd(false);
  }, [form, setDefinitions]);

  const handleUpdate = useCallback(
    (id: string) => {
      setDefinitions((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                namespace: form.namespace || d.namespace,
                key: form.key || d.key,
                type: (form.type as MetafieldType) || d.type,
                description: form.description ?? d.description,
                owner: (form.owner as OwnerType) || d.owner,
              }
            : d
        )
      );
      setEditingId(null);
    },
    [form, setDefinitions]
  );

  const handleDelete = useCallback(
    (id: string) => {
      setDefinitions((prev) => prev.filter((d) => d.id !== id));
    },
    [setDefinitions]
  );

  const handleBulkCreate = useCallback(() => {
    setBulkError("");
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) throw new Error("Must be a JSON array");
      const newDefs: MetafieldDef[] = parsed.map((item: Record<string, string>) => ({
        id: generateId(),
        namespace: item.namespace || "custom",
        key: item.key || "",
        type: (item.type as MetafieldType) || "single_line_text",
        description: item.description || "",
        owner: (item.owner as OwnerType) || "product",
        createdAt: new Date().toISOString(),
      }));
      setDefinitions((prev) => [...newDefs, ...prev]);
      setBulkJson("");
      setShowBulk(false);
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }, [bulkJson, setDefinitions]);

  const exportJson = useCallback(() => {
    const data = definitions.map(({ id, createdAt, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metafield-definitions-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [definitions]);

  const handleCopyAll = useCallback(async () => {
    const data = definitions.map(({ id, createdAt, ...rest }) => rest);
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [definitions]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Metafield Manager"
        description="Define, manage, and export Shopify metafield definitions with bulk creation support."
        icon={Database}
        badge="Shopify Dev"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowBulk(!showBulk); setShowAdd(false); }}>
              <Upload className="h-4 w-4 mr-1" /> Bulk Create
            </Button>
            <Button variant="outline" size="sm" onClick={exportJson}>
              <Download className="h-4 w-4 mr-1" /> Export JSON
            </Button>
            <Button
              size="sm"
              onClick={() => { setShowAdd(!showAdd); setShowBulk(false); }}
              className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Definition
            </Button>
          </div>
        }
      />

      {/* Add Form */}
      {showAdd && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {editingId ? "Edit Definition" : "New Metafield Definition"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Namespace</Label>
                <Input
                  value={form.namespace || ""}
                  onChange={(e) => setForm((p) => ({ ...p, namespace: e.target.value }))}
                  placeholder="custom"
                  className="text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Key</Label>
                <Input
                  value={form.key || ""}
                  onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
                  placeholder="my_field"
                  className="text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Type</Label>
                <select
                  value={form.type || "single_line_text"}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as MetafieldType }))}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                >
                  {METAFIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Owner</Label>
                <select
                  value={form.owner || "product"}
                  onChange={(e) => setForm((p) => ({ ...p, owner: e.target.value as OwnerType }))}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                >
                  {OWNER_TYPES.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Input
                value={form.description || ""}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="What this metafield is for..."
                className="text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={editingId ? () => handleUpdate(editingId) : handleAdd} disabled={!form.key} size="sm">
                <Save className="h-4 w-4 mr-1" /> {editingId ? "Update" : "Save"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setShowAdd(false); setEditingId(null); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Create */}
      {showBulk && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Bulk Create from JSON</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={bulkJson}
              onChange={(e) => setBulkJson(e.target.value)}
              placeholder={`[
  { "namespace": "custom", "key": "subtitle", "type": "single_line_text", "owner": "product", "description": "Product subtitle" },
  { "namespace": "custom", "key": "ingredients", "type": "multi_line_text", "owner": "product", "description": "Product ingredients list" }
]`}
              className="text-sm font-mono min-h-[150px]"
            />
            {bulkError && (
              <p className="text-sm text-red-500">{bulkError}</p>
            )}
            <div className="flex gap-2">
              <Button onClick={handleBulkCreate} size="sm">
                Create All
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowBulk(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by namespace, key, or description..."
            className="pl-9 text-sm"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as MetafieldType | "all")}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All Types</option>
          {METAFIELD_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          value={filterOwner}
          onChange={(e) => setFilterOwner(e.target.value as OwnerType | "all")}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All Owners</option>
          {OWNER_TYPES.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {OWNER_TYPES.map((o) => {
          const count = definitions.filter((d) => d.owner === o.value).length;
          return (
            <Card key={o.value}>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-bold font-mono">{count}</p>
                <p className="text-xs text-muted-foreground">{o.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Definitions List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {definitions.length === 0
                ? "No metafield definitions yet. Add your first one above."
                : "No matching definitions found."}
            </CardContent>
          </Card>
        )}
        {filtered.map((def) => (
          <Card key={def.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="text-sm font-mono font-bold">
                      {def.namespace}.{def.key}
                    </code>
                    <Badge className={`text-[10px] ${TYPE_COLORS[def.type]}`}>
                      {def.type}
                    </Badge>
                    <Badge className={`text-[10px] ${OWNER_COLORS[def.owner]}`}>
                      {def.owner}
                    </Badge>
                  </div>
                  {def.description && (
                    <p className="text-xs text-muted-foreground mt-1">{def.description}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => {
                      setForm({
                        namespace: def.namespace,
                        key: def.key,
                        type: def.type,
                        description: def.description,
                        owner: def.owner,
                      });
                      setEditingId(def.id);
                      setShowAdd(true);
                      setShowBulk(false);
                    }}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(def.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
