"use client";

import { useState, useMemo } from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  Copy,
  Pencil,
  FileText,
  ChevronDown,
  ChevronUp,
  Star,
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

interface AssignmentTemplate {
  id: string;
  role: string;
  taskDescription: string;
  requirements: string;
  timeLimit: string;
  evaluationCriteria: string;
}

interface Submission {
  id: string;
  templateId: string;
  candidateName: string;
  submittedAt: string;
  score: number;
  notes: string;
}

const DEFAULT_TEMPLATES: AssignmentTemplate[] = [
  {
    id: "tpl-dev",
    role: "Developer",
    taskDescription: "Build a custom Shopify section that displays a product grid with filtering by collection. The section should be responsive and follow Shopify theme development best practices.",
    requirements: "- Use Liquid, HTML, CSS, and optional JavaScript\n- Must work with Online Store 2.0 themes\n- Include section settings for customization\n- Responsive design (mobile, tablet, desktop)",
    timeLimit: "4 hours",
    evaluationCriteria: "Code quality, Liquid best practices, responsiveness, section settings implementation, documentation",
  },
  {
    id: "tpl-designer",
    role: "Designer",
    taskDescription: "Redesign the product detail page for a premium fashion e-commerce store. Focus on improving the visual hierarchy, product imagery presentation, and conversion optimization.",
    requirements: "- Provide desktop and mobile designs\n- Include hover/interaction states\n- Use a modern design system\n- Annotate key design decisions",
    timeLimit: "6 hours",
    evaluationCriteria: "Visual design quality, UX best practices, attention to detail, brand consistency, mobile experience",
  },
  {
    id: "tpl-pm",
    role: "Project Manager",
    taskDescription: "Create a comprehensive project plan for migrating an existing Shopify store to a new custom theme. Include timeline, resource allocation, risk assessment, and communication plan.",
    requirements: "- Define project phases and milestones\n- Include resource allocation matrix\n- Risk register with mitigation strategies\n- Stakeholder communication plan\n- QA and launch checklist",
    timeLimit: "3 hours",
    evaluationCriteria: "Completeness, realistic timeline, risk awareness, communication clarity, attention to dependencies",
  },
];

export default function ScreeningPage() {
  const [templates, setTemplates] = useLocalStorage<AssignmentTemplate[]>("hr-ext-screening-templates", DEFAULT_TEMPLATES);
  const [submissions, setSubmissions] = useLocalStorage<Submission[]>("hr-ext-screening-submissions", []);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [form, setForm] = useState({ role: "", taskDescription: "", requirements: "", timeLimit: "", evaluationCriteria: "" });
  const [subForm, setSubForm] = useState({ candidateName: "", score: 0, notes: "" });

  function openCreateTemplate() {
    setEditingId(null);
    setForm({ role: "", taskDescription: "", requirements: "", timeLimit: "", evaluationCriteria: "" });
    setTemplateDialogOpen(true);
  }

  function openEditTemplate(t: AssignmentTemplate) {
    setEditingId(t.id);
    setForm({ role: t.role, taskDescription: t.taskDescription, requirements: t.requirements, timeLimit: t.timeLimit, evaluationCriteria: t.evaluationCriteria });
    setTemplateDialogOpen(true);
  }

  function saveTemplate() {
    if (!form.role.trim() || !form.taskDescription.trim()) return;
    if (editingId) {
      setTemplates((prev) => prev.map((t) => t.id === editingId ? { ...t, ...form } : t));
    } else {
      setTemplates((prev) => [...prev, { id: generateId(), ...form }]);
    }
    setTemplateDialogOpen(false);
  }

  function deleteTemplate(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  function generateDocument(t: AssignmentTemplate) {
    const doc = `SCREENING ASSIGNMENT\n${"=".repeat(40)}\nRole: ${t.role}\nTime Limit: ${t.timeLimit}\n\nTASK DESCRIPTION\n${"-".repeat(20)}\n${t.taskDescription}\n\nREQUIREMENTS\n${"-".repeat(20)}\n${t.requirements}\n\nEVALUATION CRITERIA\n${"-".repeat(20)}\n${t.evaluationCriteria}`;
    navigator.clipboard.writeText(doc);
  }

  function openSubmission(templateId: string) {
    setSelectedTemplateId(templateId);
    setSubForm({ candidateName: "", score: 0, notes: "" });
    setSubmissionDialogOpen(true);
  }

  function saveSubmission() {
    if (!selectedTemplateId || !subForm.candidateName.trim()) return;
    setSubmissions((prev) => [
      ...prev,
      { id: generateId(), templateId: selectedTemplateId, candidateName: subForm.candidateName.trim(), submittedAt: new Date().toISOString(), score: subForm.score, notes: subForm.notes },
    ]);
    setSubmissionDialogOpen(false);
  }

  function deleteSubmission(id: string) {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Screening Assignment Generator"
        description="Create and manage role-specific screening assignments for candidates"
        icon={ClipboardList}
        badge="HR Extended"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Templates", value: templates.length, color: "text-violet-600 dark:text-violet-400" },
          { label: "Submissions", value: submissions.length, color: "text-pink-600 dark:text-pink-400" },
          { label: "Avg Score", value: submissions.length > 0 ? `${(submissions.reduce((s, sub) => s + sub.score, 0) / submissions.length).toFixed(1)}/5` : "---", color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Roles Covered", value: new Set(templates.map((t) => t.role)).size, color: "text-blue-600 dark:text-blue-400" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground mt-0.5">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="templates">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
          </TabsList>
          <Button size="sm" onClick={openCreateTemplate} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">
            <Plus className="h-3.5 w-3.5 mr-1.5" />New Template
          </Button>
        </div>

        <TabsContent value="templates" className="space-y-3">
          {templates.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-16 text-center"><ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" /><p className="text-sm text-muted-foreground">No templates yet.</p></CardContent></Card>
          ) : (
            templates.map((t) => {
              const isExpanded = expandedId === t.id;
              const subs = submissions.filter((s) => s.templateId === t.id);
              return (
                <Card key={t.id} className="overflow-hidden hover:border-violet-500/30 transition-colors">
                  <button className="w-full text-left" onClick={() => setExpandedId(isExpanded ? null : t.id)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center shrink-0"><FileText className="h-4 w-4 text-violet-500" /></div>
                          <div>
                            <CardTitle className="text-base">{t.role}</CardTitle>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="secondary" className="text-[10px]">{t.timeLimit || "No time limit"}</Badge>
                              <span className="text-xs text-muted-foreground">{subs.length} submission{subs.length !== 1 ? "s" : ""}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); generateDocument(t); }}><Copy className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openSubmission(t.id); }}><Plus className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEditTemplate(t); }}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>
                    </CardHeader>
                  </button>
                  {isExpanded && (
                    <CardContent className="pt-0 pb-5 px-5">
                      <Separator className="mb-4" />
                      <div className="space-y-3">
                        <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Task Description</p><p className="text-sm bg-muted/30 rounded-lg p-3">{t.taskDescription}</p></div>
                        <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Requirements</p><pre className="text-sm bg-muted/30 rounded-lg p-3 whitespace-pre-wrap">{t.requirements}</pre></div>
                        <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Evaluation Criteria</p><p className="text-sm bg-muted/30 rounded-lg p-3">{t.evaluationCriteria}</p></div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="submissions" className="space-y-3">
          {submissions.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-16 text-center"><ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" /><p className="text-sm text-muted-foreground">No submissions recorded yet.</p></CardContent></Card>
          ) : (
            submissions.map((sub) => {
              const template = templates.find((t) => t.id === sub.templateId);
              return (
                <Card key={sub.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{sub.candidateName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px]">{template?.role || "Unknown Role"}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(sub.submittedAt).toLocaleDateString()}</span>
                        </div>
                        {sub.notes && <p className="text-xs text-muted-foreground mt-1">{sub.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} className={`h-3.5 w-3.5 ${n <= sub.score ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                          ))}
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => deleteSubmission(sub.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Template" : "New Template"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Role *</Label><Input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="e.g. Developer" className="mt-1" /></div>
              <div><Label>Time Limit</Label><Input value={form.timeLimit} onChange={(e) => setForm((f) => ({ ...f, timeLimit: e.target.value }))} placeholder="e.g. 4 hours" className="mt-1" /></div>
            </div>
            <div><Label>Task Description *</Label><Textarea value={form.taskDescription} onChange={(e) => setForm((f) => ({ ...f, taskDescription: e.target.value }))} rows={4} className="mt-1" /></div>
            <div><Label>Requirements</Label><Textarea value={form.requirements} onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))} rows={4} className="mt-1" /></div>
            <div><Label>Evaluation Criteria</Label><Textarea value={form.evaluationCriteria} onChange={(e) => setForm((f) => ({ ...f, evaluationCriteria: e.target.value }))} rows={3} className="mt-1" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveTemplate} disabled={!form.role.trim() || !form.taskDescription.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">{editingId ? "Save" : "Create Template"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={submissionDialogOpen} onOpenChange={setSubmissionDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Record Submission</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Candidate Name *</Label><Input value={subForm.candidateName} onChange={(e) => setSubForm((f) => ({ ...f, candidateName: e.target.value }))} placeholder="Candidate name" className="mt-1" /></div>
            <div>
              <Label>Score (1-5)</Label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setSubForm((f) => ({ ...f, score: n }))} className="p-1">
                    <Star className={`h-5 w-5 transition-colors ${n <= subForm.score ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div><Label>Notes</Label><Textarea value={subForm.notes} onChange={(e) => setSubForm((f) => ({ ...f, notes: e.target.value }))} rows={3} className="mt-1" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setSubmissionDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveSubmission} disabled={!subForm.candidateName.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">Record</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
