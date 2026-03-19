"use client";

import { useState } from "react";
import {
  Lightbulb,
  Sparkles,
  Copy,
  Check,
  Star,
  StarOff,
  Trash2,
  Globe,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface GeneratedName {
  id: string;
  name: string;
  domain: string;
  favorited: boolean;
}

interface SavedFavorite {
  id: string;
  name: string;
  domain: string;
  savedAt: string;
}

type StyleType = "modern" | "classic" | "creative" | "techy";
type LengthType = "short" | "medium" | "long";

const STYLE_OPTIONS: { id: StyleType; label: string; desc: string }[] = [
  { id: "modern", label: "Modern", desc: "Clean & minimal" },
  { id: "classic", label: "Classic", desc: "Trusted & formal" },
  { id: "creative", label: "Creative", desc: "Unique & bold" },
  { id: "techy", label: "Techy", desc: "Tech-forward" },
];

const LENGTH_OPTIONS: { id: LengthType; label: string; desc: string }[] = [
  { id: "short", label: "Short", desc: "1-6 chars" },
  { id: "medium", label: "Medium", desc: "7-10 chars" },
  { id: "long", label: "Long", desc: "11-15 chars" },
];

// Business name generation algorithm
const PREFIXES = {
  modern: ["neo", "nova", "flux", "apex", "arc", "zen", "pure", "prime"],
  classic: ["pro", "elite", "grand", "royal", "premier", "ace", "top", "gold"],
  creative: ["spark", "bloom", "vivid", "bold", "bright", "lumi", "pixel", "flair"],
  techy: ["byte", "data", "sync", "cloud", "mesh", "core", "node", "stack"],
};

const SUFFIXES = {
  modern: ["ify", "ly", "hub", "lab", "co", "io", "ai", "hq"],
  classic: ["group", "works", "pro", "solutions", "services", "agency", "corp", "inc"],
  creative: ["studio", "collective", "craft", "works", "made", "design", "space", "room"],
  techy: ["tech", "dev", "systems", "io", "labs", "hub", "cloud", "stack"],
};

const DOMAIN_EXTS = [".com", ".io", ".co", ".net"];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateBusinessNames(
  industry: string,
  keywords: string,
  style: StyleType,
  length: LengthType
): string[] {
  const kwList = keywords
    .split(/[\s,]+/)
    .map((k) => k.toLowerCase().trim())
    .filter(Boolean)
    .slice(0, 4);

  const industrySlug = industry.toLowerCase().replace(/\s+/g, "").slice(0, 8);
  const prefixes = PREFIXES[style];
  const suffixes = SUFFIXES[style];

  const names = new Set<string>();

  const addName = (n: string) => {
    const cleaned = n.replace(/[^a-z0-9]/gi, "");
    if (cleaned.length < 3) return;
    const check =
      (length === "short" && cleaned.length <= 6) ||
      (length === "medium" && cleaned.length > 6 && cleaned.length <= 10) ||
      (length === "long" && cleaned.length > 10 && cleaned.length <= 15);
    if (check) names.add(capitalize(cleaned));
  };

  const kws = kwList.length > 0 ? kwList : [industrySlug || "brand"];

  // Prefix + keyword
  for (const p of prefixes) {
    for (const kw of kws) {
      addName(p + kw);
      addName(kw + p);
    }
  }

  // Keyword + suffix
  for (const kw of kws) {
    for (const s of suffixes) {
      addName(kw + s);
    }
  }

  // Industry + suffix
  if (industrySlug) {
    for (const s of suffixes) {
      addName(industrySlug + s);
    }
    for (const p of prefixes) {
      addName(p + industrySlug);
    }
  }

  // Combine two keywords
  if (kws.length >= 2) {
    for (let i = 0; i < kws.length - 1; i++) {
      addName(kws[i].slice(0, 4) + kws[i + 1]);
      addName(kws[i] + kws[i + 1].slice(0, 4));
    }
  }

  // Prefix + industry
  for (const p of prefixes.slice(0, 3)) {
    addName(p + (industrySlug || kws[0] || "brand"));
  }

  const arr = Array.from(names);

  // If we don't have 10, pad with creative combinations
  while (arr.length < 10) {
    const p = prefixes[arr.length % prefixes.length];
    const s = suffixes[arr.length % suffixes.length];
    const kw = kws[arr.length % kws.length] || "brand";
    const candidate = capitalize(p.slice(0, 3) + kw.slice(0, 4) + s.slice(0, 3));
    if (!arr.includes(candidate)) arr.push(candidate);
    else break;
  }

  return arr.slice(0, 10);
}

export default function NameGenPage() {
  const [favorites, setFavorites] = useLocalStorage<SavedFavorite[]>("name-gen-favorites", []);
  const [industry, setIndustry] = useState("");
  const [keywords, setKeywords] = useState("");
  const [style, setStyle] = useState<StyleType>("modern");
  const [length, setLength] = useState<LengthType>("medium");
  const [generated, setGenerated] = useState<GeneratedName[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"generate" | "favorites">("generate");

  const handleGenerate = () => {
    const names = generateBusinessNames(industry, keywords, style, length);
    const items: GeneratedName[] = names.map((name) => ({
      id: generateId(),
      name,
      domain: name.toLowerCase() + DOMAIN_EXTS[Math.floor(Math.random() * DOMAIN_EXTS.length)],
      favorited: false,
    }));
    setGenerated(items);
  };

  const toggleFavorite = (id: string) => {
    setGenerated((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const next = { ...n, favorited: !n.favorited };
        if (next.favorited) {
          setFavorites((fav) => [
            { id: generateId(), name: next.name, domain: next.domain, savedAt: new Date().toISOString() },
            ...fav,
          ]);
        } else {
          setFavorites((fav) => fav.filter((f) => f.name !== next.name));
        }
        return next;
      })
    );
  };

  const copyName = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Name Generator"
        description="Generate creative business names algorithmically based on your industry, keywords, and style."
        icon={Lightbulb}
        badge="AI Studio"
        replaces="Namelix, BrandBucket"
      />

      <div className="flex gap-2 p-1 bg-muted/40 rounded-xl w-fit">
        {(["generate", "favorites"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
              activeTab === tab
                ? "bg-white dark:bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "favorites" ? `Favorites (${favorites.length})` : "Generate"}
          </button>
        ))}
      </div>

      {activeTab === "generate" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Business Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    placeholder="e.g. Fashion, Tech, Food"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords</Label>
                  <Input
                    id="keywords"
                    placeholder="e.g. swift, bright, cloud"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">Separate with spaces or commas</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Style
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border-2 transition-all ${
                      style === s.id
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-border hover:border-violet-300"
                    }`}
                  >
                    <span className={`text-sm font-medium ${style === s.id ? "text-violet-600 dark:text-violet-400" : ""}`}>{s.label}</span>
                    <span className="text-[10px] text-muted-foreground">{s.desc}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Name Length
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
                {LENGTH_OPTIONS.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLength(l.id)}
                    className={`flex flex-col items-center py-2.5 rounded-xl border-2 transition-all ${
                      length === l.id
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-border hover:border-violet-300"
                    }`}
                  >
                    <span className={`text-sm font-medium ${length === l.id ? "text-violet-600 dark:text-violet-400" : ""}`}>{l.label}</span>
                    <span className="text-[10px] text-muted-foreground">{l.desc}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Button
              onClick={handleGenerate}
              className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0 h-11"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate 10 Names
            </Button>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {generated.length === 0 ? (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-16">
                  <Lightbulb className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Fill in the details and click generate</p>
                  <p className="text-xs text-muted-foreground mt-1">Names are generated algorithmically — no AI needed</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Generated Names</h3>
                  <Button size="sm" variant="outline" onClick={handleGenerate} className="h-8 gap-1.5">
                    <RefreshCw className="h-3 w-3" />
                    Regenerate
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {generated.map((item, idx) => (
                    <Card
                      key={item.id}
                      className={`transition-all ${item.favorited ? "border-violet-400/50 bg-violet-500/5" : "hover:border-violet-300"}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground font-mono">#{idx + 1}</span>
                              <h4 className="text-lg font-bold tracking-tight">{item.name}</h4>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Globe className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground font-mono">{item.domain}</span>
                            </div>
                            <div className="flex gap-1 mt-2">
                              {[".com", ".io", ".co"].map((ext) => (
                                <Badge
                                  key={ext}
                                  variant="secondary"
                                  className="text-[9px] px-1.5 py-0 h-4"
                                >
                                  {item.name.toLowerCase() + ext}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              onClick={() => toggleFavorite(item.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                item.favorited ? "text-yellow-500" : "text-muted-foreground hover:text-yellow-500"
                              }`}
                            >
                              {item.favorited ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => copyName(item.name)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-violet-500 transition-colors"
                            >
                              {copied === item.name ? (
                                <Check className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Favorites Tab */
        <div>
          {favorites.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No favorites yet</p>
                <p className="text-xs text-muted-foreground mt-1">Star names from the generate tab to save them here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {favorites.map((fav) => (
                <Card key={fav.id} className="border-yellow-400/30 bg-yellow-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-lg font-bold">{fav.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground font-mono">{fav.domain}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Saved {new Date(fav.savedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => copyName(fav.name)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-violet-500 transition-colors"
                        >
                          {copied === fav.name ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => removeFavorite(fav.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Separator />
      <div className="p-4 rounded-xl bg-muted/30 border">
        <p className="text-xs text-muted-foreground">
          <strong>How it works:</strong> Names are generated by combining your keywords with style-specific prefixes and suffixes (e.g., &ldquo;neo&rdquo;, &ldquo;ify&rdquo;, &ldquo;hub&rdquo;) algorithmically — no external API required. Always check domain availability on a registrar before committing.
        </p>
      </div>
    </div>
  );
}
