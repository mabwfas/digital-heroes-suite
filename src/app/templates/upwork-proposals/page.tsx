"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  Copy,
  Check,
  Search,
  Plus,
  Trash2,
  Edit2,
  Type,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface ProposalTemplate {
  id: string;
  name: string;
  projectType: string;
  body: string;
  variables: string[];
  isBuiltIn: boolean;
}

const BUILT_IN: Omit<ProposalTemplate, "id">[] = [
  { name: "Shopify Store Setup", projectType: "Shopify Store", body: "Hi {client_name},\n\nI read your job post carefully and I'd love to help you build your Shopify store. With {years}+ years of Shopify development experience and {stores_built}+ stores built, I understand exactly what you need.\n\nHere's my approach:\n1. {approach_step_1}\n2. {approach_step_2}\n3. {approach_step_3}\n\nI noticed you mentioned {specific_need} - I've handled this in similar projects and can deliver a solution that {benefit}.\n\nTimeline: {timeline}\nAvailable to start: {start_date}\n\nLooking forward to discussing your project!\n\nBest,\n{your_name}", variables: ["client_name","years","stores_built","approach_step_1","approach_step_2","approach_step_3","specific_need","benefit","timeline","start_date","your_name"], isBuiltIn: true },
  { name: "Theme Customization", projectType: "Shopify Theme", body: "Hi {client_name},\n\nYour theme customization project caught my eye! I specialize in Shopify theme development and have extensive experience with {theme_name}.\n\nWhat I'll do:\n- Analyze your current theme setup\n- Implement the customizations: {customizations}\n- Ensure mobile responsiveness\n- Test across browsers\n\nI can have this completed within {timeline}. My rate for this scope is {rate}.\n\nPortfolio: {portfolio_link}\n\nBest,\n{your_name}", variables: ["client_name","theme_name","customizations","timeline","rate","portfolio_link","your_name"], isBuiltIn: true },
  { name: "Store Migration", projectType: "Migration", body: "Hi {client_name},\n\nI've successfully migrated {migration_count}+ stores to Shopify from platforms like {platforms}. I understand the critical importance of preserving:\n\n- All product data and variants\n- Customer information\n- Order history\n- SEO rankings and URL redirects\n\nMy migration process:\n1. Full audit of your {current_platform} store\n2. Data mapping and test migration\n3. Full migration with verification\n4. Post-migration QA and support\n\nTimeline: {timeline}\nSupport period: {support_period}\n\nBest,\n{your_name}", variables: ["client_name","migration_count","platforms","current_platform","timeline","support_period","your_name"], isBuiltIn: true },
  { name: "Speed Optimization", projectType: "Speed/Performance", body: "Hi {client_name},\n\nSlow stores lose sales - I can help! I specialize in Shopify speed optimization and typically achieve {improvement}% improvement.\n\nMy optimization checklist:\n- Image optimization and lazy loading\n- Code minification (CSS/JS)\n- App audit and cleanup\n- Theme code optimization\n- CDN configuration\n\nI'll provide before/after metrics using Google PageSpeed Insights and GTmetrix.\n\nGuarantee: If I can't improve your score by at least {guarantee}%, you get a full refund.\n\nBest,\n{your_name}", variables: ["client_name","improvement","guarantee","your_name"], isBuiltIn: true },
  { name: "SEO Project", projectType: "SEO", body: "Hi {client_name},\n\nI noticed you're looking for Shopify SEO help. I've helped {client_count}+ stores improve their organic traffic.\n\nMy SEO approach for Shopify:\n- Technical SEO audit (site structure, schema, speed)\n- On-page optimization (titles, meta, headings)\n- Content strategy recommendations\n- Internal linking optimization\n- {custom_service}\n\nRecent results: Helped a {niche} store increase organic traffic by {result}% in {timeframe}.\n\nI'd love to run a free quick audit of your store first.\n\nBest,\n{your_name}", variables: ["client_name","client_count","custom_service","niche","result","timeframe","your_name"], isBuiltIn: true },
  { name: "Custom App Development", projectType: "App Dev", body: "Hi {client_name},\n\nI'm a Shopify app developer with experience building custom solutions using {tech_stack}.\n\nFor your {app_description} project, here's my plan:\n1. Requirements deep dive\n2. Architecture and design\n3. Development with regular demos\n4. Testing and deployment\n5. {support_period} of post-launch support\n\nEstimate: {estimate}\nTimeline: {timeline}\n\nBest,\n{your_name}", variables: ["client_name","tech_stack","app_description","support_period","estimate","timeline","your_name"], isBuiltIn: true },
  { name: "Bug Fix / Quick Task", projectType: "Bug Fix", body: "Hi {client_name},\n\nI can fix this! I've dealt with {issue_type} issues many times on Shopify stores.\n\nMy process:\n1. Identify the root cause\n2. Implement the fix\n3. Test thoroughly\n4. Document what was done\n\nEstimated time: {time_estimate}\nRate: {rate}\n\nI can start {availability}.\n\nBest,\n{your_name}", variables: ["client_name","issue_type","time_estimate","rate","availability","your_name"], isBuiltIn: true },
  { name: "Conversion Optimization", projectType: "CRO", body: "Hi {client_name},\n\nI help Shopify stores increase their conversion rates through data-driven optimization.\n\nWhat I'll analyze and improve:\n- Checkout flow friction points\n- Product page layout and CTAs\n- Trust signals and social proof\n- Mobile experience\n- {custom_focus}\n\nAverage improvement I achieve: {avg_improvement}%\n\nI'd love to do a free quick audit. What's your store URL?\n\nBest,\n{your_name}", variables: ["client_name","custom_focus","avg_improvement","your_name"], isBuiltIn: true },
  { name: "Design / Branding", projectType: "Design", body: "Hi {client_name},\n\nI love your vision for {brand_name}! As a Shopify designer with {years}+ years of experience, I specialize in creating stores that convert.\n\nDeliverables:\n- Custom homepage design\n- Product page layout\n- {additional_pages}\n- Mobile-optimized design\n- Brand-consistent styling\n\nDesign process: Moodboard -> Wireframes -> Design -> Development\n\nPortfolio: {portfolio_link}\n\nBest,\n{your_name}", variables: ["client_name","brand_name","years","additional_pages","portfolio_link","your_name"], isBuiltIn: true },
  { name: "Ongoing Maintenance", projectType: "Maintenance", body: "Hi {client_name},\n\nI offer ongoing Shopify maintenance packages that include:\n\n- Weekly backups and monitoring\n- Bug fixes and updates\n- Performance optimization\n- {hours_per_month} hours of development/month\n- Priority support\n\nMonthly rate: {monthly_rate}\nContract: {contract_length}\n\nThis ensures your store runs smoothly while you focus on growing your business.\n\nBest,\n{your_name}", variables: ["client_name","hours_per_month","monthly_rate","contract_length","your_name"], isBuiltIn: true },
];

export default function UpworkProposalsPage() {
  const [customTemplates, setCustomTemplates] = useLocalStorage<ProposalTemplate[]>("upwork-proposals-custom", []);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", projectType: "", body: "" });
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const allTemplates = useMemo(() => {
    const builtIn = BUILT_IN.map((t) => ({ ...t, id: `builtin-${t.name.toLowerCase().replace(/\s+/g, "-")}` }));
    return [...builtIn, ...customTemplates];
  }, [customTemplates]);

  const filtered = useMemo(() => {
    if (!search) return allTemplates;
    const s = search.toLowerCase();
    return allTemplates.filter((t) => t.name.toLowerCase().includes(s) || t.projectType.toLowerCase().includes(s));
  }, [allTemplates, search]);

  const activeTemplate = allTemplates.find((t) => t.id === activeId);

  function extractVars(body: string): string[] {
    const matches = body.match(/\{(\w+)\}/g) || [];
    return [...new Set(matches.map((m) => m.slice(1, -1)))];
  }

  function resolveBody(body: string): string {
    return body.replace(/\{(\w+)\}/g, (match, key) => varValues[key] || match);
  }

  function wordCount(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  function copyTemplate(template: ProposalTemplate) {
    navigator.clipboard.writeText(resolveBody(template.body));
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function openAdd() {
    setForm({ name: "", projectType: "", body: "" });
    setEditingId(null);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name.trim() || !form.body.trim()) return;
    const variables = extractVars(form.body);
    if (editingId) {
      setCustomTemplates((prev) => prev.map((t) => (t.id === editingId ? { ...t, ...form, variables } : t)));
    } else {
      setCustomTemplates((prev) => [...prev, { id: generateId(), ...form, variables, isBuiltIn: false }]);
    }
    setShowForm(false);
  }

  function deleteTemplate(id: string) {
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
    if (activeId === id) setActiveId(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upwork Proposal Templates"
        description="10 project-type templates for winning Upwork proposals with variable substitution"
        icon={FileText}
        badge="Templates"
        replaces="Google Docs / Text files"
        actions={
          <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Custom Template
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search proposals..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {filtered.map((t) => (
            <Card
              key={t.id}
              className={`cursor-pointer transition-colors ${activeId === t.id ? "border-violet-500/50 bg-violet-500/5" : "hover:border-violet-500/30"}`}
              onClick={() => { setActiveId(t.id); setVarValues({}); }}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px]">{t.projectType}</Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Type className="h-2.5 w-2.5" /> {wordCount(t.body)} words
                      </span>
                    </div>
                  </div>
                  {!t.isBuiltIn && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2">
          {activeTemplate ? (
            <Card className="sticky top-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{activeTemplate.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{activeTemplate.projectType}</Badge>
                      <span className="text-xs text-muted-foreground">{wordCount(resolveBody(activeTemplate.body))} words</span>
                    </div>
                  </div>
                  <Button onClick={() => copyTemplate(activeTemplate)}>
                    {copiedId === activeTemplate.id ? <><Check className="h-4 w-4 mr-2" /> Copied!</> : <><Copy className="h-4 w-4 mr-2" /> Copy</>}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeTemplate.variables.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {activeTemplate.variables.map((v) => (
                      <div key={v} className="space-y-1">
                        <Label className="text-xs capitalize">{v.replace(/_/g, " ")}</Label>
                        <Input
                          placeholder={v.replace(/_/g, " ")}
                          value={varValues[v] || ""}
                          onChange={(e) => setVarValues((prev) => ({ ...prev, [v]: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div className="bg-muted/50 rounded-md p-4">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{resolveBody(activeTemplate.body)}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-border/60">
              <CardContent className="flex items-center justify-center py-16">
                <p className="text-sm text-muted-foreground">Select a template to customize and copy</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Template" : "New Proposal Template"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Template Name *</Label>
                <Input placeholder="e.g., Headless Commerce" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Project Type</Label>
                <Input placeholder="e.g., Development" value={form.projectType} onChange={(e) => setForm((f) => ({ ...f, projectType: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Proposal Body *</Label>
              <Textarea placeholder="Use {variable_name} for dynamic content..." value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} rows={12} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || !form.body.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              {editingId ? "Save" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
