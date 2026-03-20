"use client";

import { useState, useMemo } from "react";
import {
  Users,
  Plus,
  Trash2,
  Trophy,
  Star,
  Clock,
  DollarSign,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  tasksCompleted: number;
  hoursLogged: number;
  onTimeDeliveryPct: number;
  clientSatisfaction: number; // 1-5
  revenueGenerated: number;
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function ratingStars(rating: number): string {
  return "★".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating));
}

export default function TeamMetricsPage() {
  const [members, setMembers, hydrated] = useLocalStorage<TeamMember[]>("analytics-team-metrics", []);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [tasks, setTasks] = useState("");
  const [hours, setHours] = useState("");
  const [onTime, setOnTime] = useState("");
  const [satisfaction, setSatisfaction] = useState("");
  const [revenue, setRevenue] = useState("");

  const summary = useMemo(() => {
    if (members.length === 0) return { totalTasks: 0, totalHours: 0, avgOnTime: 0, avgSatisfaction: 0, totalRevenue: 0 };
    return {
      totalTasks: members.reduce((s, m) => s + m.tasksCompleted, 0),
      totalHours: members.reduce((s, m) => s + m.hoursLogged, 0),
      avgOnTime: Math.round(members.reduce((s, m) => s + m.onTimeDeliveryPct, 0) / members.length),
      avgSatisfaction: Math.round(members.reduce((s, m) => s + m.clientSatisfaction, 0) / members.length * 10) / 10,
      totalRevenue: members.reduce((s, m) => s + m.revenueGenerated, 0),
    };
  }, [members]);

  const ranked = useMemo(() => {
    return [...members].sort((a, b) => {
      const scoreA = a.tasksCompleted * 0.3 + a.onTimeDeliveryPct * 0.3 + a.clientSatisfaction * 20 * 0.2 + (a.revenueGenerated / 1000) * 0.2;
      const scoreB = b.tasksCompleted * 0.3 + b.onTimeDeliveryPct * 0.3 + b.clientSatisfaction * 20 * 0.2 + (b.revenueGenerated / 1000) * 0.2;
      return scoreB - scoreA;
    });
  }, [members]);

  function handleAdd() {
    if (!name.trim()) return;
    const member: TeamMember = {
      id: generateId(),
      name: name.trim(),
      role: role.trim(),
      tasksCompleted: parseInt(tasks) || 0,
      hoursLogged: parseFloat(hours) || 0,
      onTimeDeliveryPct: parseInt(onTime) || 0,
      clientSatisfaction: Math.min(5, Math.max(1, parseFloat(satisfaction) || 3)),
      revenueGenerated: parseFloat(revenue) || 0,
    };
    setMembers((prev) => [...prev, member]);
    setName(""); setRole(""); setTasks(""); setHours(""); setOnTime(""); setSatisfaction(""); setRevenue("");
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Performance Metrics"
        description="Track and compare team member performance across tasks, hours, delivery, satisfaction, and revenue."
        icon={Users}
        badge="Analytics"
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Tasks", value: summary.totalTasks.toString(), icon: Trophy, color: "text-violet-600" },
          { label: "Total Hours", value: `${summary.totalHours}h`, icon: Clock, color: "text-pink-600" },
          { label: "Avg On-Time", value: `${summary.avgOnTime}%`, icon: Clock, color: summary.avgOnTime >= 80 ? "text-emerald-600" : "text-amber-600" },
          { label: "Avg Satisfaction", value: `${summary.avgSatisfaction}/5`, icon: Star, color: "text-amber-500" },
          { label: "Total Revenue", value: fmt(summary.totalRevenue), icon: DollarSign, color: "text-emerald-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-violet-500" />
            Add Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input placeholder="John" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Input placeholder="Designer" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tasks Done</Label>
              <Input type="number" placeholder="24" value={tasks} onChange={(e) => setTasks(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Hours Logged</Label>
              <Input type="number" placeholder="160" value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>On-Time %</Label>
              <Input type="number" min="0" max="100" placeholder="92" value={onTime} onChange={(e) => setOnTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Satisfaction (1-5)</Label>
              <Input type="number" min="1" max="5" step="0.1" placeholder="4.5" value={satisfaction} onChange={(e) => setSatisfaction(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Revenue ($)</Label>
              <Input type="number" placeholder="25000" value={revenue} onChange={(e) => setRevenue(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="invisible">Add</Label>
              <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleAdd} disabled={!name.trim()}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {members.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Add team members to track and compare performance.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {["#", "Name", "Role", "Tasks", "Hours", "On-Time %", "Satisfaction", "Revenue", "Rev/Hour", ""].map((h) => (
                      <th key={h} className="text-left p-2 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((m, i) => {
                    const revPerHour = m.hoursLogged > 0 ? m.revenueGenerated / m.hoursLogged : 0;
                    return (
                      <tr key={m.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="p-2">
                          {i === 0 ? <Badge className="bg-amber-500/10 text-amber-600 border-0 text-[10px]">1st</Badge> :
                           i === 1 ? <Badge className="bg-slate-500/10 text-slate-600 border-0 text-[10px]">2nd</Badge> :
                           i === 2 ? <Badge className="bg-orange-500/10 text-orange-600 border-0 text-[10px]">3rd</Badge> :
                           <span className="text-xs text-muted-foreground">{i + 1}</span>}
                        </td>
                        <td className="p-2 font-medium">{m.name}</td>
                        <td className="p-2 text-xs text-muted-foreground">{m.role || "—"}</td>
                        <td className="p-2 font-semibold">{m.tasksCompleted}</td>
                        <td className="p-2">{m.hoursLogged}h</td>
                        <td className={`p-2 font-medium ${m.onTimeDeliveryPct >= 90 ? "text-emerald-600" : m.onTimeDeliveryPct >= 70 ? "text-amber-600" : "text-red-600"}`}>
                          {m.onTimeDeliveryPct}%
                        </td>
                        <td className="p-2">
                          <span className="text-amber-500 text-xs">{ratingStars(m.clientSatisfaction)}</span>
                          <span className="text-xs text-muted-foreground ml-1">{m.clientSatisfaction}</span>
                        </td>
                        <td className="p-2 font-semibold text-emerald-600">{fmt(m.revenueGenerated)}</td>
                        <td className="p-2 text-xs text-muted-foreground">{fmt(revPerHour)}/h</td>
                        <td className="p-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMembers((prev) => prev.filter((x) => x.id !== m.id))}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {members.length > 1 && (
              <>
                <Separator className="my-4" />
                <h3 className="text-sm font-semibold mb-3">Tasks Completed Comparison</h3>
                <div className="flex items-end gap-2 h-32">
                  {ranked.map((m) => {
                    const maxTasks = Math.max(...members.map((x) => x.tasksCompleted), 1);
                    const h = Math.max(5, (m.tasksCompleted / maxTasks) * 100);
                    return (
                      <div key={m.id} className="flex-1 flex flex-col items-center gap-0.5">
                        <span className="text-[9px] font-mono text-muted-foreground">{m.tasksCompleted}</span>
                        <div className="w-full rounded-t bg-gradient-to-t from-violet-500 to-pink-400" style={{ height: `${h}%` }} />
                        <span className="text-[8px] text-muted-foreground truncate w-full text-center">{m.name.split(" ")[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
