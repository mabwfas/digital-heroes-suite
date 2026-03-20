"use client";

import { useState, useMemo } from "react";
import {
  Inbox,
  Plus,
  Trash2,
  Search,
  Mail,
  Phone,
  MessageSquare,
  Video,
  Filter,
  Bell,
  Check,
  Calendar,
  X,
  ChevronDown,
  ChevronRight,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type CommType = "email" | "call" | "chat" | "meeting";

interface Communication {
  id: string;
  clientName: string;
  type: CommType;
  summary: string;
  actionItems: string;
  date: string;
  isRead: boolean;
  hasAction: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<CommType, { label: string; icon: typeof Mail; color: string; bg: string }> = {
  email: { label: "Email", icon: Mail, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
  call: { label: "Call", icon: Phone, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  chat: { label: "Chat", icon: MessageSquare, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
  meeting: { label: "Meeting", icon: Video, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-500/10" },
};

export default function InboxPage() {
  const [comms, setComms] = useLocalStorage<Communication[]>("client-inbox", []);
  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState("all");
  const [filterType, setFilterType] = useState<"all" | CommType>("all");
  const [showForm, setShowForm] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  // Form state
  const [formClient, setFormClient] = useState("");
  const [formType, setFormType] = useState<CommType>("email");
  const [formSummary, setFormSummary] = useState("");
  const [formActions, setFormActions] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formHasAction, setFormHasAction] = useState(false);

  const clients = useMemo(() => {
    const names = Array.from(new Set(comms.map((c) => c.clientName)));
    return names.sort();
  }, [comms]);

  const filtered = useMemo(() => {
    return comms.filter((c) => {
      const matchesSearch = c.summary.toLowerCase().includes(search.toLowerCase()) ||
        c.clientName.toLowerCase().includes(search.toLowerCase()) ||
        c.actionItems.toLowerCase().includes(search.toLowerCase());
      const matchesClient = filterClient === "all" || c.clientName === filterClient;
      const matchesType = filterType === "all" || c.type === filterType;
      return matchesSearch && matchesClient && matchesType;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [comms, search, filterClient, filterType]);

  const stats = useMemo(() => ({
    total: comms.length,
    unread: comms.filter((c) => !c.isRead).length,
    actionRequired: comms.filter((c) => c.hasAction && !c.isRead).length,
    thisWeek: comms.filter((c) => {
      const d = new Date(c.date);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= weekAgo;
    }).length,
  }), [comms]);

  // Group by client for timeline view
  const groupedByClient = useMemo(() => {
    const groups: Record<string, Communication[]> = {};
    for (const c of filtered) {
      if (!groups[c.clientName]) groups[c.clientName] = [];
      groups[c.clientName].push(c);
    }
    return groups;
  }, [filtered]);

  function handleSave() {
    if (!formClient.trim() || !formSummary.trim()) return;
    const comm: Communication = {
      id: generateId(),
      clientName: formClient,
      type: formType,
      summary: formSummary,
      actionItems: formActions,
      date: formDate,
      isRead: false,
      hasAction: formHasAction,
      createdAt: new Date().toISOString(),
    };
    setComms((prev) => [comm, ...prev]);
    setShowForm(false);
    setFormClient("");
    setFormSummary("");
    setFormActions("");
    setFormHasAction(false);
  }

  function toggleRead(id: string) {
    setComms((prev) => prev.map((c) => (c.id === id ? { ...c, isRead: !c.isRead } : c)));
  }

  function toggleAction(id: string) {
    setComms((prev) => prev.map((c) => (c.id === id ? { ...c, hasAction: !c.hasAction } : c)));
  }

  function handleDelete(id: string) {
    setComms((prev) => prev.filter((c) => c.id !== id));
  }

  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unified Client Inbox"
        description="Log and track all client communications in one place"
        icon={Inbox}
        badge="Inbox"
        replaces="Email / Slack / Notion"
        actions={
          <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Log Communication
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: Inbox, color: "text-violet-600 dark:text-violet-400" },
          { label: "Unread", value: stats.unread, icon: Mail, color: "text-blue-600 dark:text-blue-400" },
          { label: "Action Required", value: stats.actionRequired, icon: Bell, color: "text-red-600 dark:text-red-400" },
          { label: "This Week", value: stats.thisWeek, icon: Calendar, color: "text-emerald-600 dark:text-emerald-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search communications..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterClient} onValueChange={(v) => setFilterClient(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="chat">Chat</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")} className={viewMode === "list" ? "bg-violet-600 text-white" : ""}>
            List
          </Button>
          <Button variant={viewMode === "timeline" ? "default" : "outline"} size="sm" onClick={() => setViewMode("timeline")} className={viewMode === "timeline" ? "bg-violet-600 text-white" : ""}>
            Timeline
          </Button>
        </div>
      </div>

      {/* Communications */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center mb-4">
              <Inbox className="h-7 w-7 text-violet-400" />
            </div>
            <p className="font-medium text-muted-foreground mb-1">No communications logged</p>
            <p className="text-sm text-muted-foreground/70">Log your first client communication</p>
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <div className="grid gap-2">
          {filtered.map((comm) => {
            const cfg = TYPE_CONFIG[comm.type];
            const TypeIcon = cfg.icon;
            return (
              <Card key={comm.id} className={`border-border/50 hover:border-violet-500/30 transition-colors group ${!comm.isRead ? "bg-violet-500/[0.02]" : ""}`}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                      <TypeIcon className={`h-4 w-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {!comm.isRead && <div className="h-2 w-2 rounded-full bg-violet-500 shrink-0" />}
                        <span className={`font-medium text-sm truncate ${!comm.isRead ? "font-semibold" : ""}`}>{comm.clientName}</span>
                        <Badge className={`${cfg.bg} ${cfg.color} border-0 text-[10px]`}>{cfg.label}</Badge>
                        {comm.hasAction && <Badge className="bg-red-500/10 text-red-600 border-0 text-[10px]">Action Required</Badge>}
                        <span className="text-xs text-muted-foreground ml-auto shrink-0">{new Date(comm.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{comm.summary}</p>
                      {comm.actionItems && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 truncate">Action: {comm.actionItems}</p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleRead(comm.id)} title={comm.isRead ? "Mark unread" : "Mark read"}>
                        <Check className={`h-3.5 w-3.5 ${comm.isRead ? "text-emerald-500" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleAction(comm.id)} title={comm.hasAction ? "Clear action" : "Flag action"}>
                        <Bell className={`h-3.5 w-3.5 ${comm.hasAction ? "text-red-500" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => handleDelete(comm.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Timeline view */
        <div className="space-y-4">
          {Object.entries(groupedByClient).map(([clientName, clientComms]) => (
            <Card key={clientName} className="border-border/50">
              <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedClient(expandedClient === clientName ? null : clientName)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {expandedClient === clientName ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <CardTitle className="text-base">{clientName}</CardTitle>
                    <Badge variant="outline" className="text-[10px]">{clientComms.length} messages</Badge>
                    {clientComms.some((c) => !c.isRead) && (
                      <Badge className="bg-violet-500/10 text-violet-600 border-0 text-[10px]">
                        {clientComms.filter((c) => !c.isRead).length} unread
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              {expandedClient === clientName && (
                <CardContent className="pt-0">
                  <div className="border-l-2 border-border/50 ml-4 space-y-3 pl-4">
                    {clientComms.map((comm) => {
                      const cfg = TYPE_CONFIG[comm.type];
                      const TypeIcon = cfg.icon;
                      return (
                        <div key={comm.id} className="relative">
                          <div className={`absolute -left-[1.35rem] top-1 h-3 w-3 rounded-full border-2 border-background ${!comm.isRead ? "bg-violet-500" : "bg-muted-foreground/30"}`} />
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <TypeIcon className={`h-3.5 w-3.5 ${cfg.color}`} />
                                <Badge className={`${cfg.bg} ${cfg.color} border-0 text-[10px]`}>{cfg.label}</Badge>
                                <span className="text-xs text-muted-foreground">{new Date(comm.date).toLocaleDateString()}</span>
                                {comm.hasAction && <Badge className="bg-red-500/10 text-red-600 border-0 text-[10px]">Action</Badge>}
                              </div>
                              <p className="text-sm">{comm.summary}</p>
                              {comm.actionItems && <p className="text-xs text-amber-600 mt-0.5">Action: {comm.actionItems}</p>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Communication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Client Name *</Label>
                <Input value={formClient} onChange={(e) => setFormClient(e.target.value)} placeholder="Client name" list="client-names" />
                <datalist id="client-names">
                  {clients.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as CommType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="chat">Chat</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Summary *</Label>
              <Textarea rows={3} value={formSummary} onChange={(e) => setFormSummary(e.target.value)} placeholder="Brief summary of the communication..." />
            </div>
            <div className="space-y-1.5">
              <Label>Action Items</Label>
              <Textarea rows={2} value={formActions} onChange={(e) => setFormActions(e.target.value)} placeholder="Any follow-up actions needed..." />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFormHasAction(!formHasAction)}
                className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${formHasAction ? "bg-red-500 border-red-500" : "border-muted-foreground/30"}`}
              >
                {formHasAction && <Check className="h-3 w-3 text-white" />}
              </button>
              <Label className="cursor-pointer" onClick={() => setFormHasAction(!formHasAction)}>Flag as action required</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formClient.trim() || !formSummary.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
