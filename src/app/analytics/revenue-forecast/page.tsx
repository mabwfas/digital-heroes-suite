"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  Plus,
  Trash2,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface PipelineDeal {
  id: string;
  name: string;
  value: number;
  probability: number;
  expectedCloseMonth: number; // months from now
}

interface ForecastConfig {
  monthlyRecurring: number;
  seasonalQ1: number;
  seasonalQ2: number;
  seasonalQ3: number;
  seasonalQ4: number;
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

const DEFAULT_CONFIG: ForecastConfig = {
  monthlyRecurring: 0,
  seasonalQ1: 100,
  seasonalQ2: 100,
  seasonalQ3: 100,
  seasonalQ4: 100,
};

export default function RevenueForecastPage() {
  const [deals, setDeals, hydrated] = useLocalStorage<PipelineDeal[]>("analytics-revenue-forecast-deals", []);
  const [config, setConfig, hydrated2] = useLocalStorage<ForecastConfig>("analytics-revenue-forecast-config", DEFAULT_CONFIG);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [probability, setProbability] = useState("50");
  const [closeMonth, setCloseMonth] = useState("1");

  const forecast = useMemo(() => {
    const months: { month: number; label: string; pipeline: number; recurring: number; seasonal: number; total: number }[] = [];
    const now = new Date();

    for (let i = 1; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const qtr = Math.floor(d.getMonth() / 3) + 1;
      const seasonalPct = qtr === 1 ? config.seasonalQ1 : qtr === 2 ? config.seasonalQ2 : qtr === 3 ? config.seasonalQ3 : config.seasonalQ4;
      const pipelineRev = deals
        .filter((deal) => deal.expectedCloseMonth === i)
        .reduce((s, deal) => s + (deal.value * deal.probability / 100), 0);
      const recurringAdj = config.monthlyRecurring * (seasonalPct / 100);
      months.push({
        month: i,
        label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        pipeline: Math.round(pipelineRev),
        recurring: Math.round(recurringAdj),
        seasonal: seasonalPct,
        total: Math.round(pipelineRev + recurringAdj),
      });
    }
    return months;
  }, [deals, config]);

  const summaryPeriods = useMemo(() => {
    const m3 = forecast.slice(0, 3).reduce((s, m) => s + m.total, 0);
    const m6 = forecast.slice(0, 6).reduce((s, m) => s + m.total, 0);
    const m12 = forecast.reduce((s, m) => s + m.total, 0);
    const weightedPipeline = deals.reduce((s, d) => s + (d.value * d.probability / 100), 0);
    return { m3, m6, m12, weightedPipeline };
  }, [forecast, deals]);

  function handleAddDeal() {
    if (!name.trim()) return;
    const deal: PipelineDeal = {
      id: generateId(),
      name: name.trim(),
      value: parseFloat(value) || 0,
      probability: parseInt(probability) || 50,
      expectedCloseMonth: parseInt(closeMonth) || 1,
    };
    setDeals((prev) => [...prev, deal]);
    setName(""); setValue(""); setProbability("50"); setCloseMonth("1");
  }

  function updateConfig(field: keyof ForecastConfig, val: string) {
    setConfig((prev) => ({ ...prev, [field]: parseFloat(val) || 0 }));
  }

  if (!hydrated || !hydrated2) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue Forecaster"
        description="Forecast revenue from pipeline deals, recurring revenue, and seasonal adjustments."
        icon={TrendingUp}
        badge="Analytics"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "3-Month Forecast", value: fmt(summaryPeriods.m3), color: "text-violet-600" },
          { label: "6-Month Forecast", value: fmt(summaryPeriods.m6), color: "text-emerald-600" },
          { label: "12-Month Forecast", value: fmt(summaryPeriods.m12), color: "text-pink-600" },
          { label: "Weighted Pipeline", value: fmt(summaryPeriods.weightedPipeline), color: "text-amber-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-violet-500" />
              Recurring Revenue & Seasonality
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Monthly Recurring Revenue ($)</Label>
              <Input type="number" placeholder="10000" value={config.monthlyRecurring || ""} onChange={(e) => updateConfig("monthlyRecurring", e.target.value)} />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(["seasonalQ1", "seasonalQ2", "seasonalQ3", "seasonalQ4"] as const).map((q, i) => (
                <div key={q} className="space-y-1.5">
                  <Label className="text-xs">Q{i + 1} Adj (%)</Label>
                  <Input type="number" placeholder="100" value={config[q] || ""} onChange={(e) => updateConfig(q, e.target.value)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-violet-500" />
              Add Pipeline Deal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Deal Name *</Label>
                <Input placeholder="Acme rebrand" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Value ($)</Label>
                <Input type="number" placeholder="15000" value={value} onChange={(e) => setValue(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Probability (%)</Label>
                <Input type="number" min="0" max="100" placeholder="50" value={probability} onChange={(e) => setProbability(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Close In (months)</Label>
                <Select value={closeMonth} onValueChange={(v) => { if (v) setCloseMonth(v); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <SelectItem key={m} value={m.toString()}>{m} month{m > 1 ? "s" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="mt-3 w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleAddDeal} disabled={!name.trim()}>
              <Plus className="h-4 w-4" />
              Add Deal
            </Button>
          </CardContent>
        </Card>
      </div>

      {deals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pipeline Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {["Deal", "Value", "Probability", "Weighted", "Close In", ""].map((h) => (
                      <th key={h} className="text-left p-2 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deals.map((d) => (
                    <tr key={d.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-2 font-medium">{d.name}</td>
                      <td className="p-2">{fmt(d.value)}</td>
                      <td className="p-2">{d.probability}%</td>
                      <td className="p-2 font-semibold text-emerald-600">{fmt(d.value * d.probability / 100)}</td>
                      <td className="p-2">{d.expectedCloseMonth} mo</td>
                      <td className="p-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeals((prev) => prev.filter((x) => x.id !== d.id))}>
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-violet-500" />
            12-Month Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-48 mb-4">
            {forecast.map((m) => {
              const maxTotal = Math.max(...forecast.map((f) => f.total), 1);
              const h = Math.max(4, (m.total / maxTotal) * 100);
              const recH = m.total > 0 ? (m.recurring / m.total) * h : 0;
              const pipH = h - recH;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-[9px] font-mono text-muted-foreground">{fmt(m.total)}</span>
                  <div className="w-full flex flex-col" style={{ height: `${h}%` }}>
                    <div className="w-full rounded-t bg-gradient-to-t from-violet-500 to-violet-400" style={{ height: `${pipH}%` }} />
                    <div className="w-full bg-gradient-to-t from-pink-500 to-pink-400" style={{ height: `${recH}%` }} />
                  </div>
                  <span className="text-[8px] text-muted-foreground">{m.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-violet-500" /><span>Pipeline</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-pink-500" /><span>Recurring</span></div>
          </div>

          <Separator className="my-4" />
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  {["Month", "Pipeline", "Recurring", "Seasonal Adj", "Total"].map((h) => (
                    <th key={h} className="text-left p-1.5 font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {forecast.map((m) => (
                  <tr key={m.month} className="border-b last:border-0">
                    <td className="p-1.5 font-medium">{m.label}</td>
                    <td className="p-1.5">{fmt(m.pipeline)}</td>
                    <td className="p-1.5">{fmt(m.recurring)}</td>
                    <td className="p-1.5">{m.seasonal}%</td>
                    <td className="p-1.5 font-bold">{fmt(m.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
