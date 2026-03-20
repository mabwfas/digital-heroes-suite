"use client";

import { useState, useMemo } from "react";
import {
  LogOut,
  Plus,
  Trash2,
  Search,
  Check,
  Copy,
  CheckCircle,
  Circle,
  FileText,
  Shield,
  HardDrive,
  MessageSquare,
  Award,
  Package,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  notes: string;
  icon: string;
}

interface ClientOffboarding {
  id: string;
  clientName: string;
  reason: string;
  checklist: ChecklistItem[];
  startDate: string;
  completedDate: string;
  createdAt: string;
}

const DEFAULT_CHECKLIST: Omit<ChecklistItem, "id">[] = [
  { label: "Final Delivery", description: "Deliver all remaining project files and assets to the client", completed: false, notes: "", icon: "package" },
  { label: "Documentation Handoff", description: "Provide complete documentation including passwords, guides, and SOPs", completed: false, notes: "", icon: "file" },
  { label: "Access Revocation", description: "Remove client access from all internal tools, repos, and systems", completed: false, notes: "", icon: "shield" },
  { label: "Backup Creation", description: "Create final backups of all project files, databases, and configurations", completed: false, notes: "", icon: "drive" },
  { label: "Feedback Request", description: "Send feedback/review request survey to the client", completed: false, notes: "", icon: "message" },
  { label: "Testimonial Request", description: "Ask the client for a testimonial or case study permission", completed: false, notes: "", icon: "award" },
];

const ICON_MAP: Record<string, typeof Package> = {
  package: Package,
  file: FileText,
  shield: Shield,
  drive: HardDrive,
  message: MessageSquare,
  award: Award,
};

export default function OffboardingPage() {
  const [offboardings, setOffboardings] = useLocalStorage<ClientOffboarding[]>("client-offboarding", []);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formClient, setFormClient] = useState("");
  const [formReason, setFormReason] = useState("");
  const [showExport, setShowExport] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return offboardings.filter((o) => o.clientName.toLowerCase().includes(search.toLowerCase()));
  }, [offboardings, search]);

  const stats = useMemo(() => ({
    total: offboardings.length,
    inProgress: offboardings.filter((o) => !o.completedDate && o.checklist.some((c) => !c.completed)).length,
    completed: offboardings.filter((o) => o.checklist.every((c) => c.completed)).length,
  }), [offboardings]);

  function createOffboarding() {
    if (!formClient.trim()) return;
    const offboarding: ClientOffboarding = {
      id: generateId(),
      clientName: formClient,
      reason: formReason,
      checklist: DEFAULT_CHECKLIST.map((item) => ({ ...item, id: generateId() })),
      startDate: new Date().toISOString(),
      completedDate: "",
      createdAt: new Date().toISOString(),
    };
    setOffboardings((prev) => [offboarding, ...prev]);
    setShowForm(false);
    setFormClient("");
    setFormReason("");
  }

  function toggleItem(offboardingId: string, itemId: string) {
    setOffboardings((prev) =>
      prev.map((o) => {
        if (o.id !== offboardingId) return o;
        const updated = {
          ...o,
          checklist: o.checklist.map((c) => (c.id === itemId ? { ...c, completed: !c.completed } : c)),
        };
        const allDone = updated.checklist.every((c) => c.completed);
        return { ...updated, completedDate: allDone ? new Date().toISOString() : "" };
      })
    );
  }

  function updateItemNotes(offboardingId: string, itemId: string, notes: string) {
    setOffboardings((prev) =>
      prev.map((o) =>
        o.id === offboardingId
          ? { ...o, checklist: o.checklist.map((c) => (c.id === itemId ? { ...c, notes } : c)) }
          : o
      )
    );
  }

  function handleDelete(id: string) {
    setOffboardings((prev) => prev.filter((o) => o.id !== id));
  }

  function generateExportText(o: ClientOffboarding): string {
    let text = `OFFBOARDING SUMMARY - ${o.clientName}\n`;
    text += `${"=".repeat(50)}\n`;
    text += `Reason: ${o.reason || "Not specified"}\n`;
    text += `Started: ${new Date(o.startDate).toLocaleDateString()}\n`;
    text += `Status: ${o.checklist.every((c) => c.completed) ? "COMPLETED" : "IN PROGRESS"}\n\n`;

    text += `CHECKLIST\n`;
    text += `${"-".repeat(30)}\n`;
    o.checklist.forEach((item) => {
      text += `[${item.completed ? "X" : " "}] ${item.label}\n`;
      text += `    ${item.description}\n`;
      if (item.notes) text += `    Notes: ${item.notes}\n`;
      text += "\n";
    });

    const completed = o.checklist.filter((c) => c.completed).length;
    text += `\nProgress: ${completed}/${o.checklist.length} (${Math.round((completed / o.checklist.length) * 100)}%)\n`;
    text += `Generated: ${new Date().toLocaleDateString()}`;
    return text;
  }

  function copyExport(o: ClientOffboarding) {
    navigator.clipboard.writeText(generateExportText(o));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Offboarding Checklist"
        description="Ensure smooth client transitions with structured offboarding"
        icon={LogOut}
        badge="Offboarding"
        replaces="Notion / Asana"
        actions={
          <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Start Offboarding
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-violet-600 dark:text-violet-400" },
          { label: "In Progress", value: stats.inProgress, color: "text-amber-600 dark:text-amber-400" },
          { label: "Completed", value: stats.completed, color: "text-emerald-600 dark:text-emerald-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Offboarding List */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center mb-4">
              <LogOut className="h-7 w-7 text-violet-400" />
            </div>
            <p className="font-medium text-muted-foreground mb-1">No offboarding processes</p>
            <p className="text-sm text-muted-foreground/70">Start an offboarding checklist when a client project ends</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((offboarding) => {
            const completed = offboarding.checklist.filter((c) => c.completed).length;
            const total = offboarding.checklist.length;
            const progress = Math.round((completed / total) * 100);
            const isComplete = completed === total;

            return (
              <Card key={offboarding.id} className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isComplete ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
                        {isComplete ? <CheckCircle className="h-5 w-5 text-emerald-500" /> : <LogOut className="h-5 w-5 text-amber-500" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{offboarding.clientName}</CardTitle>
                          <Badge className={isComplete ? "bg-emerald-500/10 text-emerald-600 border-0" : "bg-amber-500/10 text-amber-600 border-0"}>
                            {isComplete ? "Completed" : "In Progress"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>Started {new Date(offboarding.startDate).toLocaleDateString()}</span>
                          {offboarding.reason && <span>Reason: {offboarding.reason}</span>}
                          <span>{completed}/{total} tasks</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setShowExport(showExport === offboarding.id ? null : offboarding.id)}>
                        <Copy className="h-3.5 w-3.5 mr-1" /> Export
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(offboarding.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isComplete ? "bg-emerald-500" : "bg-gradient-to-r from-violet-500 to-pink-500"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{progress}%</span>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Checklist */}
                  <div className="space-y-2">
                    {offboarding.checklist.map((item) => {
                      const ItemIcon = ICON_MAP[item.icon] || Circle;
                      return (
                        <div key={item.id} className={`rounded-lg border p-3 transition-colors ${item.completed ? "border-emerald-500/20 bg-emerald-500/[0.02]" : "border-border/50"}`}>
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggleItem(offboarding.id, item.id)}
                              className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                item.completed ? "bg-emerald-600 border-emerald-600" : "border-muted-foreground/30 hover:border-violet-500"
                              }`}
                            >
                              {item.completed && <Check className="h-3 w-3 text-white" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <ItemIcon className={`h-3.5 w-3.5 ${item.completed ? "text-emerald-500" : "text-muted-foreground"}`} />
                                <span className={`text-sm font-medium ${item.completed ? "line-through text-muted-foreground" : ""}`}>{item.label}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                              <div className="mt-2">
                                <Input
                                  value={item.notes}
                                  onChange={(e) => updateItemNotes(offboarding.id, item.id, e.target.value)}
                                  placeholder="Add notes..."
                                  className="h-7 text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Export Preview */}
                  {showExport === offboarding.id && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-medium text-muted-foreground">Export Preview</p>
                        <Button variant="outline" size="sm" onClick={() => copyExport(offboarding)} className="h-6 text-[10px]">
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                      </div>
                      <pre className="text-xs whitespace-pre-wrap bg-muted/30 rounded-lg p-4 font-sans max-h-60 overflow-y-auto">
                        {generateExportText(offboarding)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Offboarding Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start Client Offboarding</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Client Name *</Label>
              <Input value={formClient} onChange={(e) => setFormClient(e.target.value)} placeholder="Client name" />
            </div>
            <div className="space-y-1.5">
              <Label>Reason for Offboarding</Label>
              <Textarea rows={2} value={formReason} onChange={(e) => setFormReason(e.target.value)} placeholder="e.g. Project completed, contract ended..." />
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs font-medium mb-2">Default Checklist Items:</p>
              <div className="space-y-1">
                {DEFAULT_CHECKLIST.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Circle className="h-3 w-3" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={createOffboarding} disabled={!formClient.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              Start Offboarding
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
