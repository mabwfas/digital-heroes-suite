"use client";

import { useState, useCallback } from "react";
import { Type, RefreshCw, Star, Copy, Trash2, History, X, Globe } from "lucide-react";
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

type Style = "modern" | "classic" | "playful" | "technical";

interface NameIdea {
  id: string;
  name: string;
  method: string;
  domain: string;
  favorite: boolean;
}

interface SavedSession {
  id: string;
  keywords: string;
  names: NameIdea[];
  createdAt: string;
}

const STYLE_LABELS: Record<Style, string> = { modern: "Modern", classic: "Classic", playful: "Playful", technical: "Technical" };

const PREFIXES: Record<Style, string[]> = {
  modern: ["Neo", "Zen", "Flux", "Nova", "Luma", "Vex", "Aero", "Moda"],
  classic: ["Grand", "Crown", "Noble", "Prime", "Royal", "Sterling", "Atlas", "Beacon"],
  playful: ["Ziggy", "Boop", "Fizz", "Zippy", "Wiggly", "Buzz", "Jolly", "Peppy"],
  technical: ["Byte", "Quant", "Logic", "Sync", "Data", "Core", "Algo", "Net"],
};

const SUFFIXES: Record<Style, string[]> = {
  modern: ["ify", "ly", "io", "co", "fy", "hub", "lab", "flow"],
  classic: ["works", "craft", "bridge", "stone", "field", "worth", "dale", "grove"],
  playful: ["ster", "pop", "tastic", "roo", "matic", "zilla", "ville", "land"],
  technical: ["base", "stack", "forge", "sys", "link", "ware", "ops", "grid"],
};

function generateNames(keywords: string, style: Style): NameIdea[] {
  const words = keywords.split(/[,\s]+/).filter(Boolean).map((w) => w.toLowerCase());
  const names: NameIdea[] = [];
  const prefixes = PREFIXES[style];
  const suffixes = SUFFIXES[style];

  // Prefix method
  for (let i = 0; i < 5 && i < prefixes.length; i++) {
    const base = words[i % words.length] || "brand";
    const name = prefixes[i] + base.charAt(0).toUpperCase() + base.slice(1);
    names.push({ id: generateId(), name, method: "Prefix", domain: `${name.toLowerCase()}.com`, favorite: false });
  }

  // Suffix method
  for (let i = 0; i < 5 && i < suffixes.length; i++) {
    const base = words[i % words.length] || "brand";
    const name = base.charAt(0).toUpperCase() + base.slice(1) + suffixes[i];
    names.push({ id: generateId(), name, method: "Suffix", domain: `${name.toLowerCase()}.com`, favorite: false });
  }

  // Compound method
  for (let i = 0; i < 5; i++) {
    const a = words[i % words.length] || "smart";
    const b = words[(i + 1) % Math.max(words.length, 1)] || "hub";
    const name = a.charAt(0).toUpperCase() + a.slice(1) + b.charAt(0).toUpperCase() + b.slice(1);
    names.push({ id: generateId(), name, method: "Compound", domain: `${name.toLowerCase()}.com`, favorite: false });
  }

  // Portmanteau method
  for (let i = 0; i < 5; i++) {
    const a = words[i % words.length] || "flow";
    const b = words[(i + 1) % Math.max(words.length, 1)] || "ease";
    const mid = Math.ceil(a.length / 2);
    const name = a.slice(0, mid) + b.slice(Math.floor(b.length / 3));
    const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
    names.push({ id: generateId(), name: capitalized, method: "Portmanteau", domain: `${capitalized.toLowerCase()}.com`, favorite: false });
  }

  return names;
}

export default function NamingPage() {
  const [keywords, setKeywords] = useState("");
  const [style, setStyle] = useState<Style>("modern");
  const [names, setNames] = useState<NameIdea[]>([]);
  const [saved, setSaved, hydrated] = useLocalStorage<SavedSession[]>("brand-naming", []);
  const [showSaved, setShowSaved] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const generate = useCallback(() => {
    if (!keywords.trim()) return;
    setNames(generateNames(keywords, style));
  }, [keywords, style]);

  const toggleFav = useCallback((id: string) => {
    setNames((prev) => prev.map((n) => n.id === id ? { ...n, favorite: !n.favorite } : n));
  }, []);

  const handleSave = useCallback(() => {
    const favs = names.filter((n) => n.favorite);
    if (favs.length === 0) return;
    setSaved((prev) => [{ id: generateId(), keywords, names: favs, createdAt: new Date().toISOString() }, ...prev.slice(0, 19)]);
  }, [names, keywords, setSaved]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brand Naming Workshop"
        description="Generate 20 brand name ideas using multiple naming methods. Star favorites and save."
        icon={Type}
        badge="Brand"
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
              <CardTitle className="text-base">Saved Name Sessions</CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowSaved(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {saved.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No saved sessions yet.</p>
            ) : (
              <div className="space-y-3">
                {saved.map((s) => (
                  <div key={s.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Keywords: {s.keywords}</span>
                      <Button variant="ghost" size="icon-sm" onClick={() => setSaved((p) => p.filter((x) => x.id !== s.id))}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                    </div>
                    <div className="flex flex-wrap gap-1">{s.names.map((n) => <Badge key={n.id} variant="secondary" className="text-[10px]">{n.name}</Badge>)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Naming Inputs</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Keywords (comma separated) *</Label>
                  <Input placeholder="e.g. speed, cloud, sync, smart" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Style</Label>
                  <Select value={style} onValueChange={(v) => setStyle(v as Style)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(STYLE_LABELS) as [Style, string][]).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={generate} disabled={!keywords.trim()}>
                  <RefreshCw className="h-4 w-4" />Generate 20 Names
                </Button>
                {names.some((n) => n.favorite) && <Button variant="outline" onClick={handleSave}><Star className="h-4 w-4" />Save Favorites</Button>}
              </div>
            </CardContent>
          </Card>

          {names.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {names.map((n) => (
                <Card key={n.id} className={`border-border/50 hover:border-violet-500/30 transition-colors group ${n.favorite ? "border-amber-500/40 bg-amber-500/5" : ""}`}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <Button variant="ghost" size="icon-sm" onClick={() => toggleFav(n.id)}>
                      <Star className={`h-4 w-4 ${n.favorite ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`} />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{n.name}</span>
                        <Badge variant="secondary" className="text-[10px]">{n.method}</Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{n.domain}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { navigator.clipboard.writeText(n.name); setCopied(n.id); setTimeout(() => setCopied(null), 1500); }}>
                      <Copy className={`h-3.5 w-3.5 ${copied === n.id ? "text-emerald-500" : ""}`} />
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
