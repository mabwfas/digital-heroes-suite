"use client";

import { useState, useMemo } from "react";
import {
  Handshake,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  TrendingUp,
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type DealStatus = "pitched" | "negotiating" | "confirmed" | "delivered" | "paid";

interface Deal {
  id: string;
  brand: string;
  contact: string;
  email: string;
  dealValue: number;
  deliverables: string;
  deadline: string;
  status: DealStatus;
  notes: string;
  createdAt: string;
}

interface RateCard {
  integration: number;
  dedicated: number;
  shorts: number;
}

const STATUS_CONFIG: Record<DealStatus, { label: string; className: string }> = {
  pitched: { label: "Pitched", className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-0" },
  negotiating: { label: "Negotiating", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0" },
  confirmed: { label: "Confirmed", className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-0" },
  delivered: { label: "Delivered", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0" },
  paid: { label: "Paid", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0" },
};

const EMPTY_FORM: Omit<Deal, "id" | "createdAt"> = {
  brand: "", contact: "", email: "", dealValue: 0, deliverables: "", deadline: "", status: "pitched", notes: "",
};

export default function SponsorshipPage() {
  const [deals, setDeals, hydrated] = useLocalStorage<Deal[]>("yt-sponsorship-deals", []);
  const [rateCard, setRateCard] = useLocalStorage<RateCard>("yt-rate-card", { integration: 500, dedicated: 2000, shorts: 250 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | DealStatus>("all");

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      const matchSearch = d.brand.toLowerCase().includes(search.toLowerCase()) || d.contact.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || d.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [deals, search, filterStatus]);

  const pipelineStats = useMemo(() => {
    const statuses: DealStatus[] = ["pitched", "negotiating", "confirmed", "delivered", "paid"];
    return statuses.map((s) => {
      const items = deals.filter((d) => d.status === s);
      return { status: s, count: items.length, total: items.reduce((sum, d) => sum + d.dealValue, 0) };
    });
  }, [deals]);

  const totalRevenue = useMemo(() => deals.filter((d) => d.status === "paid").reduce((s, d) => s + d.dealValue, 0), [deals]);
  const pipelineValue = useMemo(() => deals.filter((d) => d.status !== "paid").reduce((s, d) => s + d.dealValue, 0), [deals]);

  function openAdd() { setForm(EMPTY_FORM); setEditingId(null); setDialogOpen(true); }
  function openEdit(deal: Deal) {
    setForm({ brand: deal.brand, contact: deal.contact, email: deal.email, dealValue: deal.dealValue, deliverables: deal.deliverables, deadline: deal.deadline, status: deal.status, notes: deal.notes });
    setEditingId(deal.id);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.brand.trim()) return;
    if (editingId) {
      setDeals((prev) => prev.map((d) => (d.id === editingId ? { ...d, ...form } : d)));
    } else {
      setDeals((prev) => [{ ...form, id: generateId(), createdAt: new Date().toISOString() }, ...prev]);
    }
    setDialogOpen(false);
    setEditingId(null);
  }

  function handleDelete(id: string) {
    setDeals((prev) => prev.filter((d) => d.id !== id));
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sponsorship & Brand Deal CRM"
        description="Track sponsorship deals, manage your rate card, and monitor revenue"
        icon={Handshake}
        badge="YouTube"
        replaces="Notion / Spreadsheets"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mb-2" />
            <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Revenue (Paid)</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400 mb-2" />
            <p className="text-2xl font-bold">${pipelineValue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Pipeline Value</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <Handshake className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-2" />
            <p className="text-2xl font-bold">{deals.length}</p>
            <p className="text-xs text-muted-foreground">Total Deals</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400 mb-2" />
            <p className="text-2xl font-bold">${deals.length > 0 ? Math.round(deals.reduce((s, d) => s + d.dealValue, 0) / deals.length).toLocaleString() : 0}</p>
            <p className="text-xs text-muted-foreground">Avg Deal Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-5 gap-2">
        {pipelineStats.map((p) => (
          <Card key={p.status} className="border-border/50">
            <CardContent className="p-3 text-center">
              <Badge className={`${STATUS_CONFIG[p.status].className} mb-1`}>{STATUS_CONFIG[p.status].label}</Badge>
              <p className="text-lg font-bold">{p.count}</p>
              <p className="text-xs text-muted-foreground">${p.total.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="deals">
        <TabsList>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="rates">Rate Card</TabsTrigger>
        </TabsList>

        <TabsContent value="deals" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search deals..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {(["pitched", "negotiating", "confirmed", "delivered", "paid"] as DealStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              <Plus className="h-4 w-4 mr-2" />Add Deal
            </Button>
          </div>

          {filtered.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center">
              <Handshake className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{deals.length === 0 ? "No deals yet. Add your first sponsorship deal!" : "No deals match your filter."}</p>
            </CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {filtered.map((deal) => (
                <Card key={deal.id} className="border-border/50 hover:border-violet-500/30 transition-colors group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{deal.brand}</span>
                          <Badge className={STATUS_CONFIG[deal.status].className}>{STATUS_CONFIG[deal.status].label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{deal.contact}{deal.email ? ` (${deal.email})` : ""}</p>
                        {deal.deliverables && <p className="text-xs text-muted-foreground mt-1">Deliverables: {deal.deliverables}</p>}
                        {deal.deadline && <p className="text-xs text-muted-foreground">Deadline: {deal.deadline}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-lg">${deal.dealValue.toLocaleString()}</p>
                        <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(deal)}><Edit2 className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(deal.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Rate Card</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Integration ($)</Label>
                  <Input type="number" value={rateCard.integration || ""} onChange={(e) => setRateCard((prev) => ({ ...prev, integration: parseFloat(e.target.value) || 0 }))} />
                  <p className="text-xs text-muted-foreground">30-60s mention within a video</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Dedicated Video ($)</Label>
                  <Input type="number" value={rateCard.dedicated || ""} onChange={(e) => setRateCard((prev) => ({ ...prev, dedicated: parseFloat(e.target.value) || 0 }))} />
                  <p className="text-xs text-muted-foreground">Full video about the brand</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Shorts / Reel ($)</Label>
                  <Input type="number" value={rateCard.shorts || ""} onChange={(e) => setRateCard((prev) => ({ ...prev, shorts: parseFloat(e.target.value) || 0 }))} />
                  <p className="text-xs text-muted-foreground">Short-form video content</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Deal" : "Add New Deal"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Brand Name *</Label><Input value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Contact Person</Label><Input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Deal Value ($)</Label><Input type="number" value={form.dealValue || ""} onChange={(e) => setForm((f) => ({ ...f, dealValue: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Deadline</Label><Input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} /></div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as DealStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["pitched", "negotiating", "confirmed", "delivered", "paid"] as DealStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Deliverables</Label><Input value={form.deliverables} onChange={(e) => setForm((f) => ({ ...f, deliverables: e.target.value }))} placeholder="e.g., 1 integration + 2 shorts" /></div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.brand.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              {editingId ? "Save Changes" : "Add Deal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
