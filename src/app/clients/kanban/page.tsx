"use client";

import { useState } from "react";
import {
  Kanban,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Flag,
  X,
  CheckSquare,
} from "lucide-react";
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

type ColumnId = "todo" | "inprogress" | "review" | "done";
type Priority = "low" | "medium" | "high";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate: string;
  assignedTo: string;
  column: ColumnId;
  createdAt: string;
}

const COLUMNS: { id: ColumnId; label: string; color: string; headerColor: string }[] = [
  { id: "todo", label: "To Do", color: "border-slate-300 dark:border-slate-700", headerColor: "bg-slate-100 dark:bg-slate-800/50" },
  { id: "inprogress", label: "In Progress", color: "border-blue-300 dark:border-blue-700/50", headerColor: "bg-blue-50 dark:bg-blue-900/20" },
  { id: "review", label: "Review", color: "border-amber-300 dark:border-amber-700/50", headerColor: "bg-amber-50 dark:bg-amber-900/20" },
  { id: "done", label: "Done", color: "border-emerald-300 dark:border-emerald-700/50", headerColor: "bg-emerald-50 dark:bg-emerald-900/20" },
];

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string; dot: string }> = {
  low: { label: "Low", className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-0", dot: "bg-slate-400" },
  medium: { label: "Medium", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0", dot: "bg-amber-400" },
  high: { label: "High", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-0", dot: "bg-red-500" },
};

const EMPTY_FORM = (): Omit<Task, "id" | "createdAt" | "column"> => ({
  title: "",
  description: "",
  priority: "medium",
  dueDate: "",
  assignedTo: "",
});

function isOverdue(dueDate: string) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function daysUntil(dueDate: string) {
  if (!dueDate) return null;
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  return diff;
}

export default function KanbanPage() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("kanban-tasks", []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [defaultColumn, setDefaultColumn] = useState<ColumnId>("todo");
  const [form, setForm] = useState(EMPTY_FORM());

  function openAdd(col: ColumnId) {
    setForm(EMPTY_FORM());
    setDefaultColumn(col);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(task: Task) {
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      assignedTo: task.assignedTo,
    });
    setEditingId(task.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.title.trim()) return;
    if (editingId) {
      setTasks((prev) =>
        prev.map((t) => (t.id === editingId ? { ...t, ...form } : t))
      );
    } else {
      setTasks((prev) => [
        ...prev,
        {
          ...form,
          id: generateId(),
          column: defaultColumn,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    setShowForm(false);
    setEditingId(null);
  }

  function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function moveTask(id: string, direction: "left" | "right") {
    const colOrder: ColumnId[] = ["todo", "inprogress", "review", "done"];
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const idx = colOrder.indexOf(t.column);
        const newIdx = direction === "left" ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= colOrder.length) return t;
        return { ...t, column: colOrder[newIdx] };
      })
    );
  }

  const colOrder: ColumnId[] = ["todo", "inprogress", "review", "done"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kanban Board"
        description="Visualize and manage your project tasks across workflow stages"
        icon={Kanban}
        badge="Board"
        replaces="Trello / Jira"
      />

      {/* Summary bar */}
      <div className="flex flex-wrap gap-3">
        {COLUMNS.map((col) => {
          const count = tasks.filter((t) => t.column === col.id).length;
          return (
            <div key={col.id} className="flex items-center gap-2 text-sm">
              <span className="font-medium text-muted-foreground">{col.label}:</span>
              <Badge variant="secondary" className="font-mono">{count}</Badge>
            </div>
          );
        })}
        <div className="ml-auto">
          <Badge className="bg-gradient-to-r from-violet-500/10 to-pink-500/10 text-violet-600 dark:text-violet-400 border-0">
            {tasks.length} total tasks
          </Badge>
        </div>
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.column === col.id);
          const highCount = colTasks.filter((t) => t.priority === "high").length;

          return (
            <div key={col.id} className={`rounded-xl border-2 ${col.color} overflow-hidden`}>
              {/* Column Header */}
              <div className={`px-4 py-3 ${col.headerColor}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{col.label}</span>
                    <span className="h-5 w-5 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-bold">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {highCount > 0 && (
                      <Badge className="bg-red-500/10 text-red-600 border-0 text-[10px] h-4 px-1">
                        {highCount} high
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => openAdd(col.id)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div className="p-3 space-y-2.5 min-h-[200px]">
                {colTasks.length === 0 && (
                  <div
                    className="flex flex-col items-center justify-center py-8 text-center cursor-pointer rounded-lg border-2 border-dashed border-border/40 hover:border-violet-400/40 transition-colors"
                    onClick={() => openAdd(col.id)}
                  >
                    <Plus className="h-5 w-5 text-muted-foreground/40 mb-1" />
                    <p className="text-xs text-muted-foreground/60">Add task</p>
                  </div>
                )}
                {colTasks.map((task) => {
                  const colIdx = colOrder.indexOf(task.column);
                  const days = daysUntil(task.dueDate);
                  const overdue = isOverdue(task.dueDate) && task.column !== "done";
                  const priorityCfg = PRIORITY_CONFIG[task.priority];

                  return (
                    <Card
                      key={task.id}
                      className="border-border/60 shadow-sm hover:shadow-md transition-all group cursor-default"
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-medium text-sm leading-snug flex-1">{task.title}</p>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              disabled={colIdx === 0}
                              onClick={() => moveTask(task.id, "left")}
                            >
                              <ChevronLeft className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              disabled={colIdx === colOrder.length - 1}
                              onClick={() => moveTask(task.id, "right")}
                            >
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => openEdit(task)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 hover:text-destructive"
                              onClick={() => handleDelete(task.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                        )}

                        <div className="flex flex-wrap gap-1.5 items-center">
                          <div className="flex items-center gap-1">
                            <div className={`h-1.5 w-1.5 rounded-full ${priorityCfg.dot}`} />
                            <Badge className={`${priorityCfg.className} text-[10px] h-4 px-1.5`}>
                              {priorityCfg.label}
                            </Badge>
                          </div>

                          {task.dueDate && (
                            <div className={`flex items-center gap-1 text-[10px] font-medium ${overdue ? "text-red-500" : days !== null && days <= 2 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                              <Clock className="h-2.5 w-2.5" />
                              {overdue ? "Overdue" : days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d`}
                            </div>
                          )}

                          {task.assignedTo && (
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
                              <User className="h-2.5 w-2.5" />
                              <span className="truncate max-w-[80px]">{task.assignedTo}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {colTasks.length > 0 && (
                  <Button
                    variant="ghost"
                    className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => openAdd(col.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add task
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Task Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-violet-500" />
              {editingId ? "Edit Task" : "New Task"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Task Title *</Label>
              <Input
                placeholder="e.g. Design homepage mockup"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Additional details about this task..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Priority }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <Flag className="h-3.5 w-3.5 text-slate-400" /> Low
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <Flag className="h-3.5 w-3.5 text-amber-400" /> Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <Flag className="h-3.5 w-3.5 text-red-500" /> High
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>
            {!editingId && (
              <div className="space-y-1.5">
                <Label>Column</Label>
                <Select value={defaultColumn} onValueChange={(v) => setDefaultColumn(v as ColumnId)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((col) => (
                      <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Assigned To</Label>
              <Input
                placeholder="Team member name"
                value={form.assignedTo}
                onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.title.trim()}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0"
            >
              {editingId ? "Save Changes" : "Add Task"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
