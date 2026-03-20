"use client";

import { useState, useMemo, useCallback } from "react";
import { MessageCircle, Copy, Search, Plus, Edit2, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface Template {
  id: string;
  name: string;
  category: string;
  body: string;
  variables: string[];
  isDefault: boolean;
}

const CATEGORIES = ["Bug Report", "Feature Request", "Billing", "How-To", "Escalation", "General", "Onboarding"];

const DEFAULT_TEMPLATES: Template[] = [
  { id: "d1", name: "Bug Report Acknowledgment", category: "Bug Report", body: "Hi {name},\n\nThank you for reporting this issue. We've logged your bug report regarding {issue} and our engineering team is investigating.\n\nWe'll keep you updated on the progress. If you have additional details, please reply to this message.\n\nBest regards,\nSupport Team", variables: ["name", "issue"], isDefault: true },
  { id: "d2", name: "Feature Request Response", category: "Feature Request", body: "Hi {name},\n\nThank you for your feature suggestion regarding {issue}. We appreciate your feedback and have added it to our product roadmap for review.\n\nWhile we can't guarantee a timeline, your input helps us prioritize what matters most to our users.\n\nBest regards,\nProduct Team", variables: ["name", "issue"], isDefault: true },
  { id: "d3", name: "Billing Question", category: "Billing", body: "Hi {name},\n\nThank you for reaching out about your billing concern regarding {issue}.\n\nI've reviewed your account and here's what I found:\n[Add billing details]\n\nIf you have any other questions, please don't hesitate to ask.\n\nBest regards,\nBilling Team", variables: ["name", "issue"], isDefault: true },
  { id: "d4", name: "How-To Guide", category: "How-To", body: "Hi {name},\n\nGreat question about {issue}! Here's a step-by-step guide:\n\n1. [Step 1]\n2. [Step 2]\n3. [Step 3]\n\nIf you need further assistance, please let us know.\n\nBest regards,\nSupport Team", variables: ["name", "issue"], isDefault: true },
  { id: "d5", name: "Escalation Notice", category: "Escalation", body: "Hi {name},\n\nI understand your frustration with {issue}. I've escalated this to our senior support team for priority handling.\n\nYou can expect an update within [timeframe]. Your case reference is [ID].\n\nWe appreciate your patience.\n\nBest regards,\nSupport Management", variables: ["name", "issue"], isDefault: true },
];

const EMPTY: Omit<Template, "id" | "isDefault" | "variables"> = {
  name: "", category: "General", body: "",
};

function extractVariables(body: string): string[] {
  const matches = body.match(/\{(\w+)\}/g);
  return matches ? [...new Set(matches.map((m) => m.slice(1, -1)))] : [];
}

export default function ResponseTemplatesPage() {
  const [custom, setCustom, hydrated] = useLocalStorage<Template[]>("response-templates", []);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const allTemplates = useMemo(() => [...DEFAULT_TEMPLATES, ...custom], [custom]);

  const filtered = useMemo(() => {
    return allTemplates.filter((t) => {
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.body.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === "all" || t.category === filterCat;
      return matchSearch && matchCat;
    });
  }, [allTemplates, search, filterCat]);

  const openPreview = useCallback((t: Template) => {
    setPreviewTemplate(t);
    const vars: Record<string, string> = {};
    t.variables.forEach((v) => { vars[v] = ""; });
    setPreviewVars(vars);
  }, []);

  const copyWithVars = useCallback((t: Template) => {
    let body = t.body;
    Object.entries(previewVars).forEach(([k, v]) => {
      body = body.replace(new RegExp(`\\{${k}\\}`, "g"), v || `{${k}}`);
    });
    navigator.clipboard.writeText(body);
    setCopied(t.id);
    setTimeout(() => setCopied(null), 1500);
  }, [previewVars]);

  const openAdd = useCallback(() => { setForm(EMPTY); setEditingId(null); setShowForm(true); }, []);
  const openEdit = useCallback((t: Template) => {
    setForm({ name: t.name, category: t.category, body: t.body });
    setEditingId(t.id); setShowForm(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.name.trim()) return;
    const variables = extractVariables(form.body);
    if (editingId) {
      setCustom((prev) => prev.map((t) => t.id === editingId ? { ...t, ...form, variables } : t));
    } else {
      setCustom((prev) => [{ ...form, id: generateId(), isDefault: false, variables }, ...prev]);
    }
    setShowForm(false); setEditingId(null);
  }, [form, editingId, setCustom]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Response Templates"
        description="Pre-built response templates with variable substitution. Copy, customize, and reply fast."
        icon={MessageCircle}
        badge="Support"
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCat} onValueChange={(v) => setFilterCat(v as string)}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">
          <Plus className="h-4 w-4 mr-2" />New Template
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((t) => (
          <Card key={t.id} className="border-border/50 hover:border-violet-500/30 transition-colors group">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{t.name}</span>
                  <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>
                  {t.isDefault && <Badge className="bg-violet-500/10 text-violet-600 border-0 text-[10px]">Built-in</Badge>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openPreview(t)}><Copy className="h-3 w-3" /></Button>
                  {!t.isDefault && <>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}><Edit2 className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => setCustom((p) => p.filter((x) => x.id !== t.id))}><Trash2 className="h-3 w-3" /></Button>
                  </>}
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">{t.body}</p>
              {t.variables.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {t.variables.map((v) => <Badge key={v} variant="outline" className="text-[10px]">{`{${v}}`}</Badge>)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!previewTemplate} onOpenChange={(o) => !o && setPreviewTemplate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Use Template: {previewTemplate?.name}</DialogTitle></DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              {previewTemplate.variables.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {previewTemplate.variables.map((v) => (
                    <div key={v} className="space-y-1">
                      <Label className="text-xs capitalize">{v}</Label>
                      <Input placeholder={`Enter ${v}...`} value={previewVars[v] || ""} onChange={(e) => setPreviewVars((p) => ({ ...p, [v]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-lg border p-3 bg-muted/30">
                <p className="text-xs whitespace-pre-wrap">{
                  Object.entries(previewVars).reduce((body, [k, v]) => body.replace(new RegExp(`\\{${k}\\}`, "g"), v || `{${k}}`), previewTemplate.body)
                }</p>
              </div>
              <Button className="w-full" onClick={() => copyWithVars(previewTemplate)}>
                <Copy className={`h-4 w-4 mr-2 ${copied === previewTemplate.id ? "text-emerald-500" : ""}`} />
                {copied === previewTemplate.id ? "Copied!" : "Copy to Clipboard"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Template" : "New Template"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Template Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v ?? f.category }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Body (use {"{name}"} for variables)</Label>
              <Textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} rows={8} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">{editingId ? "Save" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
