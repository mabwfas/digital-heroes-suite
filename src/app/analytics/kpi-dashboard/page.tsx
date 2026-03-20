"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  Plus,
  Trash2,
  Target,
  TrendingUp,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface WeeklyEntry {
  week: string;
  value: number;
}

interface KPI {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  weeklyData: WeeklyEntry[];
}

const UNITS = ["%", "$", "#", "hrs", "pts", "x"];

function achievementPct(current: number, target: number): number {
  if (target === 0) return 0;
  return Math.round((current / target) * 100);
}

function statusColor(pct: number): string {
  if (pct >= 100) return "text-emerald-600";
  if (pct >= 75) return "text-amber-600";
  return "text-red-600";
}

function statusBg(pct: number): string {
  if (pct >= 100) return "bg-emerald-500";
  if (pct >= 75) return "bg-amber-500";
  return "bg-red-500";
}

function statusBadge(pct: number): { label: string; className: string } {
  if (pct >= 100) return { label: "On Track", className: "bg-emerald-500/10 text-emerald-600 border-0" };
  if (pct >= 75) return { label: "At Risk", className: "bg-amber-500/10 text-amber-600 border-0" };
  return { label: "Behind", className: "bg-red-500/10 text-red-600 border-0" };
}

export default function KpiDashboardPage() {
  const [kpis, setKpis, hydrated] = useLocalStorage<KPI[]>("analytics-kpi-dashboard", []);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [unit, setUnit] = useState("%");
  const [editingWeek, setEditingWeek] = useState<{ kpiId: string; week: string; value: string } | null>(null);
  const [newWeek, setNewWeek] = useState("");
  const [newWeekValue, setNewWeekValue] = useState("");
  const [weekKpiId, setWeekKpiId] = useState("");

  const summary = useMemo(() => {
    const total = kpis.length;
    const onTrack = kpis.filter((k) => achievementPct(k.current, k.target) >= 100).length;
    const atRisk = kpis.filter((k) => {
      const p = achievementPct(k.current, k.target);
      return p >= 75 && p < 100;
    }).length;
    const behind = total - onTrack - atRisk;
    const avgAchievement = total > 0 ? Math.round(kpis.reduce((s, k) => s + achievementPct(k.current, k.target), 0) / total) : 0;
    return { total, onTrack, atRisk, behind, avgAchievement };
  }, [kpis]);

  function handleAdd() {
    if (!name.trim()) return;
    const kpi: KPI = {
      id: generateId(),
      name: name.trim(),
      target: parseFloat(target) || 0,
      current: parseFloat(current) || 0,
      unit,
      weeklyData: [],
    };
    setKpis((prev) => [...prev, kpi]);
    setName("");
    setTarget("");
    setCurrent("");
    setUnit("%");
  }

  function handleAddWeekly() {
    if (!weekKpiId || !newWeek.trim()) return;
    setKpis((prev) =>
      prev.map((k) =>
        k.id === weekKpiId
          ? { ...k, weeklyData: [...k.weeklyData, { week: newWeek.trim(), value: parseFloat(newWeekValue) || 0 }] }
          : k
      )
    );
    setNewWeek("");
    setNewWeekValue("");
    setWeekKpiId("");
  }

  function handleUpdateCurrent(id: string, value: number) {
    setKpis((prev) => prev.map((k) => (k.id === id ? { ...k, current: value } : k)));
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="KPI Dashboard"
        description="Define KPIs, track achievement percentages, and monitor weekly trends with color-coded status indicators."
        icon={BarChart3}
        badge="Analytics"
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total KPIs", value: summary.total.toString(), color: "text-violet-600" },
          { label: "On Track", value: summary.onTrack.toString(), color: "text-emerald-600" },
          { label: "At Risk", value: summary.atRisk.toString(), color: "text-amber-600" },
          { label: "Behind", value: summary.behind.toString(), color: "text-red-600" },
          { label: "Avg Achievement", value: `${summary.avgAchievement}%`, color: summary.avgAchievement >= 75 ? "text-emerald-600" : "text-red-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-violet-500" />
            Add KPI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="space-y-1.5">
              <Label>KPI Name *</Label>
              <Input placeholder="Revenue Growth" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Target</Label>
              <Input type="number" placeholder="100" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Current</Label>
              <Input type="number" placeholder="75" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={(v) => { if (v) setUnit(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="invisible">Add</Label>
              <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleAdd} disabled={!name.trim()}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {kpis.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              Add Weekly Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label>KPI</Label>
                <Select value={weekKpiId} onValueChange={(v) => { if (v) setWeekKpiId(v); }}>
                  <SelectTrigger><SelectValue placeholder="Select KPI" /></SelectTrigger>
                  <SelectContent>
                    {kpis.map((k) => (
                      <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Week Label</Label>
                <Input placeholder="Week 1" value={newWeek} onChange={(e) => setNewWeek(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Value</Label>
                <Input type="number" placeholder="25" value={newWeekValue} onChange={(e) => setNewWeekValue(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="invisible">Add</Label>
                <Button variant="outline" className="w-full" onClick={handleAddWeekly} disabled={!weekKpiId || !newWeek.trim()}>
                  <Plus className="h-4 w-4" />
                  Add Entry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {kpis.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Target className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Define your first KPI to start tracking performance.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {kpis.map((kpi) => {
            const pct = achievementPct(kpi.current, kpi.target);
            const badge = statusBadge(pct);
            const maxWeekly = kpi.weeklyData.length > 0 ? Math.max(...kpi.weeklyData.map((w) => w.value), 1) : 1;
            return (
              <Card key={kpi.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{kpi.name}</h3>
                        <Badge className={badge.className}>{badge.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {kpi.current}{kpi.unit} of {kpi.target}{kpi.unit} target
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${statusColor(pct)}`}>{pct}%</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setKpis((prev) => prev.filter((k) => k.id !== kpi.id))}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="w-full bg-muted rounded-full h-2.5 mb-4">
                    <div
                      className={`h-2.5 rounded-full transition-all ${statusBg(pct)}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-xs">Update Current:</Label>
                    <Input
                      type="number"
                      className="w-24 h-7 text-xs"
                      value={kpi.current}
                      onChange={(e) => handleUpdateCurrent(kpi.id, parseFloat(e.target.value) || 0)}
                    />
                    <span className="text-xs text-muted-foreground">{kpi.unit}</span>
                  </div>

                  {kpi.weeklyData.length > 0 && (
                    <>
                      <Separator className="my-3" />
                      <p className="text-xs font-medium text-muted-foreground mb-2">Weekly Trend</p>
                      <div className="flex items-end gap-1 h-20">
                        {kpi.weeklyData.map((w, i) => {
                          const h = Math.max(8, (w.value / maxWeekly) * 100);
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                              <span className="text-[9px] font-mono text-muted-foreground">{w.value}</span>
                              <div
                                className="w-full rounded-t bg-gradient-to-t from-violet-500 to-pink-400"
                                style={{ height: `${h}%` }}
                              />
                              <span className="text-[8px] text-muted-foreground truncate w-full text-center">{w.week}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
