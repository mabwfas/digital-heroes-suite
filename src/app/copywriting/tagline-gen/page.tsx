"use client";

import { useState, useCallback } from "react";
import { Sparkles, Copy, Star, RefreshCw, Trash2, History, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type Personality = "playful" | "serious" | "luxurious" | "bold";

interface Tagline {
  id: string;
  text: string;
  favorite: boolean;
}

interface SavedSet {
  id: string;
  brand: string;
  taglines: Tagline[];
  createdAt: string;
}

const PERSONALITY_LABELS: Record<Personality, string> = {
  playful: "Playful", serious: "Serious", luxurious: "Luxurious", bold: "Bold",
};

function generateTaglines(brand: string, industry: string, personality: Personality): Tagline[] {
  const b = brand || "Brand";
  const ind = industry || "your world";
  const templates: Record<Personality, string[]> = {
    playful: [
      `${b}. Because ${ind} should be fun.`,
      `Think ${ind}. Think ${b}.`,
      `${b}: Where ${ind} meets happy.`,
      `Life's too short for boring ${ind}.`,
      `${b}. Seriously not serious.`,
      `Put the fun back in ${ind}.`,
      `${b} — ${ind}, but make it awesome.`,
      `Smile more. ${b} more.`,
      `${b}: Making ${ind} a joy ride.`,
      `Why so serious? It's just ${ind}.`,
      `${b}. Delight in every detail.`,
      `The playful side of ${ind}.`,
      `${b}: Cleverly crafted for ${ind}.`,
      `More ${ind}. More smiles. ${b}.`,
      `${b}. Fresh. Fun. Fearless.`,
    ],
    serious: [
      `${b}. Excellence in ${ind}.`,
      `The standard for ${ind}.`,
      `${b}: Where ${ind} means business.`,
      `Precision. Quality. ${b}.`,
      `${b}. Trusted by ${ind} leaders.`,
      `Serious about ${ind}. Serious results.`,
      `${b}: The authority in ${ind}.`,
      `Built for ${ind}. Built to last.`,
      `${b}. Professional-grade ${ind}.`,
      `Raising the bar for ${ind}.`,
      `${b}: Integrity meets ${ind}.`,
      `Leading ${ind} forward.`,
      `${b}. Results you can measure.`,
      `The proven path in ${ind}. ${b}.`,
      `${b}. Where expertise lives.`,
    ],
    luxurious: [
      `${b}. The art of ${ind}.`,
      `Crafted for those who demand more.`,
      `${b}: Redefining ${ind} elegance.`,
      `Experience ${ind} at its finest.`,
      `${b}. Exquisitely ${ind}.`,
      `Beyond ordinary. ${b}.`,
      `${b}: The pinnacle of ${ind}.`,
      `Indulge in ${ind}. Choose ${b}.`,
      `${b}. Where ${ind} becomes luxury.`,
      `A masterclass in ${ind}.`,
      `${b}: Timeless ${ind} perfection.`,
      `Elevate your ${ind}. ${b}.`,
      `The luxury of ${ind}. ${b}.`,
      `${b}. Refined. Rare. Remarkable.`,
      `Savor the difference. ${b}.`,
    ],
    bold: [
      `${b}. Disrupt ${ind}.`,
      `No limits. No compromises. ${b}.`,
      `${b}: Own your ${ind}.`,
      `Break the rules of ${ind}. ${b}.`,
      `${b}. Built different.`,
      `Challenge ${ind}. Choose ${b}.`,
      `${b}: Unleash your ${ind}.`,
      `Go bigger. Go ${b}.`,
      `${b}. The ${ind} revolution starts here.`,
      `Dare to ${ind}. Dare ${b}.`,
      `${b}: Fearless ${ind}.`,
      `${b}. Make ${ind} legendary.`,
      `Not for the faint of heart. ${b}.`,
      `${b}. Power your ${ind}.`,
      `Conquer ${ind}. ${b}.`,
    ],
  };
  return templates[personality].map((text) => ({ id: generateId(), text, favorite: false }));
}

export default function TaglineGenPage() {
  const [brand, setBrand] = useState("");
  const [industry, setIndustry] = useState("");
  const [personality, setPersonality] = useState<Personality>("bold");
  const [taglines, setTaglines] = useState<Tagline[]>([]);
  const [saved, setSaved, hydrated] = useLocalStorage<SavedSet[]>("tagline-sets", []);
  const [showSaved, setShowSaved] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const generate = useCallback(() => {
    if (!brand.trim()) return;
    setTaglines(generateTaglines(brand, industry, personality));
  }, [brand, industry, personality]);

  const toggleFav = useCallback((id: string) => {
    setTaglines((prev) => prev.map((t) => t.id === id ? { ...t, favorite: !t.favorite } : t));
  }, []);

  const handleSave = useCallback(() => {
    const favs = taglines.filter((t) => t.favorite);
    if (favs.length === 0) return;
    setSaved((prev) => [{ id: generateId(), brand, taglines: favs, createdAt: new Date().toISOString() }, ...prev.slice(0, 19)]);
  }, [taglines, brand, setSaved]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tagline Generator"
        description="Generate 15 taglines based on your brand personality. Rate and save your favorites."
        icon={Sparkles}
        badge="Copywriting"
        actions={
          <Button variant="outline" size="sm" onClick={() => setShowSaved(!showSaved)}>
            <History className="h-4 w-4" />Saved ({saved.length})
          </Button>
        }
      />

      {showSaved ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Saved Taglines</CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowSaved(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {saved.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No saved taglines yet. Star your favorites and save them.</p>
            ) : (
              <div className="space-y-3">
                {saved.map((s) => (
                  <div key={s.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{s.brand}</span>
                      <Button variant="ghost" size="icon-sm" onClick={() => setSaved((p) => p.filter((x) => x.id !== s.id))}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                    </div>
                    {s.taglines.map((t) => <p key={t.id} className="text-xs text-muted-foreground">{t.text}</p>)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Brand Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Brand Name *</Label>
                  <Input placeholder="e.g. Acme" value={brand} onChange={(e) => setBrand(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Industry</Label>
                  <Input placeholder="e.g. fitness" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Personality</Label>
                  <Select value={personality} onValueChange={(v) => setPersonality(v as Personality)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(PERSONALITY_LABELS) as [Personality, string][]).map(([k, l]) => (
                        <SelectItem key={k} value={k}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={generate} disabled={!brand.trim()}>
                  <RefreshCw className="h-4 w-4" />Generate 15 Taglines
                </Button>
                {taglines.some((t) => t.favorite) && <Button variant="outline" onClick={handleSave}><Star className="h-4 w-4" />Save Favorites</Button>}
              </div>
            </CardContent>
          </Card>

          {taglines.length > 0 && (
            <div className="grid gap-2">
              {taglines.map((t) => (
                <Card key={t.id} className={`border-border/50 hover:border-violet-500/30 transition-colors group ${t.favorite ? "border-amber-500/40 bg-amber-500/5" : ""}`}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Button variant="ghost" size="icon-sm" onClick={() => toggleFav(t.id)}>
                      <Star className={`h-4 w-4 ${t.favorite ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`} />
                    </Button>
                    <p className="text-sm flex-1">{t.text}</p>
                    <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { navigator.clipboard.writeText(t.text); setCopied(t.id); setTimeout(() => setCopied(null), 1500); }}>
                      <Copy className={`h-3.5 w-3.5 ${copied === t.id ? "text-emerald-500" : ""}`} />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
