"use client";

import { useState, useMemo } from "react";
import { Grid3X3, Plus, Trash2, Archive, GripVertical } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type Quadrant = "do" | "schedule" | "delegate" | "eliminate";

interface EisenhowerTask {
  id: string;
  text: string;
  quadrant: Quadrant;
  completed: boolean;
  createdAt: string;
}

const QUADRANTS: { key: Quadrant; label: string; desc: string; color: string; border: string }[] = [
  { key: "do", label: "Do First", desc: "Urgent & Important", color: "bg-red-500/10 text-red-600", border: "border-red-500/20" },
  { key: "schedule", label: "Schedule", desc: "Important, Not Urgent", color: "bg-blue-500/10 text-blue-600", border: "border-blue-500/20" },
  { key: "delegate", label: "Delegate", desc: "Urgent, Not Important", color: "bg-amber-500/10 text-amber-600", border: "border-amber-500/20" },
  { key: "eliminate", label: "Eliminate", desc: "Neither", color: "bg-slate-500/10 text-slate-600", border: "border-slate-500/20" },
];

export default function EisenhowerPage() {
  const [tasks, setTasks] = useLocalStorage<EisenhowerTask[]>("productivity-eisenhower", []);
  const [newText, setNewText] = useState("");
  const [addingTo, setAddingTo] = useState<Quadrant | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [dragItem, setDragItem] = useState<string | null>(null);

  const active = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const archived = useMemo(() => tasks.filter((t) => t.completed), [tasks]);

  function addTask(quadrant: Quadrant) {
    if (!newText.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: generateId(), text: newText.trim(), quadrant, completed: false, createdAt: new Date().toISOString() },
    ]);
    setNewText("");
    setAddingTo(null);
  }

  function moveTask(id: string, quadrant: Quadrant) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, quadrant } : t)));
  }

  function completeTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: true } : t)));
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function restoreTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: false } : t)));
  }

  function handleDrop(quadrant: Quadrant) {
    if (dragItem) {
      moveTask(dragItem, quadrant);
      setDragItem(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Eisenhower Matrix"
        description="Prioritize tasks across 4 quadrants: Do, Schedule, Delegate, and Eliminate. Drag tasks between quadrants."
        icon={Grid3X3}
        badge="Productivity"
        replaces="Priority spreadsheets"
        actions={
          <Button variant="outline" onClick={() => setShowArchived(!showArchived)}>
            <Archive className="h-4 w-4 mr-2" />
            {showArchived ? "Hide" : "Show"} Archived ({archived.length})
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUADRANTS.map((q) => {
          const quadTasks = active.filter((t) => t.quadrant === q.key);
          return (
            <Card
              key={q.key}
              className={`${q.border} min-h-[200px]`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(q.key)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">{q.label}</CardTitle>
                    <p className="text-xs text-muted-foreground">{q.desc}</p>
                  </div>
                  <Badge className={`${q.color} border-0 text-xs`}>{quadTasks.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {quadTasks.map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setDragItem(t.id)}
                    className="flex items-center gap-2 p-2 rounded-lg border bg-background cursor-move hover:border-violet-500/30 group"
                  >
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                    <span className="text-sm flex-1">{t.text}</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => completeTask(t.id)}>
                        <Archive className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => deleteTask(t.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {addingTo === q.key ? (
                  <div className="flex gap-2">
                    <Input
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder="Task description..."
                      className="flex-1 h-8"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addTask(q.key);
                        if (e.key === "Escape") setAddingTo(null);
                      }}
                    />
                    <Button size="sm" onClick={() => addTask(q.key)}>Add</Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => { setAddingTo(q.key); setNewText(""); }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />Add task
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showArchived && archived.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Archived Tasks</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {archived.map((t) => (
              <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-sm">
                <span className="flex-1 text-muted-foreground line-through">{t.text}</span>
                <Badge variant="outline" className="text-[10px]">{QUADRANTS.find((q) => q.key === t.quadrant)?.label}</Badge>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => restoreTask(t.id)}>
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => deleteTask(t.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RotateCcw(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
    </svg>
  );
}
