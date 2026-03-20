"use client";

import { useState, useMemo } from "react";
import {
  FlaskConical,
  Plus,
  Trash2,
  Trophy,
  BarChart3,
  Filter,
  Calculator,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type Metric = "CTR" | "CVR" | "CPA" | "ROAS";

interface Experiment {
  id: string;
  name: string;
  variantA: string;
  variantB: string;
  metric: Metric;
  sampleSizeA: number;
  conversionsA: number;
  sampleSizeB: number;
  conversionsB: number;
  status: "running" | "completed";
  winner: "A" | "B" | "none" | null;
  confidence: number;
  createdAt: string;
}

function calcSignificance(nA: number, cA: number, nB: number, cB: number): { winner: "A" | "B" | "none"; confidence: number } {
  if (nA === 0 || nB === 0) return { winner: "none", confidence: 0 };
  const pA = cA / nA;
  const pB = cB / nB;
  const seA = Math.sqrt((pA * (1 - pA)) / nA);
  const seB = Math.sqrt((pB * (1 - pB)) / nB);
  const seDiff = Math.sqrt(seA * seA + seB * seB);
  if (seDiff === 0) return { winner: "none", confidence: 0 };
  const z = Math.abs(pA - pB) / seDiff;
  // Approximate p-value from z-score
  const p = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  const confidence = Math.min(99.9, Math.round((1 - 2 * p) * 1000) / 10);
  if (confidence < 90) return { winner: "none", confidence };
  return { winner: pA > pB ? "A" : "B", confidence };
}

const METRIC_LABELS: Record<Metric, string> = { CTR: "Click-Through Rate", CVR: "Conversion Rate", CPA: "Cost Per Acquisition", ROAS: "Return on Ad Spend" };

export default function ABTrackerPage() {
  const [experiments, setExperiments, hydrated] = useLocalStorage<Experiment[]>("ads-ab-experiments", []);
  const [showForm, setShowForm] = useState(false);
  const [filterMetric, setFilterMetric] = useState<"all" | Metric>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "running" | "completed">("all");

  const [name, setName] = useState("");
  const [variantA, setVariantA] = useState("");
  const [variantB, setVariantB] = useState("");
  const [metric, setMetric] = useState<Metric>("CTR");
  const [sampleSizeA, setSampleSizeA] = useState("");
  const [sampleSizeB, setSampleSizeB] = useState("");
  const [conversionsA, setConversionsA] = useState("");
  const [conversionsB, setConversionsB] = useState("");

  const filtered = useMemo(() => {
    return experiments.filter((e) => {
      if (filterMetric !== "all" && e.metric !== filterMetric) return false;
      if (filterStatus !== "all" && e.status !== filterStatus) return false;
      return true;
    });
  }, [experiments, filterMetric, filterStatus]);

  const stats = useMemo(() => ({
    total: experiments.length,
    running: experiments.filter((e) => e.status === "running").length,
    completed: experiments.filter((e) => e.status === "completed").length,
    winRate: experiments.filter((e) => e.winner && e.winner !== "none").length,
  }), [experiments]);

  function handleAdd() {
    if (!name.trim()) return;
    const nA = parseInt(sampleSizeA) || 0;
    const cA = parseInt(conversionsA) || 0;
    const nB = parseInt(sampleSizeB) || 0;
    const cB = parseInt(conversionsB) || 0;
    const result = calcSignificance(nA, cA, nB, cB);
    const exp: Experiment = {
      id: generateId(),
      name: name.trim(),
      variantA: variantA.trim(),
      variantB: variantB.trim(),
      metric,
      sampleSizeA: nA,
      conversionsA: cA,
      sampleSizeB: nB,
      conversionsB: cB,
      status: result.confidence >= 95 ? "completed" : "running",
      winner: result.winner,
      confidence: result.confidence,
      createdAt: new Date().toISOString(),
    };
    setExperiments((prev) => [exp, ...prev]);
    setShowForm(false);
    resetForm();
  }

  function recalculate(id: string, field: string, value: string) {
    setExperiments((prev) => prev.map((e) => {
      if (e.id !== id) return e;
      const updated = { ...e, [field]: parseInt(value) || 0 };
      const result = calcSignificance(updated.sampleSizeA, updated.conversionsA, updated.sampleSizeB, updated.conversionsB);
      return { ...updated, winner: result.winner, confidence: result.confidence, status: result.confidence >= 95 ? "completed" : "running" };
    }));
  }

  function resetForm() {
    setName("");
    setVariantA("");
    setVariantB("");
    setMetric("CTR");
    setSampleSizeA("");
    setSampleSizeB("");
    setConversionsA("");
    setConversionsB("");
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="A/B Test Tracker" description="Track experiments, calculate statistical significance, and declare winners." icon={FlaskConical} badge="Ads" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Tests", value: stats.total, color: "text-violet-600" },
          { label: "Running", value: stats.running, color: "text-amber-600" },
          { label: "Completed", value: stats.completed, color: "text-emerald-600" },
          { label: "Winners Found", value: stats.winRate, color: "text-pink-600" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground mt-0.5">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filterMetric} onValueChange={(v) => setFilterMetric(v as typeof filterMetric)}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Metrics" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Metrics</SelectItem>{(Object.keys(METRIC_LABELS) as Metric[]).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="running">Running</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent>
        </Select>
        <Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white ml-auto" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />New Experiment</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">New A/B Experiment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Experiment Name *</Label><Input placeholder="e.g., Homepage CTA Color" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Primary Metric</Label><Select value={metric} onValueChange={(v) => setMetric(v as Metric)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(METRIC_LABELS) as Metric[]).map((m) => <SelectItem key={m} value={m}>{METRIC_LABELS[m]}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Variant A Description</Label><Input placeholder="Control: Blue button" value={variantA} onChange={(e) => setVariantA(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Variant B Description</Label><Input placeholder="Test: Green button" value={variantB} onChange={(e) => setVariantB(e.target.value)} /></div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5"><Label>Sample A</Label><Input type="number" placeholder="1000" value={sampleSizeA} onChange={(e) => setSampleSizeA(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Conversions A</Label><Input type="number" placeholder="50" value={conversionsA} onChange={(e) => setConversionsA(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Sample B</Label><Input type="number" placeholder="1000" value={sampleSizeB} onChange={(e) => setSampleSizeB(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Conversions B</Label><Input type="number" placeholder="65" value={conversionsB} onChange={(e) => setConversionsB(e.target.value)} /></div>
            </div>
            <div className="flex gap-2">
              <Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleAdd} disabled={!name.trim()}><Calculator className="h-4 w-4" />Create & Calculate</Button>
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-16 text-center">
          <FlaskConical className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No experiments yet. Create your first A/B test to get started.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((exp) => {
            const rateA = exp.sampleSizeA > 0 ? ((exp.conversionsA / exp.sampleSizeA) * 100).toFixed(2) : "0.00";
            const rateB = exp.sampleSizeB > 0 ? ((exp.conversionsB / exp.sampleSizeB) * 100).toFixed(2) : "0.00";
            return (
              <Card key={exp.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{exp.name}</p>
                        <Badge variant="secondary" className="text-[10px]">{exp.metric}</Badge>
                        <Badge className={exp.status === "completed" ? "bg-emerald-500/10 text-emerald-600 border-0 text-[10px]" : "bg-amber-500/10 text-amber-600 border-0 text-[10px]"}>{exp.status}</Badge>
                      </div>
                      {exp.winner && exp.winner !== "none" && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Trophy className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-xs font-medium text-amber-600">Variant {exp.winner} wins with {exp.confidence}% confidence</span>
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setExperiments((prev) => prev.filter((e) => e.id !== exp.id))}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`rounded-lg border p-3 ${exp.winner === "A" ? "border-emerald-500/50 bg-emerald-500/5" : ""}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium">Variant A {exp.winner === "A" && <Trophy className="h-3 w-3 inline text-amber-500" />}</span>
                        <span className="text-lg font-bold">{rateA}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{exp.variantA || "Control"}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1"><Label className="text-[10px]">Sample</Label><Input type="number" value={exp.sampleSizeA} onChange={(e) => recalculate(exp.id, "sampleSizeA", e.target.value)} className="h-7 text-xs" /></div>
                        <div className="space-y-1"><Label className="text-[10px]">Conversions</Label><Input type="number" value={exp.conversionsA} onChange={(e) => recalculate(exp.id, "conversionsA", e.target.value)} className="h-7 text-xs" /></div>
                      </div>
                    </div>
                    <div className={`rounded-lg border p-3 ${exp.winner === "B" ? "border-emerald-500/50 bg-emerald-500/5" : ""}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium">Variant B {exp.winner === "B" && <Trophy className="h-3 w-3 inline text-amber-500" />}</span>
                        <span className="text-lg font-bold">{rateB}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{exp.variantB || "Test"}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1"><Label className="text-[10px]">Sample</Label><Input type="number" value={exp.sampleSizeB} onChange={(e) => recalculate(exp.id, "sampleSizeB", e.target.value)} className="h-7 text-xs" /></div>
                        <div className="space-y-1"><Label className="text-[10px]">Conversions</Label><Input type="number" value={exp.conversionsB} onChange={(e) => recalculate(exp.id, "conversionsB", e.target.value)} className="h-7 text-xs" /></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2"><div className="bg-gradient-to-r from-violet-500 to-pink-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, exp.confidence)}%` }} /></div>
                    <span className="text-xs font-mono text-muted-foreground w-14 text-right">{exp.confidence}%</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
