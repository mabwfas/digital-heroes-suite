"use client";

import { useState, useMemo } from "react";
import { BookOpen, Plus, Search, Trash2, Calendar, Smile, Meh, Frown, Heart, Flame } from "lucide-react";
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
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface JournalEntry {
  id: string;
  date: string;
  mood: number;
  wins: string;
  challenges: string;
  gratitude: string;
  tomorrowPriorities: string;
  freeWrite: string;
}

const MOODS = [
  { value: 1, icon: Frown, label: "Tough Day", color: "text-red-500" },
  { value: 2, icon: Meh, label: "Okay", color: "text-amber-500" },
  { value: 3, icon: Smile, label: "Good", color: "text-emerald-500" },
  { value: 4, icon: Heart, label: "Great", color: "text-violet-500" },
  { value: 5, icon: Flame, label: "Amazing", color: "text-pink-500" },
];

export default function JournalPage() {
  const [entries, setEntries] = useLocalStorage<JournalEntry[]>("productivity-journal", []);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Omit<JournalEntry, "id">>({
    date: new Date().toISOString().split("T")[0],
    mood: 3,
    wins: "",
    challenges: "",
    gratitude: "",
    tomorrowPriorities: "",
    freeWrite: "",
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return entries
      .filter((e) =>
        e.wins.toLowerCase().includes(q) ||
        e.challenges.toLowerCase().includes(q) ||
        e.gratitude.toLowerCase().includes(q) ||
        e.freeWrite.toLowerCase().includes(q) ||
        e.date.includes(q)
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, search]);

  const streak = useMemo(() => {
    const dates = [...new Set(entries.map((e) => e.date))].sort().reverse();
    let count = 0;
    const d = new Date();
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(d);
      expected.setDate(expected.getDate() - i);
      if (dates[i] === expected.toISOString().split("T")[0]) count++;
      else break;
    }
    return count;
  }, [entries]);

  const avgMood = useMemo(() => {
    if (entries.length === 0) return 0;
    return Math.round((entries.reduce((s, e) => s + e.mood, 0) / entries.length) * 10) / 10;
  }, [entries]);

  function openNew() {
    setForm({
      date: new Date().toISOString().split("T")[0],
      mood: 3, wins: "", challenges: "", gratitude: "", tomorrowPriorities: "", freeWrite: "",
    });
    setShowForm(true);
  }

  function handleSave() {
    setEntries((prev) => [{ ...form, id: generateId() }, ...prev]);
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function getMoodConfig(mood: number) {
    return MOODS.find((m) => m.value === mood) || MOODS[2];
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Journal"
        description="Date-based entries with guided prompts, mood tracking, search, and journaling streaks."
        icon={BookOpen}
        badge="Productivity"
        replaces="Day One / Notion journal"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{entries.length}</p><p className="text-xs text-muted-foreground">Total Entries</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold flex items-center gap-1"><Flame className="h-5 w-5 text-orange-500" />{streak}</p><p className="text-xs text-muted-foreground">Day Streak</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{avgMood}</p><p className="text-xs text-muted-foreground">Avg Mood (1-5)</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{entries.filter((e) => e.date.startsWith(new Date().toISOString().slice(0, 7))).length}</p><p className="text-xs text-muted-foreground">This Month</p></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search entries..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openNew} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
          <Plus className="h-4 w-4 mr-2" />New Entry
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><BookOpen className="h-10 w-10 text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">No journal entries yet</p></CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((entry) => {
            const moodCfg = getMoodConfig(entry.mood);
            const MoodIcon = moodCfg.icon;
            const isExpanded = expandedId === entry.id;
            return (
              <Card key={entry.id} className="border-border/50 group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : entry.id)}>
                    <div className="flex items-center gap-3">
                      <MoodIcon className={`h-6 w-6 ${moodCfg.color}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{new Date(entry.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
                          <Badge className={`text-xs border-0 ${moodCfg.color} bg-current/10`}>{moodCfg.label}</Badge>
                        </div>
                        {entry.wins && <p className="text-sm text-muted-foreground truncate max-w-md">{entry.wins}</p>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      {entry.wins && <div><p className="text-xs font-medium text-emerald-600 mb-0.5">Wins</p><p className="text-sm whitespace-pre-wrap">{entry.wins}</p></div>}
                      {entry.challenges && <div><p className="text-xs font-medium text-amber-600 mb-0.5">Challenges</p><p className="text-sm whitespace-pre-wrap">{entry.challenges}</p></div>}
                      {entry.gratitude && <div><p className="text-xs font-medium text-pink-600 mb-0.5">Gratitude</p><p className="text-sm whitespace-pre-wrap">{entry.gratitude}</p></div>}
                      {entry.tomorrowPriorities && <div><p className="text-xs font-medium text-violet-600 mb-0.5">Tomorrow&#39;s Priorities</p><p className="text-sm whitespace-pre-wrap">{entry.tomorrowPriorities}</p></div>}
                      {entry.freeWrite && <div><p className="text-xs font-medium text-muted-foreground mb-0.5">Notes</p><p className="text-sm whitespace-pre-wrap">{entry.freeWrite}</p></div>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Journal Entry</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-40" />
              </div>
              <div className="space-y-1.5">
                <Label>How was your day?</Label>
                <div className="flex gap-2">
                  {MOODS.map((m) => (
                    <button key={m.value} onClick={() => setForm((f) => ({ ...f, mood: m.value }))} className={`p-2 rounded-lg border ${form.mood === m.value ? "border-violet-500 bg-violet-500/10" : "border-border/50"}`}>
                      <m.icon className={`h-5 w-5 ${m.color}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-emerald-600">What went well today?</Label><Textarea value={form.wins} onChange={(e) => setForm((f) => ({ ...f, wins: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label className="text-amber-600">What were your challenges?</Label><Textarea value={form.challenges} onChange={(e) => setForm((f) => ({ ...f, challenges: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label className="text-pink-600">What are you grateful for?</Label><Textarea value={form.gratitude} onChange={(e) => setForm((f) => ({ ...f, gratitude: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label className="text-violet-600">Tomorrow&#39;s top priorities</Label><Textarea value={form.tomorrowPriorities} onChange={(e) => setForm((f) => ({ ...f, tomorrowPriorities: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label>Free write / Notes</Label><Textarea value={form.freeWrite} onChange={(e) => setForm((f) => ({ ...f, freeWrite: e.target.value }))} rows={3} /></div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={handleSave} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">Save Entry</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
