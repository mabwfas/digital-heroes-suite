"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Calendar,
  Filter,
  Search,
  ArrowUpRight,
  ArrowRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type TrendStatus = "emerging" | "growing" | "mature" | "declining";
type ImpactLevel = "high" | "medium" | "low";

interface Trend {
  id: string;
  name: string;
  category: string;
  sourceUrl: string;
  impact: ImpactLevel;
  status: TrendStatus;
  notes: string;
  dateSpotted: string;
}

const STATUS_CONFIG: Record<TrendStatus, { label: string; icon: typeof ArrowUpRight; className: string }> = {
  emerging: { label: "Emerging", icon: ArrowUpRight, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0" },
  growing: { label: "Growing", icon: TrendingUp, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0" },
  mature: { label: "Mature", icon: ArrowRight, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0" },
  declining: { label: "Declining", icon: ArrowDownRight, className: "bg-red-500/10 text-red-600 dark:text-red-400 border-0" },
};

const IMPACT_COLORS: Record<ImpactLevel, string> = {
  high: "bg-red-500/10 text-red-600 border-0",
  medium: "bg-amber-500/10 text-amber-600 border-0",
  low: "bg-slate-500/10 text-slate-600 border-0",
};

const EMPTY_FORM: Omit<Trend, "id"> = {
  name: "",
  category: "",
  sourceUrl: "",
  impact: "medium",
  status: "emerging",
  notes: "",
  dateSpotted: new Date().toISOString().split("T")[0],
};

export default function TrendTrackerPage() {
  const [trends, setTrends] = useLocalStorage<Trend[]>("trend-tracker-data", []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | TrendStatus>("all");
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");

  const categories = useMemo(() => {
    const set = new Set(trends.map((t) => t.category).filter(Boolean));
    return Array.from(set).sort();
  }, [trends]);

  const filtered = useMemo(() => {
    return trends.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "all" || t.status === filterStatus;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.dateSpotted).getTime() - new Date(a.dateSpotted).getTime());
  }, [trends, search, filterStatus]);

  const timelineGroups = useMemo(() => {
    const groups = new Map<string, Trend[]>();
    filtered.forEach((t) => {
      const month = t.dateSpotted.substring(0, 7);
      const existing = groups.get(month) || [];
      existing.push(t);
      groups.set(month, existing);
    });
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(trend: Trend) {
    setForm({ name: trend.name, category: trend.category, sourceUrl: trend.sourceUrl, impact: trend.impact, status: trend.status, notes: trend.notes, dateSpotted: trend.dateSpotted });
    setEditingId(trend.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editingId) {
      setTrends((prev) => prev.map((t) => (t.id === editingId ? { ...t, ...form } : t)));
    } else {
      setTrends((prev) => [{ ...form, id: generateId() }, ...prev]);
    }
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setTrends((prev) => prev.filter((t) => t.id !== id));
  }

  const stats = useMemo(() => ({
    total: trends.length,
    emerging: trends.filter((t) => t.status === "emerging").length,
    growing: trends.filter((t) => t.status === "growing").length,
    highImpact: trends.filter((t) => t.impact === "high").length,
  }), [trends]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Industry Trend Tracker"
        description="Log and track industry trends with status, impact, and timeline views"
        icon={TrendingUp}
        badge="Research"
        replaces="Notion / Spreadsheets"
        actions={
          <Button
            onClick={openAdd}
            className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0"
          >
            <Plus className="h-4 w-4 mr-2" /> Log Trend
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Trends", value: stats.total, color: "text-violet-600 dark:text-violet-400" },
          { label: "Emerging", value: stats.emerging, color: "text-blue-600 dark:text-blue-400" },
          { label: "Growing", value: stats.growing, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "High Impact", value: stats.highImpact, color: "text-red-600 dark:text-red-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search trends..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="emerging">Emerging</SelectItem>
            <SelectItem value="growing">Growing</SelectItem>
            <SelectItem value="mature">Mature</SelectItem>
            <SelectItem value="declining">Declining</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>List</Button>
          <Button variant={viewMode === "timeline" ? "default" : "outline"} size="sm" onClick={() => setViewMode("timeline")}>Timeline</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center mb-4">
              <TrendingUp className="h-7 w-7 text-violet-400" />
            </div>
            <p className="font-medium text-muted-foreground mb-1">No trends tracked yet</p>
            <p className="text-sm text-muted-foreground/70">Start logging industry trends to build your tracker</p>
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <div className="grid gap-3">
          {filtered.map((trend) => {
            const StatusIcon = STATUS_CONFIG[trend.status].icon;
            return (
              <Card key={trend.id} className="border-border/50 hover:border-violet-500/30 transition-colors group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold">{trend.name}</span>
                        <Badge className={STATUS_CONFIG[trend.status].className}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {STATUS_CONFIG[trend.status].label}
                        </Badge>
                        <Badge className={IMPACT_COLORS[trend.impact]}>{trend.impact} impact</Badge>
                        {trend.category && <Badge variant="secondary" className="text-[10px]">{trend.category}</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(trend.dateSpotted).toLocaleDateString()}</span>
                        {trend.sourceUrl && (
                          <a href={trend.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-violet-500 transition-colors">
                            <ExternalLink className="h-3 w-3" /> Source
                          </a>
                        )}
                      </div>
                      {trend.notes && <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{trend.notes}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(trend)}><Edit2 className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => handleDelete(trend.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="space-y-8">
          {timelineGroups.map(([month, items]) => (
            <div key={month}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-3 w-3 rounded-full bg-violet-500" />
                <h3 className="font-semibold text-sm">{new Date(month + "-01").toLocaleDateString(undefined, { year: "numeric", month: "long" })}</h3>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="ml-6 space-y-2">
                {items.map((trend) => (
                  <Card key={trend.id} className="border-border/50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{trend.name}</span>
                        <Badge className={`text-[10px] ${STATUS_CONFIG[trend.status].className}`}>{STATUS_CONFIG[trend.status].label}</Badge>
                        <Badge className={`text-[10px] ${IMPACT_COLORS[trend.impact]}`}>{trend.impact}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Trend" : "Log New Trend"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Trend Name *</Label>
              <Input placeholder="e.g., AI-powered checkout" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input placeholder="e.g., E-commerce" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} list="trend-categories" />
                <datalist id="trend-categories">
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label>Date Spotted</Label>
                <Input type="date" value={form.dateSpotted} onChange={(e) => setForm((f) => ({ ...f, dateSpotted: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as TrendStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emerging">Emerging</SelectItem>
                    <SelectItem value="growing">Growing</SelectItem>
                    <SelectItem value="mature">Mature</SelectItem>
                    <SelectItem value="declining">Declining</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Impact Level</Label>
                <Select value={form.impact} onValueChange={(v) => setForm((f) => ({ ...f, impact: v as ImpactLevel }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Source URL</Label>
              <Input placeholder="https://..." value={form.sourceUrl} onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Additional context..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              {editingId ? "Save Changes" : "Log Trend"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
