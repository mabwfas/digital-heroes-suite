"use client";

import { useState, useMemo } from "react";
import {
  Gift,
  Plus,
  Trash2,
  Search,
  Trophy,
  DollarSign,
  Users,
  TrendingUp,
  Edit2,
  X,
  Check,
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
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type ReferralStatus = "pending" | "converted" | "paid";

interface Referral {
  id: string;
  clientName: string;
  status: ReferralStatus;
  value: number;
  date: string;
}

interface Referrer {
  id: string;
  name: string;
  email: string;
  bonusRate: number;
  referrals: Referral[];
  createdAt: string;
}

const STATUS_CONFIG: Record<ReferralStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0" },
  converted: { label: "Converted", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0" },
  paid: { label: "Paid", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0" },
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function ReferralPage() {
  const [referrers, setReferrers, hydrated] = useLocalStorage<Referrer[]>("sales-referrers", []);
  const [search, setSearch] = useState("");
  const [showAddReferrer, setShowAddReferrer] = useState(false);
  const [showAddReferral, setShowAddReferral] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newBonusRate, setNewBonusRate] = useState("10");
  const [refClientName, setRefClientName] = useState("");
  const [refValue, setRefValue] = useState("");
  const [refStatus, setRefStatus] = useState<ReferralStatus>("pending");

  const stats = useMemo(() => {
    const allReferrals = referrers.flatMap((r) => r.referrals);
    const totalReferrals = allReferrals.length;
    const converted = allReferrals.filter((r) => r.status === "converted" || r.status === "paid").length;
    const conversionRate = totalReferrals > 0 ? ((converted / totalReferrals) * 100) : 0;
    const totalValue = allReferrals.filter((r) => r.status === "converted" || r.status === "paid").reduce((s, r) => s + r.value, 0);
    const totalPaid = referrers.reduce((s, referrer) => {
      const paidRefs = referrer.referrals.filter((r) => r.status === "paid");
      return s + paidRefs.reduce((ps, r) => ps + (r.value * referrer.bonusRate / 100), 0);
    }, 0);
    return { totalReferrals, converted, conversionRate, totalValue, totalPaid, referrerCount: referrers.length };
  }, [referrers]);

  const leaderboard = useMemo(() => {
    return [...referrers].sort((a, b) => {
      const aConverted = a.referrals.filter((r) => r.status !== "pending").length;
      const bConverted = b.referrals.filter((r) => r.status !== "pending").length;
      return bConverted - aConverted;
    });
  }, [referrers]);

  const filtered = useMemo(() => {
    if (!search) return referrers;
    const q = search.toLowerCase();
    return referrers.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
  }, [referrers, search]);

  function handleAddReferrer() {
    if (!newName.trim()) return;
    const referrer: Referrer = { id: generateId(), name: newName.trim(), email: newEmail.trim(), bonusRate: parseFloat(newBonusRate) || 10, referrals: [], createdAt: new Date().toISOString() };
    setReferrers((prev) => [referrer, ...prev]);
    setShowAddReferrer(false);
    setNewName(""); setNewEmail(""); setNewBonusRate("10");
  }

  function handleAddReferral(referrerId: string) {
    if (!refClientName.trim()) return;
    const referral: Referral = { id: generateId(), clientName: refClientName.trim(), status: refStatus, value: parseFloat(refValue) || 0, date: new Date().toISOString() };
    setReferrers((prev) => prev.map((r) => r.id === referrerId ? { ...r, referrals: [...r.referrals, referral] } : r));
    setShowAddReferral(null);
    setRefClientName(""); setRefValue(""); setRefStatus("pending");
  }

  function updateReferralStatus(referrerId: string, referralId: string, status: ReferralStatus) {
    setReferrers((prev) => prev.map((r) => r.id === referrerId ? { ...r, referrals: r.referrals.map((ref) => ref.id === referralId ? { ...ref, status } : ref) } : r));
  }

  function removeReferral(referrerId: string, referralId: string) {
    setReferrers((prev) => prev.map((r) => r.id === referrerId ? { ...r, referrals: r.referrals.filter((ref) => ref.id !== referralId) } : r));
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Referral Program Manager" description="Track referrers, referrals, and calculate commissions." icon={Gift} badge="Sales" actions={
        <Button variant="outline" size="sm" onClick={() => setShowLeaderboard(!showLeaderboard)}>
          <Trophy className="h-4 w-4" />{showLeaderboard ? "All Referrers" : "Leaderboard"}
        </Button>
      } />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: "Referrers", value: stats.referrerCount, color: "text-violet-600" },
          { label: "Total Referrals", value: stats.totalReferrals, color: "text-pink-600" },
          { label: "Converted", value: stats.converted, color: "text-emerald-600" },
          { label: "Conversion Rate", value: `${stats.conversionRate.toFixed(1)}%`, color: "text-blue-600" },
          { label: "Referral Revenue", value: formatCurrency(stats.totalValue), color: "text-amber-600" },
          { label: "Total Paid Out", value: formatCurrency(stats.totalPaid), color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4"><p className={`text-xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
        ))}
      </div>

      {showLeaderboard ? (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-amber-500" />Leaderboard</CardTitle></CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No referrers yet.</p> : (
              <div className="space-y-2">
                {leaderboard.map((r, i) => {
                  const converted = r.referrals.filter((ref) => ref.status !== "pending").length;
                  const earned = r.referrals.filter((ref) => ref.status === "paid").reduce((s, ref) => s + (ref.value * r.bonusRate / 100), 0);
                  return (
                    <div key={r.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-slate-400 text-white" : i === 2 ? "bg-amber-700 text-white" : "bg-muted text-muted-foreground"}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{converted} converted &middot; {r.referrals.length} total</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-600">{formatCurrency(earned)}</p>
                        <p className="text-[10px] text-muted-foreground">earned</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search referrers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
            <Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={() => setShowAddReferrer(true)}><Plus className="h-4 w-4" />Add Referrer</Button>
          </div>

          {filtered.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-16 text-center"><Gift className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" /><p className="text-sm text-muted-foreground">No referrers yet. Add your first referrer to start tracking.</p></CardContent></Card>
          ) : (
            <div className="space-y-4">
              {filtered.map((referrer) => {
                const totalEarned = referrer.referrals.filter((r) => r.status === "paid").reduce((s, r) => s + (r.value * referrer.bonusRate / 100), 0);
                return (
                  <Card key={referrer.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">{referrer.name.charAt(0).toUpperCase()}</div>
                          <div>
                            <p className="font-semibold text-sm">{referrer.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {referrer.email && <span>{referrer.email}</span>}
                              <Badge variant="secondary" className="text-[10px]">{referrer.bonusRate}% bonus</Badge>
                              <span className="font-medium text-emerald-600">{formatCurrency(totalEarned)} earned</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => setShowAddReferral(referrer.id)}><Plus className="h-3.5 w-3.5" />Referral</Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setReferrers((prev) => prev.filter((r) => r.id !== referrer.id))}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                        </div>
                      </div>
                    </CardHeader>
                    {referrer.referrals.length > 0 && (
                      <CardContent>
                        <div className="space-y-2">
                          {referrer.referrals.map((ref) => (
                            <div key={ref.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{ref.clientName}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{formatCurrency(ref.value)}</span>
                                  <span>&middot;</span>
                                  <span>{new Date(ref.date).toLocaleDateString()}</span>
                                  {ref.status === "paid" && <span className="text-emerald-600 font-medium">+{formatCurrency(ref.value * referrer.bonusRate / 100)}</span>}
                                </div>
                              </div>
                              <Select value={ref.status} onValueChange={(v) => updateReferralStatus(referrer.id, ref.id, v as ReferralStatus)}>
                                <SelectTrigger className="w-[110px] h-7 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="converted">Converted</SelectItem>
                                  <SelectItem value="paid">Paid</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeReferral(referrer.id, ref.id)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <Dialog open={showAddReferrer} onOpenChange={setShowAddReferrer}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Referrer</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="John Smith" /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="john@example.com" /></div>
            <div className="space-y-1.5"><Label>Bonus Rate (%)</Label><Input type="number" value={newBonusRate} onChange={(e) => setNewBonusRate(e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowAddReferrer(false)}>Cancel</Button><Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleAddReferrer} disabled={!newName.trim()}>Add Referrer</Button></div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showAddReferral} onOpenChange={(open) => !open && setShowAddReferral(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Referral</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Referred Client *</Label><Input value={refClientName} onChange={(e) => setRefClientName(e.target.value)} placeholder="Client name" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Deal Value ($)</Label><Input type="number" value={refValue} onChange={(e) => setRefValue(e.target.value)} placeholder="5000" /></div>
              <div className="space-y-1.5"><Label>Status</Label><Select value={refStatus} onValueChange={(v) => setRefStatus(v as ReferralStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="converted">Converted</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent></Select></div>
            </div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowAddReferral(null)}>Cancel</Button><Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={() => showAddReferral && handleAddReferral(showAddReferral)} disabled={!refClientName.trim()}>Add Referral</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
