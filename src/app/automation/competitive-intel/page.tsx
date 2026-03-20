"use client";

import { useState, useMemo } from "react";
import {
  Radar,
  Plus,
  Trash2,
  Edit2,
  Search,
  Globe,
  Eye,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface CompetitorNote {
  id: string;
  text: string;
  date: string;
}

interface Competitor {
  id: string;
  name: string;
  website: string;
  services: string;
  pricing: string;
  strengths: string;
  weaknesses: string;
  notes: CompetitorNote[];
  createdAt: string;
}

const EMPTY_FORM = { name: "", website: "", services: "", pricing: "", strengths: "", weaknesses: "" };

export default function CompetitiveIntelPage() {
  const [competitors, setCompetitors, hydrated] = useLocalStorage<Competitor[]>("competitive-intel", []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [viewId, setViewId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return competitors;
    const q = search.toLowerCase();
    return competitors.filter((c) => c.name.toLowerCase().includes(q) || c.services.toLowerCase().includes(q));
  }, [competitors, search]);

  const viewCompetitor = useMemo(() => competitors.find((c) => c.id === viewId) || null, [competitors, viewId]);

  function openAdd() { setForm(EMPTY_FORM); setEditingId(null); setDialogOpen(true); }
  function openEdit(c: Competitor) {
    setForm({ name: c.name, website: c.website, services: c.services, pricing: c.pricing, strengths: c.strengths, weaknesses: c.weaknesses });
    setEditingId(c.id);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editingId) {
      setCompetitors((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...form } : c)));
    } else {
      setCompetitors((prev) => [{ ...form, id: generateId(), notes: [], createdAt: new Date().toISOString() }, ...prev]);
    }
    setDialogOpen(false);
  }

  function addNote(competitorId: string) {
    if (!noteText.trim()) return;
    setCompetitors((prev) => prev.map((c) => {
      if (c.id !== competitorId) return c;
      return { ...c, notes: [{ id: generateId(), text: noteText, date: new Date().toISOString() }, ...c.notes] };
    }));
    setNoteText("");
  }

  function deleteNote(competitorId: string, noteId: string) {
    setCompetitors((prev) => prev.map((c) => {
      if (c.id !== competitorId) return c;
      return { ...c, notes: c.notes.filter((n) => n.id !== noteId) };
    }));
  }

  function deleteCompetitor(id: string) {
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
    if (viewId === id) setViewId(null);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Competitive Intelligence Tracker" description="Track competitors, monitor changes, and compare strengths" icon={Radar} badge="Automation" replaces="Crayon / Klue" />

      <Tabs defaultValue="tracker">
        <TabsList>
          <TabsTrigger value="tracker">Competitors ({competitors.length})</TabsTrigger>
          <TabsTrigger value="matrix">Comparison Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="tracker" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search competitors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              <Plus className="h-4 w-4 mr-2" />Add Competitor
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Competitor List */}
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <Card className="border-dashed"><CardContent className="py-12 text-center">
                  <Radar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">{competitors.length === 0 ? "No competitors tracked yet." : "No matches found."}</p>
                </CardContent></Card>
              ) : (
                filtered.map((c) => (
                  <Card key={c.id} className={`border-border/50 hover:border-violet-500/30 transition-colors group cursor-pointer ${viewId === c.id ? "border-violet-500/50" : ""}`} onClick={() => setViewId(c.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{c.name}</p>
                          {c.website && <p className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" />{c.website}</p>}
                          {c.services && <p className="text-xs text-muted-foreground mt-1">Services: {c.services.slice(0, 60)}...</p>}
                          <p className="text-xs text-muted-foreground mt-1">{c.notes.length} notes</p>
                        </div>
                        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(c)}><Edit2 className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => deleteCompetitor(c.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Detail / SWOT */}
            {viewCompetitor ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{viewCompetitor.name} — SWOT Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-emerald-500/30 p-3 bg-emerald-500/5">
                      <p className="text-xs font-semibold text-emerald-600 mb-1">Strengths</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewCompetitor.strengths || "Not documented"}</p>
                    </div>
                    <div className="rounded-lg border border-red-500/30 p-3 bg-red-500/5">
                      <p className="text-xs font-semibold text-red-600 mb-1">Weaknesses</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewCompetitor.weaknesses || "Not documented"}</p>
                    </div>
                  </div>
                  {viewCompetitor.pricing && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold mb-1">Pricing</p>
                      <p className="text-sm text-muted-foreground">{viewCompetitor.pricing}</p>
                    </div>
                  )}
                  {viewCompetitor.services && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold mb-1">Services</p>
                      <p className="text-sm text-muted-foreground">{viewCompetitor.services}</p>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <p className="text-xs font-semibold mb-2">Change Notes ({viewCompetitor.notes.length})</p>
                    <div className="flex gap-2 mb-3">
                      <Input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note..." className="flex-1" onKeyDown={(e) => e.key === "Enter" && addNote(viewCompetitor.id)} />
                      <Button variant="outline" size="icon" onClick={() => addNote(viewCompetitor.id)}><Plus className="h-4 w-4" /></Button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {viewCompetitor.notes.map((n) => (
                        <div key={n.id} className="flex items-start justify-between text-sm rounded-lg border p-2 group/note">
                          <div>
                            <p className="text-xs text-muted-foreground">{new Date(n.date).toLocaleDateString()}</p>
                            <p className="text-sm">{n.text}</p>
                          </div>
                          <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover/note:opacity-100 shrink-0" onClick={() => deleteNote(viewCompetitor.id, n.id)}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card><CardContent className="py-16 text-center">
                <Eye className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Select a competitor to view details</p>
              </CardContent></Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="matrix" className="space-y-4">
          {competitors.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">Add competitors to see the comparison matrix.</p>
            </CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Competitor</th>
                      <th className="text-left p-3 font-medium">Services</th>
                      <th className="text-left p-3 font-medium">Pricing</th>
                      <th className="text-left p-3 font-medium">Strengths</th>
                      <th className="text-left p-3 font-medium">Weaknesses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitors.map((c) => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-3 font-medium">{c.name}</td>
                        <td className="p-3 text-muted-foreground max-w-[200px] truncate">{c.services || "-"}</td>
                        <td className="p-3 text-muted-foreground">{c.pricing || "-"}</td>
                        <td className="p-3 text-emerald-600 max-w-[200px] truncate">{c.strengths || "-"}</td>
                        <td className="p-3 text-red-600 max-w-[200px] truncate">{c.weaknesses || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Competitor" : "Add Competitor"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Website</Label><Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://..." /></div>
            </div>
            <div className="space-y-1.5"><Label>Services</Label><Textarea value={form.services} onChange={(e) => setForm((f) => ({ ...f, services: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label>Pricing</Label><Input value={form.pricing} onChange={(e) => setForm((f) => ({ ...f, pricing: e.target.value }))} placeholder="e.g., $50-200/hr" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Strengths</Label><Textarea value={form.strengths} onChange={(e) => setForm((f) => ({ ...f, strengths: e.target.value }))} rows={3} /></div>
              <div className="space-y-1.5"><Label>Weaknesses</Label><Textarea value={form.weaknesses} onChange={(e) => setForm((f) => ({ ...f, weaknesses: e.target.value }))} rows={3} /></div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">{editingId ? "Save" : "Add"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
