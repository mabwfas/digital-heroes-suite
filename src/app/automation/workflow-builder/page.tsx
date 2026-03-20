"use client";

import { useState } from "react";
import {
  Workflow,
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Power,
  PowerOff,
  Play,
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

type TriggerType = "new-client" | "order-complete" | "deadline-approaching" | "daily-schedule" | "custom";
type ActionType = "send-email" | "create-task" | "update-status" | "notify-team" | "custom";

interface WorkflowStep {
  id: string;
  actionType: ActionType;
  description: string;
  condition: string;
}

interface WorkflowItem {
  id: string;
  name: string;
  trigger: TriggerType;
  triggerDetail: string;
  steps: WorkflowStep[];
  active: boolean;
  createdAt: string;
}

const TRIGGER_LABELS: Record<TriggerType, string> = {
  "new-client": "New Client Added",
  "order-complete": "Order Completed",
  "deadline-approaching": "Deadline Approaching",
  "daily-schedule": "Daily Schedule",
  "custom": "Custom Trigger",
};

const ACTION_LABELS: Record<ActionType, string> = {
  "send-email": "Send Email",
  "create-task": "Create Task",
  "update-status": "Update Status",
  "notify-team": "Notify Team",
  "custom": "Custom Action",
};

export default function WorkflowBuilderPage() {
  const [workflows, setWorkflows, hydrated] = useLocalStorage<WorkflowItem[]>("automation-workflows", []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", trigger: "new-client" as TriggerType, triggerDetail: "", steps: [] as WorkflowStep[] });

  function openAdd() {
    setForm({ name: "", trigger: "new-client", triggerDetail: "", steps: [] });
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(wf: WorkflowItem) {
    setForm({ name: wf.name, trigger: wf.trigger, triggerDetail: wf.triggerDetail, steps: wf.steps });
    setEditingId(wf.id);
    setDialogOpen(true);
  }

  function addStep() {
    setForm((f) => ({ ...f, steps: [...f.steps, { id: generateId(), actionType: "send-email", description: "", condition: "" }] }));
  }

  function updateStep(id: string, field: keyof Omit<WorkflowStep, "id">, value: string) {
    setForm((f) => ({ ...f, steps: f.steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)) }));
  }

  function removeStep(id: string) {
    setForm((f) => ({ ...f, steps: f.steps.filter((s) => s.id !== id) }));
  }

  function moveStep(id: string, dir: "up" | "down") {
    setForm((f) => {
      const idx = f.steps.findIndex((s) => s.id === id);
      if ((dir === "up" && idx === 0) || (dir === "down" && idx === f.steps.length - 1)) return f;
      const arr = [...f.steps];
      const swap = dir === "up" ? idx - 1 : idx + 1;
      [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
      return { ...f, steps: arr };
    });
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editingId) {
      setWorkflows((prev) => prev.map((w) => (w.id === editingId ? { ...w, ...form } : w)));
    } else {
      setWorkflows((prev) => [{ ...form, id: generateId(), active: true, createdAt: new Date().toISOString() }, ...prev]);
    }
    setDialogOpen(false);
  }

  function toggleActive(id: string) {
    setWorkflows((prev) => prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w)));
  }

  function deleteWorkflow(id: string) {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Workflow Automator" description="Build trigger-based workflows to automate repetitive processes" icon={Workflow} badge="Automation" replaces="Zapier / Make" />

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{workflows.filter((w) => w.active).length} active / {workflows.length} total workflows</div>
        <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
          <Plus className="h-4 w-4 mr-2" />New Workflow
        </Button>
      </div>

      {workflows.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center">
          <Workflow className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No workflows yet. Create your first automation!</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {workflows.map((wf) => (
            <Card key={wf.id} className={`border-border/50 ${!wf.active ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{wf.name}</span>
                      <Badge className={wf.active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0" : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-0"}>
                        {wf.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Badge variant="secondary" className="text-xs">Trigger: {TRIGGER_LABELS[wf.trigger]}</Badge>
                      {wf.triggerDetail && <span className="text-xs">({wf.triggerDetail})</span>}
                    </div>

                    {/* Visual step flow */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 px-3 py-1.5 text-xs font-medium">
                        {TRIGGER_LABELS[wf.trigger]}
                      </div>
                      {wf.steps.map((step, idx) => (
                        <div key={step.id} className="flex items-center gap-2">
                          <span className="text-muted-foreground">→</span>
                          <div className="rounded-lg border px-3 py-1.5 text-xs">
                            <span className="font-medium">{ACTION_LABELS[step.actionType]}</span>
                            {step.condition && <span className="text-muted-foreground ml-1">(if: {step.condition})</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => toggleActive(wf.id)}>
                      {wf.active ? <Power className="h-3.5 w-3.5 text-emerald-500" /> : <PowerOff className="h-3.5 w-3.5 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(wf)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => deleteWorkflow(wf.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Workflow" : "New Workflow"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label>Workflow Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g., New Client Setup" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Trigger</Label>
                <Select value={form.trigger} onValueChange={(v) => setForm((f) => ({ ...f, trigger: v as TriggerType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIGGER_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Trigger Detail</Label><Input value={form.triggerDetail} onChange={(e) => setForm((f) => ({ ...f, triggerDetail: e.target.value }))} placeholder="Optional details" /></div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label>Actions ({form.steps.length})</Label>
              <Button variant="outline" size="sm" onClick={addStep}><Plus className="h-3.5 w-3.5 mr-1" />Add Action</Button>
            </div>

            {form.steps.map((step, idx) => (
              <div key={step.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">Action {idx + 1}</Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => moveStep(step.id, "up")} disabled={idx === 0}><ArrowUp className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => moveStep(step.id, "down")} disabled={idx === form.steps.length - 1}><ArrowDown className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => removeStep(step.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                  </div>
                </div>
                <Select value={step.actionType} onValueChange={(v) => { if (v) updateStep(step.id, "actionType", v); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input value={step.description} onChange={(e) => updateStep(step.id, "description", e.target.value)} placeholder="Action description" />
                <Input value={step.condition} onChange={(e) => updateStep(step.id, "condition", e.target.value)} placeholder="Condition (optional, e.g., status = active)" />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">{editingId ? "Save" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
