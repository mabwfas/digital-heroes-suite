"use client";

import { useState, useMemo } from "react";
import { Mail, Copy, Check, Search, Plus, Trash2, Edit2 } from "lucide-react";
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

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  variables: string[];
  isBuiltIn: boolean;
}

const BUILT_IN: Omit<EmailTemplate, "id">[] = [
  { name: "Welcome Email", category: "Onboarding", subject: "Welcome to {company}! Let's get started", body: "Hi {client_name},\n\nWelcome aboard! I'm thrilled to have you as a client.\n\nHere's what happens next:\n1. I'll send you a kickoff questionnaire\n2. We'll schedule our first call\n3. I'll begin work on {project_name}\n\nFeel free to reach me anytime at {your_email}.\n\nBest regards,\n{your_name}", variables: ["client_name","company","project_name","your_email","your_name"], isBuiltIn: true },
  { name: "Kickoff Meeting", category: "Onboarding", subject: "Kickoff meeting for {project_name}", body: "Hi {client_name},\n\nI'd love to schedule our kickoff meeting. Here's what we'll cover:\n\n- Project goals and KPIs\n- Timeline and milestones\n- Communication preferences\n- Access and credentials needed\n\nAvailable times: {available_times}\n\nDuration: ~{duration} minutes\n\nLooking forward to it!\n\n{your_name}", variables: ["client_name","project_name","available_times","duration","your_name"], isBuiltIn: true },
  { name: "Progress Update", category: "Updates", subject: "Progress Update: {project_name} - Week {week_number}", body: "Hi {client_name},\n\nHere's your weekly update:\n\nCompleted this week:\n{completed}\n\nIn progress:\n{in_progress}\n\nUp next:\n{next_steps}\n\nBlockers: {blockers}\n\nOverall status: On track for {delivery_date} delivery.\n\n{your_name}", variables: ["client_name","project_name","week_number","completed","in_progress","next_steps","blockers","delivery_date","your_name"], isBuiltIn: true },
  { name: "Delivery Email", category: "Delivery", subject: "{project_name} - Final Delivery", body: "Hi {client_name},\n\nI'm excited to share the final deliverables for {project_name}!\n\nDelivered:\n{deliverables}\n\nAccess details:\n{access_details}\n\nDocumentation: {doc_link}\n\nPlease review and let me know if you need any adjustments. I offer {support_period} of post-delivery support.\n\n{your_name}", variables: ["client_name","project_name","deliverables","access_details","doc_link","support_period","your_name"], isBuiltIn: true },
  { name: "Feedback Request", category: "Follow-up", subject: "How was your experience with {project_name}?", body: "Hi {client_name},\n\nNow that {project_name} is complete, I'd love your feedback!\n\n1. What went well?\n2. What could be improved?\n3. Would you recommend me to others?\n\nYour honest feedback helps me improve. If you have a moment, a testimonial or review would mean a lot.\n\nThank you for the opportunity to work together!\n\n{your_name}", variables: ["client_name","project_name","your_name"], isBuiltIn: true },
  { name: "Payment Reminder", category: "Finance", subject: "Invoice #{invoice_number} - Payment Reminder", body: "Hi {client_name},\n\nFriendly reminder that invoice #{invoice_number} for ${amount} is due on {due_date}.\n\nPayment methods:\n{payment_methods}\n\nIf you've already sent payment, please disregard this message.\n\nPlease let me know if you have any questions.\n\n{your_name}", variables: ["client_name","invoice_number","amount","due_date","payment_methods","your_name"], isBuiltIn: true },
  { name: "Upsell / Cross-sell", category: "Sales", subject: "A new opportunity for {company}", body: "Hi {client_name},\n\nSince completing {previous_project}, I've been thinking about additional ways I could help {company}.\n\nI noticed an opportunity for:\n{opportunity}\n\nBased on our work together, I estimate this could {benefit}.\n\nWould you be interested in a quick call to discuss?\n\n{your_name}", variables: ["client_name","company","previous_project","opportunity","benefit","your_name"], isBuiltIn: true },
  { name: "Holiday Greeting", category: "Follow-up", subject: "Happy {holiday} from {company}!", body: "Hi {client_name},\n\nWishing you and your team a wonderful {holiday}!\n\nPlease note my availability:\n- Limited hours: {limited_dates}\n- Fully back: {return_date}\n\nI'll respond to urgent requests within {response_time}.\n\nHere's to a great {year} ahead!\n\n{your_name}", variables: ["client_name","holiday","company","limited_dates","return_date","response_time","year","your_name"], isBuiltIn: true },
  { name: "Contract Renewal", category: "Sales", subject: "Renewing our partnership - {company}", body: "Hi {client_name},\n\nOur current agreement ends on {end_date}. I'd love to continue working together!\n\nResults achieved:\n{results}\n\nFor renewal, I'm offering:\n{renewal_offer}\n\nShall we schedule a call to discuss?\n\n{your_name}", variables: ["client_name","company","end_date","results","renewal_offer","your_name"], isBuiltIn: true },
  { name: "Scope Change Notice", category: "Updates", subject: "Scope Update: {project_name}", body: "Hi {client_name},\n\nI want to discuss a scope adjustment for {project_name}.\n\nOriginal scope: {original_scope}\nRequested changes: {changes}\n\nImpact:\n- Timeline: {timeline_impact}\n- Cost: {cost_impact}\n\nI want to be transparent about this to ensure we stay aligned. Please let me know how you'd like to proceed.\n\n{your_name}", variables: ["client_name","project_name","original_scope","changes","timeline_impact","cost_impact","your_name"], isBuiltIn: true },
  { name: "Testimonial Request", category: "Follow-up", subject: "Quick favor - {client_name}", body: "Hi {client_name},\n\nI hope {project_name} is going well!\n\nWould you be willing to write a brief testimonial about our work together? It would really help my business.\n\nA few sentences about:\n- The challenge you faced\n- How I helped\n- The results\n\nI can also draft something for your approval if that's easier!\n\nThank you,\n{your_name}", variables: ["client_name","project_name","your_name"], isBuiltIn: true },
  { name: "Referral Request", category: "Follow-up", subject: "Know anyone who needs {service}?", body: "Hi {client_name},\n\nI'm expanding my client base and would love referrals. If you know anyone who could benefit from {service}, I'd appreciate an introduction.\n\nAs a thank you, I offer {referral_bonus} for successful referrals.\n\nThanks for your support!\n\n{your_name}", variables: ["client_name","service","referral_bonus","your_name"], isBuiltIn: true },
];

export default function ClientEmailsPage() {
  const [customTemplates, setCustomTemplates] = useLocalStorage<EmailTemplate[]>("client-emails-custom", []);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", category: "", subject: "", body: "" });
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const allTemplates = useMemo(() => {
    const builtIn = BUILT_IN.map((t) => ({ ...t, id: `builtin-${t.name.toLowerCase().replace(/\s+/g, "-")}` }));
    return [...builtIn, ...customTemplates];
  }, [customTemplates]);

  const filtered = useMemo(() => {
    if (!search) return allTemplates;
    const s = search.toLowerCase();
    return allTemplates.filter((t) => t.name.toLowerCase().includes(s) || t.category.toLowerCase().includes(s));
  }, [allTemplates, search]);

  const activeTemplate = allTemplates.find((t) => t.id === activeId);

  function extractVars(text: string): string[] {
    const matches = text.match(/\{(\w+)\}/g) || [];
    return [...new Set(matches.map((m) => m.slice(1, -1)))];
  }

  function resolve(text: string): string {
    return text.replace(/\{(\w+)\}/g, (match, key) => varValues[key] || match);
  }

  function copyEmail() {
    if (!activeTemplate) return;
    const text = `Subject: ${resolve(activeTemplate.subject)}\n\n${resolve(activeTemplate.body)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(activeTemplate.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleSave() {
    if (!form.name.trim() || !form.body.trim()) return;
    const variables = extractVars(form.subject + " " + form.body);
    if (editingId) {
      setCustomTemplates((prev) => prev.map((t) => (t.id === editingId ? { ...t, ...form, variables } : t)));
    } else {
      setCustomTemplates((prev) => [...prev, { id: generateId(), ...form, variables, isBuiltIn: false }]);
    }
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Email Templates"
        description="12 professional email templates for every stage of client communication"
        icon={Mail}
        badge="Templates"
        replaces="Gmail Templates / Notion"
        actions={
          <Button onClick={() => { setForm({ name: "", category: "", subject: "", body: "" }); setEditingId(null); setShowForm(true); }} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Custom Template
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search email templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          {filtered.map((t) => (
            <Card key={t.id} className={`cursor-pointer transition-colors ${activeId === t.id ? "border-violet-500/50 bg-violet-500/5" : "hover:border-violet-500/30"}`} onClick={() => { setActiveId(t.id); setVarValues({}); }}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <Badge variant="secondary" className="text-[10px] mt-1">{t.category}</Badge>
                  </div>
                  {!t.isBuiltIn && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setCustomTemplates((p) => p.filter((x) => x.id !== t.id)); if (activeId === t.id) setActiveId(null); }}>
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
                  <CardTitle className="text-lg">{activeTemplate.name}</CardTitle>
                  <Button onClick={copyEmail}>
                    {copiedId === activeTemplate.id ? <><Check className="h-4 w-4 mr-2" /> Copied!</> : <><Copy className="h-4 w-4 mr-2" /> Copy Email</>}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeTemplate.variables.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {activeTemplate.variables.map((v) => (
                      <div key={v} className="space-y-1">
                        <Label className="text-xs capitalize">{v.replace(/_/g, " ")}</Label>
                        <Input placeholder={v.replace(/_/g, " ")} value={varValues[v] || ""} onChange={(e) => setVarValues((prev) => ({ ...prev, [v]: e.target.value }))} className="h-8 text-sm" />
                      </div>
                    ))}
                  </div>
                )}
                <div className="bg-muted/50 rounded-md p-4 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Subject</p>
                    <p className="text-sm font-medium">{resolve(activeTemplate.subject)}</p>
                  </div>
                  <div className="h-px bg-border" />
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{resolve(activeTemplate.body)}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-border/60">
              <CardContent className="flex items-center justify-center py-16">
                <p className="text-sm text-muted-foreground">Select a template to customize</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Template" : "New Email Template"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Subject *</Label><Input placeholder="Email subject with {variables}" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Body *</Label><Textarea placeholder="Email body with {variables}..." value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} rows={10} /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || !form.body.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">{editingId ? "Save" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
