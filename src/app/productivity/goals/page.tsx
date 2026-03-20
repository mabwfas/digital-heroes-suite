"use client";

import { useState, useMemo } from "react";
import { Target, Plus, Trash2, Edit2, CheckCircle2, Circle, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface Milestone {
  id: string;
  text: string;
  targetDate: string;
  done: boolean;
}

interface Goal {
  id: string;
  title: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
  deadline: string;
  quarter: string;
  progress: number;
  milestones: Milestone[];
  status: "active" | "completed" | "paused";
  createdAt: string;
}

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

export default function GoalsPage() {
  const [goals, setGoals] = useLocalStorage<Goal[]>("productivity-goals", []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterQuarter, setFilterQuarter] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newMilestoneText, setNewMilestoneText] = useState("");
  const [newMilestoneDate, setNewMilestoneDate] = useState("");

  const [form, setForm] = useState({
    title: "", specific: "", measurable: "", achievable: "", relevant: "", timeBound: "",
    deadline: "", quarter: "Q1", progress: 0, milestones: [] as Milestone[], status: "active" as Goal["status"],
  });

  const filtered = useMemo(() => {
    return goals.filter((g) => {
      const matchQ = filterQuarter === "all" || g.quarter === filterQuarter;
      const matchS = filterStatus === "all" || g.status === filterStatus;
      return matchQ && matchS;
    });
  }, [goals, filterQuarter, filterStatus]);

  const stats = useMemo(() => ({
    total: goals.length,
    active: goals.filter((g) => g.status === "active").length,
    completed: goals.filter((g) => g.status === "completed").length,
    avgProgress: goals.length > 0 ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0,
  }), [goals]);

  function openAdd() {
    setForm({ title: "", specific: "", measurable: "", achievable: "", relevant: "", timeBound: "", deadline: "", quarter: "Q1", progress: 0, milestones: [], status: "active" });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(g: Goal) {
    setForm({ title: g.title, specific: g.specific, measurable: g.measurable, achievable: g.achievable, relevant: g.relevant, timeBound: g.timeBound, deadline: g.deadline, quarter: g.quarter, progress: g.progress, milestones: [...g.milestones], status: g.status });
    setEditingId(g.id);
    setShowForm(true);
  }

  function addMilestone() {
    if (!newMilestoneText.trim()) return;
    setForm((f) => ({ ...f, milestones: [...f.milestones, { id: generateId(), text: newMilestoneText.trim(), targetDate: newMilestoneDate, done: false }] }));
    setNewMilestoneText("");
    setNewMilestoneDate("");
  }

  function removeMilestone(id: string) {
    setForm((f) => ({ ...f, milestones: f.milestones.filter((m) => m.id !== id) }));
  }

  function handleSave() {
    if (!form.title.trim()) return;
    if (editingId) {
      setGoals((prev) => prev.map((g) => (g.id === editingId ? { ...g, ...form } : g)));
    } else {
      setGoals((prev) => [{ ...form, id: generateId(), createdAt: new Date().toISOString() }, ...prev]);
    }
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  function toggleMilestone(goalId: string, milestoneId: string) {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const milestones = g.milestones.map((m) => (m.id === milestoneId ? { ...m, done: !m.done } : m));
        const doneCount = milestones.filter((m) => m.done).length;
        const progress = milestones.length > 0 ? Math.round((doneCount / milestones.length) * 100) : g.progress;
        return { ...g, milestones, progress };
      })
    );
  }

  function updateProgress(goalId: string, progress: number) {
    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, progress } : g)));
  }

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-600",
    completed: "bg-violet-500/10 text-violet-600",
    paused: "bg-slate-500/10 text-slate-600",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goal Setting Tool"
        description="Set SMART goals with milestones, deadlines, progress tracking, and quarterly reviews."
        icon={Target}
        badge="Productivity"
        replaces="Goal spreadsheets"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Goals</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{stats.active}</p><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{stats.completed}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{stats.avgProgress}%</p><p className="text-xs text-muted-foreground">Avg Progress</p></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filterQuarter} onValueChange={(v) => setFilterQuarter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Quarters</SelectItem>
            {QUARTERS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
          <Plus className="h-4 w-4 mr-2" />New Goal
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><Target className="h-10 w-10 text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">No goals found</p></CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((g) => {
            const isExpanded = expandedId === g.id;
            return (
              <Card key={g.id} className="border-border/50 group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : g.id)}>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{g.title}</span>
                        <Badge className={`${statusColors[g.status]} border-0 text-xs`}>{g.status}</Badge>
                        <Badge variant="outline" className="text-xs">{g.quarter}</Badge>
                        {g.deadline && <span className="text-xs text-muted-foreground">Due: {g.deadline}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(g); }}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(g.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div className="bg-gradient-to-r from-violet-500 to-pink-500 h-2 rounded-full transition-all" style={{ width: `${g.progress}%` }} />
                    </div>
                    <span className="text-sm font-bold">{g.progress}%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0" max="100" value={g.progress}
                      onChange={(e) => updateProgress(g.id, parseInt(e.target.value))}
                      className="flex-1 h-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          { label: "Specific", value: g.specific, color: "text-violet-600" },
                          { label: "Measurable", value: g.measurable, color: "text-blue-600" },
                          { label: "Achievable", value: g.achievable, color: "text-emerald-600" },
                          { label: "Relevant", value: g.relevant, color: "text-amber-600" },
                          { label: "Time-bound", value: g.timeBound, color: "text-pink-600" },
                        ].filter((s) => s.value).map((s) => (
                          <div key={s.label} className="p-2 rounded-lg bg-muted/30">
                            <p className={`text-xs font-medium ${s.color}`}>{s.label}</p>
                            <p className="text-sm">{s.value}</p>
                          </div>
                        ))}
                      </div>

                      {g.milestones.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Milestones</p>
                          {g.milestones.map((m) => (
                            <button key={m.id} onClick={() => toggleMilestone(g.id, m.id)} className="flex items-center gap-2 w-full text-left p-1.5 rounded hover:bg-muted/50">
                              {m.done ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                              <span className={`text-sm flex-1 ${m.done ? "line-through text-muted-foreground" : ""}`}>{m.text}</span>
                              {m.targetDate && <span className="text-xs text-muted-foreground">{m.targetDate}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Goal" : "New SMART Goal"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label>Goal Title *</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Quarter</Label>
                <Select value={form.quarter} onValueChange={(v) => setForm((f) => ({ ...f, quarter: v ?? "Q1" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{QUARTERS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as Goal["status"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3 border rounded-lg p-3">
              <p className="text-sm font-medium">SMART Framework</p>
              <div className="space-y-1.5"><Label className="text-xs text-violet-600">Specific - What exactly will you accomplish?</Label><Textarea value={form.specific} onChange={(e) => setForm((f) => ({ ...f, specific: e.target.value }))} rows={1} /></div>
              <div className="space-y-1.5"><Label className="text-xs text-blue-600">Measurable - How will you know when it&#39;s done?</Label><Textarea value={form.measurable} onChange={(e) => setForm((f) => ({ ...f, measurable: e.target.value }))} rows={1} /></div>
              <div className="space-y-1.5"><Label className="text-xs text-emerald-600">Achievable - Is this realistic?</Label><Textarea value={form.achievable} onChange={(e) => setForm((f) => ({ ...f, achievable: e.target.value }))} rows={1} /></div>
              <div className="space-y-1.5"><Label className="text-xs text-amber-600">Relevant - Why does this matter?</Label><Textarea value={form.relevant} onChange={(e) => setForm((f) => ({ ...f, relevant: e.target.value }))} rows={1} /></div>
              <div className="space-y-1.5"><Label className="text-xs text-pink-600">Time-bound - When will you complete it?</Label><Textarea value={form.timeBound} onChange={(e) => setForm((f) => ({ ...f, timeBound: e.target.value }))} rows={1} /></div>
            </div>
            <div className="border rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium">Milestones ({form.milestones.length})</p>
              {form.milestones.map((m) => (
                <div key={m.id} className="flex items-center gap-2 text-sm">
                  <span className="flex-1">{m.text}</span>
                  {m.targetDate && <span className="text-xs text-muted-foreground">{m.targetDate}</span>}
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => removeMilestone(m.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input value={newMilestoneText} onChange={(e) => setNewMilestoneText(e.target.value)} placeholder="Milestone..." className="flex-1 h-8" onKeyDown={(e) => e.key === "Enter" && addMilestone()} />
                <Input type="date" value={newMilestoneDate} onChange={(e) => setNewMilestoneDate(e.target.value)} className="w-36 h-8" />
                <Button size="sm" onClick={addMilestone}><Plus className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={handleSave} disabled={!form.title.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">{editingId ? "Save" : "Create Goal"}</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
