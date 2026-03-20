"use client";

import { useState, useMemo } from "react";
import { CreditCard, Plus, Trash2, ExternalLink, AlertTriangle, ArrowUpDown, Pause, Play, XCircle, DollarSign, CalendarDays, BarChart3, Bell, Edit2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface Subscription {
  id: string;
  name: string;
  cost: number;
  cycle: "monthly" | "yearly" | "weekly";
  category: string;
  renewalDate: string;
  url: string;
  status: "active" | "paused" | "cancelled";
  createdAt: string;
}

const CATEGORIES = ["Design", "Development", "Marketing", "Communication", "Storage", "AI", "Analytics", "Other"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Design: "#8b5cf6",
  Development: "#3b82f6",
  Marketing: "#f59e0b",
  Communication: "#10b981",
  Storage: "#06b6d4",
  AI: "#ec4899",
  Analytics: "#f97316",
  Other: "#64748b",
};

type SortKey = "cost" | "name" | "renewalDate";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function getMonthlyCost(sub: Subscription): number {
  if (sub.cycle === "weekly") return sub.cost * 4.333;
  if (sub.cycle === "yearly") return sub.cost / 12;
  return sub.cost;
}

function getYearlyCost(sub: Subscription): number {
  if (sub.cycle === "weekly") return sub.cost * 52;
  if (sub.cycle === "monthly") return sub.cost * 12;
  return sub.cost;
}

function daysUntilRenewal(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewal = new Date(dateStr);
  renewal.setHours(0, 0, 0, 0);
  const diff = Math.ceil((renewal.getTime() - today.getTime()) / 86400000);
  return diff;
}

export default function SubscriptionManagerPage() {
  const [subscriptions, setSubscriptions, hydrated] = useLocalStorage<Subscription[]>("finance-subscriptions", []);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [cycle, setCycle] = useState<"monthly" | "yearly" | "weekly">("monthly");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [renewalDate, setRenewalDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  });
  const [url, setUrl] = useState("");

  const [sortKey, setSortKey] = useState<SortKey>("renewalDate");
  const [sortAsc, setSortAsc] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const startEdit = (sub: Subscription) => {
    setEditingId(sub.id);
    setName(sub.name);
    setCost(String(sub.cost));
    setCycle(sub.cycle);
    setCategory(sub.category);
    setRenewalDate(sub.renewalDate);
    setUrl(sub.url);
    setShowForm(true);
  };

  const addSubscription = () => {
    const parsed = parseFloat(cost);
    if (!name.trim() || !parsed || parsed <= 0) return;
    const sub: Subscription = {
      id: generateId(),
      name: name.trim(),
      cost: parsed,
      cycle,
      category,
      renewalDate,
      url: url.trim(),
      status: "active",
      createdAt: new Date().toISOString(),
    };
    if (editingId) {
      setSubscriptions((prev) => prev.map((s) => (s.id === editingId ? { ...sub, id: editingId, createdAt: s.createdAt, status: s.status } : s)));
      setEditingId(null);
    } else {
      setSubscriptions((prev) => [...prev, sub]);
    }
    setName("");
    setCost("");
    setUrl("");
    setShowForm(false);
  };

  const deleteSub = (id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleStatus = (id: string, status: "active" | "paused" | "cancelled") => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  const sortedSubs = useMemo(() => {
    const sorted = [...subscriptions].sort((a, b) => {
      if (sortKey === "cost") return getMonthlyCost(a) - getMonthlyCost(b);
      if (sortKey === "name") return a.name.localeCompare(b.name);
      return a.renewalDate.localeCompare(b.renewalDate);
    });
    return sortAsc ? sorted : sorted.reverse();
  }, [subscriptions, sortKey, sortAsc]);

  const activeSubs = subscriptions.filter((s) => s.status === "active");

  const stats = useMemo(() => {
    const totalMonthly = activeSubs.reduce((s, sub) => s + getMonthlyCost(sub), 0);
    const totalYearly = activeSubs.reduce((s, sub) => s + getYearlyCost(sub), 0);
    const activeCount = activeSubs.length;
    const nextRenewal = activeSubs
      .filter((s) => daysUntilRenewal(s.renewalDate) >= 0)
      .sort((a, b) => a.renewalDate.localeCompare(b.renewalDate))[0];
    return { totalMonthly, totalYearly, activeCount, nextRenewal };
  }, [activeSubs]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const cats: Record<string, number> = {};
    activeSubs.forEach((s) => {
      cats[s.category] = (cats[s.category] || 0) + getMonthlyCost(s);
    });
    const total = Object.values(cats).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount]) => ({ cat, amount, pct: (amount / total) * 100 }));
  }, [activeSubs]);

  // Renewals within 7 days
  const upcomingRenewals = useMemo(() => {
    return activeSubs
      .filter((s) => {
        const days = daysUntilRenewal(s.renewalDate);
        return days >= 0 && days <= 7;
      })
      .sort((a, b) => a.renewalDate.localeCompare(b.renewalDate));
  }, [activeSubs]);

  // Compute next renewal date for a subscription on or after a given date
  const getRecurringRenewals = (sub: Subscription, startDate: Date, endDate: Date): string[] => {
    const dates: string[] = [];
    const renewal = new Date(sub.renewalDate);
    renewal.setHours(0, 0, 0, 0);
    if (renewal > endDate) return dates;

    // Walk forward from renewalDate by cycle increments
    const current = new Date(renewal);
    while (current <= endDate) {
      if (current >= startDate) {
        dates.push(current.toISOString().split("T")[0]);
      }
      if (sub.cycle === "weekly") {
        current.setDate(current.getDate() + 7);
      } else if (sub.cycle === "monthly") {
        current.setMonth(current.getMonth() + 1);
      } else {
        current.setFullYear(current.getFullYear() + 1);
      }
    }
    return dates;
  };

  // Calendar view (next 30 days)
  const calendarDays = useMemo(() => {
    const days: { date: string; label: string; subs: Subscription[] }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 29);

    // Pre-compute all renewal dates for each sub
    const subRenewals = new Map<string, Set<string>>();
    activeSubs.forEach((s) => {
      const renewalDates = getRecurringRenewals(s, today, endDate);
      renewalDates.forEach((d) => {
        if (!subRenewals.has(d)) subRenewals.set(d, new Set());
        subRenewals.get(d)!.add(s.id);
      });
    });

    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const subIds = subRenewals.get(dateStr);
      const daySubs = subIds ? activeSubs.filter((s) => subIds.has(s.id)) : [];
      days.push({
        date: dateStr,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        subs: daySubs,
      });
    }
    return days;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubs]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Manager"
        description="Track all your subscriptions, costs, and renewal dates in one place."
        icon={CreditCard}
        replaces="TrackMySubs ($36/yr)"
        actions={
          <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0">
            <Plus className="h-4 w-4 mr-2" />
            Add Subscription
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Monthly Cost</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalMonthly)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Yearly Cost</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalYearly)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CreditCard className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Active</span>
            </div>
            <p className="text-2xl font-bold">{stats.activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CalendarDays className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Next Renewal</span>
            </div>
            <p className="text-lg font-bold truncate">
              {stats.nextRenewal ? (
                <>
                  {stats.nextRenewal.name}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    ({daysUntilRenewal(stats.nextRenewal.renewalDate)}d)
                  </span>
                </>
              ) : (
                "None"
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Renewals Warning */}
      {upcomingRenewals.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Renewing within 7 days</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {upcomingRenewals.map((s) => (
                <Badge key={s.id} variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  {s.name} &middot; {formatCurrency(s.cost)}/{s.cycle === "monthly" ? "mo" : s.cycle === "yearly" ? "yr" : "wk"} &middot; {s.renewalDate}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{editingId ? "Edit Subscription" : "New Subscription"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Name</Label>
                <Input placeholder="e.g. Figma" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Cost ($)</Label>
                <Input type="number" min="0" step="0.01" placeholder="12.99" value={cost} onChange={(e) => setCost(e.target.value)} />
              </div>
              <div>
                <Label>Billing Cycle</Label>
                <select
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value as "monthly" | "yearly" | "weekly")}
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div>
                <Label>Category</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Renewal Date</Label>
                <Input type="date" value={renewalDate} onChange={(e) => setRenewalDate(e.target.value)} />
              </div>
              <div>
                <Label>URL (optional)</Label>
                <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={addSubscription} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Cost by Category (Monthly)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Stacked bar */}
            <div className="flex h-8 rounded-lg overflow-hidden">
              {categoryBreakdown.map((c) => (
                <div
                  key={c.cat}
                  className="transition-all duration-500 flex items-center justify-center"
                  style={{ width: `${c.pct}%`, backgroundColor: CATEGORY_COLORS[c.cat] || "#64748b", minWidth: c.pct > 0 ? "4px" : "0" }}
                >
                  {c.pct > 12 && <span className="text-xs font-medium text-white truncate px-1">{c.cat}</span>}
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-4">
              {categoryBreakdown.map((c) => (
                <div key={c.cat} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c.cat] || "#64748b" }} />
                  <span className="text-xs text-muted-foreground">{c.cat}</span>
                  <span className="text-xs font-medium">{formatCurrency(c.amount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar View */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Upcoming Renewals (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 gap-1">
            {calendarDays.map((day) => {
              const isToday = day.date === new Date().toISOString().split("T")[0];
              const hasRenewal = day.subs.length > 0;
              return (
                <div
                  key={day.date}
                  className={`p-2 rounded-lg text-center text-xs border transition-colors ${
                    isToday ? "border-emerald-500 bg-emerald-500/10" : hasRenewal ? "border-amber-500/50 bg-amber-500/10" : "border-transparent bg-muted/30"
                  }`}
                  title={day.subs.map((s) => `${s.name}: ${formatCurrency(s.cost)}`).join(", ")}
                >
                  <span className={`font-medium ${isToday ? "text-emerald-600 dark:text-emerald-400" : ""}`}>{day.label}</span>
                  {hasRenewal && (
                    <div className="flex flex-wrap gap-0.5 justify-center mt-1">
                      {day.subs.map((s) => (
                        <div key={s.id} className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[s.category] || "#64748b" }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sort Controls */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        {(["cost", "name", "renewalDate"] as SortKey[]).map((key) => (
          <Button
            key={key}
            variant={sortKey === key ? "default" : "outline"}
            size="sm"
            onClick={() => toggleSort(key)}
          >
            {key === "cost" ? "Cost" : key === "name" ? "Name" : "Renewal Date"}
            {sortKey === key && <ArrowUpDown className="h-3 w-3 ml-1" />}
          </Button>
        ))}
      </div>

      {/* Subscription List */}
      {sortedSubs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">No subscriptions yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Add your first subscription to start tracking costs.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {sortedSubs.map((sub) => {
                const days = daysUntilRenewal(sub.renewalDate);
                const renewingSoon = days >= 0 && days <= 7;
                return (
                  <div key={sub.id} className={`flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors ${sub.status !== "active" ? "opacity-60" : ""}`}>
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[sub.category] || "#64748b" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{sub.name}</p>
                        {sub.status !== "active" && (
                          <Badge variant="secondary" className="text-[10px]">{sub.status}</Badge>
                        )}
                        {renewingSoon && sub.status === "active" && (
                          <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600">
                            <AlertTriangle className="h-3 w-3 mr-0.5" />
                            {days === 0 ? "Today" : `${days}d`}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px]">{sub.category}</Badge>
                        <span className="text-xs text-muted-foreground">{sub.cycle}</span>
                        <span className="text-xs text-muted-foreground">Renews: {sub.renewalDate}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">{formatCurrency(sub.cost)}<span className="text-xs font-normal text-muted-foreground">/{sub.cycle === "monthly" ? "mo" : sub.cycle === "yearly" ? "yr" : "wk"}</span></p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(getMonthlyCost(sub))}/mo</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(sub)} title="Edit">
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      {sub.url && (
                        <Button size="sm" variant="ghost" onClick={() => window.open(sub.url, "_blank")}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {sub.status === "active" ? (
                        <Button size="sm" variant="ghost" onClick={() => toggleStatus(sub.id, "paused")} title="Pause">
                          <Pause className="h-3.5 w-3.5" />
                        </Button>
                      ) : sub.status === "paused" ? (
                        <Button size="sm" variant="ghost" onClick={() => toggleStatus(sub.id, "active")} title="Resume">
                          <Play className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                      {sub.status !== "cancelled" && (
                        <Button size="sm" variant="ghost" onClick={() => toggleStatus(sub.id, "cancelled")} title="Cancel">
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteSub(sub.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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
