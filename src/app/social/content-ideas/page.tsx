"use client";

import { useState, useCallback } from "react";
import { Lightbulb, RefreshCw, Bookmark, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface ContentIdea {
  id: string;
  title: string;
  format: string;
  difficulty: "Easy" | "Medium" | "Hard";
  platform: string;
}

interface SavedIdea extends ContentIdea {
  niche: string;
  savedAt: string;
}

const FORMATS = ["Carousel", "Reel", "Story", "Post", "Thread", "Live", "Guide"];
const DIFFICULTIES: ContentIdea["difficulty"][] = ["Easy", "Medium", "Hard"];

const IDEA_TEMPLATES = [
  "X mistakes beginners make in {niche}",
  "How I got started in {niche} (my story)",
  "3 tools I can't live without for {niche}",
  "{niche} trends you need to know this year",
  "Day in the life of a {niche} creator",
  "Beginner's guide to {niche}",
  "Why most people fail at {niche}",
  "My top 5 {niche} tips for beginners",
  "{niche} myth vs reality",
  "How to save time with {niche}",
  "The truth about {niche} nobody talks about",
  "Before vs after {niche} transformation",
  "{niche} Q&A — answering your questions",
  "My {niche} routine breakdown",
  "What I wish I knew before starting {niche}",
  "POV: you just discovered {niche}",
  "{niche} do's and don'ts",
  "Unpopular {niche} opinions",
  "How {niche} changed my life",
  "Stop doing this in {niche} — do this instead",
  "{niche} starter pack",
  "Rating popular {niche} products/tools",
  "{niche} challenge — can I do it?",
  "Behind the scenes of my {niche} process",
  "Free vs paid {niche} resources compared",
];

function generateIdeas(niche: string, platform: string): ContentIdea[] {
  const shuffled = [...IDEA_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, 20);
  return shuffled.map((template, i) => ({
    id: generateId(),
    title: template.replace(/{niche}/g, niche),
    format: FORMATS[i % FORMATS.length],
    difficulty: DIFFICULTIES[i % DIFFICULTIES.length],
    platform,
  }));
}

export default function ContentIdeasPage() {
  const [niche, setNiche] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [savedIdeas, setSavedIdeas, hydrated] = useLocalStorage<SavedIdea[]>("content-ideas-saved", []);
  const [showSaved, setShowSaved] = useState(false);

  const handleGenerate = useCallback(() => {
    if (!niche.trim()) return;
    setIdeas(generateIdeas(niche.trim(), platform));
  }, [niche, platform]);

  const handleSaveIdea = useCallback((idea: ContentIdea) => {
    setSavedIdeas(prev => {
      if (prev.some(s => s.title === idea.title)) return prev;
      return [{ ...idea, niche: niche.trim(), savedAt: new Date().toISOString() }, ...prev.slice(0, 49)];
    });
  }, [niche, setSavedIdeas]);

  const diffColor = (d: string) => d === "Easy" ? "bg-emerald-500/10 text-emerald-600" : d === "Medium" ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600";
  const formatColor = (f: string) => f === "Carousel" ? "bg-blue-500/10 text-blue-600" : f === "Reel" ? "bg-pink-500/10 text-pink-600" : f === "Story" ? "bg-purple-500/10 text-purple-600" : "bg-gray-500/10 text-gray-600";

  if (!hydrated) return null;

  const PLATFORMS = ["Instagram", "TikTok", "Twitter/X", "LinkedIn", "YouTube", "Facebook"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Idea Generator"
        description="Generate 20 content ideas with formats and difficulty levels for any niche."
        icon={Lightbulb}
        badge="Free"
        actions={
          <Button variant="outline" size="sm" onClick={() => setShowSaved(!showSaved)}>
            <Bookmark className="h-4 w-4" /> Saved ({savedIdeas.length})
          </Button>
        }
      />

      {showSaved ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Saved Ideas</CardTitle>
              <div className="flex gap-2">
                {savedIdeas.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setSavedIdeas([])}><Trash2 className="h-3.5 w-3.5 text-red-500" /> Clear</Button>
                )}
                <Button variant="ghost" size="icon-sm" onClick={() => setShowSaved(false)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {savedIdeas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No saved ideas yet.</p>
            ) : (
              <div className="space-y-2">
                {savedIdeas.map(s => (
                  <div key={s.id} className="rounded-lg border p-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{s.title}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary" className={`text-[10px] ${formatColor(s.format)}`}>{s.format}</Badge>
                        <Badge variant="secondary" className={`text-[10px] ${diffColor(s.difficulty)}`}>{s.difficulty}</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => setSavedIdeas(prev => prev.filter(i => i.id !== s.id))}>
                      <Trash2 className="h-3 w-3 text-red-500" />
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
                <Lightbulb className="h-4 w-4 text-violet-500" /> Enter Your Niche
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Niche / Topic</Label>
                <Input placeholder="e.g. fitness, cooking, personal finance..." value={niche} onChange={e => setNiche(e.target.value)} onKeyDown={e => e.key === "Enter" && handleGenerate()} />
              </div>
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => setPlatform(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${platform === p ? "border-violet-500 bg-violet-500/10 text-violet-600" : "border-border hover:border-violet-300"}`}
                    >{p}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleGenerate} disabled={!niche.trim()}>
                  Generate 20 Ideas
                </Button>
                <Button variant="outline" onClick={handleGenerate} disabled={!niche.trim()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {ideas.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Content Ideas ({ideas.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ideas.map((idea, i) => (
                  <div key={idea.id} className="rounded-lg border p-3 flex items-start justify-between gap-3 hover:bg-muted/50 transition-colors">
                    <div className="flex gap-3 items-start min-w-0">
                      <span className="text-xs text-muted-foreground font-mono shrink-0 mt-0.5">{i + 1}.</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{idea.title}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary" className={`text-[10px] ${formatColor(idea.format)}`}>{idea.format}</Badge>
                          <Badge variant="secondary" className={`text-[10px] ${diffColor(idea.difficulty)}`}>{idea.difficulty}</Badge>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleSaveIdea(idea)} className="shrink-0">
                      <Bookmark className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
