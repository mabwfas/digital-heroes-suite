"use client";

import { useState } from "react";
import {
  ImageIcon,
  Sparkles,
  Clock,
  Trash2,
  Copy,
  Check,
  Wand2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface HistoryItem {
  id: string;
  prompt: string;
  style: string;
  ratio: string;
  quality: string;
  createdAt: string;
}

const STYLES = [
  { id: "photorealistic", label: "Photorealistic", emoji: "📷" },
  { id: "illustration", label: "Illustration", emoji: "🎨" },
  { id: "3d-render", label: "3D Render", emoji: "🧊" },
  { id: "watercolor", label: "Watercolor", emoji: "🌊" },
  { id: "flat-design", label: "Flat Design", emoji: "⬜" },
  { id: "anime", label: "Anime", emoji: "⛩️" },
];

const RATIOS = [
  { id: "1:1", label: "1:1", desc: "Square" },
  { id: "16:9", label: "16:9", desc: "Wide" },
  { id: "9:16", label: "9:16", desc: "Portrait" },
  { id: "4:3", label: "4:3", desc: "Standard" },
];

const QUALITIES = [
  { id: "standard", label: "Standard", desc: "Fast generation" },
  { id: "hd", label: "HD", desc: "Higher detail" },
  { id: "4k", label: "4K", desc: "Maximum quality" },
];

const PROMPT_SUGGESTIONS = [
  "A stunning Shopify product display for luxury skincare with soft pink bokeh background",
  "Minimalist flat-lay of artisan coffee products on marble surface",
  "Vibrant summer fashion collection banner with tropical elements",
  "Professional tech gadget showcase with neon accent lighting",
];

export default function ImageGenPage() {
  const [history, setHistory] = useLocalStorage<HistoryItem[]>("image-gen-history", []);
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("photorealistic");
  const [ratio, setRatio] = useState("1:1");
  const [quality, setQuality] = useState("standard");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGenerated(false);
    setTimeout(() => {
      setIsGenerating(false);
      setGenerated(true);
      const item: HistoryItem = {
        id: generateId(),
        prompt: prompt.trim(),
        style,
        ratio,
        quality,
        createdAt: new Date().toISOString(),
      };
      setHistory((prev) => [item, ...prev].slice(0, 20));
    }, 2000);
  };

  const copyPrompt = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  const loadFromHistory = (item: HistoryItem) => {
    setPrompt(item.prompt);
    setStyle(item.style);
    setRatio(item.ratio);
    setQuality(item.quality);
    setGenerated(false);
  };

  const deleteHistory = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const ratioClass: Record<string, string> = {
    "1:1": "aspect-square",
    "16:9": "aspect-video",
    "9:16": "aspect-[9/16]",
    "4:3": "aspect-[4/3]",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Image Generator"
        description="Generate stunning images for your store with AI. Connect Gemini MCP for actual generation."
        icon={ImageIcon}
        badge="AI Studio"
        replaces="Midjourney, DALL·E"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Prompt */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Your Prompt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Describe the image you want to generate... e.g. 'A luxurious skincare product on white marble with soft pink lighting'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <div className="flex flex-wrap gap-2">
                {PROMPT_SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(s)}
                    className="text-[11px] px-2 py-1 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 transition-colors text-left"
                  >
                    {s.slice(0, 50)}…
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Style Presets */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Style Preset
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      style === s.id
                        ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        : "border-border hover:border-violet-300 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="text-base">{s.emoji}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Aspect Ratio & Quality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Aspect Ratio
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {RATIOS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRatio(r.id)}
                    className={`flex flex-col items-center py-2.5 rounded-xl border-2 transition-all ${
                      ratio === r.id
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-border hover:border-violet-300"
                    }`}
                  >
                    <span className={`text-sm font-bold ${ratio === r.id ? "text-violet-600 dark:text-violet-400" : ""}`}>{r.label}</span>
                    <span className="text-[10px] text-muted-foreground">{r.desc}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Quality
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {QUALITIES.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setQuality(q.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 transition-all ${
                      quality === q.id
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-border hover:border-violet-300"
                    }`}
                  >
                    <span className={`text-sm font-medium ${quality === q.id ? "text-violet-600 dark:text-violet-400" : ""}`}>{q.label}</span>
                    <span className="text-[10px] text-muted-foreground">{q.desc}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0 h-12 text-base"
          >
            {isGenerating ? (
              <>
                <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`${ratioClass[ratio]} w-full rounded-xl overflow-hidden relative flex items-center justify-center`}
              >
                {isGenerating ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 via-pink-500/20 to-purple-500/20 animate-pulse flex items-center justify-center">
                    <div className="text-center">
                      <Wand2 className="h-8 w-8 text-violet-500 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">Generating…</p>
                    </div>
                  </div>
                ) : generated ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/30 via-pink-500/30 to-fuchsia-500/30 flex items-center justify-center">
                    <div className="text-center p-4">
                      <ImageIcon className="h-10 w-10 text-violet-400 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        Connect Gemini MCP for real generation
                      </p>
                      <Badge className="mt-2 bg-violet-500/20 text-violet-600 dark:text-violet-400 border-0 text-[10px]">
                        {STYLES.find(s => s.id === style)?.label} · {ratio} · {quality.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-muted/60 to-muted/30 flex items-center justify-center">
                    <div className="text-center p-4">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Generated image will appear here</p>
                    </div>
                  </div>
                )}
              </div>

              {generated && (
                <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                    <strong>Note:</strong> Connect Gemini MCP in your settings to enable actual AI image generation via Google's Imagen model.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prompt History */}
          {history.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    History
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => setHistory([])}
                  >
                    Clear all
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 max-h-72 overflow-y-auto">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors"
                  >
                    <button
                      onClick={() => loadFromHistory(item)}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className="text-xs font-medium truncate">{item.prompt}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">{item.style}</Badge>
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">{item.ratio}</Badge>
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">{item.quality}</Badge>
                      </div>
                    </button>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => copyPrompt(item.prompt)}
                        className="p-1 hover:text-violet-500 transition-colors"
                      >
                        {copied === item.prompt ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteHistory(item.id)}
                        className="p-1 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Separator />
      <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-violet-500/5 to-pink-500/5 border border-violet-500/10">
        <Sparkles className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium">Gemini MCP Integration</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            To enable real AI image generation, connect the Gemini MCP tool to your Claude instance. This will use Google&apos;s Imagen 3 model to generate actual images from your prompts.
          </p>
        </div>
      </div>
    </div>
  );
}
