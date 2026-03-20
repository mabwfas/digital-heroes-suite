"use client";

import { useState, useMemo, useCallback } from "react";
import { Timer, Plus, Trash2, AlertTriangle, CheckCircle, Clock, Edit2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type Tier = "standard" | "priority" | "critical";

interface SLATier {
  tier: Tier;
  responseHours: number;
  resolutionHours: number;
}

interface SLATicket {
  id: string;
  client: string;
  subject: string;
  tier: Tier;
  openedAt: string;
  respondedAt: string | null;
  resolvedAt: string | null;
}

const DEFAULT_TIERS: SLATier[] = [
  { tier: "standard", responseHours: 24, resolutionHours: 72 },
  { tier: "priority", responseHours: 8, resolutionHours: 24 },
  { tier: "critical", responseHours: 2, resolutionHours: 8 },
];

const TIER_CONFIG: Record<Tier, { label: string; color: string }> = {
  standard: { label: "Standard", color: "bg-blue-500/10 text-blue-600 border-0" },
  priority: { label: "Priority", color: "bg-amber-500/10 text-amber-600 border-0" },
  critical: { label: "Critical", color: "bg-red-500/10 text-red-600 border-0" },
};

function hoursSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
}

function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours * 10) / 10}h`;
  return `${Math.round(hours / 24 * 10) / 10}d`;
}

const EMPTY: Omit<SLATicket, "id" | "openedAt" | "respondedAt" | "resolvedAt"> = {
  client: "", subject: "", tier: "standard",
};

export default function SLATrackerPage() {
  const [tiers, setTiers, hydrated] = useLocalStorage<SLATier[]>("sla-tiers", DEFAULT_TIERS);
  const [tickets, setTickets] = useLocalStorage<SLATicket[]>("sla-tickets", []);
  const [showForm, setShowForm] = useState(false);
  const [showTierEdit, setShowTierEdit] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const stats = useMemo(() => {
    const total = tickets.length;
    const responded = tickets.filter((t) => t.respondedAt !== null).length;
    const resolved = tickets.filter((t) => t.resolvedAt !== null).length;
    let compliant = 0;
    let overdue = 0;
    tickets.forEach((t) => {
      const tierDef = tiers.find((d) => d.tier === t.tier) || DEFAULT_TIERS[0];
      const elapsed = t.respondedAt ? (new Date(t.respondedAt).getTime() - new Date(t.openedAt).getTime()) / (1000 * 60 * 60) : hoursSince(t.openedAt);
      if (elapsed <= tierDef.responseHours) compliant++;
      if (!t.respondedAt && elapsed > tierDef.responseHours) overdue++;
    });
    const compliance = total > 0 ? Math.round((compliant / total) * 100) : 100;
    return { total, responded, resolved, compliance, overdue };
  }, [tickets, tiers]);

  const handleSave = useCallback(() => {
    if (!form.client.trim() || !form.subject.trim()) return;
    setTickets((prev) => [{ ...form, id: generateId(), openedAt: new Date().toISOString(), respondedAt: null, resolvedAt: null }, ...prev]);
    setShowForm(false);
  }, [form, setTickets]);

  const markResponded = useCallback((id: string) => {
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, respondedAt: new Date().toISOString() } : t));
  }, [setTickets]);

  const markResolved = useCallback((id: string) => {
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, resolvedAt: new Date().toISOString(), respondedAt: t.respondedAt || new Date().toISOString() } : t));
  }, [setTickets]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="SLA Tracker"
        description="Define SLA tiers, track response times, and monitor compliance rates."
        icon={Timer}
        badge="Support"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowTierEdit(true)}><Edit2 className="h-4 w-4" />Edit Tiers</Button>
            <Button size="sm" className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={() => { setForm(EMPTY); setShowForm(true); }}><Plus className="h-4 w-4" />New Ticket</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Tickets", value: stats.total, color: "text-violet-600" },
          { label: "Responded", value: stats.responded, color: "text-blue-600" },
          { label: "Resolved", value: stats.resolved, color: "text-emerald-600" },
          { label: "SLA Compliance", value: `${stats.compliance}%`, color: stats.compliance >= 90 ? "text-emerald-600" : stats.compliance >= 70 ? "text-amber-600" : "text-red-600" },
          { label: "Overdue", value: stats.overdue, color: stats.overdue > 0 ? "text-red-600" : "text-emerald-600" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">SLA Tiers</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {tiers.map((t) => (
              <div key={t.tier} className="rounded-lg border p-3">
                <Badge className={TIER_CONFIG[t.tier].color}>{TIER_CONFIG[t.tier].label}</Badge>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p>Response: <strong>{t.responseHours}h</strong></p>
                  <p>Resolution: <strong>{t.resolutionHours}h</strong></p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {tickets.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Timer className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No tickets tracked yet.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {tickets.map((ticket) => {
            const tierDef = tiers.find((d) => d.tier === ticket.tier) || DEFAULT_TIERS[0];
            const elapsed = hoursSince(ticket.openedAt);
            const isOverdue = !ticket.respondedAt && elapsed > tierDef.responseHours;
            return (
              <Card key={ticket.id} className={`border-border/50 ${isOverdue ? "border-red-500/50" : ""} group`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm">{ticket.subject}</span>
                        <Badge className={TIER_CONFIG[ticket.tier].color}>{TIER_CONFIG[ticket.tier].label}</Badge>
                        {ticket.resolvedAt ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-0"><CheckCircle className="h-3 w-3 mr-0.5" />Resolved</Badge>
                        ) : ticket.respondedAt ? (
                          <Badge className="bg-blue-500/10 text-blue-600 border-0">Responded</Badge>
                        ) : isOverdue ? (
                          <Badge className="bg-red-500/10 text-red-600 border-0"><AlertTriangle className="h-3 w-3 mr-0.5" />Overdue</Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-600 border-0"><Clock className="h-3 w-3 mr-0.5" />Pending</Badge>
                        )}
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>Client: {ticket.client}</span>
                        <span>Opened: {formatDuration(elapsed)} ago</span>
                        <span>SLA: {tierDef.responseHours}h response</span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!ticket.respondedAt && <Button variant="outline" size="sm" onClick={() => markResponded(ticket.id)}>Responded</Button>}
                      {!ticket.resolvedAt && <Button variant="outline" size="sm" onClick={() => markResolved(ticket.id)}>Resolved</Button>}
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setTickets((p) => p.filter((t) => t.id !== ticket.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New SLA Ticket</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label>Client *</Label><Input value={form.client} onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Subject *</Label><Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Tier</Label>
              <Select value={form.tier} onValueChange={(v) => setForm((f) => ({ ...f, tier: v as Tier }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(Object.entries(TIER_CONFIG) as [Tier, { label: string }][]).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.client.trim() || !form.subject.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">Create</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTierEdit} onOpenChange={setShowTierEdit}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit SLA Tiers</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {tiers.map((t, i) => (
              <div key={t.tier} className="grid grid-cols-3 gap-3 items-end">
                <div><Label className="text-xs">{TIER_CONFIG[t.tier].label}</Label></div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Response (h)</Label>
                  <Input type="number" value={t.responseHours} onChange={(e) => setTiers((prev) => prev.map((x, j) => j === i ? { ...x, responseHours: Number(e.target.value) || 1 } : x))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Resolution (h)</Label>
                  <Input type="number" value={t.resolutionHours} onChange={(e) => setTiers((prev) => prev.map((x, j) => j === i ? { ...x, resolutionHours: Number(e.target.value) || 1 } : x))} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end"><Button onClick={() => setShowTierEdit(false)}>Done</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
