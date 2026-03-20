"use client";

import { useState, useCallback, useMemo } from "react";
import { Flame, Check, RotateCcw, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface WarmupDay {
  day: number;
  target: number;
  actual: number | null;
  completed: boolean;
}

interface WarmupPlan {
  id: string;
  name: string;
  startVolume: number;
  endVolume: number;
  days: number;
  schedule: WarmupDay[];
  startDate: string;
  createdAt: string;
}

function generateSchedule(startVol: number, endVol: number, totalDays: number): WarmupDay[] {
  const schedule: WarmupDay[] = [];
  for (let i = 0; i < totalDays; i++) {
    const progress = i / (totalDays - 1 || 1);
    // Exponential ramp-up curve
    const target = Math.round(startVol + (endVol - startVol) * Math.pow(progress, 1.5));
    schedule.push({ day: i + 1, target, actual: null, completed: false });
  }
  return schedule;
}

export default function WarmupPlannerPage() {
  const [plans, setPlans, hydrated] = useLocalStorage<WarmupPlan[]>("warmup-plans", []);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [name, setName] = useState("Domain Warmup");
  const [startVol, setStartVol] = useState("50");
  const [endVol, setEndVol] = useState("5000");
  const [days, setDays] = useState("14");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  const activePlan = useMemo(() => plans.find(p => p.id === activePlanId) || null, [plans, activePlanId]);

  const handleCreate = useCallback(() => {
    const sv = Number(startVol) || 50;
    const ev = Number(endVol) || 5000;
    const d = Number(days) || 14;
    const schedule = generateSchedule(sv, ev, d);
    const plan: WarmupPlan = {
      id: generateId(), name: name.trim() || "Untitled", startVolume: sv, endVolume: ev, days: d,
      schedule, startDate, createdAt: new Date().toISOString(),
    };
    setPlans(prev => [plan, ...prev.slice(0, 9)]);
    setActivePlanId(plan.id);
  }, [name, startVol, endVol, days, startDate, setPlans]);

  const markDay = useCallback((dayNum: number, actual: string) => {
    if (!activePlanId) return;
    setPlans(prev => prev.map(p => {
      if (p.id !== activePlanId) return p;
      return { ...p, schedule: p.schedule.map(d => d.day === dayNum ? { ...d, actual: Number(actual) || 0, completed: true } : d) };
    }));
  }, [activePlanId, setPlans]);

  const handleExport = useCallback(() => {
    if (!activePlan) return;
    const lines = ["Day,Date,Target Emails,Actual Sent,Status"];
    activePlan.schedule.forEach(d => {
      const date = new Date(activePlan.startDate);
      date.setDate(date.getDate() + d.day - 1);
      lines.push(`${d.day},${date.toISOString().split("T")[0]},${d.target},${d.actual ?? ""},${d.completed ? "Done" : "Pending"}`);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activePlan.name.replace(/\s+/g, "-")}-warmup.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activePlan]);

  const completedDays = activePlan?.schedule.filter(d => d.completed).length || 0;
  const totalDays = activePlan?.schedule.length || 0;
  const progress = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Warmup Planner"
        description="Plan IP/domain warmup schedules with daily targets and progress tracking."
        icon={Flame}
        badge="Free"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Flame className="h-4 w-4 text-violet-500" /> Create Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Plan Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Start Volume</Label>
                  <Input type="number" value={startVol} onChange={e => setStartVol(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Volume</Label>
                  <Input type="number" value={endVol} onChange={e => setEndVol(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Duration (days)</Label>
                  <Input type="number" value={days} onChange={e => setDays(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleCreate}>
                <Flame className="h-4 w-4" /> Generate Plan
              </Button>
            </CardContent>
          </Card>

          {plans.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Saved Plans</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {plans.map(p => (
                  <button key={p.id} onClick={() => setActivePlanId(p.id)}
                    className={`w-full text-left rounded-lg border p-2.5 transition-all text-xs ${activePlanId === p.id ? "border-violet-500 bg-violet-500/10" : "hover:border-violet-300"}`}
                  >
                    <p className="font-medium">{p.name}</p>
                    <p className="text-muted-foreground">{p.startVolume} → {p.endVolume} over {p.days} days</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {!activePlan ? (
            <Card><CardContent className="py-16 text-center">
              <Flame className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Create or select a warmup plan to get started.</p>
            </CardContent></Card>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{activePlan.name}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{completedDays}/{totalDays} days</Badge>
                      <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-3.5 w-3.5" /> CSV</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500" style={{ width: `${progress}%`, transition: "width 0.5s ease" }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{progress.toFixed(0)}% complete</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left font-medium">Day</th>
                        <th className="p-3 text-left font-medium">Date</th>
                        <th className="p-3 text-right font-medium">Target</th>
                        <th className="p-3 text-right font-medium">Actual</th>
                        <th className="p-3 text-center font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activePlan.schedule.map(d => {
                        const date = new Date(activePlan.startDate);
                        date.setDate(date.getDate() + d.day - 1);
                        return (
                          <tr key={d.day} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="p-3 font-mono">Day {d.day}</td>
                            <td className="p-3 text-muted-foreground">{date.toLocaleDateString()}</td>
                            <td className="p-3 text-right font-mono font-medium">{d.target.toLocaleString()}</td>
                            <td className="p-3 text-right">
                              {d.completed ? (
                                <span className="font-mono">{d.actual?.toLocaleString()}</span>
                              ) : (
                                <Input type="number" placeholder="0" className="w-24 ml-auto text-right h-7 text-xs"
                                  onKeyDown={e => { if (e.key === "Enter") markDay(d.day, (e.target as HTMLInputElement).value); }}
                                  onBlur={e => { if (e.target.value) markDay(d.day, e.target.value); }}
                                />
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {d.completed ? (
                                <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                              ) : (
                                <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600">Pending</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Volume Ramp-Up Preview</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-end gap-1 h-32">
                    {activePlan.schedule.map(d => {
                      const height = (d.target / activePlan.endVolume) * 100;
                      return (
                        <div key={d.day} className="flex-1 flex flex-col items-center justify-end" title={`Day ${d.day}: ${d.target}`}>
                          <div className={`w-full rounded-t-sm ${d.completed ? "bg-emerald-500" : "bg-violet-500/40"}`}
                            style={{ height: `${height}%`, transition: "height 0.3s ease", minHeight: "2px" }} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>Day 1</span>
                    <span>Day {activePlan.days}</span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
