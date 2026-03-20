"use client";

import { useState, useMemo, useCallback } from "react";
import { Ticket, Plus, Search, Edit2, Trash2, Clock, X, AlertCircle } from "lucide-react";
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

type Priority = "low" | "medium" | "high" | "critical";
type Status = "open" | "in-progress" | "waiting" | "resolved";

interface SupportTicket {
  id: string;
  client: string;
  subject: string;
  description: string;
  priority: Priority;
  status: Status;
  assignee: string;
  createdAt: string;
  resolvedAt: string | null;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-blue-500/10 text-blue-600 border-0" },
  medium: { label: "Medium", color: "bg-amber-500/10 text-amber-600 border-0" },
  high: { label: "High", color: "bg-orange-500/10 text-orange-600 border-0" },
  critical: { label: "Critical", color: "bg-red-500/10 text-red-600 border-0" },
};

const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-blue-500/10 text-blue-600 border-0" },
  "in-progress": { label: "In Progress", color: "bg-violet-500/10 text-violet-600 border-0" },
  waiting: { label: "Waiting", color: "bg-amber-500/10 text-amber-600 border-0" },
  resolved: { label: "Resolved", color: "bg-emerald-500/10 text-emerald-600 border-0" },
};

const EMPTY: Omit<SupportTicket, "id" | "createdAt" | "resolvedAt"> = {
  client: "", subject: "", description: "", priority: "medium", status: "open", assignee: "",
};

function timeSince(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function TicketTrackerPage() {
  const [tickets, setTickets, hydrated] = useLocalStorage<SupportTicket[]>("support-tickets", []);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | Status>("all");
  const [filterPriority, setFilterPriority] = useState<"all" | Priority>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const matchSearch = !search || t.client.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || t.status === filterStatus;
      const matchPriority = filterPriority === "all" || t.priority === filterPriority;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tickets, search, filterStatus, filterPriority]);

  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in-progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  }), [tickets]);

  const openAdd = useCallback(() => { setForm(EMPTY); setEditingId(null); setShowForm(true); }, []);
  const openEdit = useCallback((t: SupportTicket) => {
    setForm({ client: t.client, subject: t.subject, description: t.description, priority: t.priority, status: t.status, assignee: t.assignee });
    setEditingId(t.id); setShowForm(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.subject.trim() || !form.client.trim()) return;
    if (editingId) {
      setTickets((prev) => prev.map((t) => {
        if (t.id !== editingId) return t;
        const resolvedAt = form.status === "resolved" && t.status !== "resolved" ? new Date().toISOString() : t.resolvedAt;
        return { ...t, ...form, resolvedAt };
      }));
    } else {
      setTickets((prev) => [{ ...form, id: generateId(), createdAt: new Date().toISOString(), resolvedAt: null }, ...prev]);
    }
    setShowForm(false); setEditingId(null);
  }, [form, editingId, setTickets]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Ticket Tracker"
        description="Track support tickets with priorities, statuses, assignments, and SLA timers."
        icon={Ticket}
        badge="Support"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Tickets", value: stats.total, icon: Ticket, color: "text-violet-600" },
          { label: "Open", value: stats.open, icon: AlertCircle, color: "text-blue-600" },
          { label: "In Progress", value: stats.inProgress, icon: Clock, color: "text-amber-600" },
          { label: "Resolved", value: stats.resolved, icon: Ticket, color: "text-emerald-600" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center mb-2">
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tickets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {(Object.entries(STATUS_CONFIG) as [Status, { label: string }][]).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as typeof filterPriority)}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {(Object.entries(PRIORITY_CONFIG) as [Priority, { label: string }][]).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">
          <Plus className="h-4 w-4 mr-2" />New Ticket
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Ticket className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">{tickets.length === 0 ? "No tickets yet." : "No matching tickets."}</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((ticket) => (
            <Card key={ticket.id} className="border-border/50 hover:border-violet-500/30 transition-colors group">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm truncate">{ticket.subject}</span>
                      <Badge className={STATUS_CONFIG[ticket.status].color}>{STATUS_CONFIG[ticket.status].label}</Badge>
                      <Badge className={PRIORITY_CONFIG[ticket.priority].color}>{PRIORITY_CONFIG[ticket.priority].label}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                      <span>Client: {ticket.client}</span>
                      {ticket.assignee && <span>Assigned: {ticket.assignee}</span>}
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeSince(ticket.createdAt)} ago</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(ticket)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => setTickets((p) => p.filter((t) => t.id !== ticket.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Ticket" : "New Support Ticket"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Client Name *</Label><Input placeholder="Client name" value={form.client} onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Assignee</Label><Input placeholder="Who's handling this?" value={form.assignee} onChange={(e) => setForm((f) => ({ ...f, assignee: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Subject *</Label><Input placeholder="Ticket subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea placeholder="Details..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Priority }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.entries(PRIORITY_CONFIG) as [Priority, { label: string }][]).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as Status }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.entries(STATUS_CONFIG) as [Status, { label: string }][]).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.subject.trim() || !form.client.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">{editingId ? "Save" : "Create Ticket"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
