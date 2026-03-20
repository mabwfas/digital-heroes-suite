"use client";

import { useState, useMemo } from "react";
import {
  Target,
  Plus,
  Trash2,
  Search,
  Flame,
  ThermometerSun,
  Snowflake,
  ArrowUpDown,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type Platform = "Fiverr" | "Upwork" | "Direct" | "Referral" | "Other";

interface Lead {
  id: string;
  name: string;
  email: string;
  platform: Platform;
  budget: number;      // 1-5
  timeline: number;    // 1-5
  complexity: number;  // 1-5
  communication: number; // 1-5
  notes: string;
  createdAt: string;
}

const WEIGHTS = { budget: 3, timeline: 2.5, complexity: 1.5, communication: 2 };

function calcScore(lead: Lead): number {
  return (
    lead.budget * WEIGHTS.budget +
    lead.timeline * WEIGHTS.timeline +
    (6 - lead.complexity) * WEIGHTS.complexity + // lower complexity = better
    lead.communication * WEIGHTS.communication
  );
}

function maxScore(): number {
  return 5 * WEIGHTS.budget + 5 * WEIGHTS.timeline + 5 * WEIGHTS.complexity + 5 * WEIGHTS.communication;
}

function getCategory(score: number): { label: string; className: string; icon: typeof Flame } {
  const pct = (score / maxScore()) * 100;
  if (pct >= 70) return { label: "Hot", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-0", icon: Flame };
  if (pct >= 45) return { label: "Warm", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0", icon: ThermometerSun };
  return { label: "Cold", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0", icon: Snowflake };
}

const PLATFORMS: Platform[] = ["Fiverr", "Upwork", "Direct", "Referral", "Other"];

export default function LeadScorerPage() {
  const [leads, setLeads, hydrated] = useLocalStorage<Lead[]>("sales-leads", []);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<"all" | "hot" | "warm" | "cold">("all");
  const [sortBy, setSortBy] = useState<"score" | "date" | "name">("score");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [platform, setPlatform] = useState<Platform>("Direct");
  const [budget, setBudget] = useState(3);
  const [timeline, setTimeline] = useState(3);
  const [complexity, setComplexity] = useState(3);
  const [communication, setCommunication] = useState(3);
  const [notes, setNotes] = useState("");

  const filtered = useMemo(() => {
    let list = [...leads];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((l) => l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q));
    }
    if (filterCat !== "all") {
      list = list.filter((l) => getCategory(calcScore(l)).label.toLowerCase() === filterCat);
    }
    list.sort((a, b) => {
      if (sortBy === "score") return calcScore(b) - calcScore(a);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [leads, search, filterCat, sortBy]);

  const stats = useMemo(() => ({
    total: leads.length,
    hot: leads.filter((l) => getCategory(calcScore(l)).label === "Hot").length,
    warm: leads.filter((l) => getCategory(calcScore(l)).label === "Warm").length,
    cold: leads.filter((l) => getCategory(calcScore(l)).label === "Cold").length,
  }), [leads]);

  function handleAdd() {
    if (!name.trim()) return;
    const lead: Lead = { id: generateId(), name: name.trim(), email: email.trim(), platform, budget, timeline, complexity, communication, notes: notes.trim(), createdAt: new Date().toISOString() };
    setLeads((prev) => [lead, ...prev]);
    setShowForm(false);
    setName(""); setEmail(""); setPlatform("Direct"); setBudget(3); setTimeline(3); setComplexity(3); setCommunication(3); setNotes("");
  }

  function ScoreSlider({ label, value, onChange, invert }: { label: string; value: number; onChange: (v: number) => void; invert?: boolean }) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">{label}</Label>
          <span className="text-xs font-mono text-violet-600">{value}/5</span>
        </div>
        <input type="range" min={1} max={5} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="w-full accent-violet-600" />
        <div className="flex justify-between text-[9px] text-muted-foreground"><span>{invert ? "Complex" : "Low"}</span><span>{invert ? "Simple" : "High"}</span></div>
      </div>
    );
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Lead Scorer" description="Score and categorize leads with weighted criteria." icon={Target} badge="Sales" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Leads", value: stats.total, color: "text-violet-600" },
          { label: "Hot Leads", value: stats.hot, color: "text-red-600" },
          { label: "Warm Leads", value: stats.warm, color: "text-amber-600" },
          { label: "Cold Leads", value: stats.cold, color: "text-blue-600" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={filterCat} onValueChange={(v) => setFilterCat(v as typeof filterCat)}><SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="hot">Hot</SelectItem><SelectItem value="warm">Warm</SelectItem><SelectItem value="cold">Cold</SelectItem></SelectContent></Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}><SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="score">Score</SelectItem><SelectItem value="date">Date</SelectItem><SelectItem value="name">Name</SelectItem></SelectContent></Select>
        <Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />Add Lead</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Score New Lead</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" /></div>
              <div className="space-y-1.5"><Label>Platform</Label><Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <ScoreSlider label="Budget Range" value={budget} onChange={setBudget} />
              <ScoreSlider label="Timeline Urgency" value={timeline} onChange={setTimeline} />
              <ScoreSlider label="Complexity" value={complexity} onChange={setComplexity} invert />
              <ScoreSlider label="Communication" value={communication} onChange={setCommunication} />
            </div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Additional context..." /></div>
            <div className="flex gap-2">
              <Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleAdd} disabled={!name.trim()}><Plus className="h-4 w-4" />Add Lead</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-16 text-center"><Target className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" /><p className="text-sm text-muted-foreground">No leads found. Add your first lead to start scoring.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => {
            const score = calcScore(lead);
            const cat = getCategory(score);
            const CatIcon = cat.icon;
            const pct = Math.round((score / maxScore()) * 100);
            return (
              <Card key={lead.id} className="hover:border-violet-500/30 transition-colors group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">{lead.name.charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{lead.name}</span>
                        <Badge className={cat.className}><CatIcon className="h-3 w-3 mr-1" />{cat.label}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{lead.platform}</Badge>
                      </div>
                      {lead.email && <p className="text-xs text-muted-foreground">{lead.email}</p>}
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex-1 bg-muted rounded-full h-1.5"><div className={`h-1.5 rounded-full ${pct >= 70 ? "bg-red-500" : pct >= 45 ? "bg-amber-500" : "bg-blue-500"}`} style={{ width: `${pct}%` }} /></div>
                        <span className="text-xs font-mono font-bold">{pct}%</span>
                      </div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-lg font-bold">{score.toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground">/ {maxScore()}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={() => setLeads((prev) => prev.filter((l) => l.id !== lead.id))}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
