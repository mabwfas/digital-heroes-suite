"use client";

import { useState, useMemo } from "react";
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  Save,
  Copy,
  Shield,
  AlertTriangle,
  Lightbulb,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
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

type Quadrant = "strengths" | "weaknesses" | "opportunities" | "threats";

interface SwotItem {
  id: string;
  text: string;
  priority: number;
  actionItem: string;
}

interface SwotAnalysis {
  id: string;
  name: string;
  description: string;
  strengths: SwotItem[];
  weaknesses: SwotItem[];
  opportunities: SwotItem[];
  threats: SwotItem[];
  createdAt: string;
}

const QUADRANT_CONFIG: Record<Quadrant, { label: string; icon: typeof Shield; color: string; bg: string }> = {
  strengths: { label: "Strengths", icon: Shield, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  weaknesses: { label: "Weaknesses", icon: AlertTriangle, color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" },
  opportunities: { label: "Opportunities", icon: Lightbulb, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
  threats: { label: "Threats", icon: TrendingDown, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
};

export default function SwotPage() {
  const [analyses, setAnalyses] = useLocalStorage<SwotAnalysis[]>("swot-analyses", []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [addingTo, setAddingTo] = useState<Quadrant | null>(null);
  const [itemForm, setItemForm] = useState({ text: "", actionItem: "" });

  const active = analyses.find((a) => a.id === activeId) ?? null;

  function createAnalysis() {
    if (!newName.trim()) return;
    const analysis: SwotAnalysis = {
      id: generateId(),
      name: newName,
      description: newDesc,
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
      createdAt: new Date().toISOString(),
    };
    setAnalyses((prev) => [analysis, ...prev]);
    setActiveId(analysis.id);
    setNewName("");
    setNewDesc("");
    setShowNew(false);
  }

  function updateActive(fn: (a: SwotAnalysis) => SwotAnalysis) {
    if (!activeId) return;
    setAnalyses((prev) => prev.map((a) => (a.id === activeId ? fn(a) : a)));
  }

  function addItem(quadrant: Quadrant) {
    if (!itemForm.text.trim()) return;
    const item: SwotItem = {
      id: generateId(),
      text: itemForm.text,
      priority: 0,
      actionItem: itemForm.actionItem,
    };
    updateActive((a) => ({ ...a, [quadrant]: [...a[quadrant], item] }));
    setItemForm({ text: "", actionItem: "" });
    setAddingTo(null);
  }

  function removeItem(quadrant: Quadrant, itemId: string) {
    updateActive((a) => ({ ...a, [quadrant]: a[quadrant].filter((i) => i.id !== itemId) }));
  }

  function moveItem(quadrant: Quadrant, itemId: string, dir: -1 | 1) {
    updateActive((a) => {
      const items = [...a[quadrant]];
      const idx = items.findIndex((i) => i.id === itemId);
      if (idx < 0) return a;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= items.length) return a;
      [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
      return { ...a, [quadrant]: items };
    });
  }

  function deleteAnalysis(id: string) {
    setAnalyses((prev) => prev.filter((a) => a.id !== id));
    if (activeId === id) setActiveId(null);
  }

  function copyAnalysis() {
    if (!active) return;
    const q = (quadrant: Quadrant) => active[quadrant].map((i, idx) => `  ${idx + 1}. ${i.text}${i.actionItem ? ` -> Action: ${i.actionItem}` : ""}`).join("\n");
    const text = `SWOT Analysis: ${active.name}\n\nStrengths:\n${q("strengths")}\n\nWeaknesses:\n${q("weaknesses")}\n\nOpportunities:\n${q("opportunities")}\n\nThreats:\n${q("threats")}`;
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SWOT Analysis Tool"
        description="Build 4-quadrant SWOT analyses with priority ranking and action items"
        icon={Target}
        badge="Research"
        replaces="Miro / Lucidchart"
        actions={
          <Button
            onClick={() => setShowNew(true)}
            className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0"
          >
            <Plus className="h-4 w-4 mr-2" /> New Analysis
          </Button>
        }
      />

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          {analyses.length === 0 ? (
            <Card className="border-dashed border-border/60">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Target className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No analyses yet</p>
              </CardContent>
            </Card>
          ) : (
            analyses.map((a) => (
              <Card
                key={a.id}
                className={`cursor-pointer transition-colors ${activeId === a.id ? "border-violet-500/50 bg-violet-500/5" : "hover:border-violet-500/30"}`}
                onClick={() => setActiveId(a.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{a.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {a.strengths.length + a.weaknesses.length + a.opportunities.length + a.threats.length} items
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteAnalysis(a.id); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="lg:col-span-3">
          {active ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">{active.name}</h2>
                  {active.description && <p className="text-sm text-muted-foreground">{active.description}</p>}
                </div>
                <Button variant="outline" size="sm" onClick={copyAnalysis}>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                </Button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {(["strengths", "weaknesses", "opportunities", "threats"] as Quadrant[]).map((q) => {
                  const config = QUADRANT_CONFIG[q];
                  const Icon = config.icon;
                  const items = active[q];
                  return (
                    <Card key={q} className="border-border/50">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                              <Icon className={`h-4 w-4 ${config.color}`} />
                            </div>
                            <div>
                              <CardTitle className="text-sm">{config.label}</CardTitle>
                              <p className="text-xs text-muted-foreground">{items.length} items</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setAddingTo(q); setItemForm({ text: "", actionItem: "" }); }}>
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {items.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">No items yet</p>
                        ) : (
                          <div className="space-y-2">
                            {items.map((item, idx) => (
                              <div key={item.id} className="flex items-start gap-2 group/item">
                                <span className="text-xs text-muted-foreground mt-1 shrink-0">{idx + 1}.</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm">{item.text}</p>
                                  {item.actionItem && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                      <CheckCircle2 className="h-3 w-3" /> {item.actionItem}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
                                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveItem(q, item.id, -1)} disabled={idx === 0}>
                                    <ArrowUp className="h-2.5 w-2.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => moveItem(q, item.id, 1)} disabled={idx === items.length - 1}>
                                    <ArrowDown className="h-2.5 w-2.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 hover:text-destructive" onClick={() => removeItem(q, item.id)}>
                                    <Trash2 className="h-2.5 w-2.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <Card className="border-dashed border-border/60">
              <CardContent className="flex items-center justify-center py-16">
                <p className="text-sm text-muted-foreground">Select or create an analysis to get started</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* New Analysis Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New SWOT Analysis</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Analysis Name *</Label>
              <Input placeholder="e.g., Q1 Product Strategy" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="Brief description..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={createAnalysis} disabled={!newName.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={!!addingTo} onOpenChange={() => setAddingTo(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add {addingTo ? QUADRANT_CONFIG[addingTo].label.slice(0, -1) : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Item *</Label>
              <Input placeholder="Describe the item..." value={itemForm.text} onChange={(e) => setItemForm((f) => ({ ...f, text: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Action Item (optional)</Label>
              <Input placeholder="What to do about this..." value={itemForm.actionItem} onChange={(e) => setItemForm((f) => ({ ...f, actionItem: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAddingTo(null)}>Cancel</Button>
            <Button onClick={() => addingTo && addItem(addingTo)} disabled={!itemForm.text.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
