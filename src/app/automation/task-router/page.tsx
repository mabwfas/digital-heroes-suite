"use client";

import { useState, useMemo } from "react";
import {
  Route,
  Plus,
  Trash2,
  Edit2,
  UserCheck,
  Users,
  Zap,
  Clock,
  X,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type TaskCategory = "dev" | "design" | "seo" | "content" | "support";
type Urgency = "low" | "medium" | "high" | "critical";

interface TeamMember {
  id: string;
  name: string;
  skills: TaskCategory[];
  currentHours: number;
  maxHours: number;
}

interface TaskAssignment {
  id: string;
  description: string;
  category: TaskCategory;
  urgency: Urgency;
  estimatedHours: number;
  assignedTo: string;
  assignedToName: string;
  createdAt: string;
}

const CAT_LABELS: Record<TaskCategory, string> = { dev: "Development", design: "Design", seo: "SEO", content: "Content", support: "Support" };
const CAT_COLORS: Record<TaskCategory, string> = {
  dev: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0",
  design: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-0",
  seo: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0",
  content: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0",
  support: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-0",
};
const URG_COLORS: Record<Urgency, string> = {
  low: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-0",
  medium: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0",
  high: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0",
  critical: "bg-red-500/10 text-red-600 dark:text-red-400 border-0",
};

function findBestAssignee(team: TeamMember[], category: TaskCategory, hours: number): TeamMember | null {
  const skilled = team.filter((m) => m.skills.includes(category));
  if (skilled.length === 0) return null;
  const available = skilled.filter((m) => m.currentHours + hours <= m.maxHours);
  if (available.length === 0) return skilled.sort((a, b) => (a.currentHours / a.maxHours) - (b.currentHours / b.maxHours))[0];
  return available.sort((a, b) => (a.currentHours / a.maxHours) - (b.currentHours / b.maxHours))[0];
}

export default function TaskRouterPage() {
  const [team, setTeam, hydrated] = useLocalStorage<TeamMember[]>("task-router-team", []);
  const [assignments, setAssignments] = useLocalStorage<TaskAssignment[]>("task-router-assignments", []);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: "", skills: [] as TaskCategory[], maxHours: 40 });
  const [taskForm, setTaskForm] = useState({ description: "", category: "dev" as TaskCategory, urgency: "medium" as Urgency, estimatedHours: 2 });
  const [suggestion, setSuggestion] = useState<TeamMember | null>(null);

  function addMember() {
    if (!memberForm.name.trim()) return;
    setTeam((prev) => [...prev, { id: generateId(), name: memberForm.name, skills: memberForm.skills, currentHours: 0, maxHours: memberForm.maxHours }]);
    setMemberDialogOpen(false);
    setMemberForm({ name: "", skills: [], maxHours: 40 });
  }

  function deleteMember(id: string) {
    setTeam((prev) => prev.filter((m) => m.id !== id));
  }

  function toggleSkill(skill: TaskCategory) {
    setMemberForm((f) => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill],
    }));
  }

  function routeTask() {
    const best = findBestAssignee(team, taskForm.category, taskForm.estimatedHours);
    setSuggestion(best);
  }

  function assignTask() {
    if (!suggestion || !taskForm.description.trim()) return;
    setAssignments((prev) => [{
      id: generateId(),
      description: taskForm.description,
      category: taskForm.category,
      urgency: taskForm.urgency,
      estimatedHours: taskForm.estimatedHours,
      assignedTo: suggestion.id,
      assignedToName: suggestion.name,
      createdAt: new Date().toISOString(),
    }, ...prev]);
    setTeam((prev) => prev.map((m) => (m.id === suggestion.id ? { ...m, currentHours: m.currentHours + taskForm.estimatedHours } : m)));
    setTaskDialogOpen(false);
    setSuggestion(null);
    setTaskForm({ description: "", category: "dev", urgency: "medium", estimatedHours: 2 });
  }

  function deleteAssignment(id: string) {
    const a = assignments.find((x) => x.id === id);
    if (a) {
      setTeam((prev) => prev.map((m) => (m.id === a.assignedTo ? { ...m, currentHours: Math.max(0, m.currentHours - a.estimatedHours) } : m)));
    }
    setAssignments((prev) => prev.filter((x) => x.id !== id));
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="AI Task Router" description="Auto-assign tasks based on skills match and workload balancing" icon={Route} badge="Automation" replaces="Manual Assignment" />

      <Tabs defaultValue="router">
        <TabsList>
          <TabsTrigger value="router">Task Router</TabsTrigger>
          <TabsTrigger value="team">Team ({team.length})</TabsTrigger>
          <TabsTrigger value="history">History ({assignments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="router" className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4 text-violet-500" />Route a Task</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5"><Label>Task Description *</Label><Textarea value={taskForm.description} onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Describe the task..." /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={taskForm.category} onValueChange={(v) => { setTaskForm((f) => ({ ...f, category: v as TaskCategory })); setSuggestion(null); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(CAT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Urgency</Label>
                  <Select value={taskForm.urgency} onValueChange={(v) => setTaskForm((f) => ({ ...f, urgency: v as Urgency }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Est. Hours</Label><Input type="number" value={taskForm.estimatedHours || ""} onChange={(e) => setTaskForm((f) => ({ ...f, estimatedHours: parseFloat(e.target.value) || 0 }))} /></div>
              </div>
              <div className="flex gap-2">
                <Button onClick={routeTask} disabled={team.length === 0 || !taskForm.description.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
                  <Zap className="h-4 w-4 mr-2" />Find Best Assignee
                </Button>
              </div>

              {suggestion && (
                <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-violet-500" />
                    <div>
                      <p className="font-semibold">Suggested: {suggestion.name}</p>
                      <div className="flex gap-2 mt-1">
                        {suggestion.skills.map((s) => <Badge key={s} className={CAT_COLORS[s]}>{CAT_LABELS[s]}</Badge>)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Workload: {suggestion.currentHours}h / {suggestion.maxHours}h ({Math.round((suggestion.currentHours / suggestion.maxHours) * 100)}%)
                      </p>
                    </div>
                  </div>
                  <Button onClick={assignTask} className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
                    <UserCheck className="h-4 w-4 mr-2" />Assign to {suggestion.name}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workload Visualization */}
          {team.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Team Workload</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {team.map((m) => {
                  const pct = m.maxHours > 0 ? Math.round((m.currentHours / m.maxHours) * 100) : 0;
                  return (
                    <div key={m.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{m.name}</span>
                        <span className="text-muted-foreground">{m.currentHours}h / {m.maxHours}h ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setMemberDialogOpen(true)} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              <Plus className="h-4 w-4 mr-2" />Add Team Member
            </Button>
          </div>

          {team.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No team members. Add your team first!</p>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.map((m) => (
                <Card key={m.id} className="border-border/50 group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">{m.name.charAt(0)}</div>
                      <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100" onClick={() => deleteMember(m.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                    </div>
                    <p className="font-semibold">{m.name}</p>
                    <div className="flex gap-1 mt-2 flex-wrap">{m.skills.map((s) => <Badge key={s} className={CAT_COLORS[s]}>{CAT_LABELS[s]}</Badge>)}</div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Workload</span><span>{m.currentHours}h / {m.maxHours}h</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.min(100, (m.currentHours / m.maxHours) * 100)}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {assignments.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center">
              <Clock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No assignments yet.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => (
                <Card key={a.id} className="border-border/50 group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{a.description}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <Badge className={CAT_COLORS[a.category]}>{CAT_LABELS[a.category]}</Badge>
                          <Badge className={URG_COLORS[a.urgency]}>{a.urgency}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{a.estimatedHours}h</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Assigned to <span className="font-medium">{a.assignedToName}</span> on {new Date(a.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 shrink-0" onClick={() => deleteAssignment(a.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Member Dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={memberForm.name} onChange={(e) => setMemberForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Skills</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(CAT_LABELS) as [TaskCategory, string][]).map(([k, v]) => (
                  <Badge key={k} className={`cursor-pointer ${memberForm.skills.includes(k) ? CAT_COLORS[k] : "bg-muted text-muted-foreground"}`} onClick={() => toggleSkill(k)}>{v}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1.5"><Label>Max Weekly Hours</Label><Input type="number" value={memberForm.maxHours} onChange={(e) => setMemberForm((f) => ({ ...f, maxHours: parseInt(e.target.value) || 40 }))} /></div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setMemberDialogOpen(false)}>Cancel</Button><Button onClick={addMember} disabled={!memberForm.name.trim() || memberForm.skills.length === 0} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">Add Member</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
