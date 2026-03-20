"use client";

import { useState, useMemo } from "react";
import {
  DollarSign,
  Plus,
  Trash2,
  TrendingUp,
  Calculator,
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

interface LTVEntry {
  id: string;
  segment: string;
  avgProjectValue: number;
  projectsPerClient: number;
  clientLifespanYears: number;
  acquisitionCost: number;
}

function calcLTV(e: LTVEntry) {
  const ltv = e.avgProjectValue * e.projectsPerClient * e.clientLifespanYears;
  const ltvCacRatio = e.acquisitionCost > 0 ? ltv / e.acquisitionCost : 0;
  const paybackMonths = e.projectsPerClient > 0 && e.avgProjectValue > 0
    ? Math.round((e.acquisitionCost / (e.avgProjectValue * e.projectsPerClient / 12)) * 10) / 10
    : 0;
  const annualValue = e.avgProjectValue * e.projectsPerClient;
  return { ltv, ltvCacRatio, paybackMonths, annualValue };
}

function fmt(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function ClientLTVPage() {
  const [entries, setEntries, hydrated] = useLocalStorage<LTVEntry[]>("analytics-client-ltv", []);
  const [segment, setSegment] = useState("");
  const [avgProjectValue, setAvgProjectValue] = useState("");
  const [projectsPerClient, setProjectsPerClient] = useState("");
  const [clientLifespan, setClientLifespan] = useState("");
  const [acquisitionCost, setAcquisitionCost] = useState("");

  const totals = useMemo(() => {
    if (entries.length === 0) return { avgLtv: 0, avgRatio: 0, avgPayback: 0 };
    const metrics = entries.map(calcLTV);
    return {
      avgLtv: Math.round(metrics.reduce((s, m) => s + m.ltv, 0) / entries.length),
      avgRatio: Math.round(metrics.reduce((s, m) => s + m.ltvCacRatio, 0) / entries.length * 10) / 10,
      avgPayback: Math.round(metrics.reduce((s, m) => s + m.paybackMonths, 0) / entries.length * 10) / 10,
    };
  }, [entries]);

  function handleAdd() {
    if (!segment.trim()) return;
    const entry: LTVEntry = {
      id: generateId(),
      segment: segment.trim(),
      avgProjectValue: parseFloat(avgProjectValue) || 0,
      projectsPerClient: parseFloat(projectsPerClient) || 0,
      clientLifespanYears: parseFloat(clientLifespan) || 0,
      acquisitionCost: parseFloat(acquisitionCost) || 0,
    };
    setEntries((prev) => [...prev, entry]);
    setSegment(""); setAvgProjectValue(""); setProjectsPerClient(""); setClientLifespan(""); setAcquisitionCost("");
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Lifetime Value Calculator"
        description="Calculate LTV, LTV:CAC ratio, and payback period for different client segments."
        icon={DollarSign}
        badge="Analytics"
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Avg LTV", value: fmt(totals.avgLtv), color: "text-emerald-600" },
          { label: "Avg LTV:CAC", value: `${totals.avgRatio}x`, color: totals.avgRatio >= 3 ? "text-emerald-600" : "text-amber-600" },
          { label: "Avg Payback", value: `${totals.avgPayback} mo`, color: totals.avgPayback <= 12 ? "text-emerald-600" : "text-amber-600" },
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
            Add Client Segment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="space-y-1.5">
              <Label>Segment Name *</Label>
              <Input placeholder="Enterprise" value={segment} onChange={(e) => setSegment(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Avg Project Value ($)</Label>
              <Input type="number" placeholder="5000" value={avgProjectValue} onChange={(e) => setAvgProjectValue(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Projects / Client / Yr</Label>
              <Input type="number" step="0.1" placeholder="4" value={projectsPerClient} onChange={(e) => setProjectsPerClient(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Lifespan (years)</Label>
              <Input type="number" step="0.5" placeholder="3" value={clientLifespan} onChange={(e) => setClientLifespan(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Acquisition Cost ($)</Label>
              <Input type="number" placeholder="1000" value={acquisitionCost} onChange={(e) => setAcquisitionCost(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="invisible">Add</Label>
              <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleAdd} disabled={!segment.trim()}>
                <Plus className="h-4 w-4" />
                Calculate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {entries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Calculator className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Add a client segment to calculate lifetime value.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">LTV Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {["Segment", "Avg Project", "Projects/Yr", "Lifespan", "CAC", "Annual Value", "LTV", "LTV:CAC", "Payback", ""].map((h) => (
                      <th key={h} className="text-left p-2 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => {
                    const m = calcLTV(e);
                    return (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="p-2 font-medium">{e.segment}</td>
                        <td className="p-2">{fmt(e.avgProjectValue)}</td>
                        <td className="p-2">{e.projectsPerClient}</td>
                        <td className="p-2">{e.clientLifespanYears}yr</td>
                        <td className="p-2">{fmt(e.acquisitionCost)}</td>
                        <td className="p-2 font-medium">{fmt(m.annualValue)}</td>
                        <td className="p-2 font-bold text-emerald-600">{fmt(m.ltv)}</td>
                        <td className={`p-2 font-semibold ${m.ltvCacRatio >= 3 ? "text-emerald-600" : m.ltvCacRatio >= 1 ? "text-amber-600" : "text-red-600"}`}>
                          {m.ltvCacRatio.toFixed(1)}x
                          {m.ltvCacRatio >= 3 && <span className="text-[9px] ml-1">Healthy</span>}
                          {m.ltvCacRatio < 1 && <span className="text-[9px] ml-1">Loss</span>}
                        </td>
                        <td className={`p-2 ${m.paybackMonths <= 12 ? "text-emerald-600" : "text-amber-600"}`}>
                          {m.paybackMonths} mo
                        </td>
                        <td className="p-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEntries((prev) => prev.filter((x) => x.id !== e.id))}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Separator className="my-4" />
            <div className="p-3 bg-muted/30 rounded-lg text-xs space-y-1">
              <p className="font-medium">How to read these metrics:</p>
              <p className="text-muted-foreground"><strong>LTV</strong> = Avg Project Value x Projects/Year x Lifespan</p>
              <p className="text-muted-foreground"><strong>LTV:CAC</strong> = LTV / Acquisition Cost (aim for 3x+)</p>
              <p className="text-muted-foreground"><strong>Payback</strong> = CAC / Monthly Revenue (aim for &lt;12 months)</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
