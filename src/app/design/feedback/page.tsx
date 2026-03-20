"use client";

import { useState, useMemo } from "react";
import {
  MessageCircle,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  Circle,
  AlertCircle,
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
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type DesignStatus = "pending" | "reviewed" | "approved";
type FeedbackPriority = "minor" | "major" | "critical";
type FeedbackStatus = "open" | "resolved";

interface FeedbackItem {
  id: string;
  comment: string;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  createdAt: string;
}

interface DesignReview {
  id: string;
  name: string;
  url: string;
  designer: string;
  status: DesignStatus;
  feedback: FeedbackItem[];
  createdAt: string;
}

const DESIGN_STATUS_COLORS: Record<DesignStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0",
  reviewed: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0",
  approved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0",
};

const PRIORITY_COLORS: Record<FeedbackPriority, string> = {
  minor: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-0",
  major: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0",
  critical: "bg-red-500/10 text-red-600 dark:text-red-400 border-0",
};

const EMPTY_DESIGN = { name: "", url: "", designer: "", status: "pending" as DesignStatus };

export default function FeedbackCollectorPage() {
  const [designs, setDesigns, hydrated] = useLocalStorage<DesignReview[]>("design-feedback", []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_DESIGN);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedbackForm, setFeedbackForm] = useState({ comment: "", priority: "major" as FeedbackPriority });
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | DesignStatus>("all");
  const [filterDesigner, setFilterDesigner] = useState("all");

  const filtered = useMemo(() => {
    return designs.filter((d) => {
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || d.status === filterStatus;
      const matchDesigner = filterDesigner === "all" || d.designer === filterDesigner;
      return matchSearch && matchStatus && matchDesigner;
    });
  }, [designs, search, filterStatus, filterDesigner]);

  const designers = useMemo(() => Array.from(new Set(designs.map((d) => d.designer).filter(Boolean))), [designs]);
  const selectedDesign = useMemo(() => designs.find((d) => d.id === selectedId) || null, [designs, selectedId]);

  const stats = useMemo(() => {
    const allFeedback = designs.flatMap((d) => d.feedback);
    return {
      totalDesigns: designs.length,
      pendingFeedback: allFeedback.filter((f) => f.status === "open").length,
      resolvedFeedback: allFeedback.filter((f) => f.status === "resolved").length,
      resolutionRate: allFeedback.length > 0 ? Math.round((allFeedback.filter((f) => f.status === "resolved").length / allFeedback.length) * 100) : 0,
    };
  }, [designs]);

  function openAdd() { setForm(EMPTY_DESIGN); setEditingId(null); setDialogOpen(true); }
  function openEdit(d: DesignReview) {
    setForm({ name: d.name, url: d.url, designer: d.designer, status: d.status });
    setEditingId(d.id);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editingId) {
      setDesigns((prev) => prev.map((d) => (d.id === editingId ? { ...d, ...form } : d)));
    } else {
      setDesigns((prev) => [{ ...form, id: generateId(), feedback: [], createdAt: new Date().toISOString() }, ...prev]);
    }
    setDialogOpen(false);
  }

  function deleteDesign(id: string) {
    setDesigns((prev) => prev.filter((d) => d.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function addFeedback() {
    if (!feedbackForm.comment.trim() || !selectedId) return;
    setDesigns((prev) => prev.map((d) => {
      if (d.id !== selectedId) return d;
      return { ...d, feedback: [{ id: generateId(), comment: feedbackForm.comment, priority: feedbackForm.priority, status: "open", createdAt: new Date().toISOString() }, ...d.feedback] };
    }));
    setFeedbackForm({ comment: "", priority: "major" });
  }

  function toggleFeedbackStatus(designId: string, feedbackId: string) {
    setDesigns((prev) => prev.map((d) => {
      if (d.id !== designId) return d;
      return { ...d, feedback: d.feedback.map((f) => (f.id === feedbackId ? { ...f, status: f.status === "open" ? "resolved" as const : "open" as const } : f)) };
    }));
  }

  function deleteFeedback(designId: string, feedbackId: string) {
    setDesigns((prev) => prev.map((d) => {
      if (d.id !== designId) return d;
      return { ...d, feedback: d.feedback.filter((f) => f.id !== feedbackId) };
    }));
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Design Feedback Collector" description="Submit designs for review, collect feedback, and track resolution" icon={MessageCircle} badge="Design" replaces="InVision / Figma Comments" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Designs", value: stats.totalDesigns, color: "text-violet-600 dark:text-violet-400" },
          { label: "Open Feedback", value: stats.pendingFeedback, color: "text-amber-600 dark:text-amber-400" },
          { label: "Resolved", value: stats.resolvedFeedback, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Resolution Rate", value: `${stats.resolutionRate}%`, color: "text-blue-600 dark:text-blue-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search designs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
          </SelectContent>
        </Select>
        {designers.length > 0 && (
          <Select value={filterDesigner} onValueChange={(v) => { if (v) setFilterDesigner(v); }}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Designers</SelectItem>
              {designers.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
          <Plus className="h-4 w-4 mr-2" />Submit Design
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Design List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center">
              <MessageCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{designs.length === 0 ? "No designs submitted yet." : "No designs match your filter."}</p>
            </CardContent></Card>
          ) : (
            filtered.map((d) => {
              const openCount = d.feedback.filter((f) => f.status === "open").length;
              const resolvedCount = d.feedback.filter((f) => f.status === "resolved").length;
              return (
                <Card key={d.id} className={`border-border/50 hover:border-violet-500/30 transition-colors cursor-pointer group ${selectedId === d.id ? "border-violet-500/50" : ""}`} onClick={() => setSelectedId(d.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{d.name}</span>
                          <Badge className={DESIGN_STATUS_COLORS[d.status]}>{d.status}</Badge>
                        </div>
                        {d.designer && <p className="text-xs text-muted-foreground">Designer: {d.designer}</p>}
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          {openCount > 0 && <span className="text-amber-600">{openCount} open</span>}
                          {resolvedCount > 0 && <span className="text-emerald-600">{resolvedCount} resolved</span>}
                          {d.feedback.length === 0 && <span>No feedback yet</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(d)}><Edit2 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => deleteDesign(d.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Feedback Panel */}
        {selectedDesign ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{selectedDesign.name} — Feedback</CardTitle>
                <Badge className={DESIGN_STATUS_COLORS[selectedDesign.status]}>{selectedDesign.status}</Badge>
              </div>
              {selectedDesign.url && <p className="text-xs text-muted-foreground break-all">{selectedDesign.url}</p>}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Feedback */}
              <div className="space-y-2">
                <Textarea value={feedbackForm.comment} onChange={(e) => setFeedbackForm((f) => ({ ...f, comment: e.target.value }))} placeholder="Add feedback..." rows={2} />
                <div className="flex gap-2">
                  <Select value={feedbackForm.priority} onValueChange={(v) => setFeedbackForm((f) => ({ ...f, priority: v as FeedbackPriority }))}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addFeedback} disabled={!feedbackForm.comment.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0 flex-1">
                    <Plus className="h-4 w-4 mr-2" />Add Feedback
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Feedback List */}
              {selectedDesign.feedback.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">No feedback yet for this design.</div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {selectedDesign.feedback.map((f) => (
                    <div key={f.id} className={`rounded-lg border p-3 transition-colors group/item ${f.status === "resolved" ? "opacity-60" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          <button onClick={() => toggleFeedbackStatus(selectedDesign.id, f.id)} className="mt-0.5 shrink-0">
                            {f.status === "resolved" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground/40" />}
                          </button>
                          <div>
                            <p className={`text-sm ${f.status === "resolved" ? "line-through text-muted-foreground" : ""}`}>{f.comment}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge className={PRIORITY_COLORS[f.priority]}>{f.priority}</Badge>
                              <span className="text-[10px] text-muted-foreground">{new Date(f.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover/item:opacity-100 shrink-0" onClick={() => deleteFeedback(selectedDesign.id, f.id)}>
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card><CardContent className="py-16 text-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Select a design to view and add feedback</p>
          </CardContent></Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingId ? "Edit Design" : "Submit Design for Review"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label>Design Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g., Homepage Redesign V2" /></div>
            <div className="space-y-1.5"><Label>URL / Description</Label><Input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="Figma link or description" /></div>
            <div className="space-y-1.5"><Label>Designer</Label><Input value={form.designer} onChange={(e) => setForm((f) => ({ ...f, designer: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as DesignStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">{editingId ? "Save" : "Submit"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
