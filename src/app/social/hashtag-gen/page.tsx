"use client";

import { useState, useCallback } from "react";
import { Hash, Copy, Check, Star, Trash2, History, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface HashtagSet {
  id: string;
  topic: string;
  high: string[];
  medium: string[];
  niche: string[];
  createdAt: string;
}

const HIGH_PREFIXES = [
  "love", "instagood", "photooftheday", "beautiful", "happy",
  "follow", "like", "trending", "viral", "explore",
];
const MEDIUM_PREFIXES = [
  "tips", "strategy", "growth", "success", "motivation",
  "howto", "learn", "guide", "community", "lifestyle",
];
const NICHE_PREFIXES = [
  "expert", "insider", "secrets", "masterclass", "deepdive",
  "pro", "advanced", "hack", "blueprint", "playbook",
];

function generateHashtags(topic: string): Omit<HashtagSet, "id" | "createdAt"> {
  const clean = topic.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const base = words.join("");
  const cap = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("");

  const high = HIGH_PREFIXES.map((p, i) => {
    if (i < 3) return `#${base}`;
    if (i < 5) return `#${p}${cap}`;
    if (i < 7) return `#${p}`;
    return `#${words[0] || "content"}${p}`;
  });
  const medium = MEDIUM_PREFIXES.map((p, i) => {
    if (i < 3) return `#${base}${p}`;
    if (i < 6) return `#${p}${cap}`;
    return `#${words[0] || "daily"}${p}`;
  });
  const niche = NICHE_PREFIXES.map((p, i) => {
    if (i < 3) return `#${base}${p}`;
    if (i < 6) return `#${p}${cap}`;
    return `#${words[0] || "my"}${p}`;
  });

  return { topic, high: [...new Set(high)], medium: [...new Set(medium)], niche: [...new Set(niche)] };
}

export default function HashtagGenPage() {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<HashtagSet | null>(null);
  const [favorites, setFavorites, hydrated] = useLocalStorage<HashtagSet[]>("hashtag-favorites", []);
  const [copiedGroup, setCopiedGroup] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);

  const handleGenerate = useCallback(() => {
    if (!topic.trim()) return;
    const data = generateHashtags(topic.trim());
    const set: HashtagSet = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    setResult(set);
  }, [topic]);

  const handleCopy = useCallback((tags: string[], group: string) => {
    navigator.clipboard.writeText(tags.join(" "));
    setCopiedGroup(group);
    setTimeout(() => setCopiedGroup(null), 2000);
  }, []);

  const handleCopyAll = useCallback(() => {
    if (!result) return;
    const all = [...result.high, ...result.medium, ...result.niche];
    navigator.clipboard.writeText(all.join(" "));
    setCopiedGroup("all");
    setTimeout(() => setCopiedGroup(null), 2000);
  }, [result]);

  const handleSaveFavorite = useCallback(() => {
    if (!result) return;
    setFavorites(prev => [result, ...prev.slice(0, 19)]);
  }, [result, setFavorites]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hashtag Generator"
        description="Generate 30 hashtags grouped by popularity for any topic or niche."
        icon={Hash}
        badge="Free"
        actions={
          <Button variant="outline" size="sm" onClick={() => setShowFavorites(!showFavorites)}>
            <Star className="h-4 w-4" />
            Favorites ({favorites.length})
          </Button>
        }
      />

      {showFavorites ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Saved Favorites</CardTitle>
              <div className="flex gap-2">
                {favorites.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setFavorites([])}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" /> Clear
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm" onClick={() => setShowFavorites(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {favorites.length === 0 ? (
              <div className="text-center py-8">
                <Star className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No favorites saved yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {favorites.map(fav => (
                  <div key={fav.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{fav.topic}</span>
                      <span className="text-xs text-muted-foreground">{new Date(fav.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground break-all">
                      {[...fav.high, ...fav.medium, ...fav.niche].join(" ")}
                    </p>
                    <Button size="sm" variant="outline" onClick={() => {
                      navigator.clipboard.writeText([...fav.high, ...fav.medium, ...fav.niche].join(" "));
                    }}>
                      <Copy className="h-3 w-3" /> Copy All
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="h-4 w-4 text-violet-500" />
                Generate Hashtags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Topic or Niche</Label>
                <Input
                  placeholder="e.g. fitness motivation, vegan recipes, travel photography..."
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleGenerate()}
                />
              </div>
              <Button
                className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
                onClick={handleGenerate}
                disabled={!topic.trim()}
              >
                <Hash className="h-4 w-4" /> Generate 30 Hashtags
              </Button>
            </CardContent>
          </Card>

          {result && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyAll}>
                  {copiedGroup === "all" ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedGroup === "all" ? "Copied!" : "Copy All 30"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleSaveFavorite}>
                  <Star className="h-3.5 w-3.5" /> Save to Favorites
                </Button>
              </div>

              {(["high", "medium", "niche"] as const).map(group => {
                const tags = result[group];
                const label = group === "high" ? "High Popularity" : group === "medium" ? "Medium Popularity" : "Niche / Long-tail";
                const color = group === "high" ? "text-emerald-600" : group === "medium" ? "text-amber-600" : "text-violet-600";
                return (
                  <Card key={group}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className={`text-sm ${color}`}>{label} ({tags.length})</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(tags, group)}>
                          {copiedGroup === group ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedGroup === group ? "Copied!" : "Copy"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/30"
                            onClick={() => { navigator.clipboard.writeText(tag); }}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
