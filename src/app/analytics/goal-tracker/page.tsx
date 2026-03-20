"use client";

import { useState, useMemo } from "react";
import {
  Target,
  Plus,
  Trash2,
  Archive,
  CheckCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface KeyResult {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
}

interface Objective {
  id: string;
  title: string;
  quarter: string;
  keyResults: KeyResult[];
  archived: boolean;
  createdAt: string;
}

function krProgress(kr: KeyResult): number {
  if (kr.target === 0) return 0;
  return Math.min(100, Math.round((kr.current / kr.target) * 100));
}

function objProgress(obj: Objective): number {
  if (obj.keyResults.length === 0) return 0;
  return Math.round(obj.keyResults.reduce((s, kr) => s + krProgress(kr), 0) / obj.keyResults.length);
}

function progressColor(pct: number): string {
  if (pct >= 100) return "bg-emerald-500";
  if (pct >= 70) return "bg-violet-500";
  if (pct >= 40) return "bg-amber-500";
  return "bg-red-500";
}

const QUARTERS = ["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025", "Q1 2026", "Q2 2026"];

export default function GoalTrackerPage() {
  const [objectives, setObjectives, hydrated] = useLocalStorage<Objective[]>("analytics-goal-tracker", []);
  const [title, setTitle] = useState("");
  const [quarter, setQuarter] = useState(QUARTERS[0]);
  const [krTitle, setKrTitle] = useState("");
  const [krTarget, setKrTarget] = useState("");
  const [krUnit, setKrUnit] = useState("%");
  const [addingKrTo, setAddingKrTo] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const activeObjs = useMemo(() => objectives.filter((o) => !o.archived), [objectives]);
  const archivedObjs = useMemo(() => objectives.filter((o) => o.archived), [objectives]);

  const summary = useMemo(() => {
    const total = activeObjs.length;
    const completed = activeObjs.filter((o) => objProgress(o) >= 100).length;
    const avgProgress = total > 0 ? Math.round(activeObjs.reduce((s, o) => s + objProgress(o), 0) / total) : 0;
    const totalKRs = activeObjs.reduce((s, o) => s + o.keyResults.length, 0);
    return { total, completed, avgProgress, totalKRs };
  }, [activeObjs]);

  function handleAddObjective() {
    if (!title.trim()) return;
    const obj: Objective = {
      id: generateId(),
      title: title.trim(),
      quarter,
      keyResults: [],
      archived: false,
      createdAt: new Date().toISOString(),
    };
    setObjectives((prev) => [...prev, obj]);
    setTitle("");
    setExpandedIds((prev) => new Set([...prev, obj.id]));
  }

  function handleAddKR(objId: string) {
    if (!krTitle.trim()) return;
    setObjectives((prev) =>
      prev.map((o) =>
        o.id === objId
          ? {
              ...o,
              keyResults: [
                ...o.keyResults,
                { id: generateId(), title: krTitle.trim(), target: parseFloat(krTarget) || 100, current: 0, unit: krUnit },
              ],
            }
          : o
      )
    );
    setKrTitle("");
    setKrTarget("");
    setKrUnit("%");
    setAddingKrTo(null);
  }

  function updateKR(objId: string, krId: string, value: number) {
    setObjectives((prev) =>
      prev.map((o) =>
        o.id === objId
          ? { ...o, keyResults: o.keyResults.map((kr) => (kr.id === krId ? { ...kr, current: value } : kr)) }
          : o
      )
    );
  }

  function archiveObj(id: string) {
    setObjectives((prev) => prev.map((o) => (o.id === id ? { ...o, archived: true } : o)));
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goal Tracker (OKR)"
        description="Set objectives with key results, track progress, and manage quarterly goals."
        icon={Target}
        badge="Analytics"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Objectives", value: summary.total, color: "text-violet-600" },
          { label: "Completed", value: summary.completed, color: "text-emerald-600" },
          { label: "Avg Progress", value: `${summary.avgProgress}%`, color: summary.avgProgress >= 70 ? "text-emerald-600" : "text-amber-600" },
          { label: "Total Key Results", value: summary.totalKRs, color: "text-pink-600" },
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
            New Objective
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 max-w-2xl">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label>Objective Title *</Label>
              <Input placeholder="Increase MRR by 30%" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Quarter</Label>
              <Select value={quarter} onValueChange={(v) => { if (v) setQuarter(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUARTERS.map((q) => (
                    <SelectItem key={q} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="invisible">Add</Label>
              <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleAddObjective} disabled={!title.trim()}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {activeObjs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Target className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Create your first objective to start tracking OKRs.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeObjs.map((obj) => {
            const pct = objProgress(obj);
            const isExpanded = expandedIds.has(obj.id);
            return (
              <Card key={obj.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleExpand(obj.id)}>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{obj.title}</h3>
                        <Badge variant="secondary" className="text-[10px]">{obj.quarter}</Badge>
                        {pct >= 100 && <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px]">Complete</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all ${progressColor(pct)}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground">{pct}%</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); archiveObj(obj.id); }} title="Archive">
                        <Archive className="h-3 w-3 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setObjectives((prev) => prev.filter((x) => x.id !== obj.id)); }}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 ml-7 space-y-3">
                      {obj.keyResults.map((kr) => {
                        const kPct = krProgress(kr);
                        return (
                          <div key={kr.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium">{kr.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 bg-muted rounded-full h-1.5">
                                  <div className={`h-1.5 rounded-full ${progressColor(kPct)}`} style={{ width: `${kPct}%` }} />
                                </div>
                                <span className="text-[10px] text-muted-foreground">{kPct}%</span>
                              </div>
                            </div>
                            <Input
                              type="number"
                              className="w-20 h-7 text-xs"
                              value={kr.current}
                              onChange={(e) => updateKR(obj.id, kr.id, parseFloat(e.target.value) || 0)}
                            />
                            <span className="text-[10px] text-muted-foreground">/ {kr.target}{kr.unit}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setObjectives((prev) => prev.map((o) => o.id === obj.id ? { ...o, keyResults: o.keyResults.filter((k) => k.id !== kr.id) } : o))}>
                              <Trash2 className="h-2.5 w-2.5 text-red-500" />
                            </Button>
                          </div>
                        );
                      })}

                      {addingKrTo === obj.id ? (
                        <div className="grid grid-cols-4 gap-2 p-2 bg-muted/20 rounded">
                          <Input placeholder="KR title" className="h-7 text-xs" value={krTitle} onChange={(e) => setKrTitle(e.target.value)} />
                          <Input type="number" placeholder="Target" className="h-7 text-xs" value={krTarget} onChange={(e) => setKrTarget(e.target.value)} />
                          <Input placeholder="Unit (%)" className="h-7 text-xs" value={krUnit} onChange={(e) => setKrUnit(e.target.value)} />
                          <div className="flex gap-1">
                            <Button size="sm" className="h-7 text-xs flex-1" onClick={() => handleAddKR(obj.id)} disabled={!krTitle.trim()}>Save</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAddingKrTo(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setAddingKrTo(obj.id)}>
                          <Plus className="h-3 w-3" />
                          Add Key Result
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {archivedObjs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 cursor-pointer" onClick={() => setShowArchived(!showArchived)}>
              <Archive className="h-4 w-4 text-muted-foreground" />
              Archived ({archivedObjs.length})
              {showArchived ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
          {showArchived && (
            <CardContent>
              <div className="space-y-2">
                {archivedObjs.map((obj) => (
                  <div key={obj.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="flex-1">{obj.title}</span>
                    <Badge variant="secondary" className="text-[10px]">{obj.quarter}</Badge>
                    <span className="text-xs text-muted-foreground">{objProgress(obj)}%</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setObjectives((prev) => prev.filter((x) => x.id !== obj.id))}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
