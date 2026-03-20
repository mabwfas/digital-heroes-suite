"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle,
  Plus,
  Trash2,
  Shield,
  UserX,
  TrendingDown,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface ChurnClient {
  id: string;
  name: string;
  lateResponses: number;     // 0-5
  reducedOrders: number;     // 0-5
  complaints: number;        // 0-5
  paymentDelays: number;     // 0-5
  engagementDrop: number;    // 0-5
  competitorMentions: number;// 0-5
  monthlyRevenue: number;
}

interface Warning {
  label: string;
  field: keyof ChurnClient;
  weight: number;
}

const WARNINGS: Warning[] = [
  { label: "Late Responses (0-5)", field: "lateResponses", weight: 15 },
  { label: "Reduced Orders (0-5)", field: "reducedOrders", weight: 20 },
  { label: "Complaints (0-5)", field: "complaints", weight: 20 },
  { label: "Payment Delays (0-5)", field: "paymentDelays", weight: 15 },
  { label: "Engagement Drop (0-5)", field: "engagementDrop", weight: 15 },
  { label: "Competitor Mentions (0-5)", field: "competitorMentions", weight: 15 },
];

function calcChurnRisk(client: ChurnClient): number {
  let score = 0;
  for (const w of WARNINGS) {
    const val = client[w.field] as number;
    score += (val / 5) * w.weight;
  }
  return Math.min(100, Math.round(score));
}

function riskLevel(pct: number): { label: string; cls: string; color: string } {
  if (pct >= 70) return { label: "High Risk", cls: "bg-red-500/10 text-red-600 border-0", color: "text-red-600" };
  if (pct >= 40) return { label: "Medium Risk", cls: "bg-amber-500/10 text-amber-600 border-0", color: "text-amber-600" };
  return { label: "Low Risk", cls: "bg-emerald-500/10 text-emerald-600 border-0", color: "text-emerald-600" };
}

function getRecommendations(client: ChurnClient): string[] {
  const recs: string[] = [];
  if (client.lateResponses >= 3) recs.push("Schedule a personal check-in call to re-engage");
  if (client.reducedOrders >= 3) recs.push("Offer a loyalty discount or value-added service");
  if (client.complaints >= 3) recs.push("Assign a dedicated account manager to resolve issues");
  if (client.paymentDelays >= 3) recs.push("Review payment terms and offer flexible options");
  if (client.engagementDrop >= 3) recs.push("Send a personalized success story or case study");
  if (client.competitorMentions >= 3) recs.push("Prepare a competitive comparison highlighting your strengths");
  if (recs.length === 0) recs.push("Continue regular communication and nurture the relationship");
  return recs;
}

export default function ChurnPredictorPage() {
  const [clients, setClients, hydrated] = useLocalStorage<ChurnClient[]>("analytics-churn-predictor", []);
  const [name, setName] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [scores, setScores] = useState<Record<string, string>>({});

  const summary = useMemo(() => {
    const high = clients.filter((c) => calcChurnRisk(c) >= 70).length;
    const medium = clients.filter((c) => { const r = calcChurnRisk(c); return r >= 40 && r < 70; }).length;
    const low = clients.filter((c) => calcChurnRisk(c) < 40).length;
    const atRiskRevenue = clients
      .filter((c) => calcChurnRisk(c) >= 40)
      .reduce((s, c) => s + c.monthlyRevenue, 0);
    return { high, medium, low, atRiskRevenue, total: clients.length };
  }, [clients]);

  function handleAdd() {
    if (!name.trim()) return;
    const client: ChurnClient = {
      id: generateId(),
      name: name.trim(),
      lateResponses: Math.min(5, parseInt(scores.lateResponses || "0") || 0),
      reducedOrders: Math.min(5, parseInt(scores.reducedOrders || "0") || 0),
      complaints: Math.min(5, parseInt(scores.complaints || "0") || 0),
      paymentDelays: Math.min(5, parseInt(scores.paymentDelays || "0") || 0),
      engagementDrop: Math.min(5, parseInt(scores.engagementDrop || "0") || 0),
      competitorMentions: Math.min(5, parseInt(scores.competitorMentions || "0") || 0),
      monthlyRevenue: parseFloat(monthlyRevenue) || 0,
    };
    setClients((prev) => [...prev, client]);
    setName(""); setMonthlyRevenue(""); setScores({});
  }

  if (!hydrated) return null;

  const sorted = [...clients].sort((a, b) => calcChurnRisk(b) - calcChurnRisk(a));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Churn Risk Predictor"
        description="Score clients on warning signs, predict churn risk percentage, and get action recommendations."
        icon={AlertTriangle}
        badge="Analytics"
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Clients", value: summary.total, color: "text-violet-600" },
          { label: "High Risk", value: summary.high, color: "text-red-600" },
          { label: "Medium Risk", value: summary.medium, color: "text-amber-600" },
          { label: "Low Risk", value: summary.low, color: "text-emerald-600" },
          { label: "At-Risk Revenue", value: `$${summary.atRiskRevenue.toLocaleString()}/mo`, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-violet-500" />
            Score Client
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <div className="space-y-1.5">
              <Label>Client Name *</Label>
              <Input placeholder="Acme Corp" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Monthly Revenue ($)</Label>
              <Input type="number" placeholder="5000" value={monthlyRevenue} onChange={(e) => setMonthlyRevenue(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {WARNINGS.map((w) => (
              <div key={w.field} className="space-y-1.5">
                <Label className="text-xs">{w.label}</Label>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  placeholder="0"
                  value={scores[w.field] || ""}
                  onChange={(e) => setScores((prev) => ({ ...prev, [w.field]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          <Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleAdd} disabled={!name.trim()}>
            <Plus className="h-4 w-4" />
            Assess Risk
          </Button>
        </CardContent>
      </Card>

      {clients.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Shield className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Score your first client to predict churn risk.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sorted.map((client) => {
            const risk = calcChurnRisk(client);
            const level = riskLevel(risk);
            const recs = getRecommendations(client);
            return (
              <Card key={client.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{client.name}</h3>
                        <Badge className={level.cls}>{level.label}</Badge>
                        {client.monthlyRevenue > 0 && (
                          <Badge variant="secondary" className="text-[10px]">${client.monthlyRevenue.toLocaleString()}/mo</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 bg-muted rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${risk >= 70 ? "bg-red-500" : risk >= 40 ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${risk}%` }}
                          />
                        </div>
                        <span className={`text-lg font-bold ${level.color}`}>{risk}%</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {WARNINGS.map((w) => {
                          const val = client[w.field] as number;
                          return (
                            <Badge key={w.field} variant="secondary" className={`text-[10px] ${val >= 4 ? "bg-red-500/10 text-red-600" : val >= 2 ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"} border-0`}>
                              {w.label.split(" (")[0]}: {val}/5
                            </Badge>
                          );
                        })}
                      </div>

                      <div className="mt-3 p-2 bg-muted/30 rounded text-xs space-y-1">
                        <p className="font-medium text-muted-foreground">Recommended Actions:</p>
                        {recs.map((r, i) => (
                          <p key={i} className="text-muted-foreground">• {r}</p>
                        ))}
                      </div>
                    </div>

                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setClients((prev) => prev.filter((x) => x.id !== client.id))}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
