"use client";

import { useState, useCallback } from "react";
import { MessageSquare, Copy, Check, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface CaptionResult {
  id: string;
  caption: string;
  tone: string;
  platform: string;
}

const TONES = ["Funny", "Professional", "Inspirational", "Educational"] as const;
const PLATFORMS = ["Instagram", "Twitter/X", "LinkedIn", "TikTok"] as const;

const EMOJIS: Record<string, string[]> = {
  Funny: ["😂", "🤣", "😜", "👀", "💀", "🙃"],
  Professional: ["💼", "📊", "🎯", "✅", "🔑", "📈"],
  Inspirational: ["✨", "🌟", "💪", "🚀", "🔥", "💫"],
  Educational: ["📚", "💡", "🧠", "📝", "🎓", "👉"],
};

const CTAS: Record<string, string[]> = {
  Funny: ["Tag someone who needs this 😂", "Double tap if you agree!", "Drop a 💀 if this is you"],
  Professional: ["What are your thoughts? Share below.", "Save this for later!", "Follow for more insights."],
  Inspirational: ["Share this with someone who needs it today!", "Save and revisit when you need motivation.", "Tag your accountability partner!"],
  Educational: ["Save this for reference!", "Follow for daily tips.", "Which tip was most helpful? Comment below."],
};

const TEMPLATES: Record<string, ((topic: string) => string)[]> = {
  Funny: [
    t => `POV: You just discovered ${t} and now it's your entire personality.`,
    t => `Nobody: \nAbsolutely nobody: \nMe: obsessing over ${t} at 2am`,
    t => `If ${t} was a person, I'd take them out for coffee. Daily.`,
  ],
  Professional: [
    t => `Here's what most people get wrong about ${t}.\n\nThe key is consistency and strategy, not just effort.`,
    t => `3 lessons ${t} taught me about business:\n\n1. Start before you're ready\n2. Iterate based on data\n3. Never stop learning`,
    t => `The ${t} landscape is changing. Here's how to stay ahead of the curve.`,
  ],
  Inspirational: [
    t => `Your ${t} journey doesn't have to be perfect. It just has to be yours.`,
    t => `A year ago, I knew nothing about ${t}. Today, it's transformed everything. Start now.`,
    t => `The best time to start ${t} was yesterday. The second best time is right now.`,
  ],
  Educational: [
    t => `${t} 101: Here's everything you need to know to get started.\n\nBreaking it down step by step so anyone can follow.`,
    t => `Did you know? Most people approach ${t} completely wrong.\n\nHere's the framework that actually works:`,
    t => `Quick ${t} tip that took me years to figure out.\n\nThis simple shift changed everything:`,
  ],
};

function generateCaptions(topic: string, tone: string, platform: string): CaptionResult[] {
  const templates = TEMPLATES[tone] || TEMPLATES.Professional;
  const emojis = EMOJIS[tone] || EMOJIS.Professional;
  const ctas = CTAS[tone] || CTAS.Professional;

  return templates.map((tpl, i) => {
    const emoji = emojis[i % emojis.length];
    const cta = ctas[i % ctas.length];
    const hashtags = `#${topic.replace(/\s+/g, "")} #${tone.toLowerCase()} #${platform.replace(/[\s/]/g, "").toLowerCase()}`;
    const caption = `${emoji} ${tpl(topic)}\n\n${cta}\n\n${hashtags}`;
    return { id: generateId(), caption, tone, platform };
  });
}

export default function CaptionWriterPage() {
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<string>("Professional");
  const [platform, setPlatform] = useState<string>("Instagram");
  const [results, setResults] = useState<CaptionResult[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [history, setHistory, hydrated] = useLocalStorage<CaptionResult[]>("caption-history", []);

  const handleGenerate = useCallback(() => {
    if (!topic.trim()) return;
    const captions = generateCaptions(topic.trim(), tone, platform);
    setResults(captions);
    setHistory(prev => [...captions, ...prev].slice(0, 30));
  }, [topic, tone, platform, setHistory]);

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Caption Writer"
        description="Generate 3 caption variants with emojis, CTAs, and hashtags per topic."
        icon={MessageSquare}
        badge="Free"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-violet-500" /> Write a Caption
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Topic</Label>
            <Input placeholder="e.g. morning routine, product launch, travel tips..." value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && handleGenerate()} />
          </div>
          <div className="space-y-1.5">
            <Label>Tone</Label>
            <div className="flex flex-wrap gap-2">
              {TONES.map(t => (
                <button key={t} onClick={() => setTone(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${tone === t ? "border-violet-500 bg-violet-500/10 text-violet-600" : "border-border hover:border-violet-300"}`}
                >{t}</button>
              ))}
            </div>
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
            <Button className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleGenerate} disabled={!topic.trim()}>
              Generate 3 Captions
            </Button>
            <Button variant="outline" onClick={handleGenerate} disabled={!topic.trim()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
          {results.map((r, i) => (
            <Card key={r.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Variant {i + 1}</CardTitle>
                  <div className="flex gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">{r.tone}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{r.platform}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line mb-4 leading-relaxed">{r.caption}</p>
                <Button size="sm" variant="outline" onClick={() => handleCopy(r.caption, r.id)}>
                  {copied === r.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {copied === r.id ? "Copied!" : "Copy Caption"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
