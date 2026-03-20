"use client";

import { useState, useMemo } from "react";
import {
  UserMinus,
  Plus,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  User,
  Calendar,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface ChecklistItem {
  id: string;
  task: string;
  category: string;
  completed: boolean;
  notes: string;
}

interface ExitProcess {
  id: string;
  employeeName: string;
  role: string;
  lastDay: string;
  createdAt: string;
  items: ChecklistItem[];
}

const DEFAULT_CHECKLIST: Omit<ChecklistItem, "id">[] = [
  { task: "Knowledge transfer documentation completed", category: "Knowledge Transfer", completed: false, notes: "" },
  { task: "Handover meetings with team scheduled", category: "Knowledge Transfer", completed: false, notes: "" },
  { task: "All project files and documents transferred", category: "Knowledge Transfer", completed: false, notes: "" },
  { task: "GitHub access revoked", category: "Access Revocation", completed: false, notes: "" },
  { task: "Shopify admin access removed", category: "Access Revocation", completed: false, notes: "" },
  { task: "Discord / Slack access removed", category: "Access Revocation", completed: false, notes: "" },
  { task: "Email account deactivated / forwarding set up", category: "Access Revocation", completed: false, notes: "" },
  { task: "Password manager access removed", category: "Access Revocation", completed: false, notes: "" },
  { task: "Company laptop returned", category: "Asset Return", completed: false, notes: "" },
  { task: "Access cards / keys returned", category: "Asset Return", completed: false, notes: "" },
  { task: "Other company equipment returned", category: "Asset Return", completed: false, notes: "" },
  { task: "Final payroll processed", category: "Payroll & Benefits", completed: false, notes: "" },
  { task: "PTO / vacation balance settled", category: "Payroll & Benefits", completed: false, notes: "" },
  { task: "Benefits termination processed", category: "Payroll & Benefits", completed: false, notes: "" },
  { task: "Exit interview conducted", category: "HR Process", completed: false, notes: "" },
  { task: "Reference letter prepared (if applicable)", category: "HR Process", completed: false, notes: "" },
  { task: "Non-compete / NDA reminder sent", category: "HR Process", completed: false, notes: "" },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Knowledge Transfer": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Access Revocation": "bg-red-500/10 text-red-600 dark:text-red-400",
  "Asset Return": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "Payroll & Benefits": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "HR Process": "bg-pink-500/10 text-pink-600 dark:text-pink-400",
};

export default function ExitChecklistPage() {
  const [processes, setProcesses] = useLocalStorage<ExitProcess[]>("hr-ext-exit-checklist", []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employeeName: "", role: "", lastDay: "" });

  function openCreate() {
    setForm({ employeeName: "", role: "", lastDay: "" });
    setDialogOpen(true);
  }

  function save() {
    if (!form.employeeName.trim()) return;
    setProcesses((prev) => [
      {
        id: generateId(),
        employeeName: form.employeeName.trim(),
        role: form.role.trim(),
        lastDay: form.lastDay,
        createdAt: new Date().toISOString(),
        items: DEFAULT_CHECKLIST.map((item) => ({ ...item, id: generateId() })),
      },
      ...prev,
    ]);
    setDialogOpen(false);
  }

  function deleteProcess(id: string) {
    setProcesses((prev) => prev.filter((p) => p.id !== id));
  }

  function toggleItem(processId: string, itemId: string) {
    setProcesses((prev) =>
      prev.map((p) =>
        p.id === processId
          ? { ...p, items: p.items.map((i) => i.id === itemId ? { ...i, completed: !i.completed } : i) }
          : p
      )
    );
  }

  function updateItemNote(processId: string, itemId: string, notes: string) {
    setProcesses((prev) =>
      prev.map((p) =>
        p.id === processId
          ? { ...p, items: p.items.map((i) => i.id === itemId ? { ...i, notes } : i) }
          : p
      )
    );
  }

  function exportReport(process: ExitProcess) {
    const done = process.items.filter((i) => i.completed).length;
    const total = process.items.length;
    let report = `EXIT REPORT\n${"=".repeat(40)}\nEmployee: ${process.employeeName}\nRole: ${process.role}\nLast Day: ${process.lastDay ? new Date(process.lastDay + "T12:00:00").toLocaleDateString() : "TBD"}\nProgress: ${done}/${total} (${Math.round((done / total) * 100)}%)\n\n`;
    const categories = [...new Set(process.items.map((i) => i.category))];
    categories.forEach((cat) => {
      report += `${cat}\n${"-".repeat(30)}\n`;
      process.items.filter((i) => i.category === cat).forEach((i) => {
        report += `[${i.completed ? "X" : " "}] ${i.task}${i.notes ? ` — ${i.notes}` : ""}\n`;
      });
      report += "\n";
    });
    navigator.clipboard.writeText(report);
  }

  const activeCount = processes.filter((p) => p.items.some((i) => !i.completed)).length;
  const completedCount = processes.filter((p) => p.items.every((i) => i.completed)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Exit Checklist"
        description="Track offboarding tasks for departing employees"
        icon={UserMinus}
        badge="HR Extended"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Exits", value: processes.length, color: "text-violet-600 dark:text-violet-400" },
          { label: "In Progress", value: activeCount, color: "text-amber-600 dark:text-amber-400" },
          { label: "Completed", value: completedCount, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Checklist Items", value: DEFAULT_CHECKLIST.length, color: "text-pink-600 dark:text-pink-400" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground mt-0.5">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">
          <Plus className="h-3.5 w-3.5 mr-1.5" />New Exit Process
        </Button>
      </div>

      <div className="space-y-3">
        {processes.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-16 text-center"><UserMinus className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" /><p className="text-sm text-muted-foreground">No exit processes. Start one when an employee departs.</p><Button variant="outline" className="mt-4" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Exit Process</Button></CardContent></Card>
        ) : (
          processes.map((process) => {
            const done = process.items.filter((i) => i.completed).length;
            const total = process.items.length;
            const pct = Math.round((done / total) * 100);
            const allDone = done === total;
            const isExpanded = expandedId === process.id;
            const categories = [...new Set(process.items.map((i) => i.category))];

            return (
              <Card key={process.id} className={`overflow-hidden transition-colors ${allDone ? "border-emerald-500/30" : "hover:border-violet-500/30"}`}>
                <button className="w-full text-left" onClick={() => setExpandedId(isExpanded ? null : process.id)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center shrink-0"><User className="h-5 w-5 text-violet-500" /></div>
                        <div>
                          <div className="flex items-center gap-2"><CardTitle className="text-base">{process.employeeName}</CardTitle>{allDone && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-0"><Check className="h-3 w-3 mr-1" />Complete</Badge>}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {process.role && <Badge variant="secondary" className="text-[10px]">{process.role}</Badge>}
                            {process.lastDay && <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Last day: {new Date(process.lastDay + "T12:00:00").toLocaleDateString()}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right"><p className="text-sm font-semibold">{pct}%</p><p className="text-[10px] text-muted-foreground">{done}/{total}</p></div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); exportReport(process); }}><Copy className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={(e) => { e.stopPropagation(); deleteProcess(process.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                    <Progress value={pct} className="h-1.5 mt-2" />
                  </CardHeader>
                </button>
                {isExpanded && (
                  <CardContent className="pt-0 pb-5 px-5">
                    <Separator className="mb-4" />
                    {categories.map((cat) => (
                      <div key={cat} className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`text-[10px] border-0 ${CATEGORY_COLORS[cat] || "bg-muted text-muted-foreground"}`}>{cat}</Badge>
                          <span className="text-[10px] text-muted-foreground">{process.items.filter((i) => i.category === cat && i.completed).length}/{process.items.filter((i) => i.category === cat).length}</span>
                        </div>
                        <div className="space-y-2">
                          {process.items.filter((i) => i.category === cat).map((item) => (
                            <div key={item.id} className={`rounded-lg px-3 py-2.5 transition-colors ${item.completed ? "bg-emerald-500/5" : "bg-muted/30"}`}>
                              <div className="flex items-center gap-3">
                                <button onClick={() => toggleItem(process.id, item.id)} className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${item.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/30 hover:border-violet-500"}`}>
                                  {item.completed && <Check className="h-3 w-3" />}
                                </button>
                                <span className={`text-sm flex-1 ${item.completed ? "line-through text-muted-foreground" : ""}`}>{item.task}</span>
                              </div>
                              <div className="ml-8 mt-1">
                                <Input
                                  value={item.notes}
                                  onChange={(e) => updateItemNote(process.id, item.id, e.target.value)}
                                  placeholder="Add notes..."
                                  className="h-7 text-xs bg-transparent border-0 border-b border-border/30 rounded-none px-0 focus-visible:ring-0 focus-visible:border-violet-500"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Exit Process</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Employee Name *</Label><Input value={form.employeeName} onChange={(e) => setForm((f) => ({ ...f, employeeName: e.target.value }))} placeholder="Employee name" className="mt-1" /></div>
            <div><Label>Role</Label><Input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="e.g. Frontend Developer" className="mt-1" /></div>
            <div><Label>Last Working Day</Label><Input type="date" value={form.lastDay} onChange={(e) => setForm((f) => ({ ...f, lastDay: e.target.value }))} className="mt-1" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.employeeName.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">Start Exit Process</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
