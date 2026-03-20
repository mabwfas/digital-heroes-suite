"use client";

import { useState, useMemo } from "react";
import {
  GanttChart,
  Plus,
  Trash2,
  Pencil,
  AlertTriangle,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type TaskStatus = "not-started" | "in-progress" | "completed";

interface GanttTask {
  id: string;
  name: string;
  assignee: string;
  startDate: string;
  endDate: string;
  status: TaskStatus;
  dependsOn: string; // task id
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; barColor: string }> = {
  "not-started": { label: "Not Started", color: "bg-slate-500/10 text-slate-600 dark:text-slate-400", barColor: "bg-slate-400" },
  "in-progress": { label: "In Progress", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400", barColor: "bg-blue-500" },
  completed: { label: "Completed", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", barColor: "bg-emerald-500" },
};

export default function GanttPage() {
  const [tasks, setTasks] = useLocalStorage<GanttTask[]>("projects-gantt", []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [form, setForm] = useState({ name: "", assignee: "", startDate: "", endDate: "", status: "not-started" as TaskStatus, dependsOn: "" });

  const allAssignees = useMemo(() => [...new Set(tasks.map((t) => t.assignee).filter(Boolean))], [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchStatus = filterStatus === "all" || t.status === filterStatus;
      const matchAssignee = filterAssignee === "all" || t.assignee === filterAssignee;
      return matchStatus && matchAssignee;
    });
  }, [tasks, filterStatus, filterAssignee]);

  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (tasks.length === 0) return { minDate: new Date(), maxDate: new Date(), totalDays: 1 };
    const dates = tasks.flatMap((t) => [new Date(t.startDate + "T00:00:00"), new Date(t.endDate + "T00:00:00")]);
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    const days = Math.max(1, Math.ceil((max.getTime() - min.getTime()) / 86400000) + 1);
    return { minDate: min, maxDate: max, totalDays: days };
  }, [tasks]);

  function getBarStyle(task: GanttTask) {
    if (!task.startDate || !task.endDate) return { left: "0%", width: "0%" };
    const start = new Date(task.startDate + "T00:00:00");
    const end = new Date(task.endDate + "T00:00:00");
    const offset = (start.getTime() - minDate.getTime()) / 86400000;
    const duration = Math.max(1, (end.getTime() - start.getTime()) / 86400000 + 1);
    const left = (offset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    return { left: `${left}%`, width: `${width}%` };
  }

  const criticalPath = useMemo(() => {
    const ids = new Set<string>();
    const depMap = new Map<string, string>();
    tasks.forEach((t) => { if (t.dependsOn) depMap.set(t.id, t.dependsOn); });
    tasks.forEach((t) => {
      let current: string | undefined = t.id;
      const chain: string[] = [];
      while (current) {
        chain.push(current);
        current = depMap.get(current);
      }
      if (chain.length >= 2) chain.forEach((id) => ids.add(id));
    });
    return ids;
  }, [tasks]);

  function openAdd() {
    setEditingId(null);
    setForm({ name: "", assignee: "", startDate: new Date().toISOString().split("T")[0], endDate: new Date().toISOString().split("T")[0], status: "not-started", dependsOn: "" });
    setDialogOpen(true);
  }

  function openEdit(t: GanttTask) {
    setEditingId(t.id);
    setForm({ name: t.name, assignee: t.assignee, startDate: t.startDate, endDate: t.endDate, status: t.status, dependsOn: t.dependsOn });
    setDialogOpen(true);
  }

  function save() {
    if (!form.name.trim() || !form.startDate || !form.endDate) return;
    if (editingId) {
      setTasks((prev) => prev.map((t) => t.id === editingId ? { ...t, ...form } : t));
    } else {
      setTasks((prev) => [...prev, { id: generateId(), ...form }]);
    }
    setDialogOpen(false);
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id).map((t) => t.dependsOn === id ? { ...t, dependsOn: "" } : t));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Dependency Tracker (Gantt)"
        description="Visualize task timelines, dependencies, and critical path"
        icon={GanttChart}
        badge="Projects"
        replaces="Monday.com / MS Project"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Tasks", value: tasks.length, color: "text-violet-600 dark:text-violet-400" },
          { label: "In Progress", value: tasks.filter((t) => t.status === "in-progress").length, color: "text-blue-600 dark:text-blue-400" },
          { label: "Completed", value: tasks.filter((t) => t.status === "completed").length, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Critical Path", value: criticalPath.size, color: "text-red-600 dark:text-red-400" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground mt-0.5">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="not-started">Not Started</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        {allAssignees.length > 0 && (
          <Select value={filterAssignee} onValueChange={(v) => setFilterAssignee(v ?? "all")}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Assignees" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {allAssignees.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <div className="ml-auto">
          <Button size="sm" onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">
            <Plus className="h-3.5 w-3.5 mr-1.5" />Add Task
          </Button>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-16 text-center"><GanttChart className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" /><p className="text-sm text-muted-foreground">No tasks yet. Add tasks to see the Gantt chart.</p><Button variant="outline" className="mt-4" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Task</Button></CardContent></Card>
      ) : (
        <Card className="overflow-x-auto">
          <CardContent className="p-4">
            <div className="min-w-[700px]">
              {/* Timeline header */}
              <div className="flex mb-1 ml-[220px]">
                {totalDays <= 60 && Array.from({ length: Math.min(totalDays, 60) }).map((_, i) => {
                  const d = new Date(minDate.getTime() + i * 86400000);
                  return (
                    <div key={i} className="text-[9px] text-muted-foreground text-center" style={{ width: `${100 / totalDays}%` }}>
                      {d.getDate() === 1 || i === 0 ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : d.getDate()}
                    </div>
                  );
                })}
              </div>
              {/* Tasks */}
              <div className="space-y-1.5">
                {filteredTasks.map((task) => {
                  const style = getBarStyle(task);
                  const isCritical = criticalPath.has(task.id);
                  const dep = task.dependsOn ? tasks.find((t) => t.id === task.dependsOn) : null;
                  return (
                    <div key={task.id} className="flex items-center gap-2 group">
                      <div className="w-[220px] shrink-0 flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{task.name}</p>
                          <div className="flex items-center gap-1">
                            <Badge className={`text-[9px] border-0 h-4 px-1 ${STATUS_CONFIG[task.status].color}`}>{STATUS_CONFIG[task.status].label}</Badge>
                            {task.assignee && <span className="text-[9px] text-muted-foreground truncate">{task.assignee}</span>}
                          </div>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openEdit(task)}><Pencil className="h-2.5 w-2.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5 hover:text-destructive" onClick={() => deleteTask(task.id)}><X className="h-2.5 w-2.5" /></Button>
                        </div>
                      </div>
                      <div className="flex-1 relative h-7 bg-muted/30 rounded">
                        <div
                          className={`absolute top-1 bottom-1 rounded transition-all ${isCritical ? "bg-red-500/80" : STATUS_CONFIG[task.status].barColor} ${isCritical ? "ring-1 ring-red-500/50" : ""}`}
                          style={style}
                        >
                          {dep && (
                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-amber-500 border border-background" title={`Depends on: ${dep.name}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {criticalPath.size > 0 && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-xs text-muted-foreground">Red bars indicate the critical path (tasks with dependencies)</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Edit Task" : "Add Task"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Task Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Task name" className="mt-1" /></div>
            <div><Label>Assignee</Label><Input value={form.assignee} onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))} placeholder="Who is responsible" className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date *</Label><Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="mt-1" /></div>
              <div><Label>End Date *</Label><Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as TaskStatus }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not-started">Not Started</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Depends On</Label>
                <Select value={form.dependsOn || "none"} onValueChange={(v) => setForm((f) => ({ ...f, dependsOn: v === "none" ? "" : (v ?? "") }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {tasks.filter((t) => t.id !== editingId).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.name.trim() || !form.startDate || !form.endDate} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">{editingId ? "Save" : "Add Task"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
