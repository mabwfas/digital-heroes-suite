"use client";

import { useState, useMemo } from "react";
import {
  CheckSquare,
  Copy,
  Search,
  Trash2,
  CheckCircle2,
  Circle,
  BarChart3,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface ChecklistItem {
  text: string;
  category: string;
  checked: boolean;
}

interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  items: { text: string; category: string }[];
  usageCount: number;
}

interface ActiveChecklist {
  id: string;
  templateName: string;
  items: ChecklistItem[];
  createdAt: string;
}

const BUILTIN_TEMPLATES: Omit<ChecklistTemplate, "usageCount">[] = [
  {
    id: "new-client-onboarding", name: "New Client Onboarding", description: "Complete checklist for onboarding new clients",
    items: [
      { text: "Send welcome email with project timeline", category: "Communication" },
      { text: "Schedule kickoff call", category: "Communication" },
      { text: "Collect brand guidelines and assets", category: "Assets" },
      { text: "Set up project in management tool", category: "Setup" },
      { text: "Create shared folder/drive", category: "Setup" },
      { text: "Add client to communication channel", category: "Setup" },
      { text: "Define project scope and milestones", category: "Planning" },
      { text: "Assign team members and roles", category: "Planning" },
      { text: "Set up billing and invoicing", category: "Finance" },
      { text: "Send contract for signature", category: "Legal" },
      { text: "Create client-facing dashboard", category: "Reporting" },
      { text: "Schedule regular check-in meetings", category: "Communication" },
    ],
  },
  {
    id: "shopify-store-launch", name: "Shopify Store Launch", description: "Pre-launch checklist for Shopify stores",
    items: [
      { text: "Configure payment gateway (Shopify Payments)", category: "Payments" },
      { text: "Set up shipping rates and zones", category: "Shipping" },
      { text: "Add legal pages (Privacy, Terms, Refund)", category: "Legal" },
      { text: "Test checkout flow end to end", category: "Testing" },
      { text: "Verify all product images and descriptions", category: "Content" },
      { text: "Set up Google Analytics and Search Console", category: "Analytics" },
      { text: "Install Facebook Pixel and conversion tracking", category: "Analytics" },
      { text: "Test mobile responsiveness", category: "Testing" },
      { text: "Submit sitemap to Google", category: "SEO" },
      { text: "Configure email notifications", category: "Setup" },
      { text: "Set up abandoned cart recovery", category: "Marketing" },
      { text: "Remove password protection from store", category: "Launch" },
      { text: "Announce launch on social media", category: "Marketing" },
    ],
  },
  {
    id: "theme-qa", name: "Theme QA", description: "Quality assurance checklist for Shopify themes",
    items: [
      { text: "Test on Chrome, Firefox, Safari, Edge", category: "Browser Testing" },
      { text: "Test on mobile (iOS + Android)", category: "Device Testing" },
      { text: "Verify all links work correctly", category: "Functionality" },
      { text: "Check image alt texts", category: "Accessibility" },
      { text: "Test keyboard navigation", category: "Accessibility" },
      { text: "Verify color contrast ratios", category: "Accessibility" },
      { text: "Check 404 page design", category: "Pages" },
      { text: "Test search functionality", category: "Functionality" },
      { text: "Verify responsive breakpoints", category: "Responsive" },
      { text: "Check loading speed (under 3 seconds)", category: "Performance" },
      { text: "Validate HTML structure", category: "Code Quality" },
      { text: "Test with large catalog (50+ products)", category: "Scalability" },
    ],
  },
  {
    id: "seo-audit", name: "SEO Audit", description: "Comprehensive SEO audit checklist",
    items: [
      { text: "Check meta titles on all pages", category: "On-Page" },
      { text: "Verify meta descriptions are unique", category: "On-Page" },
      { text: "Check H1 tags (one per page)", category: "On-Page" },
      { text: "Verify image alt text coverage", category: "On-Page" },
      { text: "Check for broken links (404s)", category: "Technical" },
      { text: "Verify XML sitemap is submitted", category: "Technical" },
      { text: "Check robots.txt configuration", category: "Technical" },
      { text: "Test page speed on mobile and desktop", category: "Performance" },
      { text: "Check for duplicate content", category: "Content" },
      { text: "Verify SSL certificate", category: "Technical" },
      { text: "Check internal linking structure", category: "On-Page" },
      { text: "Review schema markup", category: "Technical" },
      { text: "Check mobile-friendliness", category: "Technical" },
    ],
  },
  {
    id: "employee-onboarding", name: "Employee Onboarding", description: "New employee onboarding checklist",
    items: [
      { text: "Send offer letter and employment agreement", category: "Pre-Start" },
      { text: "Set up email and accounts", category: "IT Setup" },
      { text: "Prepare workspace or remote setup", category: "IT Setup" },
      { text: "Schedule orientation meeting", category: "Day One" },
      { text: "Introduce to team members", category: "Day One" },
      { text: "Share company handbook and policies", category: "Documentation" },
      { text: "Set up payroll and benefits", category: "HR" },
      { text: "Assign mentor or buddy", category: "Support" },
      { text: "Review role expectations and goals", category: "Role" },
      { text: "Schedule 30-day check-in", category: "Follow-up" },
      { text: "Complete required training modules", category: "Training" },
      { text: "Grant access to necessary tools and repos", category: "IT Setup" },
    ],
  },
  {
    id: "project-kickoff", name: "Project Kickoff", description: "Project kickoff meeting checklist",
    items: [
      { text: "Define project objectives and success criteria", category: "Planning" },
      { text: "Identify stakeholders and decision makers", category: "People" },
      { text: "Establish communication channels", category: "Communication" },
      { text: "Create project timeline with milestones", category: "Planning" },
      { text: "Assign roles and responsibilities", category: "People" },
      { text: "Set up project tracking tools", category: "Tools" },
      { text: "Document assumptions and constraints", category: "Documentation" },
      { text: "Define risk factors and mitigation plans", category: "Risk" },
      { text: "Agree on review and approval process", category: "Process" },
      { text: "Schedule recurring status meetings", category: "Communication" },
      { text: "Share access to relevant documents", category: "Tools" },
    ],
  },
  {
    id: "sprint-planning", name: "Sprint Planning", description: "Sprint planning ceremony checklist",
    items: [
      { text: "Review previous sprint retrospective items", category: "Review" },
      { text: "Groom and prioritize backlog", category: "Preparation" },
      { text: "Define sprint goal", category: "Planning" },
      { text: "Estimate story points for each item", category: "Estimation" },
      { text: "Check team availability and capacity", category: "Resources" },
      { text: "Assign tasks to team members", category: "Assignment" },
      { text: "Identify dependencies and blockers", category: "Risks" },
      { text: "Set up sprint board in project tool", category: "Setup" },
      { text: "Communicate sprint scope to stakeholders", category: "Communication" },
      { text: "Schedule daily standups", category: "Ceremonies" },
      { text: "Set sprint review and retro dates", category: "Ceremonies" },
    ],
  },
  {
    id: "code-review", name: "Code Review", description: "Code review best practices checklist",
    items: [
      { text: "Code follows project style guidelines", category: "Style" },
      { text: "No hardcoded values or magic numbers", category: "Quality" },
      { text: "Functions are small and single-purpose", category: "Quality" },
      { text: "Error handling is implemented", category: "Reliability" },
      { text: "No console.log or debug statements", category: "Cleanup" },
      { text: "Tests are included and passing", category: "Testing" },
      { text: "No security vulnerabilities introduced", category: "Security" },
      { text: "API responses are properly typed", category: "TypeScript" },
      { text: "Components are accessible (ARIA, semantic HTML)", category: "Accessibility" },
      { text: "Performance considerations addressed", category: "Performance" },
      { text: "Documentation updated if needed", category: "Docs" },
      { text: "PR description is clear and complete", category: "Process" },
    ],
  },
];

export default function ChecklistLibPage() {
  const [templateUsage, setTemplateUsage, hydrated] = useLocalStorage<Record<string, number>>("checklist-usage", {});
  const [activeChecklists, setActiveChecklists, _h2] = useLocalStorage<ActiveChecklist[]>("active-checklists", []);
  const [search, setSearch] = useState("");

  const templates = useMemo(() => {
    return BUILTIN_TEMPLATES.map((t) => ({ ...t, usageCount: templateUsage[t.id] || 0 }));
  }, [templateUsage]);

  const filteredTemplates = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }, [templates, search]);

  function cloneTemplate(template: ChecklistTemplate) {
    const checklist: ActiveChecklist = {
      id: generateId(),
      templateName: template.name,
      items: template.items.map((item) => ({ ...item, checked: false })),
      createdAt: new Date().toISOString(),
    };
    setActiveChecklists((prev) => [checklist, ...prev]);
    setTemplateUsage((prev) => ({ ...prev, [template.id]: (prev[template.id] || 0) + 1 }));
  }

  function toggleItem(checklistId: string, itemIdx: number) {
    setActiveChecklists((prev) => prev.map((cl) => {
      if (cl.id !== checklistId) return cl;
      const items = cl.items.map((item, idx) => (idx === itemIdx ? { ...item, checked: !item.checked } : item));
      return { ...cl, items };
    }));
  }

  function deleteChecklist(id: string) {
    setActiveChecklists((prev) => prev.filter((cl) => cl.id !== id));
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Checklist Template Library" description="Pre-built checklists for common workflows — clone, customize, and track" icon={CheckSquare} badge="Knowledge" replaces="Asana Templates / Notion" />

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates ({BUILTIN_TEMPLATES.length})</TabsTrigger>
          <TabsTrigger value="active">Active Checklists ({activeChecklists.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="border-border/50 hover:border-violet-500/30 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    </div>
                    <Button size="sm" onClick={() => cloneTemplate(template)} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0 shrink-0">
                      <Copy className="h-3.5 w-3.5 mr-1" />Clone
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span>{template.items.length} items</span>
                    <span>{new Set(template.items.map((i) => i.category)).size} categories</span>
                    {template.usageCount > 0 && <span>Used {template.usageCount}x</span>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Array.from(new Set(template.items.map((i) => i.category))).map((cat) => (
                      <Badge key={cat} variant="secondary" className="text-[10px]">{cat}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeChecklists.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center">
              <CheckSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No active checklists. Clone a template to get started!</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {activeChecklists.map((cl) => {
                const checked = cl.items.filter((i) => i.checked).length;
                const total = cl.items.length;
                const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
                const categories = Array.from(new Set(cl.items.map((i) => i.category)));

                return (
                  <Card key={cl.id} className="border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{cl.templateName}</CardTitle>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{checked}/{total} completed</span>
                            <span>{pct}%</span>
                            <span>{new Date(cl.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon-sm" onClick={() => deleteChecklist(cl.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                        <div className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-500" : "bg-violet-500"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {categories.map((cat) => (
                        <div key={cat} className="mb-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">{cat}</p>
                          {cl.items.map((item, idx) => {
                            if (item.category !== cat) return null;
                            return (
                              <div key={idx} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1" onClick={() => toggleItem(cl.id, idx)}>
                                {item.checked ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                                <span className={`text-sm ${item.checked ? "line-through text-muted-foreground" : ""}`}>{item.text}</span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
