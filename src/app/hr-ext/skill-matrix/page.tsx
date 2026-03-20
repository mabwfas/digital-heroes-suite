"use client";

import { useState, useMemo } from "react";
import {
  Grid3X3,
  Plus,
  Trash2,
  Star,
  AlertTriangle,
  Pencil,
  User,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

const DEFAULT_SKILLS = ["Liquid", "CSS", "React", "Figma", "SEO", "Sales", "PM", "TypeScript", "Shopify", "Analytics"];

interface SkillRating {
  skill: string;
  level: number; // 1-5
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  ratings: SkillRating[];
}

export default function SkillMatrixPage() {
  const [members, setMembers] = useLocalStorage<TeamMember[]>("hr-ext-skill-matrix", []);
  const [skills, setSkills] = useLocalStorage<string[]>("hr-ext-skills-list", DEFAULT_SKILLS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", role: "" });
  const [newSkill, setNewSkill] = useState("");

  function openAdd() {
    setEditingId(null);
    setForm({ name: "", role: "" });
    setDialogOpen(true);
  }

  function openEdit(m: TeamMember) {
    setEditingId(m.id);
    setForm({ name: m.name, role: m.role });
    setDialogOpen(true);
  }

  function save() {
    if (!form.name.trim()) return;
    if (editingId) {
      setMembers((prev) => prev.map((m) => m.id === editingId ? { ...m, name: form.name.trim(), role: form.role.trim() } : m));
    } else {
      setMembers((prev) => [
        ...prev,
        {
          id: generateId(),
          name: form.name.trim(),
          role: form.role.trim(),
          ratings: skills.map((s) => ({ skill: s, level: 0 })),
        },
      ]);
    }
    setDialogOpen(false);
  }

  function deleteMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  function setRating(memberId: string, skill: string, level: number) {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;
        const existing = m.ratings.find((r) => r.skill === skill);
        if (existing) {
          return { ...m, ratings: m.ratings.map((r) => r.skill === skill ? { ...r, level } : r) };
        }
        return { ...m, ratings: [...m.ratings, { skill, level }] };
      })
    );
  }

  function addSkill() {
    if (!newSkill.trim() || skills.includes(newSkill.trim())) return;
    const s = newSkill.trim();
    setSkills((prev) => [...prev, s]);
    setMembers((prev) => prev.map((m) => ({ ...m, ratings: [...m.ratings, { skill: s, level: 0 }] })));
    setNewSkill("");
  }

  function removeSkill(skill: string) {
    setSkills((prev) => prev.filter((s) => s !== skill));
    setMembers((prev) => prev.map((m) => ({ ...m, ratings: m.ratings.filter((r) => r.skill !== skill) })));
  }

  const gaps = useMemo(() => {
    if (members.length === 0) return [];
    return skills.map((skill) => {
      const ratings = members.map((m) => m.ratings.find((r) => r.skill === skill)?.level || 0);
      const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      const noExpert = ratings.every((r) => r < 4);
      return { skill, avg: Math.round(avg * 10) / 10, noExpert, zeroCount: ratings.filter((r) => r === 0).length };
    }).filter((g) => g.avg < 3 || g.noExpert).sort((a, b) => a.avg - b.avg);
  }, [members, skills]);

  function getRating(member: TeamMember, skill: string): number {
    return member.ratings.find((r) => r.skill === skill)?.level || 0;
  }

  function ratingColor(level: number) {
    if (level === 0) return "bg-muted text-muted-foreground";
    if (level <= 2) return "bg-red-500/10 text-red-600 dark:text-red-400";
    if (level <= 3) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skill Matrix & Training Planner"
        description="Map team skills, identify gaps, and plan training priorities"
        icon={Grid3X3}
        badge="HR Extended"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Team Members", value: members.length, color: "text-violet-600 dark:text-violet-400" },
          { label: "Skills Tracked", value: skills.length, color: "text-pink-600 dark:text-pink-400" },
          { label: "Skill Gaps", value: gaps.length, color: "text-amber-600 dark:text-amber-400" },
          { label: "Avg Proficiency", value: members.length > 0 ? `${(members.reduce((sum, m) => sum + m.ratings.reduce((s, r) => s + r.level, 0), 0) / Math.max(1, members.reduce((sum, m) => sum + m.ratings.filter((r) => r.level > 0).length, 0))).toFixed(1)}` : "---", color: "text-emerald-600 dark:text-emerald-400" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="matrix">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="matrix">Matrix View</TabsTrigger>
            <TabsTrigger value="gaps">Skill Gaps</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSkillDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />Manage Skills
            </Button>
            <Button size="sm" onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">
              <Plus className="h-3.5 w-3.5 mr-1.5" />Add Member
            </Button>
          </div>
        </div>

        <TabsContent value="matrix">
          {members.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Grid3X3 className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">Add team members to build the skill matrix.</p>
                <Button variant="outline" className="mt-4" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Member</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid gap-0" style={{ gridTemplateColumns: `200px repeat(${skills.length}, minmax(70px, 1fr))` }}>
                  <div className="p-2 font-semibold text-xs text-muted-foreground uppercase tracking-wide border-b">Team Member</div>
                  {skills.map((s) => (
                    <div key={s} className="p-2 font-semibold text-xs text-center text-muted-foreground uppercase tracking-wide border-b truncate">{s}</div>
                  ))}
                  {members.map((member) => (
                    <>
                      <div key={`name-${member.id}`} className="p-2 flex items-center gap-2 border-b">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-violet-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{member.name}</p>
                          {member.role && <p className="text-[10px] text-muted-foreground truncate">{member.role}</p>}
                        </div>
                        <div className="flex gap-0.5 ml-auto shrink-0">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(member)}><Pencil className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => deleteMember(member.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                      {skills.map((skill) => {
                        const level = getRating(member, skill);
                        return (
                          <div key={`${member.id}-${skill}`} className="p-1 border-b flex items-center justify-center">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                  key={n}
                                  onClick={() => setRating(member.id, skill, n === level ? 0 : n)}
                                  className="p-0.5"
                                >
                                  <Star className={`h-3.5 w-3.5 transition-colors ${n <= level ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gaps" className="space-y-3">
          {gaps.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">{members.length === 0 ? "Add members and rate skills to identify gaps." : "No significant skill gaps detected."}</p>
              </CardContent>
            </Card>
          ) : (
            gaps.map((g) => (
              <Card key={g.skill} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${g.avg < 2 ? "bg-red-500/10" : "bg-amber-500/10"}`}>
                        <AlertTriangle className={`h-4 w-4 ${g.avg < 2 ? "text-red-500" : "text-amber-500"}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{g.skill}</p>
                        <p className="text-xs text-muted-foreground">
                          Avg: {g.avg}/5 {g.noExpert && "| No expert (4+)"} {g.zeroCount > 0 && `| ${g.zeroCount} unrated`}
                        </p>
                      </div>
                    </div>
                    <Badge className={`text-[10px] border-0 ${g.avg < 2 ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-600"}`}>
                      {g.avg < 2 ? "Critical Gap" : "Training Needed"}
                    </Badge>
                  </div>
                  <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${g.avg < 2 ? "bg-red-500" : g.avg < 3 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${(g.avg / 5) * 100}%` }} />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingId ? "Edit Member" : "Add Team Member"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" className="mt-1" /></div>
            <div><Label>Role</Label><Input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="e.g. Frontend Developer" className="mt-1" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.name.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">{editingId ? "Save" : "Add Member"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={skillDialogOpen} onOpenChange={setSkillDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Manage Skills</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="flex gap-2">
              <Input value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Add a skill..." onKeyDown={(e) => e.key === "Enter" && addSkill()} className="flex-1" />
              <Button variant="outline" size="icon" onClick={addSkill} disabled={!newSkill.trim()}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {skills.map((s) => (
                <div key={s} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                  <span className="text-sm">{s}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => removeSkill(s)}><X className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
