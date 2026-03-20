"use client";

import { useState, useMemo } from "react";
import {
  Users,
  Plus,
  Trash2,
  Grid3X3,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface CohortRow {
  id: string;
  month: string;
  newClients: number;
  retainedM1: number;
  retainedM2: number;
  retainedM3: number;
  retainedM6: number;
  retainedM12: number;
}

function retentionPct(retained: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((retained / total) * 100);
}

function heatColor(pct: number): string {
  if (pct >= 80) return "bg-emerald-500 text-white";
  if (pct >= 60) return "bg-emerald-400 text-white";
  if (pct >= 40) return "bg-amber-400 text-white";
  if (pct >= 20) return "bg-orange-400 text-white";
  if (pct > 0) return "bg-red-400 text-white";
  return "bg-muted text-muted-foreground";
}

export default function CohortAnalyzerPage() {
  const [cohorts, setCohorts, hydrated] = useLocalStorage<CohortRow[]>("analytics-cohort-analyzer", []);
  const [month, setMonth] = useState("");
  const [newClients, setNewClients] = useState("");
  const [m1, setM1] = useState("");
  const [m2, setM2] = useState("");
  const [m3, setM3] = useState("");
  const [m6, setM6] = useState("");
  const [m12, setM12] = useState("");

  const avgRetention = useMemo(() => {
    if (cohorts.length === 0) return { m1: 0, m2: 0, m3: 0, m6: 0, m12: 0 };
    const calc = (field: keyof CohortRow) =>
      Math.round(cohorts.reduce((s, c) => s + retentionPct(c[field] as number, c.newClients), 0) / cohorts.length);
    return {
      m1: calc("retainedM1"),
      m2: calc("retainedM2"),
      m3: calc("retainedM3"),
      m6: calc("retainedM6"),
      m12: calc("retainedM12"),
    };
  }, [cohorts]);

  function handleAdd() {
    if (!month.trim() || !newClients) return;
    const row: CohortRow = {
      id: generateId(),
      month: month.trim(),
      newClients: parseInt(newClients) || 0,
      retainedM1: parseInt(m1) || 0,
      retainedM2: parseInt(m2) || 0,
      retainedM3: parseInt(m3) || 0,
      retainedM6: parseInt(m6) || 0,
      retainedM12: parseInt(m12) || 0,
    };
    setCohorts((prev) => [...prev, row]);
    setMonth(""); setNewClients(""); setM1(""); setM2(""); setM3(""); setM6(""); setM12("");
  }

  if (!hydrated) return null;

  const periods = ["Month 1", "Month 2", "Month 3", "Month 6", "Month 12"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cohort Analyzer"
        description="Track monthly cohort retention with heat map visualization and average retention rates."
        icon={Users}
        badge="Analytics"
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Avg M1 Retention", value: `${avgRetention.m1}%` },
          { label: "Avg M2 Retention", value: `${avgRetention.m2}%` },
          { label: "Avg M3 Retention", value: `${avgRetention.m3}%` },
          { label: "Avg M6 Retention", value: `${avgRetention.m6}%` },
          { label: "Avg M12 Retention", value: `${avgRetention.m12}%` },
        ].map((s, i) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={`text-xl font-bold ${parseInt(s.value) >= 50 ? "text-emerald-600" : "text-amber-600"}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-violet-500" />
            Add Cohort Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="space-y-1.5">
              <Label>Cohort Month *</Label>
              <Input placeholder="Jan 2024" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>New Clients *</Label>
              <Input type="number" placeholder="50" value={newClients} onChange={(e) => setNewClients(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Retained M1</Label>
              <Input type="number" placeholder="40" value={m1} onChange={(e) => setM1(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Retained M2</Label>
              <Input type="number" placeholder="35" value={m2} onChange={(e) => setM2(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Retained M3</Label>
              <Input type="number" placeholder="30" value={m3} onChange={(e) => setM3(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Retained M6</Label>
              <Input type="number" placeholder="20" value={m6} onChange={(e) => setM6(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Retained M12</Label>
              <Input type="number" placeholder="12" value={m12} onChange={(e) => setM12(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="invisible">Add</Label>
              <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleAdd} disabled={!month.trim() || !newClients}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {cohorts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Grid3X3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Add cohort data to generate the retention heat map.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Grid3X3 className="h-4 w-4 text-violet-500" />
              Retention Heat Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-xs font-medium text-muted-foreground">Cohort</th>
                    <th className="text-center p-2 text-xs font-medium text-muted-foreground">New</th>
                    {periods.map((p) => (
                      <th key={p} className="text-center p-2 text-xs font-medium text-muted-foreground">{p}</th>
                    ))}
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {cohorts.map((c) => {
                    const retentions = [
                      retentionPct(c.retainedM1, c.newClients),
                      retentionPct(c.retainedM2, c.newClients),
                      retentionPct(c.retainedM3, c.newClients),
                      retentionPct(c.retainedM6, c.newClients),
                      retentionPct(c.retainedM12, c.newClients),
                    ];
                    return (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="p-2 font-medium whitespace-nowrap">{c.month}</td>
                        <td className="p-2 text-center font-semibold">{c.newClients}</td>
                        {retentions.map((pct, i) => (
                          <td key={i} className="p-1 text-center">
                            <div className={`rounded px-2 py-1 text-xs font-semibold ${heatColor(pct)}`}>
                              {pct}%
                            </div>
                          </td>
                        ))}
                        <td className="p-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCohorts((prev) => prev.filter((x) => x.id !== c.id))}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-muted/30 font-semibold">
                    <td className="p-2">Average</td>
                    <td className="p-2 text-center">—</td>
                    {[avgRetention.m1, avgRetention.m2, avgRetention.m3, avgRetention.m6, avgRetention.m12].map((pct, i) => (
                      <td key={i} className="p-1 text-center">
                        <div className={`rounded px-2 py-1 text-xs font-semibold ${heatColor(pct)}`}>
                          {pct}%
                        </div>
                      </td>
                    ))}
                    <td className="p-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
              <span>Legend:</span>
              {[
                { label: "80%+", cls: "bg-emerald-500" },
                { label: "60-79%", cls: "bg-emerald-400" },
                { label: "40-59%", cls: "bg-amber-400" },
                { label: "20-39%", cls: "bg-orange-400" },
                { label: "<20%", cls: "bg-red-400" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded ${l.cls}`} />
                  <span>{l.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
