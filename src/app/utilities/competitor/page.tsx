"use client";

import { useState } from "react";
import {
  BarChart2,
  Plus,
  Trash2,
  ExternalLink,
  Edit2,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface Competitor {
  id: string;
  storeName: string;
  url: string;
  niche: string;
  estimatedProducts: string;
  priceRange: string;
  uniqueFeatures: string;
  strengths: string;
  weaknesses: string;
  notes: string;
  swot: {
    strengths: string;
    weaknesses: string;
    opportunities: string;
    threats: string;
  };
  addedAt: string;
}

const EMPTY_COMPETITOR: Omit<Competitor, "id" | "addedAt"> = {
  storeName: "",
  url: "",
  niche: "",
  estimatedProducts: "",
  priceRange: "",
  uniqueFeatures: "",
  strengths: "",
  weaknesses: "",
  notes: "",
  swot: { strengths: "", weaknesses: "", opportunities: "", threats: "" },
};

const SWOT_CONFIG = [
  { key: "strengths" as const, label: "Strengths", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", icon: TrendingUp },
  { key: "weaknesses" as const, label: "Weaknesses", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", icon: TrendingDown },
  { key: "opportunities" as const, label: "Opportunities", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", icon: TrendingUp },
  { key: "threats" as const, label: "Threats", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", icon: Minus },
];

export default function CompetitorPage() {
  const [competitors, setCompetitors] = useLocalStorage<Competitor[]>("competitor-profiles", []);
  const [activeTab, setActiveTab] = useState<"list" | "add" | "compare">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Competitor, "id" | "addedAt">>(EMPTY_COMPETITOR);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const updateForm = (field: string, value: string) => {
    if (field.startsWith("swot.")) {
      const swotKey = field.split(".")[1] as keyof Competitor["swot"];
      setForm((prev) => ({ ...prev, swot: { ...prev.swot, [swotKey]: value } }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = () => {
    if (!form.storeName) return;
    if (editingId) {
      setCompetitors((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, ...form } : c))
      );
      setEditingId(null);
    } else {
      const newComp: Competitor = {
        id: generateId(),
        addedAt: new Date().toISOString(),
        ...form,
      };
      setCompetitors((prev) => [...prev, newComp]);
    }
    setForm(EMPTY_COMPETITOR);
    setActiveTab("list");
  };

  const handleEdit = (c: Competitor) => {
    setForm({
      storeName: c.storeName,
      url: c.url,
      niche: c.niche,
      estimatedProducts: c.estimatedProducts,
      priceRange: c.priceRange,
      uniqueFeatures: c.uniqueFeatures,
      strengths: c.strengths,
      weaknesses: c.weaknesses,
      notes: c.notes,
      swot: { ...c.swot },
    });
    setEditingId(c.id);
    setActiveTab("add");
  };

  const handleDelete = (id: string) => {
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
    setSelectedIds((prev) => prev.filter((s) => s !== id));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id].slice(0, 3)
    );
  };

  const compareList = competitors.filter((c) => selectedIds.includes(c.id));

  const cancelForm = () => {
    setForm(EMPTY_COMPETITOR);
    setEditingId(null);
    setActiveTab("list");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competitor Analyzer"
        description="Track and compare competitor Shopify stores. Build SWOT analyses and identify opportunities."
        icon={BarChart2}
        badge="Utilities"
        replaces="SimilarWeb, SpyFu"
      />

      <div className="flex items-center justify-between">
        <div className="flex gap-2 p-1 bg-muted/40 rounded-xl">
          {(["list", "add", "compare"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); if (tab !== "add") { setEditingId(null); setForm(EMPTY_COMPETITOR); } }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? "bg-white dark:bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "list" ? `Competitors (${competitors.length})` : tab === "compare" ? `Compare (${selectedIds.length}/3)` : editingId ? "Edit" : "Add New"}
            </button>
          ))}
        </div>
        {activeTab === "list" && (
          <Button
            onClick={() => { setActiveTab("add"); setEditingId(null); setForm(EMPTY_COMPETITOR); }}
            className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Competitor
          </Button>
        )}
      </div>

      {/* List Tab */}
      {activeTab === "list" && (
        <div>
          {competitors.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <BarChart2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No competitors added yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add competitor profiles to start analyzing</p>
                <Button
                  className="mt-4 bg-gradient-to-r from-violet-500 to-pink-500 text-white border-0"
                  onClick={() => setActiveTab("add")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Competitor
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {selectedIds.length > 0 && (
                <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-between mb-4">
                  <p className="text-sm text-violet-600 dark:text-violet-400">
                    {selectedIds.length} selected for comparison
                  </p>
                  <Button size="sm" onClick={() => setActiveTab("compare")} className="bg-violet-500 text-white hover:bg-violet-600 border-0">
                    Compare Now
                  </Button>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {competitors.map((c) => (
                  <Card
                    key={c.id}
                    className={`transition-all ${selectedIds.includes(c.id) ? "border-violet-400 bg-violet-500/5" : "hover:border-violet-300"}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{c.storeName}</h3>
                            {c.url && (
                              <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-violet-500">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {c.niche && <Badge variant="secondary" className="text-[10px]">{c.niche}</Badge>}
                            {c.priceRange && <Badge variant="secondary" className="text-[10px]">{c.priceRange}</Badge>}
                            {c.estimatedProducts && <Badge variant="secondary" className="text-[10px]">{c.estimatedProducts} products</Badge>}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => toggleSelect(c.id)}
                            className={`p-1.5 rounded-lg border transition-all text-xs ${
                              selectedIds.includes(c.id)
                                ? "bg-violet-500 text-white border-violet-500"
                                : "border-border hover:border-violet-400"
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleEdit(c)} className="p-1.5 rounded-lg border hover:border-violet-400 transition-colors">
                            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg border hover:border-red-400 hover:text-red-500 transition-colors">
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      </div>

                      {c.uniqueFeatures && (
                        <p className="text-xs text-muted-foreground mb-2">
                          <strong>Features:</strong> {c.uniqueFeatures}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {c.strengths && (
                          <div className="p-2 rounded-lg bg-emerald-500/10">
                            <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mb-0.5">Strengths</p>
                            <p className="text-xs text-muted-foreground">{c.strengths}</p>
                          </div>
                        )}
                        {c.weaknesses && (
                          <div className="p-2 rounded-lg bg-red-500/10">
                            <p className="text-[10px] font-medium text-red-600 dark:text-red-400 mb-0.5">Weaknesses</p>
                            <p className="text-xs text-muted-foreground">{c.weaknesses}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Add/Edit Tab */}
      {activeTab === "add" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Store Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Store Name *</Label>
                    <Input placeholder="Brand Name" value={form.storeName} onChange={(e) => updateForm("storeName", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Store URL</Label>
                    <Input placeholder="https://store.myshopify.com" value={form.url} onChange={(e) => updateForm("url", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Niche</Label>
                    <Input placeholder="e.g. Luxury Fashion" value={form.niche} onChange={(e) => updateForm("niche", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Est. Products</Label>
                    <Input placeholder="e.g. 50-200" value={form.estimatedProducts} onChange={(e) => updateForm("estimatedProducts", e.target.value)} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Price Range</Label>
                    <Input placeholder="e.g. $20-$150, Premium ($100+)" value={form.priceRange} onChange={(e) => updateForm("priceRange", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Unique Features / USP</Label>
                  <Textarea placeholder="What makes them stand out?" value={form.uniqueFeatures} onChange={(e) => updateForm("uniqueFeatures", e.target.value)} className="min-h-[80px]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Strengths</Label>
                    <Textarea placeholder="What they do well..." value={form.strengths} onChange={(e) => updateForm("strengths", e.target.value)} className="min-h-[80px]" />
                  </div>
                  <div className="space-y-2">
                    <Label>Weaknesses</Label>
                    <Textarea placeholder="Where they fall short..." value={form.weaknesses} onChange={(e) => updateForm("weaknesses", e.target.value)} className="min-h-[80px]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="Additional observations..." value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} className="min-h-[60px]" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  SWOT Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {SWOT_CONFIG.map((s) => (
                  <div key={s.key} className={`p-3 rounded-xl ${s.bg}`}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                      <Label className={`text-xs font-medium ${s.color}`}>{s.label}</Label>
                    </div>
                    <Textarea
                      placeholder={`Enter ${s.label.toLowerCase()}...`}
                      value={form.swot[s.key]}
                      onChange={(e) => updateForm(`swot.${s.key}`, e.target.value)}
                      className="min-h-[80px] text-xs bg-background/60 border-0"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={!form.storeName}
                className="flex-1 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
              >
                <Check className="h-4 w-4 mr-2" />
                {editingId ? "Update" : "Save"} Profile
              </Button>
              <Button onClick={cancelForm} variant="outline">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Tab */}
      {activeTab === "compare" && (
        <div>
          {compareList.length < 2 ? (
            <Card>
              <CardContent className="text-center py-16">
                <BarChart2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Select 2-3 competitors from the list to compare</p>
                <Button className="mt-4" variant="outline" onClick={() => setActiveTab("list")}>
                  Go to List
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className={`grid gap-4 ${compareList.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {compareList.map((c, i) => (
                  <div key={c.id} className="space-y-2">
                    <div className={`p-3 rounded-xl text-center font-semibold text-sm text-white bg-gradient-to-br ${i === 0 ? "from-violet-500 to-purple-600" : i === 1 ? "from-pink-500 to-rose-600" : "from-blue-500 to-cyan-600"}`}>
                      {c.storeName}
                    </div>
                  </div>
                ))}
              </div>

              {[
                { label: "Niche", field: "niche" as keyof Competitor },
                { label: "Price Range", field: "priceRange" as keyof Competitor },
                { label: "Est. Products", field: "estimatedProducts" as keyof Competitor },
                { label: "Unique Features", field: "uniqueFeatures" as keyof Competitor },
                { label: "Strengths", field: "strengths" as keyof Competitor },
                { label: "Weaknesses", field: "weaknesses" as keyof Competitor },
              ].map((row) => (
                <Card key={row.label}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">{row.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`grid gap-4 ${compareList.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                      {compareList.map((c) => (
                        <p key={c.id} className="text-sm">
                          {String(c[row.field]) || <span className="text-muted-foreground italic text-xs">Not specified</span>}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">SWOT Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  {SWOT_CONFIG.map((s) => (
                    <div key={s.key} className="mb-4">
                      <div className={`flex items-center gap-2 mb-2 ${s.color}`}>
                        <s.icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{s.label}</span>
                      </div>
                      <div className={`grid gap-4 ${compareList.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                        {compareList.map((c) => (
                          <div key={c.id} className={`p-2.5 rounded-lg ${s.bg} text-xs`}>
                            {c.swot[s.key] || <span className="text-muted-foreground italic">Not filled</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
