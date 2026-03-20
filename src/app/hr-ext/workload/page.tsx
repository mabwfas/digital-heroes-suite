"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  Plus,
  Trash2,
  Pencil,
  AlertTriangle,
  User,
  Briefcase,
  X,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface Project {
  id: string;
  name: string;
  estimatedHours: number;
  assignedTo: string; // member id
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  capacityHours: number; // per week
}

export default function WorkloadPage() {
  const [members, setMembers] = useLocalStorage<TeamMember[]>("hr-ext-workload-members", []);
  const [projects, setProjects] = useLocalStorage<Project[]>("hr-ext-workload-projects", []);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState({ name: "", role: "", capacityHours: 40 });
  const [projectForm, setProjectForm] = useState({ name: "", estimatedHours: 0, assignedTo: "" });

  function openAddMember() {
    setEditingMemberId(null);
    setMemberForm({ name: "", role: "", capacityHours: 40 });
    setMemberDialogOpen(true);
  }

  function openEditMember(m: TeamMember) {
    setEditingMemberId(m.id);
    setMemberForm({ name: m.name, role: m.role, capacityHours: m.capacityHours });
    setMemberDialogOpen(true);
  }

  function saveMember() {
    if (!memberForm.name.trim()) return;
    if (editingMemberId) {
      setMembers((prev) => prev.map((m) => m.id === editingMemberId ? { ...m, ...memberForm } : m));
    } else {
      setMembers((prev) => [...prev, { id: generateId(), ...memberForm }]);
    }
    setMemberDialogOpen(false);
  }

  function deleteMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setProjects((prev) => prev.filter((p) => p.assignedTo !== id));
  }

  function openAddProject() {
    setEditingProjectId(null);
    setProjectForm({ name: "", estimatedHours: 0, assignedTo: members[0]?.id || "" });
    setProjectDialogOpen(true);
  }

  function openEditProject(p: Project) {
    setEditingProjectId(p.id);
    setProjectForm({ name: p.name, estimatedHours: p.estimatedHours, assignedTo: p.assignedTo });
    setProjectDialogOpen(true);
  }

  function saveProject() {
    if (!projectForm.name.trim() || !projectForm.assignedTo) return;
    if (editingProjectId) {
      setProjects((prev) => prev.map((p) => p.id === editingProjectId ? { ...p, ...projectForm } : p));
    } else {
      setProjects((prev) => [...prev, { id: generateId(), ...projectForm }]);
    }
    setProjectDialogOpen(false);
  }

  function deleteProject(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  const memberStats = useMemo(() => {
    return members.map((m) => {
      const assigned = projects.filter((p) => p.assignedTo === m.id);
      const totalHours = assigned.reduce((sum, p) => sum + p.estimatedHours, 0);
      const utilization = m.capacityHours > 0 ? (totalHours / m.capacityHours) * 100 : 0;
      const status: "green" | "amber" | "red" = utilization <= 75 ? "green" : utilization <= 100 ? "amber" : "red";
      return { ...m, assigned, totalHours, utilization, status };
    });
  }, [members, projects]);

  const overloaded = memberStats.filter((m) => m.status === "red").length;
  const underutilized = memberStats.filter((m) => m.utilization < 50).length;

  const suggestions = useMemo(() => {
    const tips: string[] = [];
    const over = memberStats.filter((m) => m.status === "red");
    const under = memberStats.filter((m) => m.utilization < 50 && m.capacityHours > 0);
    over.forEach((o) => {
      if (under.length > 0) {
        tips.push(`Move work from ${o.name} (${Math.round(o.utilization)}%) to ${under[0].name} (${Math.round(under[0].utilization)}%)`);
      } else {
        tips.push(`${o.name} is overloaded at ${Math.round(o.utilization)}%. Consider reducing their assignments.`);
      }
    });
    if (tips.length === 0 && members.length > 0) tips.push("Workload looks balanced across the team.");
    return tips;
  }, [memberStats, members.length]);

  function barColor(status: "green" | "amber" | "red") {
    if (status === "green") return "bg-emerald-500";
    if (status === "amber") return "bg-amber-500";
    return "bg-red-500";
  }

  function barBg(status: "green" | "amber" | "red") {
    if (status === "green") return "bg-emerald-500/10";
    if (status === "amber") return "bg-amber-500/10";
    return "bg-red-500/10";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Workload Balancer"
        description="Visualize and balance workload across your team members"
        icon={BarChart3}
        badge="HR Extended"
        replaces="Resource Guru / Float"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Team Members", value: members.length, color: "text-violet-600 dark:text-violet-400" },
          { label: "Active Projects", value: projects.length, color: "text-pink-600 dark:text-pink-400" },
          { label: "Overloaded", value: overloaded, color: "text-red-600 dark:text-red-400" },
          { label: "Underutilized", value: underutilized, color: "text-amber-600 dark:text-amber-400" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground mt-0.5">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={openAddProject} disabled={members.length === 0}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />Add Project
        </Button>
        <Button size="sm" onClick={openAddMember} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">
          <Plus className="h-3.5 w-3.5 mr-1.5" />Add Member
        </Button>
      </div>

      {members.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-16 text-center"><BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" /><p className="text-sm text-muted-foreground">Add team members and assign projects to visualize workload.</p><Button variant="outline" className="mt-4" onClick={openAddMember}><Plus className="h-4 w-4 mr-2" />Add Member</Button></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {memberStats.map((ms) => (
            <Card key={ms.id} className={`overflow-hidden transition-colors ${ms.status === "red" ? "border-red-500/30" : ms.status === "amber" ? "border-amber-500/30" : "hover:border-violet-500/30"}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${barBg(ms.status)}`}>
                      <User className={`h-4 w-4 ${ms.status === "red" ? "text-red-500" : ms.status === "amber" ? "text-amber-500" : "text-emerald-500"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{ms.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {ms.role && <Badge variant="secondary" className="text-[10px]">{ms.role}</Badge>}
                        <span className="text-xs text-muted-foreground">{ms.totalHours}h / {ms.capacityHours}h capacity</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`text-[10px] border-0 ${ms.status === "red" ? "bg-red-500/10 text-red-600" : ms.status === "amber" ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}`}>
                      {Math.round(ms.utilization)}%
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditMember(ms)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => deleteMember(ms.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${barColor(ms.status)}`} style={{ width: `${Math.min(ms.utilization, 100)}%` }} />
                </div>
                {ms.assigned.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {ms.assigned.map((p) => (
                      <div key={p.id} className="flex items-center gap-1 text-xs bg-muted/50 rounded-md px-2 py-1">
                        <Briefcase className="h-3 w-3 text-muted-foreground" />
                        <span>{p.name}</span>
                        <span className="text-muted-foreground">({p.estimatedHours}h)</span>
                        <button onClick={() => openEditProject(p)} className="ml-0.5"><Pencil className="h-2.5 w-2.5 text-muted-foreground hover:text-foreground" /></button>
                        <button onClick={() => deleteProject(p.id)}><X className="h-2.5 w-2.5 text-red-400 hover:text-red-500" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {suggestions.length > 0 && members.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />Rebalancing Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {suggestions.map((tip, i) => (
                <p key={i} className="text-sm text-muted-foreground">{tip}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingMemberId ? "Edit Member" : "Add Team Member"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Name *</Label><Input value={memberForm.name} onChange={(e) => setMemberForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" className="mt-1" /></div>
            <div><Label>Role</Label><Input value={memberForm.role} onChange={(e) => setMemberForm((f) => ({ ...f, role: e.target.value }))} placeholder="e.g. Developer" className="mt-1" /></div>
            <div><Label>Capacity (hours/week)</Label><Input type="number" value={memberForm.capacityHours} onChange={(e) => setMemberForm((f) => ({ ...f, capacityHours: parseInt(e.target.value) || 0 }))} className="mt-1" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setMemberDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveMember} disabled={!memberForm.name.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">{editingMemberId ? "Save" : "Add Member"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingProjectId ? "Edit Project" : "Add Project"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Project Name *</Label><Input value={projectForm.name} onChange={(e) => setProjectForm((f) => ({ ...f, name: e.target.value }))} placeholder="Project name" className="mt-1" /></div>
            <div><Label>Estimated Hours</Label><Input type="number" value={projectForm.estimatedHours} onChange={(e) => setProjectForm((f) => ({ ...f, estimatedHours: parseInt(e.target.value) || 0 }))} className="mt-1" /></div>
            <div>
              <Label>Assign To *</Label>
              <Select value={projectForm.assignedTo} onValueChange={(v) => setProjectForm((f) => ({ ...f, assignedTo: v ?? f.assignedTo }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>{members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setProjectDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveProject} disabled={!projectForm.name.trim() || !projectForm.assignedTo} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">{editingProjectId ? "Save" : "Add Project"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
