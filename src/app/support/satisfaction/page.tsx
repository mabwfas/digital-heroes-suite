"use client";

import { useState, useMemo, useCallback } from "react";
import { SmilePlus, Plus, Star, Trash2, Search, TrendingUp, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface CSATEntry {
  id: string;
  ticketRef: string;
  client: string;
  agent: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const EMPTY: Omit<CSATEntry, "id" | "createdAt"> = {
  ticketRef: "", client: "", agent: "", rating: 5, comment: "",
};

export default function SatisfactionPage() {
  const [entries, setEntries, hydrated] = useLocalStorage<CSATEntry[]>("csat-entries", []);
  const [search, setSearch] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchSearch = !search || e.client.toLowerCase().includes(search.toLowerCase()) || e.agent.toLowerCase().includes(search.toLowerCase()) || e.ticketRef.toLowerCase().includes(search.toLowerCase());
      const matchRating = filterRating === "all" || e.rating === Number(filterRating);
      return matchSearch && matchRating;
    });
  }, [entries, search, filterRating]);

  const stats = useMemo(() => {
    const total = entries.length;
    if (total === 0) return { avg: 0, total: 0, positive: 0, negative: 0, trend: 0 };
    const avg = Math.round(entries.reduce((s, e) => s + e.rating, 0) / total * 10) / 10;
    const positive = entries.filter((e) => e.rating >= 4).length;
    const negative = entries.filter((e) => e.rating <= 2).length;
    // Trend: compare last 10 vs previous 10
    const recent = entries.slice(0, Math.min(10, total));
    const older = entries.slice(10, Math.min(20, total));
    const recentAvg = recent.reduce((s, e) => s + e.rating, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((s, e) => s + e.rating, 0) / older.length : recentAvg;
    const trend = Math.round((recentAvg - olderAvg) * 10) / 10;
    return { avg, total, positive, negative, trend };
  }, [entries]);

  const suggestions = useMemo(() => {
    const s: string[] = [];
    if (stats.avg < 3.5 && stats.total > 0) s.push("Your average CSAT is below 3.5. Review recent negative feedback for common themes.");
    if (stats.negative > stats.positive && stats.total > 3) s.push("You have more negative ratings than positive. Consider implementing a feedback loop with unhappy customers.");
    if (stats.trend < 0) s.push("Your CSAT trend is declining. Investigate what changed recently.");
    if (stats.total < 10) s.push("Collect more feedback to get statistically meaningful insights.");
    if (stats.avg >= 4.5 && stats.total >= 10) s.push("Excellent CSAT score! Consider sharing positive testimonials with your team.");
    return s;
  }, [stats]);

  const handleSave = useCallback(() => {
    if (!form.client.trim()) return;
    setEntries((prev) => [{ ...form, id: generateId(), createdAt: new Date().toISOString() }, ...prev]);
    setShowForm(false); setForm(EMPTY);
  }, [form, setEntries]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Satisfaction Tracker"
        description="Track CSAT scores, analyze trends, and get improvement suggestions."
        icon={SmilePlus}
        badge="Support"
        actions={
          <Button size="sm" className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={() => { setForm(EMPTY); setShowForm(true); }}>
            <Plus className="h-4 w-4" />Add Rating
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-border/50"><CardContent className="p-4">
          <p className={`text-2xl font-bold ${stats.avg >= 4 ? "text-emerald-600" : stats.avg >= 3 ? "text-amber-600" : "text-red-600"}`}>{stats.avg || "-"}</p>
          <p className="text-xs text-muted-foreground">Average CSAT</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total Ratings</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4">
          <p className="text-2xl font-bold text-emerald-600">{stats.positive}</p>
          <p className="text-xs text-muted-foreground">Positive (4-5)</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4">
          <p className="text-2xl font-bold text-red-600">{stats.negative}</p>
          <p className="text-xs text-muted-foreground">Negative (1-2)</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4">
          <div className="flex items-center gap-1">
            <p className={`text-2xl font-bold ${stats.trend > 0 ? "text-emerald-600" : stats.trend < 0 ? "text-red-600" : "text-muted-foreground"}`}>
              {stats.trend > 0 ? "+" : ""}{stats.trend || "-"}
            </p>
            {stats.trend !== 0 && (stats.trend > 0 ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />)}
          </div>
          <p className="text-xs text-muted-foreground">Trend</p>
        </CardContent></Card>
      </div>

      {/* Rating distribution */}
      {entries.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Rating Distribution</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[5, 4, 3, 2, 1].map((r) => {
              const count = entries.filter((e) => e.rating === r).length;
              const pct = entries.length > 0 ? Math.round((count / entries.length) * 100) : 0;
              return (
                <div key={r} className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5 w-16 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < r ? "text-amber-500 fill-amber-500" : "text-muted-foreground/20"}`} />)}
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${r >= 4 ? "bg-emerald-500" : r === 3 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">{count} ({pct}%)</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {suggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Suggestions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {suggestions.map((s, i) => (
              <div key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-amber-500 shrink-0">&#9679;</span>{s}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by client, agent, ticket..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterRating} onValueChange={(v) => setFilterRating(v as string)}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((r) => <SelectItem key={r} value={String(r)}>{r} Star{r > 1 ? "s" : ""}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <SmilePlus className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">{entries.length === 0 ? "No ratings yet. Start collecting feedback." : "No matching ratings."}</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((entry) => (
            <Card key={entry.id} className="border-border/50 group">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm">{entry.client}</span>
                      <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < entry.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/20"}`} />)}</div>
                      {entry.ticketRef && <Badge variant="secondary" className="text-[10px]">#{entry.ticketRef}</Badge>}
                    </div>
                    {entry.comment && <p className="text-xs text-muted-foreground line-clamp-2">{entry.comment}</p>}
                    <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                      {entry.agent && <span>Agent: {entry.agent}</span>}
                      <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive shrink-0" onClick={() => setEntries((p) => p.filter((e) => e.id !== entry.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add CSAT Rating</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Client Name *</Label><Input value={form.client} onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Ticket Ref</Label><Input placeholder="e.g. TK-001" value={form.ticketRef} onChange={(e) => setForm((f) => ({ ...f, ticketRef: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Agent</Label><Input value={form.agent} onChange={(e) => setForm((f) => ({ ...f, agent: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Rating</Label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} onClick={() => setForm((f) => ({ ...f, rating: i + 1 }))} className="focus:outline-none">
                    <Star className={`h-6 w-6 cursor-pointer ${i < form.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`} />
                  </button>
                ))}
                <span className="text-sm ml-2 text-muted-foreground">{form.rating}/5</span>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Comment</Label><Textarea value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} rows={3} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.client.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">Save Rating</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
