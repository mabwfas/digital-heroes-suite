"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Clock, Plus, Trash2, Play, Square, Copy, Check, Palette, FolderPlus, DollarSign, Timer, Briefcase } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface Project {
  id: string;
  name: string;
  client: string;
  hourlyRate: number;
  color: string;
}

interface TimeEntry {
  id: string;
  projectId: string;
  hours: number;
  date: string;
  note: string;
  createdAt: string;
}

interface TimerState {
  running: boolean;
  projectId: string;
  startedAt: number | null;
}

const PROJECT_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6",
  "#ef4444", "#8b5cf6", "#14b8a6", "#f97316", "#06b6d4",
];

function formatHours(h: number): string {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return `${hrs}h ${mins}m`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatTimerDisplay(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function TimeTrackerPage() {
  const [projects, setProjects, hydrated] = useLocalStorage<Project[]>("finance-time-projects", []);
  const [entries, setEntries] = useLocalStorage<TimeEntry[]>("finance-time-entries", []);
  const [timer, setTimer] = useLocalStorage<TimerState>("finance-time-timer", { running: false, projectId: "", startedAt: null });

  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Project form
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projName, setProjName] = useState("");
  const [projClient, setProjClient] = useState("");
  const [projRate, setProjRate] = useState("");
  const [projColor, setProjColor] = useState(PROJECT_COLORS[0]);

  // Manual entry form
  const [entryProjectId, setEntryProjectId] = useState("");
  const [entryHours, setEntryHours] = useState("");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [entryNote, setEntryNote] = useState("");

  const [copied, setCopied] = useState(false);

  // Timer logic
  useEffect(() => {
    if (timer.running && timer.startedAt) {
      const tick = () => {
        setElapsed(Math.floor((Date.now() - timer.startedAt!) / 1000));
      };
      tick();
      intervalRef.current = setInterval(tick, 1000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    } else {
      setElapsed(0);
    }
  }, [timer.running, timer.startedAt]);

  const startTimer = (projectId: string) => {
    setTimer({ running: true, projectId, startedAt: Date.now() });
  };

  const stopTimer = useCallback(() => {
    if (!timer.running || !timer.startedAt) return;
    const elapsedHours = (Date.now() - timer.startedAt) / 3600000;
    if (elapsedHours >= 0.01) {
      const entry: TimeEntry = {
        id: generateId(),
        projectId: timer.projectId,
        hours: Math.round(elapsedHours * 100) / 100,
        date: new Date().toISOString().split("T")[0],
        note: "Timer entry",
        createdAt: new Date().toISOString(),
      };
      setEntries((prev) => [entry, ...prev]);
    }
    setTimer({ running: false, projectId: "", startedAt: null });
  }, [timer, setEntries, setTimer]);

  const addProject = () => {
    if (!projName.trim()) return;
    const project: Project = {
      id: generateId(),
      name: projName.trim(),
      client: projClient.trim(),
      hourlyRate: parseFloat(projRate) || 0,
      color: projColor,
    };
    setProjects((prev) => [...prev, project]);
    setProjName("");
    setProjClient("");
    setProjRate("");
    setProjColor(PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]);
    setShowProjectForm(false);
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setEntries((prev) => prev.filter((e) => e.projectId !== id));
  };

  const addEntry = () => {
    const h = parseFloat(entryHours);
    if (!h || h <= 0 || !entryProjectId) return;
    const entry: TimeEntry = {
      id: generateId(),
      projectId: entryProjectId,
      hours: h,
      date: entryDate,
      note: entryNote.trim(),
      createdAt: new Date().toISOString(),
    };
    setEntries((prev) => [entry, ...prev]);
    setEntryHours("");
    setEntryNote("");
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const getProject = (id: string) => projects.find((p) => p.id === id);

  // Stats
  const stats = useMemo(() => {
    const totalHours = entries.reduce((s, e) => s + e.hours, 0);
    const totalBillable = entries.reduce((s, e) => {
      const proj = getProject(e.projectId);
      return s + e.hours * (proj?.hourlyRate || 0);
    }, 0);
    const activeProjects = new Set(entries.map((e) => e.projectId)).size;
    return { totalHours, totalBillable, activeProjects };
  }, [entries, projects]);

  // Weekly view (last 7 days)
  const weeklyData = useMemo(() => {
    const days: { label: string; date: string; entries: { projectId: string; hours: number }[] }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayEntries = entries.filter((e) => e.date === dateStr);
      const grouped: Record<string, number> = {};
      dayEntries.forEach((e) => {
        grouped[e.projectId] = (grouped[e.projectId] || 0) + e.hours;
      });
      days.push({
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: dateStr,
        entries: Object.entries(grouped).map(([projectId, hours]) => ({ projectId, hours })),
      });
    }
    return days;
  }, [entries]);

  const maxDayHours = Math.max(...weeklyData.map((d) => d.entries.reduce((s, e) => s + e.hours, 0)), 1);

  // Entries grouped by project
  const groupedEntries = useMemo(() => {
    const groups: Record<string, { project: Project; entries: TimeEntry[]; totalHours: number; totalAmount: number }> = {};
    entries.forEach((e) => {
      const proj = getProject(e.projectId);
      if (!proj) return;
      if (!groups[e.projectId]) {
        groups[e.projectId] = { project: proj, entries: [], totalHours: 0, totalAmount: 0 };
      }
      groups[e.projectId].entries.push(e);
      groups[e.projectId].totalHours += e.hours;
      groups[e.projectId].totalAmount += e.hours * proj.hourlyRate;
    });
    return Object.values(groups);
  }, [entries, projects]);

  const generateInvoice = async () => {
    const lines = groupedEntries.map((g) => {
      return `${g.project.name} (${g.project.client})\n  Hours: ${formatHours(g.totalHours)} @ ${formatCurrency(g.project.hourlyRate)}/hr\n  Subtotal: ${formatCurrency(g.totalAmount)}`;
    });
    const text = `INVOICE SUMMARY\n${"=".repeat(40)}\n\n${lines.join("\n\n")}\n\n${"=".repeat(40)}\nTOTAL: ${formatCurrency(stats.totalBillable)}\nTotal Hours: ${formatHours(stats.totalHours)}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time Tracker"
        description="Track billable hours by project with a live timer, manual entry, and invoice generation."
        icon={Clock}
        replaces="Toggl ($10/mo)"
        actions={
          <Button onClick={generateInvoice} variant="outline" disabled={entries.length === 0}>
            {copied ? <Check className="h-4 w-4 mr-2 text-emerald-500" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied!" : "Generate Invoice Data"}
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Timer className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Total Hours</span>
            </div>
            <p className="text-2xl font-bold">{formatHours(stats.totalHours)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Total Billable</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalBillable)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Briefcase className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Active Projects</span>
            </div>
            <p className="text-2xl font-bold">{stats.activeProjects}</p>
          </CardContent>
        </Card>
      </div>

      {/* Timer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Timer</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">Create a project first to use the timer.</p>
          ) : timer.running ? (
            <div className="flex items-center gap-4">
              <div className="font-mono text-4xl font-bold tracking-wider tabular-nums">{formatTimerDisplay(elapsed)}</div>
              <div className="flex-1">
                <p className="text-sm font-medium">{getProject(timer.projectId)?.name}</p>
                <p className="text-xs text-muted-foreground">{getProject(timer.projectId)?.client}</p>
              </div>
              <Button onClick={stopTimer} variant="destructive" size="lg">
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {projects.map((p) => (
                <Button key={p.id} variant="outline" onClick={() => startTimer(p.id)}>
                  <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: p.color }} />
                  <Play className="h-3 w-3 mr-1" />
                  {p.name}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly View */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-40">
            {weeklyData.map((day) => {
              const totalH = day.entries.reduce((s, e) => s + e.hours, 0);
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{totalH > 0 ? formatHours(totalH) : ""}</span>
                  <div className="w-full bg-muted rounded-t-md relative" style={{ height: "110px" }}>
                    <div className="absolute bottom-0 w-full rounded-t-md overflow-hidden flex flex-col-reverse" style={{ height: `${(totalH / maxDayHours) * 100}%`, minHeight: totalH > 0 ? "4px" : "0px" }}>
                      {day.entries.map((e, i) => {
                        const proj = getProject(e.projectId);
                        const pct = totalH > 0 ? (e.hours / totalH) * 100 : 0;
                        return (
                          <div
                            key={i}
                            style={{ backgroundColor: proj?.color || "#94a3b8", height: `${pct}%`, minHeight: "2px" }}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{day.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Projects & Manual Entry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Projects</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowProjectForm(!showProjectForm)}>
              <FolderPlus className="h-3.5 w-3.5 mr-1" />
              New
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {showProjectForm && (
              <div className="p-3 rounded-xl border bg-muted/30 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Name</Label>
                    <Input placeholder="Project name" value={projName} onChange={(e) => setProjName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Client</Label>
                    <Input placeholder="Client name" value={projClient} onChange={(e) => setProjClient(e.target.value)} />
                  </div>
                  <div>
                    <Label>Rate ($/hr)</Label>
                    <Input type="number" min="0" step="0.01" placeholder="0.00" value={projRate} onChange={(e) => setProjRate(e.target.value)} />
                  </div>
                  <div>
                    <Label>Color</Label>
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {PROJECT_COLORS.map((c) => (
                        <button
                          key={c}
                          className={`h-6 w-6 rounded-full border-2 transition-all ${projColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                          style={{ backgroundColor: c }}
                          onClick={() => setProjColor(c)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <Button size="sm" onClick={addProject}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Project
                </Button>
              </div>
            )}
            {projects.length === 0 ? (
              <div className="py-8 text-center">
                <Briefcase className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No projects yet. Create one to start tracking time.</p>
              </div>
            ) : (
              projects.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30">
                  <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.client || "No client"} &middot; {formatCurrency(p.hourlyRate)}/hr</p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive shrink-0" onClick={() => deleteProject(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Manual Entry */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Manual Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Create a project first.</p>
            ) : (
              <>
                <div>
                  <Label>Project</Label>
                  <select
                    value={entryProjectId}
                    onChange={(e) => setEntryProjectId(e.target.value)}
                    className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  >
                    <option value="">Select project...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Hours</Label>
                    <Input type="number" min="0" step="0.25" placeholder="1.5" value={entryHours} onChange={(e) => setEntryHours(e.target.value)} />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Note</Label>
                  <Input placeholder="What did you work on?" value={entryNote} onChange={(e) => setEntryNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addEntry()} />
                </div>
                <Button onClick={addEntry} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Time Entries by Project */}
      {groupedEntries.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Time Entries by Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupedEntries.map((g) => (
              <div key={g.project.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: g.project.color }} />
                  <span className="text-sm font-medium">{g.project.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{formatHours(g.totalHours)}</Badge>
                  <span className="text-sm font-bold ml-auto">{formatCurrency(g.totalAmount)}</span>
                </div>
                <div className="pl-5 space-y-1">
                  {g.entries.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground text-xs w-20">{e.date}</span>
                      <span className="text-xs font-mono">{formatHours(e.hours)}</span>
                      <span className="text-xs text-muted-foreground flex-1 truncate">{e.note}</span>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive h-6 w-6 p-0" onClick={() => deleteEntry(e.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
