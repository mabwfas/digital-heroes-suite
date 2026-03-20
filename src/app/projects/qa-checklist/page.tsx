"use client";

import { useState, useMemo } from "react";
import {
  CheckSquare,
  Plus,
  Trash2,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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

type ProjectType = "Shopify Store" | "Theme" | "App" | "Landing Page";

interface QAItem {
  id: string;
  task: string;
  category: string;
  checked: boolean;
  notes: string;
}

interface QAChecklist {
  id: string;
  projectName: string;
  projectType: ProjectType;
  items: QAItem[];
  createdAt: string;
}

const QA_ITEMS: Record<ProjectType, Omit<QAItem, "id" | "checked" | "notes">[]> = {
  "Shopify Store": [
    { task: "Homepage loads correctly on all devices", category: "Functionality" },
    { task: "Product pages display correct pricing and variants", category: "Functionality" },
    { task: "Add to cart and checkout flow works", category: "Functionality" },
    { task: "Collection filtering and sorting works", category: "Functionality" },
    { task: "Search returns relevant results", category: "Functionality" },
    { task: "All navigation links work correctly", category: "Navigation" },
    { task: "Footer links and pages accessible", category: "Navigation" },
    { task: "Mobile menu opens and closes properly", category: "Navigation" },
    { task: "Images optimized (WebP, lazy loading)", category: "Performance" },
    { task: "Page load time under 3 seconds", category: "Performance" },
    { task: "No console errors in browser", category: "Performance" },
    { task: "Responsive on mobile (375px+)", category: "Responsive" },
    { task: "Responsive on tablet (768px+)", category: "Responsive" },
    { task: "Responsive on desktop (1280px+)", category: "Responsive" },
    { task: "SSL certificate active", category: "Security" },
    { task: "Payment gateway tested (test mode)", category: "Security" },
    { task: "Meta titles and descriptions set", category: "SEO" },
    { task: "Alt tags on all images", category: "SEO" },
    { task: "Sitemap submitted", category: "SEO" },
    { task: "Google Analytics / tracking installed", category: "Analytics" },
    { task: "Facebook Pixel configured", category: "Analytics" },
  ],
  Theme: [
    { task: "All sections render correctly", category: "Functionality" },
    { task: "Section settings work in customizer", category: "Functionality" },
    { task: "Color scheme changes apply globally", category: "Functionality" },
    { task: "Typography settings apply correctly", category: "Functionality" },
    { task: "Responsive on all breakpoints", category: "Responsive" },
    { task: "Cross-browser testing (Chrome, Safari, Firefox)", category: "Compatibility" },
    { task: "No Liquid errors in theme editor", category: "Code Quality" },
    { task: "CSS organized and minimal", category: "Code Quality" },
    { task: "JavaScript has no errors", category: "Code Quality" },
    { task: "Accessibility standards met (WCAG 2.1)", category: "Accessibility" },
    { task: "Keyboard navigation works", category: "Accessibility" },
    { task: "Performance score 90+ on Lighthouse", category: "Performance" },
  ],
  App: [
    { task: "App installs without errors", category: "Installation" },
    { task: "OAuth flow completes successfully", category: "Installation" },
    { task: "App UI matches design specs", category: "UI/UX" },
    { task: "All CRUD operations work", category: "Functionality" },
    { task: "API rate limits handled gracefully", category: "Functionality" },
    { task: "Error states display helpful messages", category: "Error Handling" },
    { task: "Loading states shown appropriately", category: "UI/UX" },
    { task: "Webhook endpoints respond correctly", category: "Integration" },
    { task: "Data syncs between app and Shopify", category: "Integration" },
    { task: "Uninstall cleans up data properly", category: "Lifecycle" },
    { task: "Billing / charges work correctly", category: "Billing" },
    { task: "App listing screenshots current", category: "Submission" },
  ],
  "Landing Page": [
    { task: "Hero section displays correctly", category: "Design" },
    { task: "All CTAs are clickable and linked", category: "Functionality" },
    { task: "Forms submit and validate properly", category: "Functionality" },
    { task: "Images and videos load correctly", category: "Content" },
    { task: "Copy is proofread and accurate", category: "Content" },
    { task: "Responsive on mobile devices", category: "Responsive" },
    { task: "Page loads under 2 seconds", category: "Performance" },
    { task: "Tracking pixels installed", category: "Analytics" },
    { task: "A/B test variants configured", category: "Analytics" },
    { task: "Social share meta tags set", category: "SEO" },
    { task: "Favicon and OG image set", category: "SEO" },
  ],
};

export default function QAChecklistPage() {
  const [checklists, setChecklists] = useLocalStorage<QAChecklist[]>("projects-qa-checklist", []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ projectName: "", projectType: "Shopify Store" as ProjectType });

  function openCreate() {
    setForm({ projectName: "", projectType: "Shopify Store" });
    setDialogOpen(true);
  }

  function save() {
    if (!form.projectName.trim()) return;
    const items = QA_ITEMS[form.projectType].map((item) => ({ ...item, id: generateId(), checked: false, notes: "" }));
    setChecklists((prev) => [
      { id: generateId(), projectName: form.projectName.trim(), projectType: form.projectType, items, createdAt: new Date().toISOString() },
      ...prev,
    ]);
    setDialogOpen(false);
  }

  function deleteChecklist(id: string) {
    setChecklists((prev) => prev.filter((c) => c.id !== id));
  }

  function toggleItem(checklistId: string, itemId: string) {
    setChecklists((prev) =>
      prev.map((c) =>
        c.id === checklistId
          ? { ...c, items: c.items.map((i) => i.id === itemId ? { ...i, checked: !i.checked } : i) }
          : c
      )
    );
  }

  function updateNote(checklistId: string, itemId: string, notes: string) {
    setChecklists((prev) =>
      prev.map((c) =>
        c.id === checklistId
          ? { ...c, items: c.items.map((i) => i.id === itemId ? { ...i, notes } : i) }
          : c
      )
    );
  }

  function exportReport(cl: QAChecklist) {
    const done = cl.items.filter((i) => i.checked).length;
    const total = cl.items.length;
    let report = `QA REPORT: ${cl.projectName}\n${"=".repeat(40)}\nType: ${cl.projectType}\nDate: ${new Date().toLocaleDateString()}\nProgress: ${done}/${total} (${Math.round((done / total) * 100)}%)\n\n`;
    const cats = [...new Set(cl.items.map((i) => i.category))];
    cats.forEach((cat) => {
      report += `${cat}\n${"-".repeat(30)}\n`;
      cl.items.filter((i) => i.category === cat).forEach((i) => {
        report += `[${i.checked ? "PASS" : "FAIL"}] ${i.task}${i.notes ? ` — ${i.notes}` : ""}\n`;
      });
      report += "\n";
    });
    navigator.clipboard.writeText(report);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="QA Checklist Generator"
        description="Auto-generate QA checklists based on project type"
        icon={CheckSquare}
        badge="Projects"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Checklists", value: checklists.length, color: "text-violet-600 dark:text-violet-400" },
          { label: "Complete", value: checklists.filter((c) => c.items.every((i) => i.checked)).length, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "In Progress", value: checklists.filter((c) => c.items.some((i) => i.checked) && !c.items.every((i) => i.checked)).length, color: "text-blue-600 dark:text-blue-400" },
          { label: "Avg Completion", value: checklists.length > 0 ? `${Math.round(checklists.reduce((s, c) => s + (c.items.filter((i) => i.checked).length / c.items.length) * 100, 0) / checklists.length)}%` : "---", color: "text-pink-600 dark:text-pink-400" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground mt-0.5">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">
          <Plus className="h-3.5 w-3.5 mr-1.5" />New QA Checklist
        </Button>
      </div>

      <div className="space-y-3">
        {checklists.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-16 text-center"><CheckSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" /><p className="text-sm text-muted-foreground">No QA checklists yet. Generate one for your project.</p><Button variant="outline" className="mt-4" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Generate Checklist</Button></CardContent></Card>
        ) : (
          checklists.map((cl) => {
            const done = cl.items.filter((i) => i.checked).length;
            const total = cl.items.length;
            const pct = Math.round((done / total) * 100);
            const allDone = done === total;
            const isExpanded = expandedId === cl.id;
            const categories = [...new Set(cl.items.map((i) => i.category))];

            return (
              <Card key={cl.id} className={`overflow-hidden transition-colors ${allDone ? "border-emerald-500/30" : "hover:border-violet-500/30"}`}>
                <button className="w-full text-left" onClick={() => setExpandedId(isExpanded ? null : cl.id)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center shrink-0"><CheckSquare className="h-4 w-4 text-violet-500" /></div>
                        <div>
                          <div className="flex items-center gap-2"><CardTitle className="text-base">{cl.projectName}</CardTitle>{allDone && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-0"><Check className="h-3 w-3 mr-1" />All Passed</Badge>}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-[10px]">{cl.projectType}</Badge>
                            <span className="text-xs text-muted-foreground">{done}/{total} items</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold">{pct}%</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); exportReport(cl); }}><Copy className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={(e) => { e.stopPropagation(); deleteChecklist(cl.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
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
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{cat}</p>
                          <span className="text-[10px] text-muted-foreground">{cl.items.filter((i) => i.category === cat && i.checked).length}/{cl.items.filter((i) => i.category === cat).length}</span>
                        </div>
                        <div className="space-y-2">
                          {cl.items.filter((i) => i.category === cat).map((item) => (
                            <div key={item.id} className={`rounded-lg px-3 py-2.5 transition-colors ${item.checked ? "bg-emerald-500/5" : "bg-muted/30"}`}>
                              <div className="flex items-center gap-3">
                                <button onClick={() => toggleItem(cl.id, item.id)} className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${item.checked ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/30 hover:border-violet-500"}`}>
                                  {item.checked && <Check className="h-3 w-3" />}
                                </button>
                                <span className={`text-sm flex-1 ${item.checked ? "line-through text-muted-foreground" : ""}`}>{item.task}</span>
                              </div>
                              <div className="ml-8 mt-1">
                                <Input
                                  value={item.notes}
                                  onChange={(e) => updateNote(cl.id, item.id, e.target.value)}
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
          <DialogHeader><DialogTitle>Generate QA Checklist</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Project Name *</Label><Input value={form.projectName} onChange={(e) => setForm((f) => ({ ...f, projectName: e.target.value }))} placeholder="Project name" className="mt-1" /></div>
            <div>
              <Label>Project Type</Label>
              <Select value={form.projectType} onValueChange={(v) => setForm((f) => ({ ...f, projectType: v as ProjectType }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Shopify Store">Shopify Store</SelectItem>
                  <SelectItem value="Theme">Theme</SelectItem>
                  <SelectItem value="App">App</SelectItem>
                  <SelectItem value="Landing Page">Landing Page</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">{QA_ITEMS[form.projectType].length} items will be generated</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.projectName.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">Generate Checklist</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
