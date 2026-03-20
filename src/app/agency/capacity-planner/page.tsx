"use client";

import { useState, useMemo } from "react";
import { Users, Plus, Trash2, TrendingUp, Clock, Briefcase } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  hoursPerWeek: number;
}

interface CapacityConfig {
  internalHoursPerPerson: number;
  adminHoursPerPerson: number;
}

interface PipelineItem {
  id: string;
  projectName: string;
  estimatedHours: number;
  probability: number;
  startWeek: string;
}

export default function CapacityPlannerPage() {
  const [team, setTeam] = useLocalStorage<TeamMember[]>("agency-capacity-team", []);
  const [config, setConfig] = useLocalStorage<CapacityConfig>("agency-capacity-config", { internalHoursPerPerson: 5, adminHoursPerPerson: 3 });
  const [pipeline, setPipeline] = useLocalStorage<PipelineItem[]>("agency-capacity-pipeline", []);

  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("");
  const [memberHours, setMemberHours] = useState("40");
  const [projName, setProjName] = useState("");
  const [projHours, setProjHours] = useState("");
  const [projProb, setProjProb] = useState("50");
  const [projWeek, setProjWeek] = useState("");

  const stats = useMemo(() => {
    const totalCapacity = team.reduce((s, m) => s + m.hoursPerWeek, 0);
    const internalHours = team.length * config.internalHoursPerPerson;
    const adminHours = team.length * config.adminHoursPerPerson;
    const billableHours = totalCapacity - internalHours - adminHours;
    const pipelineHours = pipeline.reduce((s, p) => s + p.estimatedHours * (p.probability / 100), 0);
    const utilization = billableHours > 0 ? Math.round((pipelineHours / billableHours) * 100) : 0;
    return { totalCapacity, internalHours, adminHours, billableHours, pipelineHours, utilization };
  }, [team, config, pipeline]);

  function addMember() {
    if (!memberName.trim()) return;
    setTeam((prev) => [...prev, { id: generateId(), name: memberName.trim(), role: memberRole.trim(), hoursPerWeek: parseFloat(memberHours) || 40 }]);
    setMemberName("");
    setMemberRole("");
    setMemberHours("40");
  }

  function removeMember(id: string) {
    setTeam((prev) => prev.filter((m) => m.id !== id));
  }

  function addPipelineItem() {
    if (!projName.trim()) return;
    setPipeline((prev) => [...prev, { id: generateId(), projectName: projName.trim(), estimatedHours: parseFloat(projHours) || 0, probability: parseFloat(projProb) || 50, startWeek: projWeek }]);
    setProjName("");
    setProjHours("");
    setProjProb("50");
  }

  function removePipelineItem(id: string) {
    setPipeline((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agency Capacity Planner"
        description="Calculate team capacity, subtract overhead, show available billable hours, and forecast based on pipeline."
        icon={Users}
        badge="Agency"
        replaces="Capacity spreadsheets"
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Total Capacity", value: `${stats.totalCapacity}h/wk`, icon: Clock },
          { label: "Internal + Admin", value: `${stats.internalHours + stats.adminHours}h/wk`, icon: Briefcase },
          { label: "Billable Available", value: `${stats.billableHours}h/wk`, icon: TrendingUp },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><s.icon className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">{s.label}</span></div><p className="text-2xl font-bold">{s.value}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Capacity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-muted/30 border">
              <p className="text-xs text-muted-foreground">Pipeline Forecast</p>
              <p className="text-lg font-bold">{stats.pipelineHours.toFixed(0)}h</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border">
              <p className="text-xs text-muted-foreground">Utilization</p>
              <p className={`text-lg font-bold ${stats.utilization > 100 ? "text-red-600" : stats.utilization > 80 ? "text-amber-600" : "text-emerald-600"}`}>
                {stats.utilization}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border">
              <p className="text-xs text-muted-foreground">Team Size</p>
              <p className="text-lg font-bold">{team.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border">
              <p className="text-xs text-muted-foreground">Pipeline Items</p>
              <p className="text-lg font-bold">{pipeline.length}</p>
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-4 relative">
            <div
              className={`h-4 rounded-full transition-all ${stats.utilization > 100 ? "bg-red-500" : stats.utilization > 80 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.min(stats.utilization, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{stats.utilization > 100 ? "Over capacity! Consider hiring or reducing pipeline." : stats.utilization > 80 ? "Near capacity." : "Good capacity available."}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Team Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1"><Label>Name</Label><Input value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="Name" /></div>
              <div className="w-24 space-y-1"><Label>Role</Label><Input value={memberRole} onChange={(e) => setMemberRole(e.target.value)} placeholder="Role" /></div>
              <div className="w-20 space-y-1"><Label>Hrs/wk</Label><Input type="number" value={memberHours} onChange={(e) => setMemberHours(e.target.value)} /></div>
              <Button size="sm" onClick={addMember}><Plus className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Internal hrs/person</Label><Input type="number" min="0" value={config.internalHoursPerPerson} onChange={(e) => setConfig((c) => ({ ...c, internalHoursPerPerson: parseFloat(e.target.value) || 0 }))} className="h-8" /></div>
              <div className="space-y-1"><Label className="text-xs">Admin hrs/person</Label><Input type="number" min="0" value={config.adminHoursPerPerson} onChange={(e) => setConfig((c) => ({ ...c, adminHoursPerPerson: parseFloat(e.target.value) || 0 }))} className="h-8" /></div>
            </div>
            {team.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{m.name.charAt(0)}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{m.name}</p><p className="text-xs text-muted-foreground">{m.role || "Team member"} &middot; {m.hoursPerWeek}h/wk</p></div>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => removeMember(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pipeline Forecast</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1"><Label>Project</Label><Input value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="Project name" /></div>
              <div className="w-20 space-y-1"><Label>Hours</Label><Input type="number" value={projHours} onChange={(e) => setProjHours(e.target.value)} /></div>
              <div className="w-20 space-y-1"><Label>Prob %</Label><Input type="number" min="0" max="100" value={projProb} onChange={(e) => setProjProb(e.target.value)} /></div>
              <Button size="sm" onClick={addPipelineItem}><Plus className="h-3.5 w-3.5" /></Button>
            </div>
            {pipeline.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.projectName}</p>
                  <p className="text-xs text-muted-foreground">{p.estimatedHours}h &middot; {p.probability}% likely &middot; Weighted: {(p.estimatedHours * p.probability / 100).toFixed(0)}h</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => removePipelineItem(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
