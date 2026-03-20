"use client";

import { useState, useMemo, useCallback } from "react";
import {
  PieChart,
  Plus,
  Trash2,
  Save,
  Copy,
  X,
  DollarSign,
  TrendingUp,
  BookOpen,
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

interface Channel {
  id: string;
  name: string;
  percent: number;
  projectedRoi: number;
}

interface Allocation {
  id: string;
  name: string;
  totalBudget: number;
  channels: Channel[];
  createdAt: string;
}

const DEFAULT_CHANNELS: Omit<Channel, "id">[] = [
  { name: "Google Ads", percent: 35, projectedRoi: 4.0 },
  { name: "Meta Ads", percent: 25, projectedRoi: 3.5 },
  { name: "TikTok Ads", percent: 15, projectedRoi: 2.8 },
  { name: "Email Marketing", percent: 15, projectedRoi: 5.0 },
  { name: "SEO", percent: 10, projectedRoi: 6.0 },
];

const CHANNEL_COLORS = [
  "bg-violet-500", "bg-pink-500", "bg-blue-500", "bg-emerald-500",
  "bg-amber-500", "bg-red-500", "bg-cyan-500", "bg-orange-500",
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

export default function BudgetAllocatorPage() {
  const [savedAllocations, setSavedAllocations, hydrated] = useLocalStorage<Allocation[]>("ads-budget-allocations", []);
  const [totalBudget, setTotalBudget] = useState("10000");
  const [channels, setChannels] = useState<Channel[]>(DEFAULT_CHANNELS.map((c) => ({ ...c, id: generateId() })));
  const [allocationName, setAllocationName] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [showLibrary, setShowLibrary] = useState(false);
  const [copied, setCopied] = useState(false);

  const budget = parseFloat(totalBudget) || 0;
  const totalPercent = useMemo(() => channels.reduce((s, c) => s + c.percent, 0), [channels]);
  const totalProjectedRevenue = useMemo(() => channels.reduce((s, c) => s + (budget * c.percent / 100) * c.projectedRoi, 0), [channels, budget]);

  function updateChannel(id: string, field: keyof Channel, value: number) {
    setChannels((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c));
  }

  function addChannel() {
    if (!newChannelName.trim()) return;
    setChannels((prev) => [...prev, { id: generateId(), name: newChannelName.trim(), percent: 0, projectedRoi: 3.0 }]);
    setNewChannelName("");
  }

  function removeChannel(id: string) {
    setChannels((prev) => prev.filter((c) => c.id !== id));
  }

  function saveAllocation() {
    if (!allocationName.trim()) return;
    const allocation: Allocation = { id: generateId(), name: allocationName.trim(), totalBudget: budget, channels: [...channels], createdAt: new Date().toISOString() };
    setSavedAllocations((prev) => [allocation, ...prev]);
    setAllocationName("");
  }

  function loadAllocation(a: Allocation) {
    setTotalBudget(String(a.totalBudget));
    setChannels(a.channels.map((c) => ({ ...c, id: generateId() })));
    setShowLibrary(false);
  }

  const handleExport = useCallback(() => {
    let text = `AD BUDGET ALLOCATION\n${"=".repeat(40)}\nTotal Budget: ${formatCurrency(budget)}\n\n`;
    channels.forEach((c) => {
      const amount = budget * c.percent / 100;
      text += `${c.name}: ${c.percent}% (${formatCurrency(amount)}) — Projected ROI: ${c.projectedRoi}x (${formatCurrency(amount * c.projectedRoi)})\n`;
    });
    text += `\nTotal Allocation: ${totalPercent}%\nProjected Revenue: ${formatCurrency(totalProjectedRevenue)}\n`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [budget, channels, totalPercent, totalProjectedRevenue]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Ad Budget Allocator" description="Allocate your marketing budget across channels with projected ROI." icon={PieChart} badge="Ads" actions={
        <Button variant="outline" size="sm" onClick={() => setShowLibrary(!showLibrary)}><BookOpen className="h-4 w-4" />Scenarios ({savedAllocations.length})</Button>
      } />

      {showLibrary ? (
        <Card>
          <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base">Saved Scenarios</CardTitle><Button variant="ghost" size="icon" onClick={() => setShowLibrary(false)}><X className="h-4 w-4" /></Button></div></CardHeader>
          <CardContent>
            {savedAllocations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No saved scenarios.</p>
            ) : (
              <div className="space-y-2">
                {savedAllocations.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <div><p className="text-sm font-medium">{a.name}</p><p className="text-xs text-muted-foreground">{formatCurrency(a.totalBudget)} &middot; {a.channels.length} channels</p></div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => loadAllocation(a)}>Load</Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSavedAllocations((prev) => prev.filter((x) => x.id !== a.id))}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardContent className="p-4"><p className="text-2xl font-bold text-violet-600">{formatCurrency(budget)}</p><p className="text-xs text-muted-foreground">Total Budget</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className={`text-2xl font-bold ${totalPercent === 100 ? "text-emerald-600" : "text-amber-600"}`}>{totalPercent}%</p><p className="text-xs text-muted-foreground">Allocated</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-2xl font-bold text-pink-600">{channels.length}</p><p className="text-xs text-muted-foreground">Channels</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalProjectedRevenue)}</p><p className="text-xs text-muted-foreground">Projected Revenue</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">Budget Settings</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExport}><Copy className="h-3.5 w-3.5" />{copied ? "Copied!" : "Export"}</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5"><Label>Total Budget ($)</Label><Input type="number" value={totalBudget} onChange={(e) => setTotalBudget(e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Scenario Name</Label><Input placeholder="e.g., Q2 Campaign" value={allocationName} onChange={(e) => setAllocationName(e.target.value)} /></div>
                <div className="space-y-1.5"><Label className="invisible">Save</Label><Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={saveAllocation} disabled={!allocationName.trim()}><Save className="h-4 w-4" />Save Scenario</Button></div>
              </div>
            </CardContent>
          </Card>

          {/* Visual bar */}
          {channels.length > 0 && (
            <div className="flex h-8 rounded-lg overflow-hidden border">
              {channels.map((c, i) => c.percent > 0 ? (
                <div key={c.id} className={`${CHANNEL_COLORS[i % CHANNEL_COLORS.length]} flex items-center justify-center text-white text-[10px] font-medium transition-all`} style={{ width: `${c.percent}%` }} title={`${c.name}: ${c.percent}%`}>
                  {c.percent >= 8 ? `${c.name} ${c.percent}%` : c.percent >= 4 ? `${c.percent}%` : ""}
                </div>
              ) : null)}
              {totalPercent < 100 && <div className="bg-muted flex-1 flex items-center justify-center text-[10px] text-muted-foreground">{100 - totalPercent}% unallocated</div>}
            </div>
          )}

          <div className="space-y-3">
            {channels.map((channel, i) => {
              const amount = budget * channel.percent / 100;
              const revenue = amount * channel.projectedRoi;
              return (
                <Card key={channel.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-3 w-3 rounded-full ${CHANNEL_COLORS[i % CHANNEL_COLORS.length]} shrink-0`} />
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{channel.name}</span>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="font-semibold">{formatCurrency(amount)}</span>
                            <span className="text-muted-foreground text-xs">ROI: {channel.projectedRoi}x</span>
                            <span className="text-emerald-600 text-xs font-medium">{formatCurrency(revenue)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <input type="range" min={0} max={100} value={channel.percent} onChange={(e) => updateChannel(channel.id, "percent", parseInt(e.target.value))} className="flex-1 accent-violet-600" />
                          <Input type="number" min={0} max={100} value={channel.percent} onChange={(e) => updateChannel(channel.id, "percent", parseInt(e.target.value) || 0)} className="w-16 h-7 text-xs text-center" />
                          <span className="text-xs text-muted-foreground w-4">%</span>
                          <Input type="number" min={0} max={100} step={0.1} value={channel.projectedRoi} onChange={(e) => updateChannel(channel.id, "projectedRoi", parseFloat(e.target.value) || 0)} className="w-16 h-7 text-xs text-center" />
                          <span className="text-xs text-muted-foreground w-4">x</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeChannel(channel.id)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Input placeholder="New channel name..." value={newChannelName} onChange={(e) => setNewChannelName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addChannel()} className="flex-1" />
                <Button variant="outline" onClick={addChannel} disabled={!newChannelName.trim()}><Plus className="h-4 w-4" />Add Channel</Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
