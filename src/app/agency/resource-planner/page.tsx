"use client";

import { useState, useMemo } from "react";
import { LayoutGrid, Plus, Trash2, AlertTriangle } from "lucide-react";
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
  maxHours: number;
}

interface Project {
  id: string;
  name: string;
  client: string;
}

interface Allocation {
  memberId: string;
  projectId: string;
  hours: number;
}

export default function ResourcePlannerPage() {
  const [members, setMembers] = useLocalStorage<TeamMember[]>("agency-resource-members", []);
  const [projects, setProjects] = useLocalStorage<Project[]>("agency-resource-projects", []);
  const [allocations, setAllocations] = useLocalStorage<Allocation[]>("agency-resource-allocs", []);

  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("");
  const [memberMax, setMemberMax] = useState("40");
  const [projName, setProjName] = useState("");
  const [projClient, setProjClient] = useState("");

  function addMember() {
    if (!memberName.trim()) return;
    setMembers((prev) => [...prev, { id: generateId(), name: memberName.trim(), role: memberRole.trim(), maxHours: parseFloat(memberMax) || 40 }]);
    setMemberName(""); setMemberRole(""); setMemberMax("40");
  }

  function removeMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setAllocations((prev) => prev.filter((a) => a.memberId !== id));
  }

  function addProject() {
    if (!projName.trim()) return;
    setProjects((prev) => [...prev, { id: generateId(), name: projName.trim(), client: projClient.trim() }]);
    setProjName(""); setProjClient("");
  }

  function removeProject(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setAllocations((prev) => prev.filter((a) => a.projectId !== id));
  }

  function updateAllocation(memberId: string, projectId: string, hours: number) {
    setAllocations((prev) => {
      const existing = prev.find((a) => a.memberId === memberId && a.projectId === projectId);
      if (existing) {
        if (hours <= 0) return prev.filter((a) => !(a.memberId === memberId && a.projectId === projectId));
        return prev.map((a) => (a.memberId === memberId && a.projectId === projectId ? { ...a, hours } : a));
      }
      if (hours <= 0) return prev;
      return [...prev, { memberId, projectId, hours }];
    });
  }

  function getAllocation(memberId: string, projectId: string) {
    return allocations.find((a) => a.memberId === memberId && a.projectId === projectId)?.hours || 0;
  }

  function getMemberTotal(memberId: string) {
    return allocations.filter((a) => a.memberId === memberId).reduce((s, a) => s + a.hours, 0);
  }

  function getProjectTotal(projectId: string) {
    return allocations.filter((a) => a.projectId === projectId).reduce((s, a) => s + a.hours, 0);
  }

  function getUtilization(memberId: string) {
    const member = members.find((m) => m.id === memberId);
    if (!member || member.maxHours === 0) return 0;
    return Math.round((getMemberTotal(memberId) / member.maxHours) * 100);
  }

  function getCellColor(util: number) {
    if (util === 0) return "bg-muted/30";
    if (util <= 50) return "bg-emerald-500/10";
    if (util <= 80) return "bg-amber-500/10";
    return "bg-red-500/10";
  }

  const conflicts = useMemo(() => {
    return members.filter((m) => getUtilization(m.id) > 100);
  }, [members, allocations]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resource Allocation Planner"
        description="Team x Projects matrix with hours allocation, utilization heat map, and over-allocation conflict detection."
        icon={LayoutGrid}
        badge="Agency"
        replaces="Resource spreadsheets"
      />

      {conflicts.length > 0 && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-600 font-medium">Over-allocated:</span>
            {conflicts.map((m) => (
              <Badge key={m.id} className="bg-red-500/10 text-red-600 border-0 text-xs">
                {m.name} ({getUtilization(m.id)}%)
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Team Members</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1"><Label>Name</Label><Input value={memberName} onChange={(e) => setMemberName(e.target.value)} /></div>
              <div className="w-20 space-y-1"><Label>Role</Label><Input value={memberRole} onChange={(e) => setMemberRole(e.target.value)} /></div>
              <div className="w-16 space-y-1"><Label>Max h</Label><Input type="number" value={memberMax} onChange={(e) => setMemberMax(e.target.value)} /></div>
              <Button size="sm" onClick={addMember}><Plus className="h-3.5 w-3.5" /></Button>
            </div>
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2 text-sm p-2 rounded border bg-muted/30">
                <span className="font-medium flex-1">{m.name}</span>
                <span className="text-xs text-muted-foreground">{m.role}</span>
                <span className="text-xs text-muted-foreground">{m.maxHours}h</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => removeMember(m.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Projects</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1"><Label>Project</Label><Input value={projName} onChange={(e) => setProjName(e.target.value)} /></div>
              <div className="w-28 space-y-1"><Label>Client</Label><Input value={projClient} onChange={(e) => setProjClient(e.target.value)} /></div>
              <Button size="sm" onClick={addProject}><Plus className="h-3.5 w-3.5" /></Button>
            </div>
            {projects.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-sm p-2 rounded border bg-muted/30">
                <span className="font-medium flex-1">{p.name}</span>
                <span className="text-xs text-muted-foreground">{p.client}</span>
                <span className="text-xs font-medium">{getProjectTotal(p.id)}h</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => removeProject(p.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {members.length > 0 && projects.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Allocation Matrix</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium text-muted-foreground sticky left-0 bg-background">Team Member</th>
                    {projects.map((p) => (
                      <th key={p.id} className="text-center p-2 font-medium text-muted-foreground">{p.name}</th>
                    ))}
                    <th className="text-center p-2 font-medium text-muted-foreground">Total</th>
                    <th className="text-center p-2 font-medium text-muted-foreground">Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const util = getUtilization(m.id);
                    return (
                      <tr key={m.id} className="border-b border-border/50">
                        <td className="p-2 font-medium sticky left-0 bg-background">
                          {m.name}
                          <span className="text-xs text-muted-foreground ml-1">({m.maxHours}h)</span>
                        </td>
                        {projects.map((p) => {
                          const hrs = getAllocation(m.id, p.id);
                          return (
                            <td key={p.id} className="p-1 text-center">
                              <Input
                                type="number"
                                min="0"
                                value={hrs || ""}
                                onChange={(e) => updateAllocation(m.id, p.id, parseFloat(e.target.value) || 0)}
                                className={`w-16 h-8 text-center mx-auto ${getCellColor(hrs / m.maxHours * 100)}`}
                              />
                            </td>
                          );
                        })}
                        <td className="p-2 text-center font-medium">{getMemberTotal(m.id)}h</td>
                        <td className="p-2 text-center">
                          <Badge className={`border-0 text-xs ${util > 100 ? "bg-red-500/10 text-red-600" : util > 80 ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}`}>
                            {util}%
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
