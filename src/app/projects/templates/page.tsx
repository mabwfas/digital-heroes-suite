"use client";

import { useState, useMemo } from "react";
import {
  LayoutTemplate,
  Plus,
  Trash2,
  Copy,
  Pencil,
  ChevronDown,
  ChevronUp,
  Clock,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface TemplateTask {
  id: string;
  name: string;
  estimatedHours: number;
  dependencies: string;
}

interface TemplatePhase {
  id: string;
  name: string;
  tasks: TemplateTask[];
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  phases: TemplatePhase[];
  createdAt: string;
}

interface ClonedProject {
  id: string;
  name: string;
  templateName: string;
  phases: TemplatePhase[];
  createdAt: string;
}

const DEFAULT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "tpl-shopify-store", name: "Shopify Store Build", description: "Full store setup from scratch", createdAt: new Date().toISOString(),
    phases: [
      { id: generateId(), name: "Discovery & Planning", tasks: [
        { id: generateId(), name: "Client requirements gathering", estimatedHours: 4, dependencies: "" },
        { id: generateId(), name: "Competitor analysis", estimatedHours: 3, dependencies: "" },
        { id: generateId(), name: "Site architecture planning", estimatedHours: 4, dependencies: "" },
      ]},
      { id: generateId(), name: "Design", tasks: [
        { id: generateId(), name: "Homepage design", estimatedHours: 8, dependencies: "Discovery" },
        { id: generateId(), name: "Product page design", estimatedHours: 6, dependencies: "Homepage" },
        { id: generateId(), name: "Collection & cart pages", estimatedHours: 6, dependencies: "" },
      ]},
      { id: generateId(), name: "Development", tasks: [
        { id: generateId(), name: "Theme setup and configuration", estimatedHours: 4, dependencies: "Design" },
        { id: generateId(), name: "Custom sections development", estimatedHours: 16, dependencies: "" },
        { id: generateId(), name: "App integrations", estimatedHours: 8, dependencies: "" },
      ]},
      { id: generateId(), name: "Launch", tasks: [
        { id: generateId(), name: "QA testing", estimatedHours: 6, dependencies: "Development" },
        { id: generateId(), name: "Content migration", estimatedHours: 8, dependencies: "" },
        { id: generateId(), name: "Go-live and monitoring", estimatedHours: 4, dependencies: "QA" },
      ]},
    ],
  },
  {
    id: "tpl-theme-custom", name: "Theme Customization", description: "Customize existing Shopify theme", createdAt: new Date().toISOString(),
    phases: [
      { id: generateId(), name: "Audit", tasks: [
        { id: generateId(), name: "Current theme review", estimatedHours: 3, dependencies: "" },
        { id: generateId(), name: "Change requirements documentation", estimatedHours: 2, dependencies: "" },
      ]},
      { id: generateId(), name: "Implementation", tasks: [
        { id: generateId(), name: "CSS/layout modifications", estimatedHours: 8, dependencies: "Audit" },
        { id: generateId(), name: "New section development", estimatedHours: 12, dependencies: "" },
        { id: generateId(), name: "Mobile optimization", estimatedHours: 4, dependencies: "" },
      ]},
      { id: generateId(), name: "Testing & Delivery", tasks: [
        { id: generateId(), name: "Cross-browser testing", estimatedHours: 3, dependencies: "Implementation" },
        { id: generateId(), name: "Client review and revisions", estimatedHours: 4, dependencies: "" },
      ]},
    ],
  },
  {
    id: "tpl-speed-opt", name: "Speed Optimization", description: "Optimize store performance and load times", createdAt: new Date().toISOString(),
    phases: [
      { id: generateId(), name: "Analysis", tasks: [
        { id: generateId(), name: "Performance audit", estimatedHours: 3, dependencies: "" },
        { id: generateId(), name: "Bottleneck identification", estimatedHours: 2, dependencies: "" },
      ]},
      { id: generateId(), name: "Optimization", tasks: [
        { id: generateId(), name: "Image optimization", estimatedHours: 4, dependencies: "Analysis" },
        { id: generateId(), name: "Code minification & cleanup", estimatedHours: 6, dependencies: "" },
        { id: generateId(), name: "Lazy loading implementation", estimatedHours: 3, dependencies: "" },
        { id: generateId(), name: "App audit & removal", estimatedHours: 3, dependencies: "" },
      ]},
      { id: generateId(), name: "Verification", tasks: [
        { id: generateId(), name: "Performance re-testing", estimatedHours: 2, dependencies: "Optimization" },
        { id: generateId(), name: "Report generation", estimatedHours: 2, dependencies: "" },
      ]},
    ],
  },
  {
    id: "tpl-seo-audit", name: "SEO Audit", description: "Comprehensive SEO review and optimization", createdAt: new Date().toISOString(),
    phases: [
      { id: generateId(), name: "Technical SEO", tasks: [
        { id: generateId(), name: "Crawlability audit", estimatedHours: 3, dependencies: "" },
        { id: generateId(), name: "Schema markup review", estimatedHours: 2, dependencies: "" },
        { id: generateId(), name: "Site speed analysis", estimatedHours: 2, dependencies: "" },
      ]},
      { id: generateId(), name: "On-page SEO", tasks: [
        { id: generateId(), name: "Meta tags optimization", estimatedHours: 4, dependencies: "Technical SEO" },
        { id: generateId(), name: "Content gap analysis", estimatedHours: 3, dependencies: "" },
        { id: generateId(), name: "Internal linking strategy", estimatedHours: 3, dependencies: "" },
      ]},
      { id: generateId(), name: "Reporting", tasks: [
        { id: generateId(), name: "SEO report compilation", estimatedHours: 4, dependencies: "On-page SEO" },
        { id: generateId(), name: "Action plan creation", estimatedHours: 3, dependencies: "" },
      ]},
    ],
  },
  {
    id: "tpl-app-integration", name: "App Integration", description: "Third-party app setup and integration", createdAt: new Date().toISOString(),
    phases: [
      { id: generateId(), name: "Planning", tasks: [
        { id: generateId(), name: "Requirements analysis", estimatedHours: 2, dependencies: "" },
        { id: generateId(), name: "App selection and evaluation", estimatedHours: 3, dependencies: "" },
      ]},
      { id: generateId(), name: "Setup", tasks: [
        { id: generateId(), name: "App installation and config", estimatedHours: 4, dependencies: "Planning" },
        { id: generateId(), name: "Custom integration code", estimatedHours: 8, dependencies: "" },
        { id: generateId(), name: "Data migration (if needed)", estimatedHours: 4, dependencies: "" },
      ]},
      { id: generateId(), name: "Validation", tasks: [
        { id: generateId(), name: "Integration testing", estimatedHours: 3, dependencies: "Setup" },
        { id: generateId(), name: "Documentation", estimatedHours: 2, dependencies: "" },
      ]},
    ],
  },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useLocalStorage<ProjectTemplate[]>("projects-templates", DEFAULT_TEMPLATES);
  const [cloned, setCloned] = useLocalStorage<ClonedProject[]>("projects-cloned", []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [formPhases, setFormPhases] = useState<TemplatePhase[]>([]);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [newTask, setNewTask] = useState({ phaseId: "", name: "", hours: 0, deps: "" });

  function openCreate() {
    setForm({ name: "", description: "" });
    setFormPhases([]);
    setDialogOpen(true);
  }

  function addPhase() {
    if (!newPhaseName.trim()) return;
    setFormPhases((prev) => [...prev, { id: generateId(), name: newPhaseName.trim(), tasks: [] }]);
    setNewPhaseName("");
  }

  function addTask(phaseId: string) {
    if (!newTask.name.trim()) return;
    setFormPhases((prev) =>
      prev.map((p) =>
        p.id === phaseId
          ? { ...p, tasks: [...p.tasks, { id: generateId(), name: newTask.name.trim(), estimatedHours: newTask.hours, dependencies: newTask.deps }] }
          : p
      )
    );
    setNewTask({ phaseId: "", name: "", hours: 0, deps: "" });
  }

  function saveTemplate() {
    if (!form.name.trim()) return;
    setTemplates((prev) => [...prev, { id: generateId(), name: form.name.trim(), description: form.description.trim(), phases: formPhases, createdAt: new Date().toISOString() }]);
    setDialogOpen(false);
  }

  function deleteTemplate(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  function cloneTemplate(t: ProjectTemplate) {
    const clonedPhases = t.phases.map((p) => ({
      ...p,
      id: generateId(),
      tasks: p.tasks.map((task) => ({ ...task, id: generateId() })),
    }));
    setCloned((prev) => [
      { id: generateId(), name: `${t.name} - ${new Date().toLocaleDateString()}`, templateName: t.name, phases: clonedPhases, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }

  function deleteCloned(id: string) {
    setCloned((prev) => prev.filter((c) => c.id !== id));
  }

  function totalHours(phases: TemplatePhase[]) {
    return phases.reduce((sum, p) => sum + p.tasks.reduce((s, t) => s + t.estimatedHours, 0), 0);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Template Library"
        description="Pre-built project templates to quickly start new projects"
        icon={LayoutTemplate}
        badge="Projects"
        replaces="Notion Templates / Asana"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Templates", value: templates.length, color: "text-violet-600 dark:text-violet-400" },
          { label: "Active Projects", value: cloned.length, color: "text-pink-600 dark:text-pink-400" },
          { label: "Avg Est. Hours", value: templates.length > 0 ? Math.round(templates.reduce((s, t) => s + totalHours(t.phases), 0) / templates.length) : 0, color: "text-blue-600 dark:text-blue-400" },
          { label: "Total Tasks", value: templates.reduce((s, t) => s + t.phases.reduce((ps, p) => ps + p.tasks.length, 0), 0), color: "text-emerald-600 dark:text-emerald-400" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground mt-0.5">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="templates">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="projects">Active Projects</TabsTrigger>
          </TabsList>
          <Button size="sm" onClick={openCreate} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">
            <Plus className="h-3.5 w-3.5 mr-1.5" />New Template
          </Button>
        </div>

        <TabsContent value="templates" className="space-y-3">
          {templates.map((t) => {
            const isExpanded = expandedId === t.id;
            const hours = totalHours(t.phases);
            const taskCount = t.phases.reduce((s, p) => s + p.tasks.length, 0);
            return (
              <Card key={t.id} className="overflow-hidden hover:border-violet-500/30 transition-colors">
                <button className="w-full text-left" onClick={() => setExpandedId(isExpanded ? null : t.id)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center shrink-0"><LayoutTemplate className="h-4 w-4 text-violet-500" /></div>
                        <div>
                          <CardTitle className="text-base">{t.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-[10px]">{t.phases.length} phases</Badge>
                            <Badge variant="secondary" className="text-[10px]">{taskCount} tasks</Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{hours}h est.</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); cloneTemplate(t); }}><Copy className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {isExpanded && (
                  <CardContent className="pt-0 pb-5 px-5">
                    <Separator className="mb-4" />
                    {t.description && <p className="text-sm text-muted-foreground mb-3">{t.description}</p>}
                    {t.phases.map((phase) => (
                      <div key={phase.id} className="mb-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{phase.name}</p>
                        <div className="space-y-1.5">
                          {phase.tasks.map((task) => (
                            <div key={task.id} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                              <span className="text-sm flex-1">{task.name}</span>
                              <span className="text-xs text-muted-foreground">{task.estimatedHours}h</span>
                              {task.dependencies && <Badge variant="secondary" className="text-[10px]">dep: {task.dependencies}</Badge>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="projects" className="space-y-3">
          {cloned.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-16 text-center"><LayoutTemplate className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" /><p className="text-sm text-muted-foreground">No projects cloned. Clone a template to get started.</p></CardContent></Card>
          ) : (
            cloned.map((c) => (
              <Card key={c.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px]">From: {c.templateName}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                        <span className="text-xs text-muted-foreground">{totalHours(c.phases)}h est.</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => deleteCloned(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Template</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Template Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Shopify Migration" className="mt-1" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="mt-1" /></div>
            <Separator />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Phases ({formPhases.length})</p>
              {formPhases.map((phase) => (
                <div key={phase.id} className="mb-3 rounded-lg bg-muted/30 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{phase.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => setFormPhases((p) => p.filter((pp) => pp.id !== phase.id))}><X className="h-3 w-3" /></Button>
                  </div>
                  {phase.tasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 text-xs ml-3 mb-1">
                      <div className="h-1 w-1 rounded-full bg-violet-500" />
                      <span>{t.name} ({t.estimatedHours}h)</span>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <Input value={newTask.phaseId === phase.id ? newTask.name : ""} onChange={(e) => setNewTask({ phaseId: phase.id, name: e.target.value, hours: newTask.phaseId === phase.id ? newTask.hours : 0, deps: "" })} placeholder="Task name" className="flex-1 h-8 text-xs" />
                    <Input type="number" value={newTask.phaseId === phase.id ? newTask.hours : 0} onChange={(e) => setNewTask((f) => ({ ...f, phaseId: phase.id, hours: parseInt(e.target.value) || 0 }))} placeholder="Hours" className="w-16 h-8 text-xs" />
                    <Button variant="outline" size="sm" className="h-8" onClick={() => addTask(phase.id)} disabled={!newTask.name.trim() || newTask.phaseId !== phase.id}><Plus className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <Input value={newPhaseName} onChange={(e) => setNewPhaseName(e.target.value)} placeholder="New phase name..." onKeyDown={(e) => e.key === "Enter" && addPhase()} className="flex-1" />
                <Button variant="outline" size="icon" onClick={addPhase} disabled={!newPhaseName.trim()}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveTemplate} disabled={!form.name.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">Create Template</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
