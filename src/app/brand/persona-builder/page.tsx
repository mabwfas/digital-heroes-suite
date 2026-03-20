"use client";

import { useState, useCallback } from "react";
import { UserCircle, Plus, Trash2, Eye, Edit2, X, Download } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface Persona {
  id: string;
  name: string;
  ageRange: string;
  gender: string;
  location: string;
  income: string;
  education: string;
  goals: string;
  frustrations: string;
  values: string;
  platforms: string;
  contentPrefs: string;
  buyingBehavior: string;
  quote: string;
  createdAt: string;
}

const EMPTY: Omit<Persona, "id" | "createdAt"> = {
  name: "", ageRange: "25-34", gender: "All", location: "", income: "", education: "",
  goals: "", frustrations: "", values: "", platforms: "", contentPrefs: "", buyingBehavior: "", quote: "",
};

export default function PersonaBuilderPage() {
  const [personas, setPersonas, hydrated] = useLocalStorage<Persona[]>("brand-personas", []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewPersona, setViewPersona] = useState<Persona | null>(null);
  const [form, setForm] = useState(EMPTY);

  const openAdd = useCallback(() => { setForm(EMPTY); setEditingId(null); setShowForm(true); }, []);
  const openEdit = useCallback((p: Persona) => {
    const { id, createdAt, ...rest } = p;
    setForm(rest); setEditingId(p.id); setShowForm(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.name.trim()) return;
    if (editingId) {
      setPersonas((prev) => prev.map((p) => p.id === editingId ? { ...p, ...form } : p));
    } else {
      setPersonas((prev) => [{ ...form, id: generateId(), createdAt: new Date().toISOString() }, ...prev]);
    }
    setShowForm(false); setEditingId(null);
  }, [form, editingId, setPersonas]);

  const handleDelete = useCallback((id: string) => {
    setPersonas((prev) => prev.filter((p) => p.id !== id));
    if (viewPersona?.id === id) setViewPersona(null);
  }, [setPersonas, viewPersona]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Persona Builder"
        description="Create detailed customer personas with demographics, psychographics, and behavior profiles."
        icon={UserCircle}
        badge="Brand"
        actions={
          <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" size="sm">
            <Plus className="h-4 w-4" />New Persona
          </Button>
        }
      />

      {personas.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <UserCircle className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Create your first customer persona.</p>
            <Button onClick={openAdd} variant="outline" className="mt-4"><Plus className="h-4 w-4 mr-2" />Create Persona</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {personas.map((p) => (
            <Card key={p.id} className="border-border/50 hover:border-violet-500/30 transition-colors group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{p.name}</h3>
                      <p className="text-xs text-muted-foreground">{p.ageRange} &middot; {p.gender} &middot; {p.location || "Location N/A"}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewPersona(p)}><Eye className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Edit2 className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
                {p.goals && <p className="text-xs text-muted-foreground line-clamp-2"><strong>Goals:</strong> {p.goals}</p>}
                {p.frustrations && <p className="text-xs text-muted-foreground line-clamp-2 mt-1"><strong>Frustrations:</strong> {p.frustrations}</p>}
                {p.quote && <p className="text-xs italic text-muted-foreground/70 mt-2 border-l-2 border-violet-500/30 pl-2">&quot;{p.quote}&quot;</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Persona" : "Create Customer Persona"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label>Persona Name *</Label><Input placeholder="e.g. Marketing Mary" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Demographics</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Age Range</Label>
                <Select value={form.ageRange} onValueChange={(v) => setForm((f) => ({ ...f, ageRange: v ?? f.ageRange }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["18-24", "25-34", "35-44", "45-54", "55-64", "65+"].map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v ?? f.gender }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["All", "Male", "Female", "Non-binary"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Location</Label><Input placeholder="e.g. US, Urban" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Income Range</Label><Input placeholder="e.g. $50K-$80K" value={form.income} onChange={(e) => setForm((f) => ({ ...f, income: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Education</Label><Input placeholder="e.g. Bachelor's" value={form.education} onChange={(e) => setForm((f) => ({ ...f, education: e.target.value }))} /></div>
            </div>
            <Separator />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Psychographics</p>
            <div className="space-y-1.5"><Label>Goals & Aspirations</Label><Textarea placeholder="What do they want to achieve?" value={form.goals} onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label>Frustrations & Pain Points</Label><Textarea placeholder="What problems do they face?" value={form.frustrations} onChange={(e) => setForm((f) => ({ ...f, frustrations: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label>Core Values</Label><Input placeholder="e.g. Innovation, Authenticity, Growth" value={form.values} onChange={(e) => setForm((f) => ({ ...f, values: e.target.value }))} /></div>
            <Separator />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Behavior</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Preferred Platforms</Label><Input placeholder="e.g. LinkedIn, YouTube" value={form.platforms} onChange={(e) => setForm((f) => ({ ...f, platforms: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Content Preferences</Label><Input placeholder="e.g. Videos, Podcasts" value={form.contentPrefs} onChange={(e) => setForm((f) => ({ ...f, contentPrefs: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Buying Behavior</Label><Textarea placeholder="How do they make purchasing decisions?" value={form.buyingBehavior} onChange={(e) => setForm((f) => ({ ...f, buyingBehavior: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label>Representative Quote</Label><Input placeholder="A quote that captures their mindset" value={form.quote} onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">{editingId ? "Save" : "Create Persona"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewPersona} onOpenChange={(o) => !o && setViewPersona(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Persona Card</DialogTitle></DialogHeader>
          {viewPersona && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">{viewPersona.name.charAt(0).toUpperCase()}</div>
                <div>
                  <h3 className="font-bold text-lg">{viewPersona.name}</h3>
                  <p className="text-sm text-muted-foreground">{viewPersona.ageRange} &middot; {viewPersona.gender} &middot; {viewPersona.location}</p>
                  {viewPersona.income && <p className="text-xs text-muted-foreground">{viewPersona.income} &middot; {viewPersona.education}</p>}
                </div>
              </div>
              <Separator />
              {viewPersona.goals && <div><p className="text-xs font-medium uppercase text-muted-foreground mb-1">Goals</p><p className="text-sm">{viewPersona.goals}</p></div>}
              {viewPersona.frustrations && <div><p className="text-xs font-medium uppercase text-muted-foreground mb-1">Frustrations</p><p className="text-sm">{viewPersona.frustrations}</p></div>}
              {viewPersona.values && <div><p className="text-xs font-medium uppercase text-muted-foreground mb-1">Values</p><p className="text-sm">{viewPersona.values}</p></div>}
              <Separator />
              {viewPersona.platforms && <div><p className="text-xs font-medium uppercase text-muted-foreground mb-1">Platforms</p><p className="text-sm">{viewPersona.platforms}</p></div>}
              {viewPersona.contentPrefs && <div><p className="text-xs font-medium uppercase text-muted-foreground mb-1">Content Preferences</p><p className="text-sm">{viewPersona.contentPrefs}</p></div>}
              {viewPersona.buyingBehavior && <div><p className="text-xs font-medium uppercase text-muted-foreground mb-1">Buying Behavior</p><p className="text-sm">{viewPersona.buyingBehavior}</p></div>}
              {viewPersona.quote && <p className="text-sm italic text-muted-foreground border-l-2 border-violet-500/30 pl-3">&quot;{viewPersona.quote}&quot;</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
