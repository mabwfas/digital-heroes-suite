"use client";

import { useState, useMemo } from "react";
import {
  MessageSquare,
  Copy,
  Check,
  Search,
  Plus,
  Trash2,
  Edit2,
  Tag,
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

interface Template {
  id: string;
  name: string;
  category: string;
  body: string;
  variables: string[];
  isBuiltIn: boolean;
}

const BUILT_IN: Omit<Template, "id">[] = [
  { name: "First Response", category: "Initial Contact", body: "Hi {client_name}! Thank you for reaching out. I'd love to help with your {project_type} project. I have {years} years of experience in this area. Could you share more details about your requirements?", variables: ["client_name", "project_type", "years"], isBuiltIn: true },
  { name: "Requirements Gathering", category: "Discovery", body: "Thanks for the details, {client_name}! To ensure I deliver exactly what you need, could you clarify:\n\n1. What is your target audience?\n2. Do you have any design preferences or brand guidelines?\n3. What is your timeline for this project?\n4. Are there any specific features you need?", variables: ["client_name"], isBuiltIn: true },
  { name: "Custom Offer", category: "Sales", body: "Hi {client_name}! Based on our discussion, I've put together a custom offer for your {project_type} project:\n\nScope: {scope}\nTimeline: {timeline}\nPrice: ${price}\n\nThis includes {deliverables}. Let me know if you'd like to proceed!", variables: ["client_name", "project_type", "scope", "timeline", "price", "deliverables"], isBuiltIn: true },
  { name: "Order Started", category: "Delivery", body: "Great news, {client_name}! I've started working on your order. Here's what to expect:\n\nEstimated delivery: {delivery_date}\nI'll share a progress update by: {update_date}\n\nFeel free to message me anytime if you have questions!", variables: ["client_name", "delivery_date", "update_date"], isBuiltIn: true },
  { name: "Progress Update", category: "Delivery", body: "Hi {client_name}! Quick update on your project:\n\nCompleted: {completed_items}\nIn progress: {in_progress}\nNext steps: {next_steps}\n\nEverything is on track for delivery by {delivery_date}.", variables: ["client_name", "completed_items", "in_progress", "next_steps", "delivery_date"], isBuiltIn: true },
  { name: "Delivery Message", category: "Delivery", body: "Hi {client_name}! Your {project_type} is ready! 🎉\n\nHere's what I've delivered:\n{deliverables}\n\nPlease review and let me know if you need any adjustments. I offer {revision_count} revisions as part of this order.", variables: ["client_name", "project_type", "deliverables", "revision_count"], isBuiltIn: true },
  { name: "Revision Request Response", category: "Revisions", body: "Hi {client_name}! Thank you for the feedback. I understand you'd like:\n\n{revision_details}\n\nI'll have the updated version ready by {revision_date}. This is revision {revision_number} of {total_revisions}.", variables: ["client_name", "revision_details", "revision_date", "revision_number", "total_revisions"], isBuiltIn: true },
  { name: "Review Request", category: "Follow-up", body: "Hi {client_name}! I'm glad you're happy with the {project_type}! If you have a moment, I'd really appreciate a review. Your feedback helps me improve and helps other buyers find quality services. Thank you so much for working with me!", variables: ["client_name", "project_type"], isBuiltIn: true },
  { name: "Upsell Message", category: "Sales", body: "Hi {client_name}! Since you enjoyed the {previous_project}, I wanted to let you know I also offer {new_service}. Many of my clients find it pairs perfectly with what we already did. Would you be interested in learning more?", variables: ["client_name", "previous_project", "new_service"], isBuiltIn: true },
  { name: "Delay Notification", category: "Delivery", body: "Hi {client_name}, I wanted to be upfront — I need a bit more time to ensure your {project_type} meets the highest quality standards. The new estimated delivery is {new_date} (originally {original_date}). I apologize for the delay and appreciate your understanding.", variables: ["client_name", "project_type", "new_date", "original_date"], isBuiltIn: true },
  { name: "Out of Scope Response", category: "Boundaries", body: "Hi {client_name}! Thank you for the request. This falls outside the current order scope, but I'd be happy to help with it as an add-on:\n\nAdditional work: {extra_work}\nExtra cost: ${extra_cost}\nExtra time: {extra_time}\n\nWould you like me to create a custom offer?", variables: ["client_name", "extra_work", "extra_cost", "extra_time"], isBuiltIn: true },
  { name: "Thank You / Repeat Client", category: "Follow-up", body: "Hi {client_name}! It's great to hear from you again! As a returning client, I'd love to offer you {discount}% off your next order. What can I help you with this time?", variables: ["client_name", "discount"], isBuiltIn: true },
  { name: "Unavailable Response", category: "Boundaries", body: "Hi {client_name}! Thank you for your interest. Unfortunately, I'm fully booked until {available_date}. I'd be happy to schedule your project for then, or I can recommend a trusted colleague if you need it sooner.", variables: ["client_name", "available_date"], isBuiltIn: true },
  { name: "Cancellation Response", category: "Boundaries", body: "Hi {client_name}, I understand you'd like to cancel. No worries at all! If there's anything I could have done differently, I'd appreciate your feedback so I can improve. Wishing you the best with your project!", variables: ["client_name"], isBuiltIn: true },
  { name: "Holiday Greeting", category: "Follow-up", body: "Hi {client_name}! Wishing you a wonderful {holiday}! Just a heads up that I'll have limited availability from {start_date} to {end_date}. I'll respond to messages as soon as I can. Happy {holiday}!", variables: ["client_name", "holiday", "start_date", "end_date"], isBuiltIn: true },
];

export default function FiverrMessagesPage() {
  const [customTemplates, setCustomTemplates] = useLocalStorage<Template[]>("fiverr-templates-custom", []);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", category: "", body: "" });
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const allTemplates = useMemo(() => {
    const builtIn = BUILT_IN.map((t) => ({ ...t, id: `builtin-${t.name.toLowerCase().replace(/\s+/g, "-")}` }));
    return [...builtIn, ...customTemplates];
  }, [customTemplates]);

  const filtered = useMemo(() => {
    if (!search) return allTemplates;
    const s = search.toLowerCase();
    return allTemplates.filter((t) => t.name.toLowerCase().includes(s) || t.category.toLowerCase().includes(s) || t.body.toLowerCase().includes(s));
  }, [allTemplates, search]);

  const categories = useMemo(() => {
    const set = new Set(allTemplates.map((t) => t.category));
    return Array.from(set).sort();
  }, [allTemplates]);

  const activeTemplate = allTemplates.find((t) => t.id === activeId);

  function extractVars(body: string): string[] {
    const matches = body.match(/\{(\w+)\}/g) || [];
    return [...new Set(matches.map((m) => m.slice(1, -1)))];
  }

  function resolveBody(body: string): string {
    return body.replace(/\{(\w+)\}/g, (match, key) => varValues[key] || match);
  }

  function copyTemplate(template: Template) {
    const text = resolveBody(template.body);
    navigator.clipboard.writeText(text);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function openAdd() {
    setForm({ name: "", category: "", body: "" });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(t: Template) {
    setForm({ name: t.name, category: t.category, body: t.body });
    setEditingId(t.id);
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
        title="Fiverr Message Templates"
        description="15 pre-built templates with variable substitution for professional Fiverr communication"
        icon={MessageSquare}
        badge="Templates"
        replaces="Manual typing / Text files"
        actions={
          <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Custom Template
          </Button>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {filtered.map((t) => (
            <Card
              key={t.id}
              className={`border-border/50 cursor-pointer transition-colors ${activeId === t.id ? "border-violet-500/50 bg-violet-500/5" : "hover:border-violet-500/30"}`}
              onClick={() => { setActiveId(t.id); setVarValues({}); }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{t.name}</span>
                      <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>
                      {t.isBuiltIn && <Badge className="text-[10px] bg-violet-500/10 text-violet-600 border-0">Built-in</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{t.body}</p>
                    {t.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {t.variables.map((v) => (
                          <Badge key={v} variant="secondary" className="text-[10px] font-mono">{`{${v}}`}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); copyTemplate(t); }}>
                      {copiedId === t.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                    {!t.isBuiltIn && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(t); }}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          {activeTemplate ? (
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Customize &amp; Copy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-sm whitespace-pre-wrap">{resolveBody(activeTemplate.body)}</p>
                </div>
                <Button className="w-full" onClick={() => copyTemplate(activeTemplate)}>
                  {copiedId === activeTemplate.id ? <><Check className="h-4 w-4 mr-2" /> Copied!</> : <><Copy className="h-4 w-4 mr-2" /> Copy Message</>}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-border/60">
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">Select a template to customize</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Edit Template" : "New Custom Template"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Template Name *</Label>
              <Input placeholder="e.g., Portfolio Request" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input placeholder="e.g., Sales" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Message Body *</Label>
              <Textarea
                placeholder="Use {variable_name} for dynamic content..."
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={8}
              />
              <p className="text-xs text-muted-foreground">Use {"{variable_name}"} for placeholders</p>
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
