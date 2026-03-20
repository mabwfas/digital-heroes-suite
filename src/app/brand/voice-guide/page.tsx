"use client";

import { useState, useCallback } from "react";
import { MessageSquare, Plus, Trash2, Copy, Save, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface VoiceGuide {
  id: string;
  brandName: string;
  toneWords: string;
  toneWordsNot: string;
  wordsWeUse: string;
  wordsWeAvoid: string;
  sampleWebsite: string;
  sampleEmail: string;
  sampleSocial: string;
  createdAt: string;
}

const EMPTY: Omit<VoiceGuide, "id" | "createdAt"> = {
  brandName: "", toneWords: "", toneWordsNot: "", wordsWeUse: "", wordsWeAvoid: "",
  sampleWebsite: "", sampleEmail: "", sampleSocial: "",
};

export default function VoiceGuidePage() {
  const [guides, setGuides, hydrated] = useLocalStorage<VoiceGuide[]>("brand-voice-guides", []);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSave = useCallback(() => {
    if (!form.brandName.trim()) return;
    if (editingId) {
      setGuides((prev) => prev.map((g) => g.id === editingId ? { ...g, ...form } : g));
    } else {
      setGuides((prev) => [{ ...form, id: generateId(), createdAt: new Date().toISOString() }, ...prev]);
    }
    setForm(EMPTY); setEditingId(null);
  }, [form, editingId, setGuides]);

  const loadGuide = useCallback((g: VoiceGuide) => {
    const { id, createdAt, ...rest } = g;
    setForm(rest); setEditingId(g.id);
  }, []);

  const exportGuide = useCallback(() => {
    const text = `# Brand Voice Guide: ${form.brandName}

## Tone
**We are:** ${form.toneWords}
**We are NOT:** ${form.toneWordsNot}

## Vocabulary
**Words we use:** ${form.wordsWeUse}
**Words we avoid:** ${form.wordsWeAvoid}

## Writing Samples

### Website
${form.sampleWebsite}

### Email
${form.sampleEmail}

### Social Media
${form.sampleSocial}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [form]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brand Voice Guide"
        description="Define your brand voice with tone attributes, vocabulary lists, and writing samples per channel."
        icon={MessageSquare}
        badge="Brand"
      />

      {guides.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Saved Guides</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {guides.map((g) => (
                <div key={g.id} className="flex items-center gap-1">
                  <Button variant={editingId === g.id ? "default" : "outline"} size="sm" onClick={() => loadGuide(g)}>{g.brandName}</Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => { setGuides((p) => p.filter((x) => x.id !== g.id)); if (editingId === g.id) { setForm(EMPTY); setEditingId(null); } }}>
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Tone & Voice</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5"><Label>Brand Name *</Label><Input placeholder="Your brand name" value={form.brandName} onChange={(e) => setForm((f) => ({ ...f, brandName: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>We Are (tone words)</Label>
              <Textarea placeholder="e.g. Friendly, Professional, Approachable, Bold" value={form.toneWords} onChange={(e) => setForm((f) => ({ ...f, toneWords: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>We Are NOT</Label>
              <Textarea placeholder="e.g. Stuffy, Aggressive, Sarcastic, Overly Formal" value={form.toneWordsNot} onChange={(e) => setForm((f) => ({ ...f, toneWordsNot: e.target.value }))} rows={2} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Vocabulary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Words We Use</Label>
              <Textarea placeholder="e.g. empower, partner, innovate, streamline" value={form.wordsWeUse} onChange={(e) => setForm((f) => ({ ...f, wordsWeUse: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Words We Avoid</Label>
              <Textarea placeholder="e.g. cheap, disrupt, guru, leverage" value={form.wordsWeAvoid} onChange={(e) => setForm((f) => ({ ...f, wordsWeAvoid: e.target.value }))} rows={3} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Writing Samples by Channel</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Website Copy Sample</Label>
            <Textarea placeholder="Write a sample paragraph for your website..." value={form.sampleWebsite} onChange={(e) => setForm((f) => ({ ...f, sampleWebsite: e.target.value }))} rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Email Copy Sample</Label>
            <Textarea placeholder="Write a sample email paragraph..." value={form.sampleEmail} onChange={(e) => setForm((f) => ({ ...f, sampleEmail: e.target.value }))} rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Social Media Sample</Label>
            <Textarea placeholder="Write a sample social media post..." value={form.sampleSocial} onChange={(e) => setForm((f) => ({ ...f, sampleSocial: e.target.value }))} rows={3} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleSave} disabled={!form.brandName.trim()}>
          <Save className="h-4 w-4" />{editingId ? "Update Guide" : "Save Guide"}
        </Button>
        {form.brandName && (
          <Button variant="outline" onClick={exportGuide}>
            <Copy className={`h-4 w-4 ${copied ? "text-emerald-500" : ""}`} />{copied ? "Copied!" : "Copy as Doc"}
          </Button>
        )}
      </div>
    </div>
  );
}
