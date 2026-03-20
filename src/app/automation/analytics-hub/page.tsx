"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  Plus,
  Trash2,
  DollarSign,
  Users,
  TrendingUp,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface MonthlyData {
  id: string;
  month: string;
  revenue: number;
  clients: number;
  utilization: number;
  margin: number;
  nps: number;
}

interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
}

export default function AnalyticsHubPage() {
  const [data, setData, hydrated] = useLocalStorage<MonthlyData[]>("analytics-hub-data", []);
  const [goals, setGoals] = useLocalStorage<Goal[]>("analytics-hub-goals", []);
  const [dataDialogOpen, setDataDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [dataForm, setDataForm] = useState({ month: "", revenue: 0, clients: 0, utilization: 0, margin: 0, nps: 0 });
  const [goalForm, setGoalForm] = useState({ name: "", target: 0, current: 0, unit: "$" });

  const sorted = useMemo(() => [...data].sort((a, b) => a.month.localeCompare(b.month)), [data]);
  const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;

  const totals = useMemo(() => ({
    totalRevenue: data.reduce((s, d) => s + d.revenue, 0),
    avgClients: data.length > 0 ? Math.round(data.reduce((s, d) => s + d.clients, 0) / data.length) : 0,
    avgUtilization: data.length > 0 ? Math.round(data.reduce((s, d) => s + d.utilization, 0) / data.length) : 0,
    avgMargin: data.length > 0 ? Math.round(data.reduce((s, d) => s + d.margin, 0) / data.length) : 0,
    avgNPS: data.length > 0 ? Math.round(data.reduce((s, d) => s + d.nps, 0) / data.length) : 0,
  }), [data]);

  const maxRevenue = useMemo(() => Math.max(...sorted.map((d) => d.revenue), 1), [sorted]);
  const maxClients = useMemo(() => Math.max(...sorted.map((d) => d.clients), 1), [sorted]);

  function addData() {
    if (!dataForm.month) return;
    setData((prev) => {
      const existing = prev.findIndex((d) => d.month === dataForm.month);
      if (existing >= 0) {
        return prev.map((d, i) => (i === existing ? { ...d, ...dataForm } : d));
      }
      return [...prev, { ...dataForm, id: generateId() }];
    });
    setDataDialogOpen(false);
    setDataForm({ month: "", revenue: 0, clients: 0, utilization: 0, margin: 0, nps: 0 });
  }

  function deleteData(id: string) { setData((prev) => prev.filter((d) => d.id !== id)); }

  function addGoal() {
    if (!goalForm.name.trim()) return;
    setGoals((prev) => [...prev, { ...goalForm, id: generateId() }]);
    setGoalDialogOpen(false);
    setGoalForm({ name: "", target: 0, current: 0, unit: "$" });
  }

  function updateGoalCurrent(id: string, current: number) {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, current } : g)));
  }

  function deleteGoal(id: string) { setGoals((prev) => prev.filter((g) => g.id !== id)); }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Agency Analytics Hub" description="Track revenue, clients, utilization, and key business metrics" icon={BarChart3} badge="Automation" replaces="Google Sheets / Databox" />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Revenue", value: `$${totals.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Avg Clients/Mo", value: totals.avgClients, icon: Users, color: "text-blue-600 dark:text-blue-400" },
          { label: "Avg Utilization", value: `${totals.avgUtilization}%`, icon: TrendingUp, color: "text-violet-600 dark:text-violet-400" },
          { label: "Avg Margin", value: `${totals.avgMargin}%`, icon: DollarSign, color: "text-amber-600 dark:text-amber-400" },
          { label: "Avg NPS", value: totals.avgNPS, icon: Target, color: "text-pink-600 dark:text-pink-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4">
              <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Revenue Trend</CardTitle>
              <Button onClick={() => setDataDialogOpen(true)} variant="outline" size="sm"><Plus className="h-3.5 w-3.5 mr-1" />Add Data</Button>
            </div>
          </CardHeader>
          <CardContent>
            {sorted.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">No data yet. Add monthly data to see trends.</div>
            ) : (
              <div className="space-y-2">
                {sorted.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 group">
                    <span className="text-xs text-muted-foreground w-16 shrink-0">{d.month}</span>
                    <div className="flex-1 h-6 bg-muted rounded overflow-hidden relative">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded transition-all" style={{ width: `${(d.revenue / maxRevenue) * 100}%` }} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium">${d.revenue.toLocaleString()}</span>
                    </div>
                    <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 shrink-0" onClick={() => deleteData(d.id)}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Count Chart */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Client Count</CardTitle></CardHeader>
          <CardContent>
            {sorted.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">No data yet.</div>
            ) : (
              <div className="space-y-2">
                {sorted.map((d) => (
                  <div key={d.id} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16 shrink-0">{d.month}</span>
                    <div className="flex-1 h-6 bg-muted rounded overflow-hidden relative">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded transition-all" style={{ width: `${(d.clients / maxClients) * 100}%` }} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium">{d.clients}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Goals */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-violet-500" />Goals</CardTitle>
            <Button onClick={() => setGoalDialogOpen(true)} variant="outline" size="sm"><Plus className="h-3.5 w-3.5 mr-1" />Add Goal</Button>
          </div>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">No goals set yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map((g) => {
                const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
                return (
                  <div key={g.id} className="rounded-lg border p-4 space-y-3 group">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{g.name}</p>
                      <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100" onClick={() => deleteGoal(g.id)}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold">{g.unit}{g.current.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">/ {g.unit}{g.target.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : pct >= 75 ? "bg-blue-500" : "bg-violet-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{pct}% complete</span>
                      <Input type="number" value={g.current || ""} onChange={(e) => updateGoalCurrent(g.id, parseFloat(e.target.value) || 0)} className="w-24 h-7 text-xs" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Data Table */}
      {sorted.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Monthly Data</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b">
                <th className="text-left p-3">Month</th><th className="text-right p-3">Revenue</th><th className="text-right p-3">Clients</th><th className="text-right p-3">Utilization</th><th className="text-right p-3">Margin</th><th className="text-right p-3">NPS</th>
              </tr></thead>
              <tbody>
                {sorted.map((d) => (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-3 font-medium">{d.month}</td>
                    <td className="p-3 text-right">${d.revenue.toLocaleString()}</td>
                    <td className="p-3 text-right">{d.clients}</td>
                    <td className="p-3 text-right">{d.utilization}%</td>
                    <td className="p-3 text-right">{d.margin}%</td>
                    <td className="p-3 text-right">{d.nps}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dataDialogOpen} onOpenChange={setDataDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Monthly Data</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label>Month *</Label><Input type="month" value={dataForm.month} onChange={(e) => setDataForm((f) => ({ ...f, month: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Revenue ($)</Label><Input type="number" value={dataForm.revenue || ""} onChange={(e) => setDataForm((f) => ({ ...f, revenue: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="space-y-1.5"><Label>Active Clients</Label><Input type="number" value={dataForm.clients || ""} onChange={(e) => setDataForm((f) => ({ ...f, clients: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Utilization %</Label><Input type="number" value={dataForm.utilization || ""} onChange={(e) => setDataForm((f) => ({ ...f, utilization: parseInt(e.target.value) || 0 }))} /></div>
              <div className="space-y-1.5"><Label>Margin %</Label><Input type="number" value={dataForm.margin || ""} onChange={(e) => setDataForm((f) => ({ ...f, margin: parseInt(e.target.value) || 0 }))} /></div>
              <div className="space-y-1.5"><Label>NPS Score</Label><Input type="number" value={dataForm.nps || ""} onChange={(e) => setDataForm((f) => ({ ...f, nps: parseInt(e.target.value) || 0 }))} /></div>
            </div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setDataDialogOpen(false)}>Cancel</Button><Button onClick={addData} disabled={!dataForm.month} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">Add Data</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Goal</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label>Goal Name *</Label><Input value={goalForm.name} onChange={(e) => setGoalForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g., Monthly Revenue" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Target</Label><Input type="number" value={goalForm.target || ""} onChange={(e) => setGoalForm((f) => ({ ...f, target: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="space-y-1.5"><Label>Current</Label><Input type="number" value={goalForm.current || ""} onChange={(e) => setGoalForm((f) => ({ ...f, current: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="space-y-1.5"><Label>Unit</Label><Input value={goalForm.unit} onChange={(e) => setGoalForm((f) => ({ ...f, unit: e.target.value }))} placeholder="$, %, #" /></div>
            </div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setGoalDialogOpen(false)}>Cancel</Button><Button onClick={addGoal} disabled={!goalForm.name.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">Add Goal</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
