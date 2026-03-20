"use client";

import { useState, useMemo } from "react";
import { ShieldAlert, Plus, Trash2, Edit2, Check, X, AlertTriangle, CheckCircle2 } from "lucide-react";
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

interface RollbackStep {
  id: string;
  step: string;
  completed: boolean;
}

interface Deployment {
  id: string;
  date: string;
  changes: string;
  themeVersion: string;
  developer: string;
  status: "stable" | "unstable" | "monitoring";
  rollbackSteps: RollbackStep[];
  notes: string;
}

const STATUS_CONFIG = {
  stable: { label: "Stable", className: "bg-emerald-500/10 text-emerald-600 border-0", icon: CheckCircle2 },
  unstable: { label: "Unstable", className: "bg-red-500/10 text-red-600 border-0", icon: AlertTriangle },
  monitoring: { label: "Monitoring", className: "bg-amber-500/10 text-amber-600 border-0", icon: ShieldAlert },
};

const DEFAULT_ROLLBACK_STEPS = [
  "Backup current theme version",
  "Download current theme files",
  "Revert to last stable theme version",
  "Clear CDN/cache",
  "Test critical pages (homepage, product, cart, checkout)",
  "Verify tracking codes and analytics",
  "Check third-party app integrations",
  "Notify stakeholders of rollback",
  "Document issue for post-mortem",
];

export default function KillSwitchPage() {
  const [deployments, setDeployments] = useLocalStorage<Deployment[]>("kill-switch-data", []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    changes: "",
    themeVersion: "",
    developer: "",
    status: "monitoring" as Deployment["status"],
    notes: "",
    rollbackSteps: DEFAULT_ROLLBACK_STEPS.map((s) => ({ id: generateId(), step: s, completed: false })),
  });
  const [newStep, setNewStep] = useState("");

  const stats = useMemo(() => ({
    total: deployments.length,
    stable: deployments.filter((d) => d.status === "stable").length,
    unstable: deployments.filter((d) => d.status === "unstable").length,
    monitoring: deployments.filter((d) => d.status === "monitoring").length,
  }), [deployments]);

  function openAdd() {
    setForm({
      date: new Date().toISOString().split("T")[0],
      changes: "", themeVersion: "", developer: "", status: "monitoring", notes: "",
      rollbackSteps: DEFAULT_ROLLBACK_STEPS.map((s) => ({ id: generateId(), step: s, completed: false })),
    });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(d: Deployment) {
    setForm({ date: d.date, changes: d.changes, themeVersion: d.themeVersion, developer: d.developer, status: d.status, notes: d.notes, rollbackSteps: d.rollbackSteps });
    setEditingId(d.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.changes.trim()) return;
    if (editingId) {
      setDeployments((prev) => prev.map((d) => (d.id === editingId ? { ...d, ...form } : d)));
    } else {
      setDeployments((prev) => [{ ...form, id: generateId() }, ...prev]);
    }
    setShowForm(false);
  }

  function toggleStep(deployId: string, stepId: string) {
    setDeployments((prev) => prev.map((d) => d.id === deployId ? { ...d, rollbackSteps: d.rollbackSteps.map((s) => s.id === stepId ? { ...s, completed: !s.completed } : s) } : d));
  }

  function updateStatus(id: string, status: Deployment["status"]) {
    setDeployments((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)));
  }

  function addStep() {
    if (!newStep.trim()) return;
    setForm((f) => ({ ...f, rollbackSteps: [...f.rollbackSteps, { id: generateId(), step: newStep, completed: false }] }));
    setNewStep("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Rollback Planner"
        description="Log deployments, track stability, and maintain rollback checklists"
        icon={ShieldAlert}
        badge="Shopify Ext"
        replaces="Slack messages / Memory"
        actions={
          <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Log Deployment
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Deploys", value: stats.total, color: "text-violet-600 dark:text-violet-400" },
          { label: "Stable", value: stats.stable, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Unstable", value: stats.unstable, color: "text-red-600 dark:text-red-400" },
          { label: "Monitoring", value: stats.monitoring, color: "text-amber-600 dark:text-amber-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {deployments.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShieldAlert className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground mb-1">No deployments logged</p>
            <p className="text-sm text-muted-foreground/70">Log your first deployment to start tracking</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {deployments.map((d) => {
            const StatusIcon = STATUS_CONFIG[d.status].icon;
            const completedSteps = d.rollbackSteps.filter((s) => s.completed).length;
            return (
              <Card key={d.id} className={`border-border/50 ${d.status === "unstable" ? "border-red-500/30" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge className={STATUS_CONFIG[d.status].className}>
                          <StatusIcon className="h-3 w-3 mr-1" /> {STATUS_CONFIG[d.status].label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{d.date}</span>
                        {d.themeVersion && <Badge variant="secondary" className="text-[10px]">v{d.themeVersion}</Badge>}
                        {d.developer && <span className="text-xs text-muted-foreground">by {d.developer}</span>}
                      </div>
                      <p className="text-sm font-medium mb-2">{d.changes}</p>

                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground font-medium">Rollback Checklist ({completedSteps}/{d.rollbackSteps.length})</p>
                        <div className="grid sm:grid-cols-2 gap-1">
                          {d.rollbackSteps.map((step) => (
                            <button key={step.id} onClick={() => toggleStep(d.id, step.id)} className={`flex items-center gap-2 text-xs p-1.5 rounded-md text-left transition-colors ${step.completed ? "bg-emerald-500/5" : "hover:bg-muted/50"}`}>
                              <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${step.completed ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/30"}`}>
                                {step.completed && <Check className="h-2.5 w-2.5 text-white" />}
                              </div>
                              <span className={step.completed ? "line-through text-muted-foreground" : ""}>{step.step}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <div className="flex gap-1 mb-2">
                        {(["stable", "monitoring", "unstable"] as const).map((s) => (
                          <Button key={s} variant={d.status === s ? "default" : "outline"} size="sm" className="text-[10px] h-6 px-2" onClick={() => updateStatus(d.id, s)}>
                            {s}
                          </Button>
                        ))}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(d)}><Edit2 className="h-3 w-3 mr-1" /> Edit</Button>
                      <Button variant="ghost" size="sm" className="hover:text-destructive" onClick={() => setDeployments((p) => p.filter((x) => x.id !== d.id))}><Trash2 className="h-3 w-3 mr-1" /> Delete</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Deployment" : "Log Deployment"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Theme Version</Label><Input placeholder="e.g., 3.2.1" value={form.themeVersion} onChange={(e) => setForm((f) => ({ ...f, themeVersion: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Developer</Label><Input placeholder="Who deployed?" value={form.developer} onChange={(e) => setForm((f) => ({ ...f, developer: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Changes *</Label><Textarea placeholder="What was changed..." value={form.changes} onChange={(e) => setForm((f) => ({ ...f, changes: e.target.value }))} rows={3} /></div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Deployment["status"] }))}>
                <option value="stable">Stable</option><option value="monitoring">Monitoring</option><option value="unstable">Unstable</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Rollback Steps</Label>
              {form.rollbackSteps.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <span className="flex-1">{s.step}</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setForm((f) => ({ ...f, rollbackSteps: f.rollbackSteps.filter((x) => x.id !== s.id) }))}><X className="h-3 w-3" /></Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input placeholder="Add step..." value={newStep} onChange={(e) => setNewStep(e.target.value)} className="text-sm" />
                <Button variant="outline" size="sm" onClick={addStep} disabled={!newStep.trim()}><Plus className="h-3 w-3" /></Button>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea placeholder="Additional notes..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.changes.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">{editingId ? "Save" : "Log Deployment"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
