"use client";

import { useState, useMemo } from "react";
import {
  FileCheck,
  Plus,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  MessageSquare,
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
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type ApprovalStatus = "submitted" | "reviewing" | "changes-requested" | "approved";

interface Revision {
  id: string;
  feedback: string;
  date: string;
  status: ApprovalStatus;
}

interface Deliverable {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  status: ApprovalStatus;
  revisions: Revision[];
  createdAt: string;
}

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; color: string }> = {
  submitted: { label: "Submitted", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  reviewing: { label: "Reviewing", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  "changes-requested": { label: "Changes Requested", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
  approved: { label: "Approved", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
};

const STATUS_ORDER: ApprovalStatus[] = ["submitted", "reviewing", "changes-requested", "approved"];

export default function ApprovalPage() {
  const [deliverables, setDeliverables] = useLocalStorage<Deliverable[]>("projects-approval", []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", previewUrl: "" });
  const [feedbackForm, setFeedbackForm] = useState({ feedback: "", status: "reviewing" as ApprovalStatus });

  function openCreate() {
    setEditingId(null);
    setForm({ name: "", description: "", previewUrl: "" });
    setDialogOpen(true);
  }

  function openEdit(d: Deliverable) {
    setEditingId(d.id);
    setForm({ name: d.name, description: d.description, previewUrl: d.previewUrl });
    setDialogOpen(true);
  }

  function save() {
    if (!form.name.trim()) return;
    if (editingId) {
      setDeliverables((prev) => prev.map((d) => d.id === editingId ? { ...d, ...form } : d));
    } else {
      setDeliverables((prev) => [
        { id: generateId(), ...form, status: "submitted" as ApprovalStatus, revisions: [], createdAt: new Date().toISOString() },
        ...prev,
      ]);
    }
    setDialogOpen(false);
  }

  function remove(id: string) {
    setDeliverables((prev) => prev.filter((d) => d.id !== id));
  }

  function openFeedback(id: string) {
    const d = deliverables.find((dd) => dd.id === id);
    setSelectedId(id);
    setFeedbackForm({ feedback: "", status: d?.status === "submitted" ? "reviewing" : d?.status || "reviewing" });
    setFeedbackDialogOpen(true);
  }

  function saveFeedback() {
    if (!selectedId) return;
    setDeliverables((prev) =>
      prev.map((d) => {
        if (d.id !== selectedId) return d;
        const revision: Revision = {
          id: generateId(),
          feedback: feedbackForm.feedback.trim(),
          date: new Date().toISOString(),
          status: feedbackForm.status,
        };
        return { ...d, status: feedbackForm.status, revisions: [...d.revisions, revision] };
      })
    );
    setFeedbackDialogOpen(false);
  }

  const stats = useMemo(() => {
    const approved = deliverables.filter((d) => d.status === "approved").length;
    const pending = deliverables.filter((d) => d.status !== "approved").length;
    const avgRevisions = deliverables.length > 0 ? (deliverables.reduce((s, d) => s + d.revisions.length, 0) / deliverables.length).toFixed(1) : "0";
    return { total: deliverables.length, approved, pending, avgRevisions };
  }, [deliverables]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Approval Workflow"
        description="Submit deliverables and track client approval through revision cycles"
        icon={FileCheck}
        badge="Projects"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Deliverables", value: stats.total, color: "text-violet-600 dark:text-violet-400" },
          { label: "Approved", value: stats.approved, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Pending", value: stats.pending, color: "text-amber-600 dark:text-amber-400" },
          { label: "Avg Revisions", value: stats.avgRevisions, color: "text-pink-600 dark:text-pink-400" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground mt-0.5">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">
          <Plus className="h-3.5 w-3.5 mr-1.5" />Submit Deliverable
        </Button>
      </div>

      <div className="space-y-3">
        {deliverables.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-16 text-center"><FileCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" /><p className="text-sm text-muted-foreground">No deliverables submitted yet.</p><Button variant="outline" className="mt-4" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Submit Deliverable</Button></CardContent></Card>
        ) : (
          deliverables.map((d) => {
            const isExpanded = expandedId === d.id;
            const statusCfg = STATUS_CONFIG[d.status];
            return (
              <Card key={d.id} className={`overflow-hidden transition-colors ${d.status === "approved" ? "border-emerald-500/30" : d.status === "changes-requested" ? "border-red-500/30" : "hover:border-violet-500/30"}`}>
                <button className="w-full text-left" onClick={() => setExpandedId(isExpanded ? null : d.id)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center shrink-0"><FileCheck className="h-4 w-4 text-violet-500" /></div>
                        <div>
                          <CardTitle className="text-base">{d.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge className={`text-[10px] border-0 ${statusCfg.color}`}>{statusCfg.label}</Badge>
                            <span className="text-xs text-muted-foreground">{d.revisions.length} revision{d.revisions.length !== 1 ? "s" : ""}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(d.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {d.previewUrl && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); window.open(d.previewUrl, "_blank"); }}><ExternalLink className="h-3.5 w-3.5" /></Button>}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openFeedback(d.id); }}><MessageSquare className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(d); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={(e) => { e.stopPropagation(); remove(d.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                    {/* Status progress */}
                    <div className="flex gap-1 mt-3">
                      {STATUS_ORDER.map((s) => {
                        const idx = STATUS_ORDER.indexOf(d.status);
                        const thisIdx = STATUS_ORDER.indexOf(s);
                        const active = thisIdx <= idx;
                        return <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${active ? (d.status === "changes-requested" && s === "changes-requested" ? "bg-red-500" : "bg-violet-500") : "bg-muted"}`} />;
                      })}
                    </div>
                  </CardHeader>
                </button>
                {isExpanded && (
                  <CardContent className="pt-0 pb-5 px-5">
                    <Separator className="mb-4" />
                    {d.description && <p className="text-sm text-muted-foreground mb-3">{d.description}</p>}
                    {d.revisions.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Revision History</p>
                        {d.revisions.map((r) => (
                          <div key={r.id} className="rounded-lg bg-muted/30 px-4 py-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={`text-[10px] border-0 ${STATUS_CONFIG[r.status].color}`}>{STATUS_CONFIG[r.status].label}</Badge>
                              <span className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString()}</span>
                            </div>
                            {r.feedback && <p className="text-sm">{r.feedback}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No feedback yet.</p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Edit Deliverable" : "Submit Deliverable"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Homepage Design v2" className="mt-1" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="mt-1" /></div>
            <div><Label>Preview URL</Label><Input value={form.previewUrl} onChange={(e) => setForm((f) => ({ ...f, previewUrl: e.target.value }))} placeholder="https://..." className="mt-1" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.name.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">{editingId ? "Save" : "Submit"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Update Status & Feedback</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Status</Label>
              <Select value={feedbackForm.status} onValueChange={(v) => setFeedbackForm((f) => ({ ...f, status: v as ApprovalStatus }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Feedback</Label><Textarea value={feedbackForm.feedback} onChange={(e) => setFeedbackForm((f) => ({ ...f, feedback: e.target.value }))} rows={4} placeholder="Client feedback or notes..." className="mt-1" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveFeedback} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
