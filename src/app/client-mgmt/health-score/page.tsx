"use client";

import { useState, useMemo } from "react";
import {
  HeartPulse,
  Plus,
  Trash2,
  Edit2,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  X,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface HealthFactors {
  responseTime: number;
  paymentTimeliness: number;
  projectSatisfaction: number;
  communicationQuality: number;
  upsellPotential: number;
}

interface ClientHealth {
  id: string;
  clientName: string;
  factors: HealthFactors;
  notes: string;
  lastUpdated: string;
}

const FACTOR_LABELS: Record<keyof HealthFactors, string> = {
  responseTime: "Response Time",
  paymentTimeliness: "Payment Timeliness",
  projectSatisfaction: "Project Satisfaction",
  communicationQuality: "Communication Quality",
  upsellPotential: "Upsell Potential",
};

const FACTOR_DESCRIPTIONS: Record<keyof HealthFactors, string> = {
  responseTime: "How quickly does the client respond?",
  paymentTimeliness: "Are invoices paid on time?",
  projectSatisfaction: "How satisfied is the client with deliverables?",
  communicationQuality: "How clear and constructive is communication?",
  upsellPotential: "Likelihood to purchase additional services?",
};

function getOverallScore(factors: HealthFactors): number {
  const values = Object.values(factors);
  return parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
}

function getRiskLevel(score: number): { label: string; color: string; bgColor: string; icon: typeof CheckCircle } {
  if (score >= 3.5) return { label: "Healthy", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-500/10", icon: CheckCircle };
  if (score >= 2.5) return { label: "At Risk", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-500/10", icon: AlertTriangle };
  return { label: "Critical", color: "text-red-600 dark:text-red-400", bgColor: "bg-red-500/10", icon: XCircle };
}

const EMPTY_FACTORS: HealthFactors = {
  responseTime: 3,
  paymentTimeliness: 3,
  projectSatisfaction: 3,
  communicationQuality: 3,
  upsellPotential: 3,
};

export default function HealthScorePage() {
  const [clients, setClients] = useLocalStorage<ClientHealth[]>("client-health-scores", []);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formFactors, setFormFactors] = useState<HealthFactors>(EMPTY_FACTORS);
  const [formNotes, setFormNotes] = useState("");

  const filtered = useMemo(() => {
    return clients.filter((c) => c.clientName.toLowerCase().includes(search.toLowerCase()));
  }, [clients, search]);

  const stats = useMemo(() => {
    const scores = clients.map((c) => getOverallScore(c.factors));
    return {
      total: clients.length,
      healthy: scores.filter((s) => s >= 3.5).length,
      atRisk: scores.filter((s) => s >= 2.5 && s < 3.5).length,
      critical: scores.filter((s) => s < 2.5).length,
      avgScore: clients.length > 0 ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0,
    };
  }, [clients]);

  function openAdd() {
    setFormName("");
    setFormFactors(EMPTY_FACTORS);
    setFormNotes("");
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(client: ClientHealth) {
    setFormName(client.clientName);
    setFormFactors({ ...client.factors });
    setFormNotes(client.notes);
    setEditingId(client.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!formName.trim()) return;
    if (editingId) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, clientName: formName, factors: formFactors, notes: formNotes, lastUpdated: new Date().toISOString() }
            : c
        )
      );
    } else {
      const newClient: ClientHealth = {
        id: generateId(),
        clientName: formName,
        factors: formFactors,
        notes: formNotes,
        lastUpdated: new Date().toISOString(),
      };
      setClients((prev) => [newClient, ...prev]);
    }
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setClients((prev) => prev.filter((c) => c.id !== id));
  }

  function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} onClick={() => onChange(star)} className="p-0.5">
            <Star
              className={`h-5 w-5 transition-colors ${
                star <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Health Score"
        description="Monitor client relationship health across key performance factors"
        icon={HeartPulse}
        badge="Health"
        replaces="Spreadsheet Tracking"
        actions={
          <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Score Client
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Clients", value: stats.total, color: "text-violet-600 dark:text-violet-400", icon: HeartPulse },
          { label: "Avg Score", value: `${stats.avgScore}/5`, color: "text-blue-600 dark:text-blue-400", icon: TrendingUp },
          { label: "Healthy", value: stats.healthy, color: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle },
          { label: "At Risk", value: stats.atRisk, color: "text-amber-600 dark:text-amber-400", icon: AlertTriangle },
          { label: "Critical", value: stats.critical, color: "text-red-600 dark:text-red-400", icon: XCircle },
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* At-Risk Alerts */}
      {clients.filter((c) => getOverallScore(c.factors) < 2.5).length > 0 && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="font-semibold text-sm text-red-600 dark:text-red-400">Critical Clients Requiring Attention</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {clients
                .filter((c) => getOverallScore(c.factors) < 2.5)
                .map((c) => (
                  <Badge key={c.id} className="bg-red-500/10 text-red-600 border-0">
                    {c.clientName} ({getOverallScore(c.factors)}/5)
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client List */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center mb-4">
              <HeartPulse className="h-7 w-7 text-violet-400" />
            </div>
            <p className="font-medium text-muted-foreground mb-1">No health scores yet</p>
            <p className="text-sm text-muted-foreground/70">Score your first client to start tracking health</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered
            .sort((a, b) => getOverallScore(a.factors) - getOverallScore(b.factors))
            .map((client) => {
              const overall = getOverallScore(client.factors);
              const risk = getRiskLevel(overall);
              const RiskIcon = risk.icon;
              return (
                <Card key={client.id} className="border-border/50 hover:border-violet-500/30 transition-colors group">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`h-10 w-10 rounded-full ${risk.bgColor} flex items-center justify-center shrink-0`}>
                          <RiskIcon className={`h-5 w-5 ${risk.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold truncate">{client.clientName}</span>
                            <Badge className={`${risk.bgColor} ${risk.color} border-0`}>{risk.label}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">{overall}/5</span>
                            <div className="flex gap-3 text-xs">
                              {(Object.keys(FACTOR_LABELS) as (keyof HealthFactors)[]).map((key) => (
                                <span key={key} className="flex items-center gap-1">
                                  {FACTOR_LABELS[key].split(" ")[0]}: <span className="font-medium text-foreground">{client.factors[key]}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(client)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(client.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Health Score" : "Score Client"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Client Name *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Client name" />
            </div>
            {(Object.keys(FACTOR_LABELS) as (keyof HealthFactors)[]).map((key) => (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label>{FACTOR_LABELS[key]}</Label>
                  <span className="text-xs text-muted-foreground">{formFactors[key]}/5</span>
                </div>
                <p className="text-xs text-muted-foreground">{FACTOR_DESCRIPTIONS[key]}</p>
                <StarRating
                  value={formFactors[key]}
                  onChange={(v) => setFormFactors((f) => ({ ...f, [key]: v }))}
                />
              </div>
            ))}
            <div className="pt-2 border-t border-border/50">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Overall Score</span>
                <span className="text-lg font-bold">{getOverallScore(formFactors)}/5</span>
              </div>
              <Badge className={`mt-1 ${getRiskLevel(getOverallScore(formFactors)).bgColor} ${getRiskLevel(getOverallScore(formFactors)).color} border-0`}>
                {getRiskLevel(getOverallScore(formFactors)).label}
              </Badge>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formName.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              {editingId ? "Save Changes" : "Save Score"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
