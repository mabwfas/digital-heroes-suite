"use client";

import { useState, useMemo } from "react";
import {
  Scale,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type MetricKey = "ctr" | "cvr" | "cpa" | "aov" | "bounce";

interface BenchmarkData {
  industry: string;
  metric: MetricKey;
  average: number;
  low: number;
  high: number;
}

interface UserBenchmark {
  id: string;
  industry: string;
  metric: MetricKey;
  yourValue: number;
  createdAt: string;
}

const INDUSTRIES = [
  "E-Commerce",
  "SaaS / Software",
  "Finance / Banking",
  "Healthcare",
  "Real Estate",
  "Education",
  "Travel / Hospitality",
  "Food & Beverage",
  "Automotive",
  "B2B Services",
  "Retail",
  "Legal Services",
];

const METRICS: { key: MetricKey; label: string; unit: string; higherBetter: boolean }[] = [
  { key: "ctr", label: "Click-Through Rate (CTR)", unit: "%", higherBetter: true },
  { key: "cvr", label: "Conversion Rate (CVR)", unit: "%", higherBetter: true },
  { key: "cpa", label: "Cost Per Acquisition (CPA)", unit: "$", higherBetter: false },
  { key: "aov", label: "Average Order Value (AOV)", unit: "$", higherBetter: true },
  { key: "bounce", label: "Bounce Rate", unit: "%", higherBetter: false },
];

const BENCHMARKS: Record<string, Record<MetricKey, { avg: number; low: number; high: number }>> = {
  "E-Commerce": { ctr: { avg: 2.69, low: 1.5, high: 4.5 }, cvr: { avg: 2.63, low: 1.0, high: 5.0 }, cpa: { avg: 45.27, low: 20, high: 80 }, aov: { avg: 85, low: 40, high: 150 }, bounce: { avg: 47, low: 30, high: 60 } },
  "SaaS / Software": { ctr: { avg: 3.17, low: 2.0, high: 5.0 }, cvr: { avg: 3.04, low: 1.5, high: 7.0 }, cpa: { avg: 141.07, low: 50, high: 300 }, aov: { avg: 200, low: 50, high: 500 }, bounce: { avg: 42, low: 25, high: 55 } },
  "Finance / Banking": { ctr: { avg: 2.91, low: 1.8, high: 4.2 }, cvr: { avg: 5.01, low: 2.0, high: 8.0 }, cpa: { avg: 81.93, low: 40, high: 150 }, aov: { avg: 350, low: 100, high: 800 }, bounce: { avg: 51, low: 35, high: 65 } },
  "Healthcare": { ctr: { avg: 3.27, low: 2.0, high: 5.5 }, cvr: { avg: 3.36, low: 1.5, high: 6.0 }, cpa: { avg: 78.09, low: 30, high: 140 }, aov: { avg: 120, low: 50, high: 250 }, bounce: { avg: 55, low: 40, high: 70 } },
  "Real Estate": { ctr: { avg: 3.71, low: 2.5, high: 5.5 }, cvr: { avg: 2.47, low: 1.0, high: 4.5 }, cpa: { avg: 116.61, low: 50, high: 200 }, aov: { avg: 5000, low: 2000, high: 15000 }, bounce: { avg: 44, low: 30, high: 58 } },
  "Education": { ctr: { avg: 3.78, low: 2.5, high: 6.0 }, cvr: { avg: 3.39, low: 1.5, high: 6.0 }, cpa: { avg: 72.70, low: 30, high: 130 }, aov: { avg: 250, low: 50, high: 500 }, bounce: { avg: 49, low: 35, high: 62 } },
  "Travel / Hospitality": { ctr: { avg: 4.68, low: 3.0, high: 7.0 }, cvr: { avg: 3.55, low: 1.5, high: 6.0 }, cpa: { avg: 44.73, low: 20, high: 80 }, aov: { avg: 220, low: 80, high: 500 }, bounce: { avg: 43, low: 28, high: 56 } },
  "Food & Beverage": { ctr: { avg: 2.93, low: 1.8, high: 4.5 }, cvr: { avg: 2.31, low: 1.0, high: 4.0 }, cpa: { avg: 35.42, low: 15, high: 60 }, aov: { avg: 45, low: 20, high: 80 }, bounce: { avg: 52, low: 38, high: 65 } },
  "Automotive": { ctr: { avg: 2.14, low: 1.2, high: 3.5 }, cvr: { avg: 2.27, low: 1.0, high: 4.0 }, cpa: { avg: 84.32, low: 40, high: 150 }, aov: { avg: 500, low: 150, high: 1200 }, bounce: { avg: 48, low: 32, high: 60 } },
  "B2B Services": { ctr: { avg: 2.41, low: 1.5, high: 4.0 }, cvr: { avg: 3.04, low: 1.5, high: 6.0 }, cpa: { avg: 132.95, low: 50, high: 250 }, aov: { avg: 1200, low: 300, high: 3000 }, bounce: { avg: 50, low: 35, high: 65 } },
  "Retail": { ctr: { avg: 2.80, low: 1.5, high: 4.5 }, cvr: { avg: 2.82, low: 1.0, high: 5.0 }, cpa: { avg: 38.73, low: 15, high: 70 }, aov: { avg: 65, low: 25, high: 120 }, bounce: { avg: 46, low: 30, high: 58 } },
  "Legal Services": { ctr: { avg: 2.93, low: 1.8, high: 4.5 }, cvr: { avg: 6.98, low: 3.0, high: 12.0 }, cpa: { avg: 86.02, low: 40, high: 160 }, aov: { avg: 2000, low: 500, high: 5000 }, bounce: { avg: 53, low: 38, high: 68 } },
};

export default function BenchmarksPage() {
  const [entries, setEntries, hydrated] = useLocalStorage<UserBenchmark[]>("analytics-benchmarks", []);
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [metric, setMetric] = useState<MetricKey>("ctr");
  const [yourValue, setYourValue] = useState("");

  function handleAdd() {
    if (!yourValue) return;
    const entry: UserBenchmark = {
      id: generateId(),
      industry,
      metric,
      yourValue: parseFloat(yourValue) || 0,
      createdAt: new Date().toISOString(),
    };
    setEntries((prev) => [...prev, entry]);
    setYourValue("");
  }

  function getComparison(entry: UserBenchmark) {
    const bench = BENCHMARKS[entry.industry]?.[entry.metric];
    if (!bench) return { status: "unknown", diff: 0 };
    const metricInfo = METRICS.find((m) => m.key === entry.metric)!;
    const diff = entry.yourValue - bench.avg;
    const isGood = metricInfo.higherBetter ? diff > 0 : diff < 0;
    const isBad = metricInfo.higherBetter ? diff < 0 : diff > 0;
    return {
      status: Math.abs(diff) < bench.avg * 0.05 ? "average" : isGood ? "above" : "below",
      diff,
      bench,
    };
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Industry Benchmark Tool"
        description="Compare your metrics against industry averages with color-coded performance indicators."
        icon={Scale}
        badge="Analytics"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-violet-500" />
            Compare Your Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Select value={industry} onValueChange={(v) => { if (v) setIndustry(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Metric</Label>
              <Select value={metric} onValueChange={(v) => { if (v) setMetric(v as MetricKey); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METRICS.map((m) => (
                    <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Your Value</Label>
              <Input type="number" step="0.01" placeholder="3.5" value={yourValue} onChange={(e) => setYourValue(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="invisible">Add</Label>
              <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleAdd} disabled={!yourValue}>
                <Plus className="h-4 w-4" />
                Compare
              </Button>
            </div>
          </div>

          {industry && BENCHMARKS[industry] && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2">{industry} Benchmarks</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                {METRICS.map((m) => {
                  const b = BENCHMARKS[industry][m.key];
                  return (
                    <div key={m.key}>
                      <p className="font-medium">{m.label.split(" (")[0]}</p>
                      <p className="text-muted-foreground">Avg: {m.unit === "$" ? "$" : ""}{b.avg}{m.unit === "%" ? "%" : ""}</p>
                      <p className="text-muted-foreground">Range: {b.low}–{b.high}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {entries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Scale className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Add your data to compare against industry benchmarks.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Benchmark Comparisons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {entries.map((entry) => {
                const metricInfo = METRICS.find((m) => m.key === entry.metric)!;
                const comp = getComparison(entry);
                const bench = comp.bench as { avg: number; low: number; high: number } | undefined;
                const statusConfig = {
                  above: { label: "Above Average", cls: "bg-emerald-500/10 text-emerald-600 border-0", icon: TrendingUp, color: "text-emerald-600" },
                  below: { label: "Below Average", cls: "bg-red-500/10 text-red-600 border-0", icon: TrendingDown, color: "text-red-600" },
                  average: { label: "Average", cls: "bg-amber-500/10 text-amber-600 border-0", icon: Minus, color: "text-amber-600" },
                  unknown: { label: "Unknown", cls: "bg-muted text-muted-foreground border-0", icon: Minus, color: "text-muted-foreground" },
                };
                const sc = statusConfig[comp.status as keyof typeof statusConfig];
                const Icon = sc.icon;

                return (
                  <div key={entry.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                    <Icon className={`h-5 w-5 shrink-0 ${sc.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{entry.industry}</span>
                        <Badge variant="secondary" className="text-[10px]">{metricInfo.label}</Badge>
                        <Badge className={sc.cls}>{sc.label}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Yours: <span className={`font-semibold ${sc.color}`}>{metricInfo.unit === "$" ? "$" : ""}{entry.yourValue}{metricInfo.unit === "%" ? "%" : ""}</span></span>
                        {bench && (
                          <>
                            <span>Avg: {metricInfo.unit === "$" ? "$" : ""}{bench.avg}{metricInfo.unit === "%" ? "%" : ""}</span>
                            <span>Range: {bench.low}–{bench.high}</span>
                          </>
                        )}
                      </div>
                      {bench && (
                        <div className="mt-2 w-full bg-muted rounded-full h-2 relative">
                          <div className="absolute h-2 bg-muted-foreground/30 rounded-full" style={{ left: `${Math.max(0, ((bench.low) / (bench.high * 1.3)) * 100)}%`, width: `${((bench.high - bench.low) / (bench.high * 1.3)) * 100}%` }} />
                          <div
                            className={`absolute h-3 w-3 rounded-full -top-0.5 border-2 border-white ${comp.status === "above" ? "bg-emerald-500" : comp.status === "below" ? "bg-red-500" : "bg-amber-500"}`}
                            style={{ left: `${Math.min(97, Math.max(2, (entry.yourValue / (bench.high * 1.3)) * 100))}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setEntries((prev) => prev.filter((x) => x.id !== entry.id))}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
