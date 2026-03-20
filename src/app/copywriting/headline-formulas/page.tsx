"use client";

import { useState, useCallback } from "react";
import { Lightbulb, Copy, Star, Trash2, History, X, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface GeneratedHeadline {
  id: string;
  text: string;
  formula: string;
  rating: number;
}

interface SavedSet {
  id: string;
  topic: string;
  headlines: GeneratedHeadline[];
  createdAt: string;
}

const FORMULAS: { name: string; template: (v: Vars) => string }[] = [
  { name: "How to X Without Y", template: (v) => `How to ${v.benefit} Without ${v.obstacle}` },
  { name: "X Ways to Y", template: (v) => `${v.number} Ways to ${v.benefit}` },
  { name: "The Secret to X", template: (v) => `The Secret to ${v.benefit} That ${v.audience} Don't Know` },
  { name: "Why X is Y", template: (v) => `Why ${v.topic} is the Key to ${v.benefit}` },
  { name: "X Mistakes", template: (v) => `${v.number} ${v.topic} Mistakes That Are Costing You ${v.benefit}` },
  { name: "The Ultimate Guide", template: (v) => `The Ultimate Guide to ${v.topic} for ${v.audience}` },
  { name: "What Nobody Tells You", template: (v) => `What Nobody Tells You About ${v.topic}` },
  { name: "X vs Y", template: (v) => `${v.topic} vs ${v.obstacle}: Which One Wins?` },
  { name: "How I Got X", template: (v) => `How I ${v.benefit} in Just ${v.number} Days` },
  { name: "Stop Doing X", template: (v) => `Stop ${v.obstacle} and Start ${v.benefit} Today` },
  { name: "X Proven Steps", template: (v) => `${v.number} Proven Steps to ${v.benefit}` },
  { name: "Warning: X", template: (v) => `Warning: ${v.topic} Could Be ${v.obstacle}` },
  { name: "The Truth About X", template: (v) => `The Truth About ${v.topic} That ${v.audience} Need to Hear` },
  { name: "X That Will Y", template: (v) => `${v.number} ${v.topic} Tips That Will ${v.benefit}` },
  { name: "Beginner's Guide", template: (v) => `The Beginner's Guide to ${v.topic}: From Zero to ${v.benefit}` },
  { name: "Why You Should X", template: (v) => `Why Every ${v.audience} Should ${v.benefit} Right Now` },
  { name: "X in Y Minutes", template: (v) => `Master ${v.topic} in ${v.number} Minutes` },
  { name: "Don't X Until Y", template: (v) => `Don't ${v.topic} Until You've Read This` },
  { name: "Everything About X", template: (v) => `Everything You Need to Know About ${v.topic}` },
  { name: "X for Y Who Z", template: (v) => `${v.topic} for ${v.audience} Who Want to ${v.benefit}` },
];

interface Vars {
  topic: string;
  benefit: string;
  audience: string;
  obstacle: string;
  number: string;
}

function rateHeadline(text: string): number {
  let score = 3;
  const words = text.split(/\s+/).length;
  if (words >= 6 && words <= 12) score += 1;
  if (/\d/.test(text)) score += 0.5;
  if (/[!?]/.test(text)) score += 0.5;
  const power = ["secret", "proven", "ultimate", "truth", "warning", "master", "everything"];
  if (power.some((w) => text.toLowerCase().includes(w))) score += 0.5;
  return Math.min(5, Math.round(score * 10) / 10);
}

export default function HeadlineFormulasPage() {
  const [vars, setVars] = useState<Vars>({
    topic: "",
    benefit: "",
    audience: "",
    obstacle: "",
    number: "7",
  });
  const [headlines, setHeadlines] = useState<GeneratedHeadline[]>([]);
  const [saved, setSaved, hydrated] = useLocalStorage<SavedSet[]>("headline-formulas", []);
  const [showSaved, setShowSaved] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const generate = useCallback(() => {
    if (!vars.topic.trim()) return;
    const filled: Vars = {
      topic: vars.topic || "Your Topic",
      benefit: vars.benefit || "Get Results",
      audience: vars.audience || "Everyone",
      obstacle: vars.obstacle || "Wasting Time",
      number: vars.number || "7",
    };
    const results = FORMULAS.map((f) => {
      const text = f.template(filled);
      return {
        id: generateId(),
        text,
        formula: f.name,
        rating: rateHeadline(text),
      };
    });
    setHeadlines(results);
  }, [vars]);

  const handleSave = useCallback(() => {
    if (headlines.length === 0) return;
    const set: SavedSet = {
      id: generateId(),
      topic: vars.topic,
      headlines,
      createdAt: new Date().toISOString(),
    };
    setSaved((prev) => [set, ...prev.slice(0, 19)]);
  }, [headlines, vars.topic, setSaved]);

  const copyText = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Headline Formula Generator"
        description="Generate 20 headlines using proven copywriting formulas. Input your variables and get instant results."
        icon={Lightbulb}
        badge="Copywriting"
        actions={
          <Button variant="outline" size="sm" onClick={() => setShowSaved(!showSaved)}>
            <History className="h-4 w-4" />
            Saved ({saved.length})
          </Button>
        }
      />

      {showSaved ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Saved Headline Sets</CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowSaved(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {saved.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No saved headlines yet.</p>
            ) : (
              <div className="space-y-3">
                {saved.map((s) => (
                  <div key={s.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{s.topic}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</span>
                        <Button variant="ghost" size="icon-sm" onClick={() => setSaved((p) => p.filter((x) => x.id !== s.id))}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {s.headlines.slice(0, 5).map((h) => (
                        <p key={h.id} className="text-xs text-muted-foreground truncate">{h.text}</p>
                      ))}
                      {s.headlines.length > 5 && (
                        <p className="text-xs text-muted-foreground">+{s.headlines.length - 5} more</p>
                      )}
                    </div>
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
              <CardTitle className="text-base">Input Variables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Topic / Product *</Label>
                  <Input placeholder="e.g. Email Marketing" value={vars.topic} onChange={(e) => setVars((v) => ({ ...v, topic: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Key Benefit</Label>
                  <Input placeholder="e.g. Double Your Revenue" value={vars.benefit} onChange={(e) => setVars((v) => ({ ...v, benefit: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Target Audience</Label>
                  <Input placeholder="e.g. Small Business Owners" value={vars.audience} onChange={(e) => setVars((v) => ({ ...v, audience: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Pain Point / Obstacle</Label>
                  <Input placeholder="e.g. Wasting Money on Ads" value={vars.obstacle} onChange={(e) => setVars((v) => ({ ...v, obstacle: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Number (for list posts)</Label>
                  <Input placeholder="e.g. 7" value={vars.number} onChange={(e) => setVars((v) => ({ ...v, number: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
                  onClick={generate}
                  disabled={!vars.topic.trim()}
                >
                  <RefreshCw className="h-4 w-4" />
                  Generate 20 Headlines
                </Button>
                {headlines.length > 0 && (
                  <Button variant="outline" onClick={handleSave}>
                    <Star className="h-4 w-4" />
                    Save Set
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {headlines.length > 0 && (
            <div className="grid gap-3">
              {headlines.map((h) => (
                <Card key={h.id} className="border-border/50 hover:border-violet-500/30 transition-colors group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{h.text}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="secondary" className="text-[10px]">{h.formula}</Badge>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < Math.round(h.rating) ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">{h.rating}/5</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyText(h.text, h.id)}
                      >
                        <Copy className={`h-3.5 w-3.5 ${copied === h.id ? "text-emerald-500" : ""}`} />
                      </Button>
                    </div>
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
