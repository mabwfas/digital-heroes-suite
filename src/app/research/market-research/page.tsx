"use client";

import { useState } from "react";
import {
  BarChart3,
  Plus,
  Trash2,
  Edit2,
  Save,
  Copy,
  X,
  TrendingUp,
  Globe,
  Shield,
  Landmark,
  Users,
  Cpu,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface PestItem {
  id: string;
  category: "political" | "economic" | "social" | "technological";
  factor: string;
  impact: "high" | "medium" | "low";
  notes: string;
}

interface MarketReport {
  id: string;
  name: string;
  marketSize: string;
  growthRate: string;
  trends: string;
  competitors: string;
  barriers: string;
  pestItems: PestItem[];
  createdAt: string;
}

const EMPTY_REPORT: Omit<MarketReport, "id" | "createdAt"> = {
  name: "",
  marketSize: "",
  growthRate: "",
  trends: "",
  competitors: "",
  barriers: "",
  pestItems: [],
};

const PEST_ICONS = {
  political: Landmark,
  economic: TrendingUp,
  social: Users,
  technological: Cpu,
};

const PEST_COLORS = {
  political: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  economic: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  social: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  technological: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

const IMPACT_COLORS = {
  high: "bg-red-500/10 text-red-600 border-0",
  medium: "bg-amber-500/10 text-amber-600 border-0",
  low: "bg-slate-500/10 text-slate-600 border-0",
};

export default function MarketResearchPage() {
  const [reports, setReports] = useLocalStorage<MarketReport[]>("market-research-reports", []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<MarketReport, "id" | "createdAt">>(EMPTY_REPORT);
  const [pestForm, setPestForm] = useState<Omit<PestItem, "id">>({
    category: "political",
    factor: "",
    impact: "medium",
    notes: "",
  });
  const [activeReport, setActiveReport] = useState<string | null>(null);

  function openAdd() {
    setForm(EMPTY_REPORT);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(report: MarketReport) {
    setForm({
      name: report.name,
      marketSize: report.marketSize,
      growthRate: report.growthRate,
      trends: report.trends,
      competitors: report.competitors,
      barriers: report.barriers,
      pestItems: report.pestItems,
    });
    setEditingId(report.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editingId) {
      setReports((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, ...form } : r))
      );
    } else {
      setReports((prev) => [
        { ...form, id: generateId(), createdAt: new Date().toISOString() },
        ...prev,
      ]);
    }
    setShowForm(false);
    setEditingId(null);
  }

  function addPestItem() {
    if (!pestForm.factor.trim()) return;
    setForm((f) => ({
      ...f,
      pestItems: [...f.pestItems, { ...pestForm, id: generateId() }],
    }));
    setPestForm({ category: "political", factor: "", impact: "medium", notes: "" });
  }

  function removePestItem(id: string) {
    setForm((f) => ({ ...f, pestItems: f.pestItems.filter((p) => p.id !== id) }));
  }

  function deleteReport(id: string) {
    setReports((prev) => prev.filter((r) => r.id !== id));
    if (activeReport === id) setActiveReport(null);
  }

  function copyReport(report: MarketReport) {
    const text = `Market Research: ${report.name}\n\nMarket Size: ${report.marketSize}\nGrowth Rate: ${report.growthRate}\n\nTrends:\n${report.trends}\n\nCompetitors:\n${report.competitors}\n\nBarriers:\n${report.barriers}\n\nPEST Analysis:\n${report.pestItems.map((p) => `[${p.category.toUpperCase()}] ${p.factor} (Impact: ${p.impact}) - ${p.notes}`).join("\n")}`;
    navigator.clipboard.writeText(text);
  }

  const viewingReport = reports.find((r) => r.id === activeReport);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Market Research"
        description="Define markets, analyze competitors, and run PEST analysis for strategic planning"
        icon={BarChart3}
        badge="Research"
        replaces="Statista / Manual Research"
        actions={
          <Button
            onClick={openAdd}
            className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        }
      />

      {reports.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center mb-4">
              <BarChart3 className="h-7 w-7 text-violet-400" />
            </div>
            <p className="font-medium text-muted-foreground mb-1">No research reports yet</p>
            <p className="text-sm text-muted-foreground/70">Create your first market research report</p>
            <Button onClick={openAdd} className="mt-4" variant="outline">
              <Plus className="h-4 w-4 mr-2" /> Create Report
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-3">
            {reports.map((report) => (
              <Card
                key={report.id}
                className={`border-border/50 cursor-pointer transition-colors ${activeReport === report.id ? "border-violet-500/50 bg-violet-500/5" : "hover:border-violet-500/30"}`}
                onClick={() => setActiveReport(report.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{report.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {report.pestItems.length} PEST factors
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); copyReport(report); }}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(report); }}>
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteReport(report.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-2">
            {viewingReport ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{viewingReport.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Market Size</p>
                      <p className="text-sm font-medium">{viewingReport.marketSize || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Growth Rate</p>
                      <p className="text-sm font-medium">{viewingReport.growthRate || "Not specified"}</p>
                    </div>
                  </div>
                  {viewingReport.trends && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Trends</p>
                      <p className="text-sm whitespace-pre-wrap">{viewingReport.trends}</p>
                    </div>
                  )}
                  {viewingReport.competitors && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Competitors</p>
                      <p className="text-sm whitespace-pre-wrap">{viewingReport.competitors}</p>
                    </div>
                  )}
                  {viewingReport.barriers && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Barriers to Entry</p>
                      <p className="text-sm whitespace-pre-wrap">{viewingReport.barriers}</p>
                    </div>
                  )}
                  {viewingReport.pestItems.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-3">PEST Analysis</p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {(["political", "economic", "social", "technological"] as const).map((cat) => {
                          const items = viewingReport.pestItems.filter((p) => p.category === cat);
                          const Icon = PEST_ICONS[cat];
                          return (
                            <Card key={cat} className="border-border/50">
                              <CardContent className="p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Icon className={`h-4 w-4 ${PEST_COLORS[cat].split(" ").slice(1).join(" ")}`} />
                                  <p className="text-sm font-semibold capitalize">{cat}</p>
                                </div>
                                {items.length === 0 ? (
                                  <p className="text-xs text-muted-foreground">No factors</p>
                                ) : (
                                  <div className="space-y-1.5">
                                    {items.map((item) => (
                                      <div key={item.id} className="text-xs">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-medium">{item.factor}</span>
                                          <Badge className={`text-[10px] px-1.5 py-0 ${IMPACT_COLORS[item.impact]}`}>
                                            {item.impact}
                                          </Badge>
                                        </div>
                                        {item.notes && <p className="text-muted-foreground mt-0.5">{item.notes}</p>}
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
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-border/60">
                <CardContent className="flex items-center justify-center py-16">
                  <p className="text-sm text-muted-foreground">Select a report to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Report" : "New Market Research Report"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Report Name *</Label>
              <Input
                placeholder="e.g., Shopify App Market Q1 2024"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Market Size</Label>
                <Input
                  placeholder="e.g., $5.2B"
                  value={form.marketSize}
                  onChange={(e) => setForm((f) => ({ ...f, marketSize: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Growth Rate</Label>
                <Input
                  placeholder="e.g., 12% YoY"
                  value={form.growthRate}
                  onChange={(e) => setForm((f) => ({ ...f, growthRate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Key Trends</Label>
              <Textarea
                placeholder="Market trends, one per line..."
                value={form.trends}
                onChange={(e) => setForm((f) => ({ ...f, trends: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Competitors</Label>
              <Textarea
                placeholder="Major competitors and their positioning..."
                value={form.competitors}
                onChange={(e) => setForm((f) => ({ ...f, competitors: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Barriers to Entry</Label>
              <Textarea
                placeholder="What makes it hard to enter this market..."
                value={form.barriers}
                onChange={(e) => setForm((f) => ({ ...f, barriers: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <Label>PEST Analysis Factors</Label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={pestForm.category}
                  onChange={(e) => setPestForm((f) => ({ ...f, category: e.target.value as PestItem["category"] }))}
                >
                  <option value="political">Political</option>
                  <option value="economic">Economic</option>
                  <option value="social">Social</option>
                  <option value="technological">Technological</option>
                </select>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={pestForm.impact}
                  onChange={(e) => setPestForm((f) => ({ ...f, impact: e.target.value as PestItem["impact"] }))}
                >
                  <option value="high">High Impact</option>
                  <option value="medium">Medium Impact</option>
                  <option value="low">Low Impact</option>
                </select>
              </div>
              <Input
                placeholder="Factor name"
                value={pestForm.factor}
                onChange={(e) => setPestForm((f) => ({ ...f, factor: e.target.value }))}
              />
              <Input
                placeholder="Notes (optional)"
                value={pestForm.notes}
                onChange={(e) => setPestForm((f) => ({ ...f, notes: e.target.value }))}
              />
              <Button variant="outline" size="sm" onClick={addPestItem} disabled={!pestForm.factor.trim()}>
                <Plus className="h-3 w-3 mr-1" /> Add Factor
              </Button>
              {form.pestItems.length > 0 && (
                <div className="space-y-1.5">
                  {form.pestItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] px-1.5 py-0 ${PEST_COLORS[item.category]} border-0`}>
                          {item.category}
                        </Badge>
                        <span>{item.factor}</span>
                        <Badge className={`text-[10px] px-1.5 py-0 ${IMPACT_COLORS[item.impact]}`}>
                          {item.impact}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removePestItem(item.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0"
            >
              <Save className="h-4 w-4 mr-2" />
              {editingId ? "Save Changes" : "Save Report"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
