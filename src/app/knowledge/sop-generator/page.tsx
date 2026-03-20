"use client";

import { useState } from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Download,
  ArrowUp,
  ArrowDown,
  Save,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface SOPStep {
  id: string;
  title: string;
  description: string;
  responsible: string;
  estimatedTime: string;
  tools: string;
}

interface SOP {
  id: string;
  processName: string;
  department: string;
  steps: SOPStep[];
  createdAt: string;
}

function sopToMarkdown(sop: SOP): string {
  let md = `# SOP: ${sop.processName}\n\n`;
  md += `**Department:** ${sop.department}\n`;
  md += `**Created:** ${new Date(sop.createdAt).toLocaleDateString()}\n`;
  md += `**Total Steps:** ${sop.steps.length}\n\n`;
  md += `---\n\n`;
  sop.steps.forEach((step, idx) => {
    md += `## Step ${idx + 1}: ${step.title}\n\n`;
    md += `${step.description}\n\n`;
    if (step.responsible) md += `- **Responsible:** ${step.responsible}\n`;
    if (step.estimatedTime) md += `- **Estimated Time:** ${step.estimatedTime}\n`;
    if (step.tools) md += `- **Tools Needed:** ${step.tools}\n`;
    md += `\n`;
  });
  return md;
}

function sopToPlainText(sop: SOP): string {
  let text = `SOP: ${sop.processName}\n`;
  text += `${"=".repeat(sop.processName.length + 5)}\n\n`;
  text += `Department: ${sop.department}\n`;
  text += `Created: ${new Date(sop.createdAt).toLocaleDateString()}\n`;
  text += `Total Steps: ${sop.steps.length}\n\n`;
  text += `---\n\n`;
  sop.steps.forEach((step, idx) => {
    text += `Step ${idx + 1}: ${step.title}\n`;
    text += `${"-".repeat(step.title.length + 8)}\n\n`;
    text += `${step.description}\n\n`;
    if (step.responsible) text += `  Responsible: ${step.responsible}\n`;
    if (step.estimatedTime) text += `  Estimated Time: ${step.estimatedTime}\n`;
    if (step.tools) text += `  Tools Needed: ${step.tools}\n`;
    text += `\n`;
  });
  return text;
}

const EMPTY_STEP: Omit<SOPStep, "id"> = { title: "", description: "", responsible: "", estimatedTime: "", tools: "" };

export default function SOPGeneratorPage() {
  const [sops, setSOPs, hydrated] = useLocalStorage<SOP[]>("sop-library", []);
  const [processName, setProcessName] = useState("");
  const [department, setDepartment] = useState("");
  const [steps, setSteps] = useState<SOPStep[]>([]);
  const [editingSOPId, setEditingSOPId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function addStep() {
    setSteps((prev) => [...prev, { ...EMPTY_STEP, id: generateId() }]);
  }

  function updateStep(id: string, field: keyof Omit<SOPStep, "id">, value: string) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function moveStep(id: string, direction: "up" | "down") {
    setSteps((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if ((direction === "up" && idx === 0) || (direction === "down" && idx === prev.length - 1)) return prev;
      const newArr = [...prev];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      [newArr[idx], newArr[swapIdx]] = [newArr[swapIdx], newArr[idx]];
      return newArr;
    });
  }

  function handleSave() {
    if (!processName.trim() || steps.length === 0) return;
    const sop: SOP = { id: editingSOPId || generateId(), processName, department, steps, createdAt: new Date().toISOString() };
    if (editingSOPId) {
      setSOPs((prev) => prev.map((s) => (s.id === editingSOPId ? sop : s)));
    } else {
      setSOPs((prev) => [sop, ...prev]);
    }
    resetForm();
  }

  function resetForm() {
    setProcessName("");
    setDepartment("");
    setSteps([]);
    setEditingSOPId(null);
  }

  function loadSOP(sop: SOP) {
    setProcessName(sop.processName);
    setDepartment(sop.department);
    setSteps(sop.steps);
    setEditingSOPId(sop.id);
  }

  function deleteSOP(id: string) {
    setSOPs((prev) => prev.filter((s) => s.id !== id));
    if (editingSOPId === id) resetForm();
  }

  function handleCopy(format: "markdown" | "text") {
    if (!processName.trim() || steps.length === 0) return;
    const sop: SOP = { id: "temp", processName, department, steps, createdAt: new Date().toISOString() };
    const content = format === "markdown" ? sopToMarkdown(sop) : sopToPlainText(sop);
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="SOP Auto-Generator" description="Create standardized operating procedures with step-by-step guides" icon={ClipboardList} badge="Knowledge" replaces="Google Docs / Notion" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Builder */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">SOP Builder</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Process Name *</Label><Input value={processName} onChange={(e) => setProcessName(e.target.value)} placeholder="e.g., Client Onboarding" /></div>
                <div className="space-y-1.5"><Label>Department</Label><Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g., Operations" /></div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label>Steps ({steps.length})</Label>
                <Button variant="outline" size="sm" onClick={addStep}><Plus className="h-3.5 w-3.5 mr-1" />Add Step</Button>
              </div>

              {steps.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No steps yet. Click &quot;Add Step&quot; to begin building your SOP.
                </div>
              ) : (
                <div className="space-y-3">
                  {steps.map((step, idx) => (
                    <div key={step.id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">Step {idx + 1}</Badge>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => moveStep(step.id, "up")} disabled={idx === 0}><ArrowUp className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => moveStep(step.id, "down")} disabled={idx === steps.length - 1}><ArrowDown className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => removeStep(step.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                        </div>
                      </div>
                      <Input value={step.title} onChange={(e) => updateStep(step.id, "title", e.target.value)} placeholder="Step title" />
                      <Textarea value={step.description} onChange={(e) => updateStep(step.id, "description", e.target.value)} placeholder="Step description..." rows={2} />
                      <div className="grid grid-cols-3 gap-2">
                        <Input value={step.responsible} onChange={(e) => updateStep(step.id, "responsible", e.target.value)} placeholder="Responsible" />
                        <Input value={step.estimatedTime} onChange={(e) => updateStep(step.id, "estimatedTime", e.target.value)} placeholder="Est. time" />
                        <Input value={step.tools} onChange={(e) => updateStep(step.id, "tools", e.target.value)} placeholder="Tools needed" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={!processName.trim() || steps.length === 0} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
                  <Save className="h-4 w-4 mr-2" />{editingSOPId ? "Update SOP" : "Save to Library"}
                </Button>
                <Button variant="outline" onClick={() => handleCopy("markdown")} disabled={!processName.trim() || steps.length === 0}>
                  <Copy className="h-4 w-4 mr-2" />{copied ? "Copied!" : "Markdown"}
                </Button>
                <Button variant="outline" onClick={() => handleCopy("text")} disabled={!processName.trim() || steps.length === 0}>
                  <Download className="h-4 w-4 mr-2" />Plain Text
                </Button>
                {editingSOPId && <Button variant="outline" onClick={resetForm}><X className="h-4 w-4 mr-2" />New SOP</Button>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Library */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">SOP Library ({sops.length})</CardTitle></CardHeader>
          <CardContent>
            {sops.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No SOPs saved yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sops.map((sop) => (
                  <div key={sop.id} className="rounded-lg border p-3 hover:bg-muted/50 transition-colors group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => loadSOP(sop)}>
                        <p className="text-sm font-medium truncate">{sop.processName}</p>
                        <p className="text-xs text-muted-foreground">{sop.department || "No department"} &middot; {sop.steps.length} steps</p>
                        <p className="text-xs text-muted-foreground">{new Date(sop.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteSOP(sop.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
