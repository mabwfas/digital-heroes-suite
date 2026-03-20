"use client";

import { useState, useMemo } from "react";
import {
  Calculator,
  Plus,
  Trash2,
  TrendingUp,
  DollarSign,
  Target,
  BarChart3,
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

interface CampaignEntry {
  id: string;
  name: string;
  adSpend: number;
  revenue: number;
  costOfGoods: number;
  conversions: number;
  period: string;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function calcMetrics(entry: CampaignEntry) {
  const profit = entry.revenue - entry.adSpend - entry.costOfGoods;
  const roi = entry.adSpend > 0 ? ((profit / entry.adSpend) * 100) : 0;
  const roas = entry.adSpend > 0 ? (entry.revenue / entry.adSpend) : 0;
  const cpa = entry.conversions > 0 ? (entry.adSpend / entry.conversions) : 0;
  const breakEven = entry.revenue > 0 ? (entry.adSpend / (entry.revenue - entry.costOfGoods) * entry.adSpend) : 0;
  return { profit, roi, roas, cpa, breakEven };
}

export default function RoiCalculatorPage() {
  const [campaigns, setCampaigns, hydrated] = useLocalStorage<CampaignEntry[]>("ads-roi-campaigns", []);
  const [name, setName] = useState("");
  const [adSpend, setAdSpend] = useState("");
  const [revenue, setRevenue] = useState("");
  const [costOfGoods, setCostOfGoods] = useState("");
  const [conversions, setConversions] = useState("");
  const [period, setPeriod] = useState("");

  const totals = useMemo(() => {
    const totalSpend = campaigns.reduce((s, c) => s + c.adSpend, 0);
    const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
    const totalCogs = campaigns.reduce((s, c) => s + c.costOfGoods, 0);
    const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
    const totalProfit = totalRevenue - totalSpend - totalCogs;
    const overallRoi = totalSpend > 0 ? ((totalProfit / totalSpend) * 100) : 0;
    const overallRoas = totalSpend > 0 ? (totalRevenue / totalSpend) : 0;
    return { totalSpend, totalRevenue, totalProfit, totalConversions, overallRoi, overallRoas };
  }, [campaigns]);

  function handleAdd() {
    if (!name.trim()) return;
    const entry: CampaignEntry = {
      id: generateId(),
      name: name.trim(),
      adSpend: parseFloat(adSpend) || 0,
      revenue: parseFloat(revenue) || 0,
      costOfGoods: parseFloat(costOfGoods) || 0,
      conversions: parseInt(conversions) || 0,
      period: period.trim(),
    };
    setCampaigns((prev) => [...prev, entry]);
    setName(""); setAdSpend(""); setRevenue(""); setCostOfGoods(""); setConversions(""); setPeriod("");
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Marketing ROI Calculator" description="Calculate ROI, ROAS, CPA, and profit across multiple campaigns." icon={Calculator} badge="Ads" />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Spend", value: formatCurrency(totals.totalSpend), color: "text-red-600" },
          { label: "Total Revenue", value: formatCurrency(totals.totalRevenue), color: "text-emerald-600" },
          { label: "Total Profit", value: formatCurrency(totals.totalProfit), color: totals.totalProfit >= 0 ? "text-emerald-600" : "text-red-600" },
          { label: "Overall ROI", value: `${totals.overallRoi.toFixed(1)}%`, color: totals.overallRoi >= 0 ? "text-emerald-600" : "text-red-600" },
          { label: "Overall ROAS", value: `${totals.overallRoas.toFixed(2)}x`, color: "text-violet-600" },
          { label: "Conversions", value: totals.totalConversions.toString(), color: "text-pink-600" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4"><p className={`text-xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground mt-0.5">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4 text-violet-500" />Add Campaign</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            <div className="space-y-1.5"><Label>Campaign Name *</Label><Input placeholder="Google Ads" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Ad Spend ($)</Label><Input type="number" placeholder="5000" value={adSpend} onChange={(e) => setAdSpend(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Revenue ($)</Label><Input type="number" placeholder="20000" value={revenue} onChange={(e) => setRevenue(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>COGS ($)</Label><Input type="number" placeholder="3000" value={costOfGoods} onChange={(e) => setCostOfGoods(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Conversions</Label><Input type="number" placeholder="100" value={conversions} onChange={(e) => setConversions(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Period</Label><Input placeholder="Jan 2024" value={period} onChange={(e) => setPeriod(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="invisible">Add</Label><Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleAdd} disabled={!name.trim()}><Plus className="h-4 w-4" />Add</Button></div>
          </div>
        </CardContent>
      </Card>

      {campaigns.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-16 text-center">
          <Calculator className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Add campaigns to calculate and compare ROI metrics.</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Campaign Comparison</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {["Campaign", "Period", "Ad Spend", "Revenue", "COGS", "Profit", "ROI %", "ROAS", "CPA", "Conv.", ""].map((h) => (
                      <th key={h} className="text-left p-2 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => {
                    const m = calcMetrics(c);
                    return (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="p-2 font-medium">{c.name}</td>
                        <td className="p-2 text-muted-foreground text-xs">{c.period || "—"}</td>
                        <td className="p-2">{formatCurrency(c.adSpend)}</td>
                        <td className="p-2">{formatCurrency(c.revenue)}</td>
                        <td className="p-2">{formatCurrency(c.costOfGoods)}</td>
                        <td className={`p-2 font-semibold ${m.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(m.profit)}</td>
                        <td className={`p-2 font-semibold ${m.roi >= 0 ? "text-emerald-600" : "text-red-600"}`}>{m.roi.toFixed(1)}%</td>
                        <td className="p-2">{m.roas.toFixed(2)}x</td>
                        <td className="p-2">{formatCurrency(m.cpa)}</td>
                        <td className="p-2">{c.conversions}</td>
                        <td className="p-2"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCampaigns((prev) => prev.filter((x) => x.id !== c.id))}><Trash2 className="h-3 w-3 text-red-500" /></Button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {campaigns.length > 1 && (
              <>
                <Separator className="my-4" />
                <div>
                  <h3 className="text-sm font-semibold mb-3">Monthly Trend (by entry order)</h3>
                  <div className="flex items-end gap-2 h-32">
                    {campaigns.map((c) => {
                      const m = calcMetrics(c);
                      const maxRoi = Math.max(...campaigns.map((x) => Math.abs(calcMetrics(x).roi)), 1);
                      const height = Math.max(5, (Math.abs(m.roi) / maxRoi) * 100);
                      return (
                        <div key={c.id} className="flex-1 flex flex-col items-center gap-1">
                          <span className={`text-[10px] font-mono ${m.roi >= 0 ? "text-emerald-600" : "text-red-600"}`}>{m.roi.toFixed(0)}%</span>
                          <div className={`w-full rounded-t ${m.roi >= 0 ? "bg-gradient-to-t from-emerald-500 to-emerald-400" : "bg-gradient-to-t from-red-500 to-red-400"}`} style={{ height: `${height}%` }} />
                          <span className="text-[9px] text-muted-foreground truncate w-full text-center">{c.name.slice(0, 8)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
