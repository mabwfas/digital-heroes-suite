"use client";

import { useState, useMemo } from "react";
import {
  Lightbulb,
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  Search,
  Bookmark,
  Film,
  CheckCircle2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type ContentType = "tutorial" | "review" | "comparison" | "case-study" | "behind-scenes";
type IdeaStatus = "idea" | "planned" | "filmed" | "published";

interface VideoIdea {
  id: string;
  niche: string;
  audience: string;
  contentType: ContentType;
  title: string;
  hook: string;
  difficulty: "Easy" | "Medium" | "Hard";
  status: IdeaStatus;
  createdAt: string;
}

const STATUS_CONFIG: Record<IdeaStatus, { label: string; className: string }> = {
  idea: { label: "Idea", className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-0" },
  planned: { label: "Planned", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0" },
  filmed: { label: "Filmed", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0" },
  published: { label: "Published", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0" },
};

const TITLE_TEMPLATES: Record<ContentType, string[]> = {
  tutorial: [
    "How to [ACTION] [TOPIC] in [TIMEFRAME] (Step-by-Step Guide)",
    "[TOPIC] Tutorial for [AUDIENCE] — Complete Walkthrough",
    "The Ultimate [TOPIC] Guide That [AUDIENCE] Actually Need",
    "[NUMBER] [TOPIC] Tips Every [AUDIENCE] Should Know",
    "Master [TOPIC] in [TIMEFRAME] — Full Tutorial for [AUDIENCE]",
    "Stop Making These [TOPIC] Mistakes — Tutorial for [AUDIENCE]",
    "[TOPIC] From Scratch — Beginner to Pro in One Video",
    "I Learned [TOPIC] So You Don't Have To — Easy Guide",
    "Everything [AUDIENCE] Need to Know About [TOPIC]",
    "[TOPIC] Explained in [TIMEFRAME] — Quick Tutorial",
  ],
  review: [
    "Honest [TOPIC] Review After [TIMEFRAME] — Worth It for [AUDIENCE]?",
    "[TOPIC] Review — [NUMBER] Things Nobody Tells You",
    "I Tested [TOPIC] for [TIMEFRAME] — Here's What Happened",
    "Is [TOPIC] Worth the Hype? Honest Review for [AUDIENCE]",
    "[TOPIC] vs The Competition — Unbiased Review",
    "The Truth About [TOPIC] — [AUDIENCE] Need to See This",
    "[NUMBER] Pros and Cons of [TOPIC] After Real Use",
    "[TOPIC] Long-Term Review — Still Good for [AUDIENCE]?",
    "Why [AUDIENCE] Are Switching to [TOPIC] — Full Review",
    "[TOPIC] Deep Dive — Everything [AUDIENCE] Should Know",
  ],
  comparison: [
    "[TOPIC] vs [ALTERNATIVE] — Which Is Best for [AUDIENCE]?",
    "Top [NUMBER] [TOPIC] Options Compared for [AUDIENCE]",
    "[TOPIC] Showdown — I Tested Them All So You Don't Have To",
    "Best [TOPIC] for [AUDIENCE] in [YEAR] — Side by Side",
    "[TOPIC] Tier List — Ranking Every Option for [AUDIENCE]",
    "I Compared Every [TOPIC] — Here's the Winner for [AUDIENCE]",
    "[TOPIC] Battle — Which One Should [AUDIENCE] Pick?",
    "[NUMBER] [TOPIC] Options Ranked — Best to Worst",
    "The Only [TOPIC] Comparison [AUDIENCE] Need to Watch",
    "Budget vs Premium [TOPIC] — What [AUDIENCE] Actually Need",
  ],
  "case-study": [
    "How [SUBJECT] Used [TOPIC] to [RESULT] — Case Study",
    "[TOPIC] Case Study — From [START] to [RESULT] in [TIMEFRAME]",
    "Real Results with [TOPIC] — [AUDIENCE] Case Study",
    "[TOPIC] Success Story — How We Achieved [RESULT]",
    "Behind the Numbers — [TOPIC] Case Study for [AUDIENCE]",
    "[TOPIC] in Action — Real [AUDIENCE] Getting Real Results",
    "From Zero to [RESULT] Using [TOPIC] — Detailed Breakdown",
    "[TOPIC] ROI Analysis — Is It Worth It for [AUDIENCE]?",
    "What [TIMEFRAME] of [TOPIC] Actually Looks Like",
    "Lessons from [NUMBER] [TOPIC] Projects — [AUDIENCE] Edition",
  ],
  "behind-scenes": [
    "A Day in the Life of [AUDIENCE] Working on [TOPIC]",
    "Behind the Scenes — How We Handle [TOPIC]",
    "How I Actually Work on [TOPIC] — Raw Unfiltered Vlog",
    "My [TOPIC] Workflow — Full Behind-the-Scenes Tour",
    "[TOPIC] Process Revealed — What [AUDIENCE] Don't See",
    "Studio Tour + How I Create [TOPIC] Content",
    "The Real Process Behind [TOPIC] — No Shortcuts",
    "[NUMBER] Hours of [TOPIC] Compressed Into One Video",
    "What [TOPIC] Looks Like Behind Closed Doors",
    "My Honest [TOPIC] Routine — [AUDIENCE] Edition",
  ],
};

const HOOK_TEMPLATES: Record<ContentType, string[]> = {
  tutorial: [
    "By the end of this video, you'll be able to...",
    "I wish someone showed me this when I started...",
    "This simple technique will save you hours...",
    "Most people get this wrong — here's the right way...",
    "Stop overcomplicating it — here's the easy method...",
  ],
  review: [
    "After using this for weeks, I have thoughts...",
    "Everyone is recommending this, but is it actually good?",
    "I spent my own money on this — here's my honest take...",
    "The reviews are lying to you — here's the truth...",
    "Before you buy this, watch this first...",
  ],
  comparison: [
    "I tested all of these so you don't have to...",
    "The winner might surprise you...",
    "One of these is clearly better — let me show you which...",
    "I spent weeks comparing these side by side...",
    "Everyone recommends the wrong one — here's proof...",
  ],
  "case-study": [
    "These results blew my mind — let me break them down...",
    "Real data from a real project — no fluff...",
    "Here's what actually happened when we tried this...",
    "The numbers speak for themselves...",
    "This completely changed how I approach the problem...",
  ],
  "behind-scenes": [
    "Most people never get to see this part...",
    "Here's what my typical day actually looks like...",
    "I'm pulling back the curtain on my process...",
    "This is the raw, unfiltered version...",
    "Let me show you what goes on behind the scenes...",
  ],
};

const DIFFICULTY_LEVELS = ["Easy", "Medium", "Hard"] as const;
const FILLERS = ["5 Minutes", "10 Minutes", "30 Days", "One Week", "2024", "3", "5", "7", "10"];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateIdeas(niche: string, audience: string, contentType: ContentType): Omit<VideoIdea, "id" | "status" | "createdAt">[] {
  const titles = TITLE_TEMPLATES[contentType];
  const hooks = HOOK_TEMPLATES[contentType];
  const shuffledTitles = [...titles].sort(() => Math.random() - 0.5);

  return shuffledTitles.map((tpl) => {
    const title = tpl
      .replace(/\[TOPIC\]/g, niche)
      .replace(/\[AUDIENCE\]/g, audience)
      .replace(/\[ALTERNATIVE\]/g, `Alternative ${niche}`)
      .replace(/\[NUMBER\]/g, pick(["3", "5", "7", "10"]))
      .replace(/\[TIMEFRAME\]/g, pick(FILLERS))
      .replace(/\[YEAR\]/g, "2024")
      .replace(/\[RESULT\]/g, "Amazing Results")
      .replace(/\[START\]/g, "Nothing")
      .replace(/\[SUBJECT\]/g, "One Creator")
      .replace(/\[ACTION\]/g, "Master");

    return {
      niche,
      audience,
      contentType,
      title,
      hook: pick(hooks),
      difficulty: pick(DIFFICULTY_LEVELS),
    };
  });
}

export default function VideoIdeasPage() {
  const [ideas, setIdeas, hydrated] = useLocalStorage<VideoIdea[]>("yt-video-ideas", []);
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [contentType, setContentType] = useState<ContentType>("tutorial");
  const [generated, setGenerated] = useState<Omit<VideoIdea, "id" | "status" | "createdAt">[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | IdeaStatus>("all");
  const [copied, setCopied] = useState<string | null>(null);

  const filteredIdeas = useMemo(() => {
    return ideas.filter((i) => {
      const matchSearch = i.title.toLowerCase().includes(search.toLowerCase()) || i.niche.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || i.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [ideas, search, filterStatus]);

  const stats = useMemo(() => ({
    total: ideas.length,
    planned: ideas.filter((i) => i.status === "planned").length,
    filmed: ideas.filter((i) => i.status === "filmed").length,
    published: ideas.filter((i) => i.status === "published").length,
  }), [ideas]);

  function handleGenerate() {
    if (!niche.trim() || !audience.trim()) return;
    setGenerated(generateIdeas(niche.trim(), audience.trim(), contentType));
  }

  function handleSaveIdea(idea: Omit<VideoIdea, "id" | "status" | "createdAt">) {
    const newIdea: VideoIdea = {
      ...idea,
      id: generateId(),
      status: "idea",
      createdAt: new Date().toISOString(),
    };
    setIdeas((prev) => [newIdea, ...prev]);
  }

  function handleUpdateStatus(id: string, status: IdeaStatus) {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }

  function handleDelete(id: string) {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Video Idea Generator"
        description="Generate YouTube video ideas with titles, hooks, and difficulty ratings"
        icon={Lightbulb}
        badge="YouTube"
        replaces="VidIQ / TubeBuddy"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Ideas", value: stats.total, icon: Lightbulb, color: "text-violet-600 dark:text-violet-400" },
          { label: "Planned", value: stats.planned, icon: Bookmark, color: "text-blue-600 dark:text-blue-400" },
          { label: "Filmed", value: stats.filmed, icon: Film, color: "text-amber-600 dark:text-amber-400" },
          { label: "Published", value: stats.published, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-violet-500" />
              Generate Ideas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Niche / Topic <span className="text-red-500">*</span></Label>
              <Input placeholder="e.g., Shopify Development" value={niche} onChange={(e) => setNiche(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Target Audience <span className="text-red-500">*</span></Label>
              <Input placeholder="e.g., E-commerce Store Owners" value={audience} onChange={(e) => setAudience(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Content Type</Label>
              <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutorial">Tutorial</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="comparison">Comparison</SelectItem>
                  <SelectItem value="case-study">Case Study</SelectItem>
                  <SelectItem value="behind-scenes">Behind the Scenes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0"
              onClick={handleGenerate}
              disabled={!niche.trim() || !audience.trim()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate 10 Ideas
            </Button>
          </CardContent>
        </Card>

        {/* Generated Ideas */}
        <div className="lg:col-span-2 space-y-4">
          {generated.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Generated Ideas ({generated.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {generated.map((idea, idx) => (
                  <div key={idx} className="rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{idea.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 italic">&quot;{idea.hook}&quot;</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary" className="text-[10px]">{idea.contentType}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{idea.difficulty}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleCopy(idea.title, `gen-${idx}`)}>
                          <Copy className={`h-3.5 w-3.5 ${copied === `gen-${idx}` ? "text-emerald-500" : ""}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSaveIdea(idea)}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Saved Ideas Library */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Saved Ideas Library ({ideas.length})</CardTitle>
              </div>
              <div className="flex gap-2 mt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search ideas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="idea">Ideas</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="filmed">Filmed</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredIdeas.length === 0 ? (
                <div className="text-center py-8">
                  <Lightbulb className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {ideas.length === 0 ? "No saved ideas yet. Generate some and save them!" : "No ideas match your filter."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredIdeas.map((idea) => (
                    <div key={idea.id} className="rounded-lg border p-3 hover:bg-muted/50 transition-colors group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{idea.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 italic">&quot;{idea.hook}&quot;</p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Badge className={STATUS_CONFIG[idea.status].className}>{STATUS_CONFIG[idea.status].label}</Badge>
                            <Badge variant="secondary" className="text-[10px]">{idea.difficulty}</Badge>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Select value={idea.status} onValueChange={(v) => handleUpdateStatus(idea.id, v as IdeaStatus)}>
                            <SelectTrigger className="w-28 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="idea">Idea</SelectItem>
                              <SelectItem value="planned">Planned</SelectItem>
                              <SelectItem value="filmed">Filmed</SelectItem>
                              <SelectItem value="published">Published</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100" onClick={() => handleDelete(idea.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
