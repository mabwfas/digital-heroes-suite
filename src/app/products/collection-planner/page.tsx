"use client";

import { useState, useMemo } from "react";
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Search,
  Tag,
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

type Season = "spring" | "summer" | "fall" | "winter" | "evergreen";

interface CollectionPlan {
  id: string;
  name: string;
  description: string;
  season: Season;
  launchDate: string;
  rules: string;
  products: string;
  status: "planning" | "ready" | "launched";
  createdAt: string;
}

const SEASON_COLORS: Record<Season, string> = {
  spring: "bg-green-500/10 text-green-600",
  summer: "bg-amber-500/10 text-amber-600",
  fall: "bg-orange-500/10 text-orange-600",
  winter: "bg-blue-500/10 text-blue-600",
  evergreen: "bg-emerald-500/10 text-emerald-600",
};

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-slate-500/10 text-slate-600",
  ready: "bg-violet-500/10 text-violet-600",
  launched: "bg-emerald-500/10 text-emerald-600",
};

const EMPTY: Omit<CollectionPlan, "id" | "createdAt"> = {
  name: "",
  description: "",
  season: "evergreen",
  launchDate: "",
  rules: "",
  products: "",
  status: "planning",
};

export default function CollectionPlannerPage() {
  const [plans, setPlans] = useLocalStorage<CollectionPlan[]>("products-collections", []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [filterSeason, setFilterSeason] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return plans.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const matchSeason = filterSeason === "all" || p.season === filterSeason;
      return matchSearch && matchSeason;
    });
  }, [plans, search, filterSeason]);

  const upcoming = useMemo(() => {
    const now = new Date().toISOString().split("T")[0];
    return plans.filter((p) => p.launchDate >= now && p.status !== "launched").sort((a, b) => a.launchDate.localeCompare(b.launchDate));
  }, [plans]);

  function openAdd() {
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(p: CollectionPlan) {
    setForm({ name: p.name, description: p.description, season: p.season, launchDate: p.launchDate, rules: p.rules, products: p.products, status: p.status });
    setEditingId(p.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editingId) {
      setPlans((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...form } : p)));
    } else {
      setPlans((prev) => [{ ...form, id: generateId(), createdAt: new Date().toISOString() }, ...prev]);
    }
    setShowForm(false);
    setEditingId(null);
  }

  function handleDelete(id: string) {
    setPlans((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collection Planner"
        description="Plan product collections with seasonal calendars, launch dates, and collection rules."
        icon={FolderKanban}
        badge="Products"
        replaces="Spreadsheet planning"
      />

      {upcoming.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Upcoming Launches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {upcoming.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30 text-sm">
                  <Badge className={`${SEASON_COLORS[p.season]} border-0`}>{p.season}</Badge>
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground">{p.launchDate}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search collections..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterSeason} onValueChange={(v) => setFilterSeason(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Seasons</SelectItem>
            {(["spring", "summer", "fall", "winter", "evergreen"] as Season[]).map((s) => (
              <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
          <Plus className="h-4 w-4 mr-2" />Add Collection
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderKanban className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">No collections planned yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((p) => (
            <Card key={p.id} className="border-border/50 hover:border-violet-500/30 transition-colors group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{p.name}</span>
                      <Badge className={`${SEASON_COLORS[p.season]} border-0 text-xs`}>{p.season}</Badge>
                      <Badge className={`${STATUS_COLORS[p.status]} border-0 text-xs`}>{p.status}</Badge>
                    </div>
                    {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {p.launchDate && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Launch: {p.launchDate}
                  </p>
                )}
                {p.rules && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium">Rules:</span> {p.rules}
                  </p>
                )}
                {p.products && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.products.split(",").map((pr, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{pr.trim()}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Collection" : "New Collection Plan"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Collection name" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Describe the collection..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Season</Label>
                <Select value={form.season} onValueChange={(v) => setForm((f) => ({ ...f, season: v as Season }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["spring", "summer", "fall", "winter", "evergreen"] as Season[]).map((s) => (
                      <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Launch Date</Label>
                <Input type="date" value={form.launchDate} onChange={(e) => setForm((f) => ({ ...f, launchDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as CollectionPlan["status"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="launched">Launched</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Collection Rules</Label>
              <Input value={form.rules} onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value }))} placeholder="e.g. tag = summer AND price > 20" />
            </div>
            <div className="space-y-1.5">
              <Label>Products (comma separated)</Label>
              <Input value={form.products} onChange={(e) => setForm((f) => ({ ...f, products: e.target.value }))} placeholder="Product A, Product B" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              {editingId ? "Save Changes" : "Add Collection"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
