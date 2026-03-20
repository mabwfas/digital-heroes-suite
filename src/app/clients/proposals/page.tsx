"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Eye,
  Edit2,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Calendar,
  List,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type ProposalStatus = "draft" | "sent" | "accepted" | "rejected";

interface PricingItem {
  id: string;
  description: string;
  amount: number;
}

interface Proposal {
  id: string;
  clientName: string;
  projectTitle: string;
  description: string;
  scopeItems: string[];
  pricingItems: PricingItem[];
  timeline: string;
  terms: string;
  status: ProposalStatus;
  createdAt: string;
}

const STATUS_CONFIG: Record<ProposalStatus, { label: string; icon: React.ElementType; className: string }> = {
  draft: { label: "Draft", icon: Clock, className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-0" },
  sent: { label: "Sent", icon: Send, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0" },
  accepted: { label: "Accepted", icon: CheckCircle, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0" },
  rejected: { label: "Rejected", icon: XCircle, className: "bg-red-500/10 text-red-600 dark:text-red-400 border-0" },
};

const EMPTY_FORM = (): Omit<Proposal, "id" | "createdAt"> => ({
  clientName: "",
  projectTitle: "",
  description: "",
  scopeItems: [""],
  pricingItems: [{ id: generateId(), description: "", amount: 0 }],
  timeline: "",
  terms: "Payment is due within 14 days of invoice. A 50% deposit is required before work begins. All intellectual property transfers upon final payment.",
  status: "draft",
});

export default function ProposalsPage() {
  const [proposals, setProposals] = useLocalStorage<Proposal[]>("proposals", []);
  const [form, setForm] = useState(EMPTY_FORM());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "form">("list");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  const total = useMemo(
    () => form.pricingItems.reduce((s, i) => s + (i.amount || 0), 0),
    [form.pricingItems]
  );

  const previewProposal = useMemo(
    () => proposals.find((p) => p.id === previewId) ?? null,
    [proposals, previewId]
  );

  function startNew() {
    setForm(EMPTY_FORM());
    setEditingId(null);
    setView("form");
    setShowPreview(true);
  }

  function startEdit(proposal: Proposal) {
    setForm({
      clientName: proposal.clientName,
      projectTitle: proposal.projectTitle,
      description: proposal.description,
      scopeItems: proposal.scopeItems,
      pricingItems: proposal.pricingItems,
      timeline: proposal.timeline,
      terms: proposal.terms,
      status: proposal.status,
    });
    setEditingId(proposal.id);
    setView("form");
    setShowPreview(true);
  }

  function handleSave() {
    if (!form.clientName.trim() || !form.projectTitle.trim()) return;
    if (editingId) {
      setProposals((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...form } : p))
      );
    } else {
      setProposals((prev) => [
        { ...form, id: generateId(), createdAt: new Date().toISOString() },
        ...prev,
      ]);
    }
    setView("list");
    setEditingId(null);
  }

  function handleDelete(id: string) {
    setProposals((prev) => prev.filter((p) => p.id !== id));
    if (previewId === id) setPreviewId(null);
  }

  function updateStatus(id: string, status: ProposalStatus) {
    setProposals((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  function addScopeItem() {
    setForm((f) => ({ ...f, scopeItems: [...f.scopeItems, ""] }));
  }

  function updateScopeItem(idx: number, val: string) {
    setForm((f) => {
      const items = [...f.scopeItems];
      items[idx] = val;
      return { ...f, scopeItems: items };
    });
  }

  function removeScopeItem(idx: number) {
    setForm((f) => ({ ...f, scopeItems: f.scopeItems.filter((_, i) => i !== idx) }));
  }

  function addPricingItem() {
    setForm((f) => ({
      ...f,
      pricingItems: [...f.pricingItems, { id: generateId(), description: "", amount: 0 }],
    }));
  }

  function updatePricingItem(id: string, field: keyof PricingItem, val: string | number) {
    setForm((f) => ({
      ...f,
      pricingItems: f.pricingItems.map((i) => (i.id === id ? { ...i, [field]: val } : i)),
    }));
  }

  function removePricingItem(id: string) {
    setForm((f) => ({ ...f, pricingItems: f.pricingItems.filter((i) => i.id !== id) }));
  }

  const ProposalPreview = ({ p, pricing }: { p: Partial<Proposal> & { pricingItems: PricingItem[] }; pricing: number }) => (
    <div className="font-mono text-sm space-y-4 p-6 bg-white dark:bg-slate-950 rounded-lg border border-border/50 text-foreground">
      <div className="border-b-2 border-gradient-to-r from-violet-500 to-pink-500 pb-4">
        <div className="h-1.5 w-24 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 mb-3" />
        <h2 className="text-xl font-bold not-italic">{p.projectTitle || "Project Title"}</h2>
        <p className="text-muted-foreground text-xs not-italic font-sans mt-1">
          Prepared for: <strong>{p.clientName || "Client Name"}</strong>
        </p>
        <p className="text-muted-foreground text-xs not-italic font-sans">
          Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {p.description && (
        <div>
          <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2 not-italic font-sans">Overview</p>
          <p className="text-sm not-italic font-sans leading-relaxed">{p.description}</p>
        </div>
      )}

      {p.scopeItems && p.scopeItems.filter(Boolean).length > 0 && (
        <div>
          <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2 not-italic font-sans">Scope of Work</p>
          <ul className="space-y-1">
            {p.scopeItems.filter(Boolean).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm not-italic font-sans">
                <span className="text-violet-500 mt-0.5">✓</span> {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {p.pricingItems && p.pricingItems.filter((i) => i.description).length > 0 && (
        <div>
          <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2 not-italic font-sans">Investment</p>
          <div className="space-y-1.5">
            {p.pricingItems.filter((i) => i.description).map((item) => (
              <div key={item.id} className="flex justify-between text-sm not-italic font-sans">
                <span>{item.description}</span>
                <span className="font-semibold">${(item.amount || 0).toLocaleString()}</span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold not-italic font-sans">
              <span>Total</span>
              <span className="text-violet-600 dark:text-violet-400">${pricing.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {p.timeline && (
        <div>
          <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-1 not-italic font-sans">Timeline</p>
          <p className="text-sm not-italic font-sans">{p.timeline}</p>
        </div>
      )}

      {p.terms && (
        <div>
          <p className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-1 not-italic font-sans">Terms & Conditions</p>
          <p className="text-xs text-muted-foreground not-italic font-sans leading-relaxed">{p.terms}</p>
        </div>
      )}
    </div>
  );

  if (view === "form") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader
            title={editingId ? "Edit Proposal" : "New Proposal"}
            description="Fill in the details to generate a professional proposal"
            icon={FileText}
          />
          <Button variant="outline" onClick={() => setView("list")}>
            Back to List
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-5">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Client Name *</Label>
                    <Input
                      placeholder="John Smith"
                      value={form.clientName}
                      onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ProposalStatus }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Project Title *</Label>
                  <Input
                    placeholder="e.g. E-commerce Website Redesign"
                    value={form.projectTitle}
                    onChange={(e) => setForm((f) => ({ ...f, projectTitle: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Project Description</Label>
                  <Textarea
                    placeholder="Describe the project, goals and expected outcomes..."
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <List className="h-4 w-4" /> Scope of Work
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={addScopeItem}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {form.scopeItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder={`Scope item ${idx + 1}`}
                      value={item}
                      onChange={(e) => updateScopeItem(idx, e.target.value)}
                    />
                    {form.scopeItems.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 hover:text-destructive" onClick={() => removeScopeItem(idx)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> Pricing
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={addPricingItem}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Line
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {form.pricingItems.map((item) => (
                  <div key={item.id} className="flex gap-2">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updatePricingItem(item.id, "description", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="0"
                      value={item.amount || ""}
                      onChange={(e) => updatePricingItem(item.id, "amount", parseFloat(e.target.value) || 0)}
                      className="w-28"
                    />
                    {form.pricingItems.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 hover:text-destructive" onClick={() => removePricingItem(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <div className="flex justify-end pt-2 border-t border-border/50">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold text-violet-600 dark:text-violet-400">${total.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Timeline & Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Timeline</Label>
                  <Input
                    placeholder="e.g. 4-6 weeks from project kickoff"
                    value={form.timeline}
                    onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Terms & Conditions</Label>
                  <Textarea
                    placeholder="Payment terms, IP ownership, revision policy..."
                    rows={4}
                    value={form.terms}
                    onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setView("list")}>Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={!form.clientName.trim() || !form.projectTitle.trim()}
                className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0"
              >
                {editingId ? "Save Changes" : "Save Proposal"}
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Live Preview</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview((p) => !p)}>
                {showPreview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
            {showPreview && (
              <div className="sticky top-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
                <ProposalPreview p={form} pricing={total} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Proposal Generator"
          description="Create and manage professional project proposals"
          icon={FileText}
          badge="Generator"
          replaces="PandaDoc / Proposify"
        />
        <Button
          onClick={startNew}
          className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0"
        >
          <Plus className="h-4 w-4 mr-2" /> New Proposal
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["draft", "sent", "accepted", "rejected"] as ProposalStatus[]).map((status) => {
          const count = proposals.filter((p) => p.status === status).length;
          const cfg = STATUS_CONFIG[status];
          return (
            <Card key={status} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <cfg.icon className="h-4 w-4 text-muted-foreground" />
                  <Badge className={cfg.className}>{cfg.label}</Badge>
                </div>
                <p className="text-2xl font-bold">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {proposals.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center mb-4">
              <FileText className="h-7 w-7 text-violet-400" />
            </div>
            <p className="font-medium text-muted-foreground mb-1">No proposals yet</p>
            <p className="text-sm text-muted-foreground/70">Create your first professional proposal</p>
            <Button onClick={startNew} className="mt-4" variant="outline">
              <Plus className="h-4 w-4 mr-2" /> Create Proposal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {proposals.map((proposal) => {
            const cfg = STATUS_CONFIG[proposal.status];
            const proposalTotal = proposal.pricingItems.reduce((s, i) => s + (i.amount || 0), 0);
            return (
              <Card key={proposal.id} className="border-border/50 hover:border-violet-500/30 transition-colors group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold">{proposal.projectTitle}</span>
                        <Badge className={cfg.className}>{cfg.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        For: <span className="font-medium">{proposal.clientName}</span>
                        {" · "}{new Date(proposal.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                        <span className="text-muted-foreground">
                          {proposal.scopeItems.filter(Boolean).length} scope items
                        </span>
                        <span className="font-semibold text-violet-600 dark:text-violet-400">
                          ${proposalTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={proposal.status}
                        onValueChange={(v) => updateStatus(proposal.id, v as ProposalStatus)}
                      >
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setPreviewId(proposal.id === previewId ? null : proposal.id); }}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(proposal)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(proposal.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {previewId === proposal.id && previewProposal && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <ProposalPreview p={previewProposal} pricing={proposalTotal} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
