"use client";

import { useState, useMemo } from "react";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  DollarSign,
  TrendingUp,
  UserCheck,
  UserPlus,
  Mail,
  Phone,
  Building2,
  Globe,
  StickyNote,
  X,
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
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type ClientStatus = "active" | "inactive" | "lead";
type Platform = "Fiverr" | "Upwork" | "Direct" | "Other";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: ClientStatus;
  notes: string;
  platform: Platform;
  totalSpent: number;
  createdAt: string;
}

const STATUS_CONFIG: Record<ClientStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0" },
  inactive: { label: "Inactive", className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-0" },
  lead: { label: "Lead", className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-0" },
};

const PLATFORM_CONFIG: Record<Platform, { className: string }> = {
  Fiverr: { className: "bg-green-500/10 text-green-700 dark:text-green-400 border-0" },
  Upwork: { className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-0" },
  Direct: { className: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-0" },
  Other: { className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-0" },
};

const EMPTY_FORM: Omit<Client, "id" | "createdAt"> = {
  name: "",
  email: "",
  phone: "",
  company: "",
  status: "lead",
  notes: "",
  platform: "Direct",
  totalSpent: 0,
};

export default function CRMPage() {
  const [clients, setClients] = useLocalStorage<Client[]>("crm-clients", []);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | ClientStatus>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewClient, setViewClient] = useState<Client | null>(null);
  const [form, setForm] = useState<Omit<Client, "id" | "createdAt">>(EMPTY_FORM);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.company.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "all" || c.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [clients, search, filterStatus]);

  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    leads: clients.filter((c) => c.status === "lead").length,
    revenue: clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
  }), [clients]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(client: Client) {
    setForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      status: client.status,
      notes: client.notes,
      platform: client.platform,
      totalSpent: client.totalSpent,
    });
    setEditingId(client.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editingId) {
      setClients((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, ...form } : c))
      );
    } else {
      const newClient: Client = {
        ...form,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      setClients((prev) => [newClient, ...prev]);
    }
    setShowForm(false);
    setEditingId(null);
  }

  function handleDelete(id: string) {
    setClients((prev) => prev.filter((c) => c.id !== id));
    if (viewClient?.id === id) setViewClient(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client CRM"
        description="Manage your clients, track relationships and monitor revenue"
        icon={Users}
        badge="CRM"
        replaces="HubSpot / Notion CRM"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Clients", value: stats.total, icon: Users, color: "text-violet-600 dark:text-violet-400" },
          { label: "Active Clients", value: stats.active, icon: UserCheck, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Leads", value: stats.leads, icon: UserPlus, color: "text-pink-600 dark:text-pink-400" },
          { label: "Total Revenue", value: `$${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "text-amber-600 dark:text-amber-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <TrendingUp className="h-3 w-3 text-emerald-500" />
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
          <Input
            placeholder="Search clients by name, email, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={openAdd}
          className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Client List */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center mb-4">
              <Users className="h-7 w-7 text-violet-400" />
            </div>
            <p className="font-medium text-muted-foreground mb-1">No clients found</p>
            <p className="text-sm text-muted-foreground/70">
              {search || filterStatus !== "all" ? "Try adjusting your search or filter" : "Add your first client to get started"}
            </p>
            {!search && filterStatus === "all" && (
              <Button onClick={openAdd} className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Add First Client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((client) => (
            <Card key={client.id} className="border-border/50 hover:border-violet-500/30 transition-colors group">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold truncate">{client.name}</span>
                      <Badge className={STATUS_CONFIG[client.status].className}>
                        {STATUS_CONFIG[client.status].label}
                      </Badge>
                      <Badge className={PLATFORM_CONFIG[client.platform].className}>
                        {client.platform}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {client.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {client.email}
                        </span>
                      )}
                      {client.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {client.phone}
                        </span>
                      )}
                      {client.company && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {client.company}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="font-semibold text-sm">${(client.totalSpent || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">total spent</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewClient(client)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(client)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-destructive"
                        onClick={() => handleDelete(client.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Client" : "Add New Client"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input
                  placeholder="Company name"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ClientStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm((f) => ({ ...f, platform: v as Platform }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fiverr">Fiverr</SelectItem>
                    <SelectItem value="Upwork">Upwork</SelectItem>
                    <SelectItem value="Direct">Direct</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Total Spent ($)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.totalSpent || ""}
                  onChange={(e) => setForm((f) => ({ ...f, totalSpent: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                placeholder="Client notes, preferences, special requirements..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0"
            >
              {editingId ? "Save Changes" : "Add Client"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Client Dialog */}
      <Dialog open={!!viewClient} onOpenChange={(o) => !o && setViewClient(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
          </DialogHeader>
          {viewClient && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                  {viewClient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{viewClient.name}</h3>
                  {viewClient.company && <p className="text-muted-foreground text-sm">{viewClient.company}</p>}
                  <div className="flex gap-2 mt-1">
                    <Badge className={STATUS_CONFIG[viewClient.status].className}>
                      {STATUS_CONFIG[viewClient.status].label}
                    </Badge>
                    <Badge className={PLATFORM_CONFIG[viewClient.platform].className}>
                      {viewClient.platform}
                    </Badge>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-sm">
                {viewClient.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{viewClient.email}</span>
                  </div>
                )}
                {viewClient.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{viewClient.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">${(viewClient.totalSpent || 0).toLocaleString()} total spent</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span>{viewClient.platform}</span>
                </div>
              </div>
              {viewClient.notes && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <StickyNote className="h-4 w-4 text-muted-foreground" /> Notes
                    </div>
                    <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">{viewClient.notes}</p>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex justify-between">
                <p className="text-xs text-muted-foreground">
                  Added {new Date(viewClient.createdAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { openEdit(viewClient); setViewClient(null); }}>
                    <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(viewClient.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
