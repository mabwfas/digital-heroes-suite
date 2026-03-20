"use client";

import { useState, useMemo } from "react";
import { Wallet, Plus, Trash2, TrendingUp, Target } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type Platform = "Fiverr" | "Upwork" | "Direct" | "YouTube" | "Sponsorship" | "Other";

interface IncomeEntry {
  id: string;
  amount: number;
  platform: Platform;
  description: string;
  date: string;
}

interface IncomeGoal {
  monthly: number;
  yearly: number;
}

const PLATFORM_COLORS: Record<Platform, string> = {
  Fiverr: "#1dbf73",
  Upwork: "#14a800",
  Direct: "#7c3aed",
  YouTube: "#ff0000",
  Sponsorship: "#f59e0b",
  Other: "#6b7280",
};

export default function IncomeTrackerPage() {
  const [entries, setEntries] = useLocalStorage<IncomeEntry[]>("freelance-income-data", []);
  const [goals, setGoals] = useLocalStorage<IncomeGoal>("freelance-income-goals", { monthly: 5000, yearly: 60000 });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: 0, platform: "Fiverr" as Platform, description: "", date: new Date().toISOString().split("T")[0] });
  const [viewYear, setViewYear] = useState(new Date().getFullYear().toString());

  const yearEntries = useMemo(() => entries.filter((e) => e.date.startsWith(viewYear)), [entries, viewYear]);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthEntries = entries.filter((e) => e.date.startsWith(currentMonth));
    const monthTotal = monthEntries.reduce((s, e) => s + e.amount, 0);
    const yearTotal = yearEntries.reduce((s, e) => s + e.amount, 0);
    const byPlatform = new Map<Platform, number>();
    yearEntries.forEach((e) => byPlatform.set(e.platform, (byPlatform.get(e.platform) || 0) + e.amount));
    return { monthTotal, yearTotal, byPlatform: Array.from(byPlatform.entries()).sort((a, b) => b[1] - a[1]) };
  }, [entries, yearEntries]);

  const monthlyBreakdown = useMemo(() => {
    const months = new Map<string, number>();
    yearEntries.forEach((e) => {
      const m = e.date.substring(0, 7);
      months.set(m, (months.get(m) || 0) + e.amount);
    });
    return Array.from(months.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [yearEntries]);

  const maxMonthly = Math.max(...monthlyBreakdown.map(([, v]) => v), goals.monthly);

  function handleSave() {
    if (form.amount <= 0) return;
    setEntries((prev) => [{ id: generateId(), ...form }, ...prev]);
    setForm({ amount: 0, platform: "Fiverr", description: "", date: new Date().toISOString().split("T")[0] });
    setShowForm(false);
  }

  const years = useMemo(() => {
    const set = new Set(entries.map((e) => e.date.substring(0, 4)));
    set.add(new Date().getFullYear().toString());
    return Array.from(set).sort().reverse();
  }, [entries]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Freelance Income Tracker"
        description="Track income by platform with monthly/yearly totals, goals, and breakdowns"
        icon={Wallet}
        badge="Freelance"
        replaces="Spreadsheets / QuickBooks"
        actions={
          <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Log Income
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50"><CardContent className="p-4">
          <p className="text-2xl font-bold text-emerald-600">${stats.monthTotal.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">This Month</p>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (stats.monthTotal / goals.monthly) * 100)}%` }} /></div>
          <p className="text-[10px] text-muted-foreground mt-1">{Math.round((stats.monthTotal / goals.monthly) * 100)}% of ${goals.monthly.toLocaleString()} goal</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4">
          <p className="text-2xl font-bold text-violet-600">${stats.yearTotal.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{viewYear} Total</p>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.min(100, (stats.yearTotal / goals.yearly) * 100)}%` }} /></div>
          <p className="text-[10px] text-muted-foreground mt-1">{Math.round((stats.yearTotal / goals.yearly) * 100)}% of ${goals.yearly.toLocaleString()} goal</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><Target className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Monthly Goal</p></div>
          <Input type="number" value={goals.monthly || ""} onChange={(e) => setGoals((g) => ({ ...g, monthly: parseFloat(e.target.value) || 0 }))} className="h-8 text-sm font-bold" />
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1"><Target className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Yearly Goal</p></div>
          <Input type="number" value={goals.yearly || ""} onChange={(e) => setGoals((g) => ({ ...g, yearly: parseFloat(e.target.value) || 0 }))} className="h-8 text-sm font-bold" />
        </CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Monthly chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Monthly Breakdown</CardTitle>
                <select className="text-sm border rounded-md px-2 py-1 bg-transparent" value={viewYear} onChange={(e) => setViewYear(e.target.value)}>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {monthlyBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data for {viewYear}</p>
              ) : (
                <div className="flex items-end gap-2 h-40">
                  {monthlyBreakdown.map(([month, total]) => (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                      <p className="text-[10px] font-medium">${total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total}</p>
                      <div className="w-full bg-muted rounded-sm overflow-hidden" style={{ height: "100%" }}>
                        <div className="w-full bg-violet-500/60 rounded-sm transition-all" style={{ height: `${(total / maxMonthly) * 100}%`, marginTop: "auto" }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{new Date(month + "-01").toLocaleDateString(undefined, { month: "short" })}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent entries */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Recent Income</CardTitle></CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No income entries yet</p>
              ) : (
                <div className="space-y-2">
                  {entries.slice(0, 20).map((e) => (
                    <div key={e.id} className="flex items-center gap-3 group">
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: PLATFORM_COLORS[e.platform] }} />
                      <span className="text-sm flex-1">{e.description || e.platform}</span>
                      <Badge variant="secondary" className="text-[10px]">{e.platform}</Badge>
                      <span className="text-xs text-muted-foreground">{e.date}</span>
                      <span className="text-sm font-semibold text-emerald-600">${e.amount.toLocaleString()}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive" onClick={() => setEntries((p) => p.filter((x) => x.id !== e.id))}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Platform breakdown */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Platform Breakdown ({viewYear})</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {stats.byPlatform.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data</p>
            ) : (
              <>
                {/* CSS pie chart */}
                <div className="relative w-40 h-40 mx-auto rounded-full" style={{
                  background: `conic-gradient(${stats.byPlatform.map(([platform, amount], i) => {
                    const startPct = stats.byPlatform.slice(0, i).reduce((s, [, a]) => s + a, 0) / stats.yearTotal * 100;
                    const endPct = startPct + (amount / stats.yearTotal) * 100;
                    return `${PLATFORM_COLORS[platform]} ${startPct}% ${endPct}%`;
                  }).join(", ")})`,
                }}>
                  <div className="absolute inset-4 bg-background rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-lg font-bold">${stats.yearTotal >= 1000 ? `${(stats.yearTotal / 1000).toFixed(1)}k` : stats.yearTotal}</p>
                      <p className="text-[10px] text-muted-foreground">total</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {stats.byPlatform.map(([platform, amount]) => (
                    <div key={platform} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: PLATFORM_COLORS[platform] }} />
                      <span className="text-sm flex-1">{platform}</span>
                      <span className="text-sm font-medium">${amount.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">{Math.round((amount / stats.yearTotal) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Log Income</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Amount ($) *</Label><Input type="number" placeholder="0" value={form.amount || ""} onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} /></div>
            <div className="space-y-1.5"><Label>Platform</Label>
              <Select value={form.platform} onValueChange={(v) => setForm((f) => ({ ...f, platform: v as Platform }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["Fiverr","Upwork","Direct","YouTube","Sponsorship","Other"] as Platform[]).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Description</Label><Input placeholder="Project or client name" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={form.amount <= 0} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">Log Income</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
