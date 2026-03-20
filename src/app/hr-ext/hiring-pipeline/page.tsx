"use client";

import { useState, useMemo } from "react";
import {
  Users,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Link2,
  StickyNote,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type Stage = "applied" | "screening" | "assignment" | "interview" | "offer" | "hired";

interface StageNote {
  stage: Stage;
  note: string;
  date: string;
}

interface Candidate {
  id: string;
  name: string;
  role: string;
  source: string;
  resumeLink: string;
  notes: string;
  stage: Stage;
  stageNotes: StageNote[];
  createdAt: string;
}

const STAGES: { id: Stage; label: string; color: string; headerColor: string }[] = [
  { id: "applied", label: "Applied", color: "border-slate-300 dark:border-slate-700", headerColor: "bg-slate-100 dark:bg-slate-800/50" },
  { id: "screening", label: "Screening", color: "border-blue-300 dark:border-blue-700/50", headerColor: "bg-blue-50 dark:bg-blue-900/20" },
  { id: "assignment", label: "Assignment", color: "border-violet-300 dark:border-violet-700/50", headerColor: "bg-violet-50 dark:bg-violet-900/20" },
  { id: "interview", label: "Interview", color: "border-amber-300 dark:border-amber-700/50", headerColor: "bg-amber-50 dark:bg-amber-900/20" },
  { id: "offer", label: "Offer", color: "border-pink-300 dark:border-pink-700/50", headerColor: "bg-pink-50 dark:bg-pink-900/20" },
  { id: "hired", label: "Hired", color: "border-emerald-300 dark:border-emerald-700/50", headerColor: "bg-emerald-50 dark:bg-emerald-900/20" },
];

const stageOrder: Stage[] = STAGES.map((s) => s.id);

export default function HiringPipelinePage() {
  const [candidates, setCandidates] = useLocalStorage<Candidate[]>("hr-ext-hiring-pipeline", []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteCandidate, setNoteCandidate] = useState<Candidate | null>(null);
  const [stageNote, setStageNote] = useState("");
  const [form, setForm] = useState({ name: "", role: "", source: "", resumeLink: "", notes: "" });

  function openAdd() {
    setEditingId(null);
    setForm({ name: "", role: "", source: "", resumeLink: "", notes: "" });
    setDialogOpen(true);
  }

  function openEdit(c: Candidate) {
    setEditingId(c.id);
    setForm({ name: c.name, role: c.role, source: c.source, resumeLink: c.resumeLink, notes: c.notes });
    setDialogOpen(true);
  }

  function save() {
    if (!form.name.trim() || !form.role.trim()) return;
    if (editingId) {
      setCandidates((prev) => prev.map((c) => c.id === editingId ? { ...c, ...form } : c));
    } else {
      setCandidates((prev) => [
        ...prev,
        { id: generateId(), ...form, stage: "applied" as Stage, stageNotes: [], createdAt: new Date().toISOString() },
      ]);
    }
    setDialogOpen(false);
  }

  function move(id: string, dir: "left" | "right") {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const idx = stageOrder.indexOf(c.stage);
        const newIdx = dir === "left" ? idx - 1 : idx + 1;
        if (newIdx < 0 || newIdx >= stageOrder.length) return c;
        return { ...c, stage: stageOrder[newIdx] };
      })
    );
  }

  function remove(id: string) {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  }

  function openNoteDialog(c: Candidate) {
    setNoteCandidate(c);
    setStageNote("");
    setNoteDialogOpen(true);
  }

  function saveStageNote() {
    if (!noteCandidate || !stageNote.trim()) return;
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === noteCandidate.id
          ? { ...c, stageNotes: [...c.stageNotes, { stage: c.stage, note: stageNote.trim(), date: new Date().toISOString() }] }
          : c
      )
    );
    setNoteDialogOpen(false);
  }

  const stats = useMemo(() => {
    const total = candidates.length;
    const hired = candidates.filter((c) => c.stage === "hired").length;
    const conversionRate = total > 0 ? Math.round((hired / total) * 100) : 0;
    return { total, hired, conversionRate };
  }, [candidates]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hiring Pipeline"
        description="Track candidates through your hiring process with a Kanban-style pipeline"
        icon={Users}
        badge="HR Extended"
        replaces="Workable / Lever"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Candidates", value: stats.total, color: "text-violet-600 dark:text-violet-400" },
          { label: "Hired", value: stats.hired, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Conversion Rate", value: `${stats.conversionRate}%`, color: "text-pink-600 dark:text-pink-400" },
          { label: "In Pipeline", value: stats.total - stats.hired, color: "text-blue-600 dark:text-blue-400" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground mt-0.5">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          {STAGES.map((s) => {
            const count = candidates.filter((c) => c.stage === s.id).length;
            return (
              <Badge key={s.id} variant="secondary" className="text-xs">{s.label}: {count}</Badge>
            );
          })}
        </div>
        <Button size="sm" onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">
          <Plus className="h-3.5 w-3.5 mr-1.5" />Add Candidate
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4 items-start">
        {STAGES.map((stage) => {
          const stageCandidates = candidates.filter((c) => c.stage === stage.id);
          return (
            <div key={stage.id} className={`rounded-xl border-2 ${stage.color} overflow-hidden`}>
              <div className={`px-3 py-2.5 ${stage.headerColor}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">{stage.label}</span>
                  <span className="h-5 w-5 rounded-full bg-foreground/10 flex items-center justify-center text-xs font-bold">{stageCandidates.length}</span>
                </div>
              </div>
              <div className="p-2 space-y-2 min-h-[120px]">
                {stageCandidates.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 text-center rounded-lg border-2 border-dashed border-border/40">
                    <p className="text-[10px] text-muted-foreground/60">No candidates</p>
                  </div>
                )}
                {stageCandidates.map((c) => {
                  const idx = stageOrder.indexOf(c.stage);
                  return (
                    <Card key={c.id} className="border-border/60 shadow-sm hover:shadow-md transition-all group">
                      <CardContent className="p-2.5 space-y-1.5">
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-medium text-sm leading-snug flex-1">{c.name}</p>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <Button variant="ghost" size="icon" className="h-5 w-5" disabled={idx === 0} onClick={() => move(c.id, "left")}><ChevronLeft className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-5 w-5" disabled={idx === stageOrder.length - 1} onClick={() => move(c.id, "right")}><ChevronRight className="h-3 w-3" /></Button>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">{c.role}</Badge>
                        {c.source && <p className="text-[10px] text-muted-foreground">Source: {c.source}</p>}
                        <div className="flex gap-0.5 pt-1">
                          {c.resumeLink && (
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => window.open(c.resumeLink, "_blank")}><Link2 className="h-3 w-3" /></Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openNoteDialog(c)}><StickyNote className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-5 w-5 hover:text-destructive" onClick={() => remove(c.id)}><X className="h-3 w-3" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Edit Candidate" : "Add Candidate"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Candidate name" className="mt-1" /></div>
            <div><Label>Role *</Label><Input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="e.g. Frontend Developer" className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Source</Label><Input value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} placeholder="LinkedIn, Referral..." className="mt-1" /></div>
              <div><Label>Resume Link</Label><Input value={form.resumeLink} onChange={(e) => setForm((f) => ({ ...f, resumeLink: e.target.value }))} placeholder="https://..." className="mt-1" /></div>
            </div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." rows={3} className="mt-1" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.name.trim() || !form.role.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">{editingId ? "Save" : "Add Candidate"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Stage Note: {noteCandidate?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            {noteCandidate && noteCandidate.stageNotes.length > 0 && (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {noteCandidate.stageNotes.map((sn, i) => (
                  <div key={i} className="rounded-lg bg-muted/30 px-3 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[10px]">{STAGES.find((s) => s.id === sn.stage)?.label}</Badge>
                      <span className="text-[10px] text-muted-foreground">{new Date(sn.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs">{sn.note}</p>
                  </div>
                ))}
              </div>
            )}
            <div>
              <Label>Add Note for Current Stage</Label>
              <Textarea value={stageNote} onChange={(e) => setStageNote(e.target.value)} placeholder="Notes for this stage..." rows={3} className="mt-1" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Close</Button>
            <Button onClick={saveStageNote} disabled={!stageNote.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">Add Note</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
