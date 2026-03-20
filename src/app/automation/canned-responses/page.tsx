"use client";

import { useState, useMemo, useEffect } from "react";
import {
  MessageSquareText,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Search,
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
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type ResponseCategory = "Fiverr" | "Upwork" | "Email" | "Support" | "Sales";

interface CannedResponse {
  id: string;
  title: string;
  category: ResponseCategory;
  content: string;
  variables: string[];
  createdAt: string;
}

const CATEGORIES: ResponseCategory[] = ["Fiverr", "Upwork", "Email", "Support", "Sales"];

const CAT_COLORS: Record<ResponseCategory, string> = {
  Fiverr: "bg-green-500/10 text-green-600 dark:text-green-400 border-0",
  Upwork: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0",
  Email: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-0",
  Support: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0",
  Sales: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-0",
};

const PREBUILT: Omit<CannedResponse, "id" | "createdAt">[] = [
  { title: "Initial Inquiry Response", category: "Fiverr", content: "Hi {client_name}!\n\nThank you for reaching out about {project_type}. I'd love to help you with this.\n\nCould you share more details about:\n1. Your timeline\n2. Specific features you need\n3. Any reference examples\n\nLooking forward to working together!\n\nBest,\n{your_name}", variables: ["client_name", "project_type", "your_name"] },
  { title: "Project Kickoff", category: "Email", content: "Hi {client_name},\n\nGreat news — we're ready to start on {project_name}!\n\nHere's what happens next:\n- I'll share a project timeline by {date}\n- Our first check-in call is scheduled for {meeting_date}\n- Please share any remaining assets to {email}\n\nLet me know if you have any questions.\n\nBest,\n{your_name}", variables: ["client_name", "project_name", "date", "meeting_date", "email", "your_name"] },
  { title: "Delivery Message", category: "Fiverr", content: "Hi {client_name}!\n\nYour {deliverable} is complete and ready for review. Here's a summary of what's included:\n\n{summary}\n\nPlease take a look and let me know if you'd like any adjustments. I offer {revision_count} revisions as part of this order.\n\nThank you for your trust!\n\n{your_name}", variables: ["client_name", "deliverable", "summary", "revision_count", "your_name"] },
  { title: "Revision Request Acknowledgment", category: "Support", content: "Hi {client_name},\n\nThank you for the detailed feedback! I've noted all the changes you've requested:\n\n{changes}\n\nI'll have the updated version ready by {date}. Let me know if anything else comes up.\n\nBest,\n{your_name}", variables: ["client_name", "changes", "date", "your_name"] },
  { title: "Upsell Suggestion", category: "Sales", content: "Hi {client_name},\n\nI noticed {observation}. I wanted to suggest {service} which could help you {benefit}.\n\nHere's what it includes:\n{details}\n\nWould you like to discuss this further? I can prepare a proposal.\n\nBest,\n{your_name}", variables: ["client_name", "observation", "service", "benefit", "details", "your_name"] },
  { title: "Review Request", category: "Fiverr", content: "Hi {client_name}!\n\nI'm glad we completed {project_name} successfully! If you're happy with the work, I'd really appreciate a 5-star review. It helps me continue providing great service.\n\nThank you again for choosing to work with me!\n\n{your_name}", variables: ["client_name", "project_name", "your_name"] },
  { title: "Follow-up After No Response", category: "Sales", content: "Hi {client_name},\n\nI wanted to follow up on my previous message about {topic}. I understand you might be busy, so just wanted to check if you're still interested.\n\nNo pressure at all — just let me know either way so I can plan accordingly.\n\nBest,\n{your_name}", variables: ["client_name", "topic", "your_name"] },
  { title: "Upwork Proposal", category: "Upwork", content: "Hi {client_name},\n\nI've read your job post about {project_description} carefully. Here's how I can help:\n\n{approach}\n\nRelevant experience: {experience}\n\nTimeline: {timeline}\nBudget: {budget}\n\nI'd love to discuss this further. Are you available for a quick call?\n\nBest,\n{your_name}", variables: ["client_name", "project_description", "approach", "experience", "timeline", "budget", "your_name"] },
  { title: "Project Completion Summary", category: "Email", content: "Hi {client_name},\n\nI'm pleased to let you know that {project_name} is now complete!\n\nWhat was delivered:\n{deliverables}\n\nNext steps:\n{next_steps}\n\nIt was a pleasure working with you. I'm here if you need anything in the future.\n\nBest,\n{your_name}", variables: ["client_name", "project_name", "deliverables", "next_steps", "your_name"] },
  { title: "Scope Change Notice", category: "Support", content: "Hi {client_name},\n\nI wanted to discuss the additional requests for {project_name}. The following items fall outside our original scope:\n\n{items}\n\nI can absolutely handle these! Here's the estimated additional cost: {cost}\nTimeline impact: {timeline}\n\nWould you like to proceed?\n\nBest,\n{your_name}", variables: ["client_name", "project_name", "items", "cost", "timeline", "your_name"] },
  { title: "Meeting Confirmation", category: "Email", content: "Hi {client_name},\n\nJust confirming our meeting:\n\nDate: {date}\nTime: {time}\nLink: {meeting_link}\n\nAgenda:\n{agenda}\n\nSee you there!\n\n{your_name}", variables: ["client_name", "date", "time", "meeting_link", "agenda", "your_name"] },
  { title: "Payment Reminder", category: "Email", content: "Hi {client_name},\n\nJust a friendly reminder that invoice #{invoice_number} for ${amount} is due on {due_date}.\n\nPayment can be made via {payment_method}.\n\nPlease let me know if you have any questions.\n\nBest,\n{your_name}", variables: ["client_name", "invoice_number", "amount", "due_date", "payment_method", "your_name"] },
  { title: "Bug Report Acknowledgment", category: "Support", content: "Hi {client_name},\n\nThank you for reporting this issue. I've logged it and I'm investigating now.\n\nIssue: {issue_description}\nPriority: {priority}\nExpected fix: {timeline}\n\nI'll keep you updated on the progress.\n\nBest,\n{your_name}", variables: ["client_name", "issue_description", "priority", "timeline", "your_name"] },
  { title: "Referral Thank You", category: "Sales", content: "Hi {client_name},\n\nThank you so much for referring {referral_name}! I really appreciate your trust and recommendation.\n\nAs a thank you, I'd like to offer you {offer} on your next project.\n\nBest,\n{your_name}", variables: ["client_name", "referral_name", "offer", "your_name"] },
  { title: "Seasonal Outreach", category: "Sales", content: "Hi {client_name},\n\nHope you're doing well! With {season} coming up, I wanted to check if you need any help with {service_area}.\n\nI have availability starting {date} and would love to help you prepare.\n\nLet me know if you'd like to chat!\n\nBest,\n{your_name}", variables: ["client_name", "season", "service_area", "date", "your_name"] },
];

function extractVariables(text: string): string[] {
  const matches = text.match(/\{(\w+)\}/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map((m) => m.replace(/[{}]/g, ""))));
}

export default function CannedResponsesPage() {
  const [responses, setResponses, hydrated] = useLocalStorage<CannedResponse[]>("canned-responses", []);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (hydrated && responses.length === 0 && !seeded) {
      setSeeded(true);
      const seed = PREBUILT.map((r) => ({ ...r, id: generateId(), createdAt: new Date().toISOString() }));
      setResponses(seed);
    }
  }, [hydrated, responses.length, seeded, setResponses]);

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<"all" | ResponseCategory>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", category: "Email" as ResponseCategory, content: "" });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});
  const [previewId, setPreviewId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return responses.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch = r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q);
      const matchCat = filterCat === "all" || r.category === filterCat;
      return matchSearch && matchCat;
    });
  }, [responses, search, filterCat]);

  function openAdd() { setForm({ title: "", category: "Email", content: "" }); setEditingId(null); setDialogOpen(true); }
  function openEdit(r: CannedResponse) {
    setForm({ title: r.title, category: r.category, content: r.content });
    setEditingId(r.id);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.title.trim() || !form.content.trim()) return;
    const vars = extractVariables(form.content);
    if (editingId) {
      setResponses((prev) => prev.map((r) => (r.id === editingId ? { ...r, ...form, variables: vars } : r)));
    } else {
      setResponses((prev) => [{ ...form, id: generateId(), variables: vars, createdAt: new Date().toISOString() }, ...prev]);
    }
    setDialogOpen(false);
  }

  function handleCopy(r: CannedResponse) {
    let text = r.content;
    if (previewId === r.id) {
      for (const [k, v] of Object.entries(previewVars)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), v || `{${k}}`);
      }
    }
    navigator.clipboard.writeText(text);
    setCopiedId(r.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function openPreview(r: CannedResponse) {
    if (previewId === r.id) { setPreviewId(null); return; }
    const vars: Record<string, string> = {};
    r.variables.forEach((v) => { vars[v] = ""; });
    setPreviewVars(vars);
    setPreviewId(r.id);
  }

  function deleteResponse(id: string) { setResponses((prev) => prev.filter((r) => r.id !== id)); }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Canned Response Library" description="Pre-built message templates with variable substitution for quick communication" icon={MessageSquareText} badge="Automation" replaces="TextExpander / Notion" />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search responses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCat} onValueChange={(v) => setFilterCat(v as typeof filterCat)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
          <Plus className="h-4 w-4 mr-2" />Add Response
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => (
          <Card key={r.id} className="border-border/50 group">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{r.title}</span>
                    <Badge className={CAT_COLORS[r.category]}>{r.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">{r.content.slice(0, 150)}...</p>
                  {r.variables.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {r.variables.map((v) => <Badge key={v} variant="secondary" className="text-[10px] font-mono">{`{${v}}`}</Badge>)}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openPreview(r)}>
                    {previewId === r.id ? "Close" : "Preview"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(r)}>
                    <Copy className="h-3.5 w-3.5 mr-1" />{copiedId === r.id ? "Copied!" : "Copy"}
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100" onClick={() => openEdit(r)}><Edit2 className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100" onClick={() => deleteResponse(r.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                </div>
              </div>

              {previewId === r.id && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50 border space-y-3">
                  {r.variables.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {r.variables.map((v) => (
                        <div key={v} className="space-y-1">
                          <Label className="text-xs font-mono">{`{${v}}`}</Label>
                          <Input value={previewVars[v] || ""} onChange={(e) => setPreviewVars((p) => ({ ...p, [v]: e.target.value }))} placeholder={v.replace(/_/g, " ")} className="h-7 text-xs" />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap bg-background rounded p-3 border">
                    {(() => {
                      let text = r.content;
                      for (const [k, v] of Object.entries(previewVars)) {
                        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), v || `{${k}}`);
                      }
                      return text;
                    })()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Response" : "New Canned Response"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as ResponseCategory }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Content *</Label>
              <Textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={8} placeholder="Use {variable_name} for dynamic content..." />
              <p className="text-xs text-muted-foreground">Variables detected: {extractVariables(form.content).map((v) => `{${v}}`).join(", ") || "none"}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title.trim() || !form.content.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">{editingId ? "Save" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
