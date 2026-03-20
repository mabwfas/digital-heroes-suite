"use client";

import { useState, useMemo, useCallback } from "react";
import { BookOpen, Plus, Search, Edit2, Trash2, Eye, Star, X, Copy } from "lucide-react";
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

interface SwipeEntry {
  id: string;
  headline: string;
  body: string;
  source: string;
  category: string;
  tags: string;
  rating: number;
  createdAt: string;
}

const CATEGORIES = ["Ad Copy", "Email", "Landing Page", "Social Media", "Headlines", "CTA", "Taglines", "Other"];

const EMPTY_FORM: Omit<SwipeEntry, "id" | "createdAt"> = {
  headline: "", body: "", source: "", category: "Headlines", tags: "", rating: 3,
};

export default function SwipeFilePage() {
  const [entries, setEntries, hydrated] = useLocalStorage<SwipeEntry[]>("swipe-file", []);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewEntry, setViewEntry] = useState<SwipeEntry | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchSearch = !search || e.headline.toLowerCase().includes(search.toLowerCase()) || e.body.toLowerCase().includes(search.toLowerCase()) || e.tags.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === "all" || e.category === filterCat;
      return matchSearch && matchCat;
    });
  }, [entries, search, filterCat]);

  const openAdd = useCallback(() => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); }, []);
  const openEdit = useCallback((e: SwipeEntry) => {
    setForm({ headline: e.headline, body: e.body, source: e.source, category: e.category, tags: e.tags, rating: e.rating });
    setEditingId(e.id); setShowForm(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.headline.trim()) return;
    if (editingId) {
      setEntries((prev) => prev.map((e) => e.id === editingId ? { ...e, ...form } : e));
    } else {
      setEntries((prev) => [{ ...form, id: generateId(), createdAt: new Date().toISOString() }, ...prev]);
    }
    setShowForm(false); setEditingId(null);
  }, [form, editingId, setEntries]);

  const handleDelete = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (viewEntry?.id === id) setViewEntry(null);
  }, [setEntries, viewEntry]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Swipe File Manager"
        description="Save and organize inspiring copy examples. Search, filter, rate, and reference anytime."
        icon={BookOpen}
        badge="Copywriting"
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search headlines, body, tags..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCat} onValueChange={(v) => setFilterCat(v as string)}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">
          <Plus className="h-4 w-4 mr-2" />Add Entry
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">{entries.length === 0 ? "Start building your swipe file. Add your first entry." : "No matching entries."}</p>
            {entries.length === 0 && <Button onClick={openAdd} variant="outline" className="mt-4"><Plus className="h-4 w-4 mr-2" />Add First Entry</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((entry) => (
            <Card key={entry.id} className="border-border/50 hover:border-violet-500/30 transition-colors group">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm truncate">{entry.headline}</span>
                      <Badge variant="secondary" className="text-[10px]">{entry.category}</Badge>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < entry.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/20"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{entry.body}</p>
                    {entry.source && <p className="text-[10px] text-muted-foreground/60 mt-1">Source: {entry.source}</p>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewEntry(entry)}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(entry)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(entry.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Entry" : "Add Swipe File Entry"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Headline / Title *</Label>
              <Input placeholder="The catchy headline or subject" value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Body Copy</Label>
              <Textarea placeholder="The full copy text" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Input placeholder="Where you found it" value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v ?? f.category }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tags (comma separated)</Label>
                <Input placeholder="e.g. urgency, SaaS, B2B" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Rating (1-5)</Label>
                <div className="flex items-center gap-1 pt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button key={i} onClick={() => setForm((f) => ({ ...f, rating: i + 1 }))} className="focus:outline-none">
                      <Star className={`h-5 w-5 cursor-pointer ${i < form.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.headline.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">
              {editingId ? "Save Changes" : "Add Entry"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewEntry} onOpenChange={(o) => !o && setViewEntry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Swipe Entry</DialogTitle></DialogHeader>
          {viewEntry && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg">{viewEntry.headline}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{viewEntry.category}</Badge>
                  <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < viewEntry.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/20"}`} />)}</div>
                </div>
              </div>
              {viewEntry.body && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewEntry.body}</p>}
              {viewEntry.source && <p className="text-xs text-muted-foreground">Source: {viewEntry.source}</p>}
              {viewEntry.tags && <div className="flex gap-1 flex-wrap">{viewEntry.tags.split(",").map((t) => <Badge key={t.trim()} variant="outline" className="text-[10px]">{t.trim()}</Badge>)}</div>}
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`${viewEntry.headline}\n\n${viewEntry.body}`); setCopied(viewEntry.id); setTimeout(() => setCopied(null), 1500); }}>
                  <Copy className={`h-3.5 w-3.5 mr-1 ${copied === viewEntry.id ? "text-emerald-500" : ""}`} />{copied === viewEntry.id ? "Copied!" : "Copy"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { openEdit(viewEntry); setViewEntry(null); }}><Edit2 className="h-3.5 w-3.5 mr-1" />Edit</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
