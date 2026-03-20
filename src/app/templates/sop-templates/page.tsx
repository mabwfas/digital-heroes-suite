"use client";

import { useState } from "react";
import { BookOpen, Plus, Trash2, Edit2, Copy, Check, Save, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface ProcedureStep {
  id: string;
  step: string;
  details: string;
}

interface Revision {
  id: string;
  version: string;
  date: string;
  changes: string;
  author: string;
}

interface SOP {
  id: string;
  title: string;
  purpose: string;
  scope: string;
  responsibilities: string;
  steps: ProcedureStep[];
  exceptions: string;
  revisions: Revision[];
  createdAt: string;
}

export default function SopTemplatesPage() {
  const [sops, setSops] = useLocalStorage<SOP[]>("sop-templates-data", []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", purpose: "", scope: "", responsibilities: "", exceptions: "",
    steps: [] as ProcedureStep[],
    revisions: [] as Revision[],
  });
  const [stepForm, setStepForm] = useState({ step: "", details: "" });
  const [revForm, setRevForm] = useState({ version: "", date: new Date().toISOString().split("T")[0], changes: "", author: "" });

  const active = sops.find((s) => s.id === activeId);

  function openAdd() {
    setForm({ title: "", purpose: "", scope: "", responsibilities: "", exceptions: "", steps: [], revisions: [] });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(sop: SOP) {
    setForm({ title: sop.title, purpose: sop.purpose, scope: sop.scope, responsibilities: sop.responsibilities, exceptions: sop.exceptions, steps: sop.steps, revisions: sop.revisions });
    setEditingId(sop.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.title.trim()) return;
    if (editingId) {
      setSops((prev) => prev.map((s) => (s.id === editingId ? { ...s, ...form } : s)));
    } else {
      setSops((prev) => [{ ...form, id: generateId(), createdAt: new Date().toISOString() }, ...prev]);
    }
    setShowForm(false);
  }

  function addStep() {
    if (!stepForm.step.trim()) return;
    setForm((f) => ({ ...f, steps: [...f.steps, { id: generateId(), ...stepForm }] }));
    setStepForm({ step: "", details: "" });
  }

  function removeStep(id: string) {
    setForm((f) => ({ ...f, steps: f.steps.filter((s) => s.id !== id) }));
  }

  function addRevision() {
    if (!revForm.version.trim()) return;
    setForm((f) => ({ ...f, revisions: [...f.revisions, { id: generateId(), ...revForm }] }));
    setRevForm({ version: "", date: new Date().toISOString().split("T")[0], changes: "", author: "" });
  }

  function exportSOP(sop: SOP) {
    const text = `# SOP: ${sop.title}\n\n## Purpose\n${sop.purpose}\n\n## Scope\n${sop.scope}\n\n## Responsibilities\n${sop.responsibilities}\n\n## Procedure\n${sop.steps.map((s, i) => `${i + 1}. ${s.step}\n   ${s.details}`).join("\n")}\n\n## Exceptions\n${sop.exceptions}\n\n## Revision History\n| Version | Date | Author | Changes |\n|---------|------|--------|---------|\n${sop.revisions.map((r) => `| ${r.version} | ${r.date} | ${r.author} | ${r.changes} |`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopiedId(sop.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SOP Document Templates"
        description="Create structured Standard Operating Procedures with steps, exceptions, and revision tracking"
        icon={BookOpen}
        badge="Templates"
        replaces="Google Docs / Word"
        actions={
          <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> New SOP
          </Button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          {sops.length === 0 ? (
            <Card className="border-dashed border-border/60">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No SOPs yet</p>
              </CardContent>
            </Card>
          ) : (
            sops.map((sop) => (
              <Card key={sop.id} className={`cursor-pointer transition-colors ${activeId === sop.id ? "border-violet-500/50 bg-violet-500/5" : "hover:border-violet-500/30"}`} onClick={() => setActiveId(sop.id)}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{sop.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{sop.steps.length} steps &middot; v{sop.revisions.length > 0 ? sop.revisions[sop.revisions.length - 1].version : "1.0"}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); exportSOP(sop); }}>
                        {copiedId === sop.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setSops((p) => p.filter((s) => s.id !== sop.id)); if (activeId === sop.id) setActiveId(null); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {active ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{active.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(active)}><Edit2 className="h-3.5 w-3.5 mr-1" /> Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => exportSOP(active)}>
                      {copiedId === active.id ? <><Check className="h-3.5 w-3.5 mr-1" /> Copied</> : <><Copy className="h-3.5 w-3.5 mr-1" /> Export</>}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {active.purpose && <div><p className="text-xs font-medium text-muted-foreground mb-1">Purpose</p><p className="text-sm">{active.purpose}</p></div>}
                {active.scope && <div><p className="text-xs font-medium text-muted-foreground mb-1">Scope</p><p className="text-sm">{active.scope}</p></div>}
                {active.responsibilities && <div><p className="text-xs font-medium text-muted-foreground mb-1">Responsibilities</p><p className="text-sm whitespace-pre-wrap">{active.responsibilities}</p></div>}
                {active.steps.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Procedure</p>
                    <div className="space-y-2">
                      {active.steps.map((step, idx) => (
                        <div key={step.id} className="flex gap-3">
                          <div className="h-6 w-6 rounded-full bg-violet-500/10 text-violet-600 text-xs flex items-center justify-center shrink-0 font-medium">{idx + 1}</div>
                          <div>
                            <p className="text-sm font-medium">{step.step}</p>
                            {step.details && <p className="text-xs text-muted-foreground mt-0.5">{step.details}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {active.exceptions && <div><p className="text-xs font-medium text-muted-foreground mb-1">Exceptions</p><p className="text-sm whitespace-pre-wrap">{active.exceptions}</p></div>}
                {active.revisions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Revision History</p>
                    <div className="text-xs">
                      <div className="grid grid-cols-4 gap-2 font-medium text-muted-foreground border-b pb-1 mb-1">
                        <span>Version</span><span>Date</span><span>Author</span><span>Changes</span>
                      </div>
                      {active.revisions.map((r) => (
                        <div key={r.id} className="grid grid-cols-4 gap-2 py-1 border-b border-border/30">
                          <span>{r.version}</span><span>{r.date}</span><span>{r.author}</span><span>{r.changes}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-border/60">
              <CardContent className="flex items-center justify-center py-16">
                <p className="text-sm text-muted-foreground">Select or create an SOP</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit SOP" : "New SOP"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Purpose</Label><Textarea value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label>Scope</Label><Textarea value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label>Responsibilities</Label><Textarea value={form.responsibilities} onChange={(e) => setForm((f) => ({ ...f, responsibilities: e.target.value }))} rows={2} /></div>

            <div className="space-y-2">
              <Label>Procedure Steps</Label>
              {form.steps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-2">
                  <span className="text-xs text-muted-foreground shrink-0">{i + 1}.</span>
                  <span className="text-sm flex-1">{s.step}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeStep(s.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Step title" value={stepForm.step} onChange={(e) => setStepForm((f) => ({ ...f, step: e.target.value }))} />
                <Input placeholder="Details (optional)" value={stepForm.details} onChange={(e) => setStepForm((f) => ({ ...f, details: e.target.value }))} />
              </div>
              <Button variant="outline" size="sm" onClick={addStep} disabled={!stepForm.step.trim()}><Plus className="h-3 w-3 mr-1" /> Add Step</Button>
            </div>

            <div className="space-y-1.5"><Label>Exceptions</Label><Textarea value={form.exceptions} onChange={(e) => setForm((f) => ({ ...f, exceptions: e.target.value }))} rows={2} /></div>

            <div className="space-y-2">
              <Label>Revision History</Label>
              {form.revisions.map((r) => (
                <div key={r.id} className="text-xs bg-muted/50 rounded-md px-3 py-1.5">v{r.version} - {r.date} by {r.author}: {r.changes}</div>
              ))}
              <div className="grid grid-cols-4 gap-2">
                <Input placeholder="Version" value={revForm.version} onChange={(e) => setRevForm((f) => ({ ...f, version: e.target.value }))} className="text-sm" />
                <Input type="date" value={revForm.date} onChange={(e) => setRevForm((f) => ({ ...f, date: e.target.value }))} className="text-sm" />
                <Input placeholder="Author" value={revForm.author} onChange={(e) => setRevForm((f) => ({ ...f, author: e.target.value }))} className="text-sm" />
                <Input placeholder="Changes" value={revForm.changes} onChange={(e) => setRevForm((f) => ({ ...f, changes: e.target.value }))} className="text-sm" />
              </div>
              <Button variant="outline" size="sm" onClick={addRevision} disabled={!revForm.version.trim()}><Plus className="h-3 w-3 mr-1" /> Add Revision</Button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              <Save className="h-4 w-4 mr-2" /> {editingId ? "Save" : "Create SOP"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
