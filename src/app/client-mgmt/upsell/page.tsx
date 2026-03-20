"use client";

import { useState, useMemo } from "react";
import {
  Rocket,
  Plus,
  Trash2,
  Edit2,
  Search,
  Check,
  Copy,
  DollarSign,
  Target,
  TrendingUp,
  Zap,
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
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type UpsellStatus = "identified" | "pitched" | "won" | "lost";

interface UpsellOpportunity {
  id: string;
  name: string;
  description: string;
  selected: boolean;
}

interface ClientUpsell {
  id: string;
  clientName: string;
  opportunities: UpsellOpportunity[];
  potentialScore: number;
  status: UpsellStatus;
  pitchText: string;
  estimatedValue: string;
  notes: string;
  createdAt: string;
}

const DEFAULT_OPPORTUNITIES: Omit<UpsellOpportunity, "id" | "selected">[] = [
  { name: "Speed Optimization", description: "Page load performance improvements, Core Web Vitals optimization" },
  { name: "SEO Services", description: "On-page SEO, keyword research, content strategy, link building" },
  { name: "Email Marketing", description: "Email campaign setup, automation flows, newsletter design" },
  { name: "App Integration", description: "Third-party app connections, API integrations, automation" },
  { name: "Website Redesign", description: "Full or partial redesign, UX improvements, mobile optimization" },
  { name: "Maintenance Plan", description: "Ongoing support, updates, security monitoring, backups" },
];

const STATUS_CONFIG: Record<UpsellStatus, { label: string; color: string; bg: string }> = {
  identified: { label: "Identified", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
  pitched: { label: "Pitched", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  won: { label: "Won", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  lost: { label: "Lost", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10" },
};

function generatePitch(clientName: string, opportunities: UpsellOpportunity[]): string {
  const selected = opportunities.filter((o) => o.selected);
  if (selected.length === 0) return "";

  let pitch = `Hi ${clientName},\n\n`;
  pitch += `Based on our work together, I've identified ${selected.length === 1 ? "an opportunity" : "some opportunities"} that could significantly benefit your business:\n\n`;

  selected.forEach((opp, i) => {
    pitch += `${i + 1}. ${opp.name}\n`;
    pitch += `   ${opp.description}\n\n`;
  });

  pitch += `I'd love to discuss how ${selected.length === 1 ? "this" : "these"} could help you achieve your goals. Would you be available for a quick call this week?\n\n`;
  pitch += `Best regards`;
  return pitch;
}

export default function UpsellPage() {
  const [clients, setClients] = useLocalStorage<ClientUpsell[]>("client-upsells", []);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | UpsellStatus>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPitch, setShowPitch] = useState<string | null>(null);

  // Form state
  const [formClient, setFormClient] = useState("");
  const [formOpps, setFormOpps] = useState<UpsellOpportunity[]>(() =>
    DEFAULT_OPPORTUNITIES.map((o) => ({ ...o, id: generateId(), selected: false }))
  );
  const [formStatus, setFormStatus] = useState<UpsellStatus>("identified");
  const [formValue, setFormValue] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch = c.clientName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "all" || c.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [clients, search, filterStatus]);

  const stats = useMemo(() => ({
    total: clients.length,
    identified: clients.filter((c) => c.status === "identified").length,
    pitched: clients.filter((c) => c.status === "pitched").length,
    won: clients.filter((c) => c.status === "won").length,
    lost: clients.filter((c) => c.status === "lost").length,
  }), [clients]);

  function openAdd() {
    setFormClient("");
    setFormOpps(DEFAULT_OPPORTUNITIES.map((o) => ({ ...o, id: generateId(), selected: false })));
    setFormStatus("identified");
    setFormValue("");
    setFormNotes("");
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(client: ClientUpsell) {
    setFormClient(client.clientName);
    setFormOpps(client.opportunities.map((o) => ({ ...o })));
    setFormStatus(client.status);
    setFormValue(client.estimatedValue);
    setFormNotes(client.notes);
    setEditingId(client.id);
    setShowForm(true);
  }

  function toggleOpp(id: string) {
    setFormOpps((prev) => prev.map((o) => (o.id === id ? { ...o, selected: !o.selected } : o)));
  }

  function handleSave() {
    if (!formClient.trim()) return;
    const selectedCount = formOpps.filter((o) => o.selected).length;
    const score = Math.round((selectedCount / formOpps.length) * 100);
    const pitchText = generatePitch(formClient, formOpps);

    if (editingId) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, clientName: formClient, opportunities: formOpps, potentialScore: score, status: formStatus, pitchText, estimatedValue: formValue, notes: formNotes }
            : c
        )
      );
    } else {
      const newClient: ClientUpsell = {
        id: generateId(),
        clientName: formClient,
        opportunities: formOpps,
        potentialScore: score,
        status: formStatus,
        pitchText,
        estimatedValue: formValue,
        notes: formNotes,
        createdAt: new Date().toISOString(),
      };
      setClients((prev) => [newClient, ...prev]);
    }
    setShowForm(false);
  }

  function updateStatus(id: string, status: UpsellStatus) {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }

  function handleDelete(id: string) {
    setClients((prev) => prev.filter((c) => c.id !== id));
  }

  function copyPitch(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upsell Detector"
        description="Identify and track upsell opportunities across your client base"
        icon={Rocket}
        badge="Upsell"
        replaces="Spreadsheet / CRM"
        actions={
          <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Evaluate Client
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total", value: stats.total, icon: Target, color: "text-violet-600 dark:text-violet-400" },
          { label: "Identified", value: stats.identified, icon: Zap, color: STATUS_CONFIG.identified.color },
          { label: "Pitched", value: stats.pitched, icon: Rocket, color: STATUS_CONFIG.pitched.color },
          { label: "Won", value: stats.won, icon: DollarSign, color: STATUS_CONFIG.won.color },
          { label: "Lost", value: stats.lost, icon: X, color: STATUS_CONFIG.lost.color },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4">
              <s.icon className={`h-4 w-4 ${s.color} mb-2`} />
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
          <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="identified">Identified</SelectItem>
            <SelectItem value="pitched">Pitched</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Client List */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center mb-4">
              <Rocket className="h-7 w-7 text-violet-400" />
            </div>
            <p className="font-medium text-muted-foreground mb-1">No upsell evaluations yet</p>
            <p className="text-sm text-muted-foreground/70">Evaluate a client to discover upsell opportunities</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((client) => {
            const statusCfg = STATUS_CONFIG[client.status];
            const selectedOpps = client.opportunities.filter((o) => o.selected);
            return (
              <Card key={client.id} className="border-border/50 hover:border-violet-500/30 transition-colors group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{client.clientName}</span>
                        <Badge className={`${statusCfg.bg} ${statusCfg.color} border-0`}>{statusCfg.label}</Badge>
                        <Badge variant="outline" className="text-[10px]">{client.potentialScore}% potential</Badge>
                        {client.estimatedValue && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px]">
                            {client.estimatedValue}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {selectedOpps.map((opp) => (
                          <Badge key={opp.id} variant="outline" className="text-[10px]">
                            {opp.name}
                          </Badge>
                        ))}
                        {selectedOpps.length === 0 && (
                          <span className="text-xs text-muted-foreground">No opportunities selected</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Select value={client.status} onValueChange={(v) => updateStatus(client.id, v as UpsellStatus)}>
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="identified">Identified</SelectItem>
                          <SelectItem value="pitched">Pitched</SelectItem>
                          <SelectItem value="won">Won</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {client.pitchText && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPitch(showPitch === client.id ? null : client.id)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(client)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(client.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {showPitch === client.id && client.pitchText && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-medium text-muted-foreground">Generated Pitch</p>
                        <Button variant="outline" size="sm" onClick={() => copyPitch(client.pitchText)} className="h-6 text-[10px]">
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                      </div>
                      <pre className="text-sm whitespace-pre-wrap bg-muted/30 rounded-lg p-4 font-sans">{client.pitchText}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Upsell Evaluation" : "Evaluate Client"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Client Name *</Label>
                <Input value={formClient} onChange={(e) => setFormClient(e.target.value)} placeholder="Client name" />
              </div>
              <div className="space-y-1.5">
                <Label>Estimated Value</Label>
                <Input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="e.g. $2,000" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Upsell Opportunities</Label>
              <p className="text-xs text-muted-foreground">Select opportunities relevant to this client</p>
              <div className="space-y-2">
                {formOpps.map((opp) => (
                  <div
                    key={opp.id}
                    onClick={() => toggleOpp(opp.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      opp.selected ? "border-violet-500/50 bg-violet-500/5" : "border-border/50 hover:border-border"
                    }`}
                  >
                    <div className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      opp.selected ? "bg-violet-600 border-violet-600" : "border-muted-foreground/30"
                    }`}>
                      {opp.selected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{opp.name}</p>
                      <p className="text-xs text-muted-foreground">{opp.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Any additional notes..." />
            </div>

            <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
              <span className="text-sm font-medium">Upsell Potential Score</span>
              <span className="text-lg font-bold text-violet-600">
                {Math.round((formOpps.filter((o) => o.selected).length / formOpps.length) * 100)}%
              </span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formClient.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              {editingId ? "Save Changes" : "Save Evaluation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
