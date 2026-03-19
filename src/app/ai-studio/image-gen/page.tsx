"use client";

import { useState } from "react";
import {
  ImageIcon,
  Sparkles,
  Clock,
  Trash2,
  Copy,
  Check,
  Lightbulb,
  Palette,
  Sun,
  Camera,
  Ratio,
  Wand2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface HistoryItem {
  id: string;
  builtPrompt: string;
  subject: string;
  style: string;
  mood: string;
  lighting: string;
  composition: string;
  ratio: string;
  colorPalette: string;
  createdAt: string;
}

const STYLES = [
  { id: "photorealistic", label: "Photorealistic", emoji: "📷", tip: "Best with: DALL-E 3, Midjourney --v 6" },
  { id: "illustration", label: "Illustration", emoji: "🎨", tip: "Best with: Midjourney, DALL-E 3" },
  { id: "3d-render", label: "3D Render", emoji: "🧊", tip: "Best with: Midjourney, Stable Diffusion + ControlNet" },
  { id: "anime", label: "Anime", emoji: "⛩️", tip: "Best with: Stable Diffusion (anime checkpoints), NovelAI" },
  { id: "watercolor", label: "Watercolor", emoji: "🌊", tip: "Best with: DALL-E 3, Midjourney --style raw" },
  { id: "pixel-art", label: "Pixel Art", emoji: "👾", tip: "Best with: Stable Diffusion, DALL-E 3" },
];

const MOODS = [
  { id: "professional", label: "Professional" },
  { id: "warm", label: "Warm & Inviting" },
  { id: "dramatic", label: "Dramatic" },
  { id: "playful", label: "Playful" },
  { id: "serene", label: "Serene & Calm" },
  { id: "energetic", label: "Energetic" },
  { id: "mysterious", label: "Mysterious" },
  { id: "minimalist", label: "Minimalist" },
];

const LIGHTING_OPTIONS = [
  { id: "natural", label: "Natural Light" },
  { id: "studio", label: "Studio Lighting" },
  { id: "golden-hour", label: "Golden Hour" },
  { id: "neon", label: "Neon Glow" },
  { id: "soft-diffused", label: "Soft & Diffused" },
  { id: "dramatic-shadow", label: "Dramatic Shadows" },
  { id: "backlit", label: "Backlit / Rim Light" },
  { id: "flat", label: "Flat / Even" },
];

const COMPOSITIONS = [
  { id: "center", label: "Centered" },
  { id: "rule-of-thirds", label: "Rule of Thirds" },
  { id: "close-up", label: "Close-Up" },
  { id: "wide-angle", label: "Wide Angle" },
  { id: "birds-eye", label: "Bird's Eye View" },
  { id: "low-angle", label: "Low Angle" },
  { id: "flat-lay", label: "Flat Lay" },
  { id: "symmetrical", label: "Symmetrical" },
];

const RATIOS = [
  { id: "1:1", label: "1:1", desc: "Square" },
  { id: "16:9", label: "16:9", desc: "Landscape" },
  { id: "9:16", label: "9:16", desc: "Portrait" },
  { id: "4:3", label: "4:3", desc: "Standard" },
  { id: "3:2", label: "3:2", desc: "Photo" },
];

const COLOR_PALETTES = [
  { id: "none", label: "No preference" },
  { id: "warm-tones", label: "Warm Tones (reds, oranges, yellows)" },
  { id: "cool-tones", label: "Cool Tones (blues, greens, purples)" },
  { id: "pastel", label: "Pastel / Soft Colors" },
  { id: "monochrome", label: "Monochrome / B&W" },
  { id: "vibrant", label: "Vibrant / Saturated" },
  { id: "earth-tones", label: "Earth Tones (browns, greens, tans)" },
  { id: "neon", label: "Neon / Cyberpunk" },
];

const SUBJECT_SUGGESTIONS = [
  "A luxury skincare product on white marble with rose petals",
  "A cozy coffee shop interior with morning sunlight",
  "An abstract geometric pattern for a tech startup brand",
  "A fashion model in a flowing dress on a coastal cliff",
  "A modern kitchen with fresh ingredients on the counter",
  "A futuristic city skyline at sunset with flying vehicles",
];

function buildPrompt(
  subject: string,
  style: string,
  mood: string,
  lighting: string,
  composition: string,
  ratio: string,
  colorPalette: string,
): string {
  if (!subject.trim()) return "";

  const parts: string[] = [];

  // Style prefix
  const styleObj = STYLES.find((s) => s.id === style);
  if (styleObj) {
    parts.push(`${styleObj.label} image of`);
  }

  // Subject
  parts.push(subject.trim());

  // Mood
  const moodObj = MOODS.find((m) => m.id === mood);
  if (moodObj) {
    parts.push(`${moodObj.label.toLowerCase()} mood`);
  }

  // Lighting
  const lightObj = LIGHTING_OPTIONS.find((l) => l.id === lighting);
  if (lightObj) {
    parts.push(`${lightObj.label.toLowerCase()} lighting`);
  }

  // Composition
  const compObj = COMPOSITIONS.find((c) => c.id === composition);
  if (compObj) {
    parts.push(`${compObj.label.toLowerCase()} composition`);
  }

  // Color palette
  const paletteObj = COLOR_PALETTES.find((p) => p.id === colorPalette);
  if (paletteObj && colorPalette !== "none") {
    parts.push(paletteObj.label.toLowerCase());
  }

  // Aspect ratio note
  if (ratio !== "1:1") {
    parts.push(`${ratio} aspect ratio`);
  }

  // Quality suffix
  parts.push("highly detailed, professional quality");

  return parts.join(", ");
}

export default function ImageGenPage() {
  const [history, setHistory] = useLocalStorage<HistoryItem[]>("image-gen-history", []);
  const [subject, setSubject] = useState("");
  const [style, setStyle] = useState("photorealistic");
  const [mood, setMood] = useState("professional");
  const [lighting, setLighting] = useState("natural");
  const [composition, setComposition] = useState("center");
  const [ratio, setRatio] = useState("1:1");
  const [colorPalette, setColorPalette] = useState("none");
  const [copied, setCopied] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(false);

  const builtPrompt = buildPrompt(subject, style, mood, lighting, composition, ratio, colorPalette);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleBuildAndSave = () => {
    if (!builtPrompt) return;
    const item: HistoryItem = {
      id: generateId(),
      builtPrompt,
      subject: subject.trim(),
      style,
      mood,
      lighting,
      composition,
      ratio,
      colorPalette,
      createdAt: new Date().toISOString(),
    };
    setHistory((prev) => [item, ...prev].slice(0, 30));
    handleCopy(builtPrompt, "built");
  };

  const loadFromHistory = (item: HistoryItem) => {
    setSubject(item.subject);
    setStyle(item.style);
    setMood(item.mood);
    setLighting(item.lighting);
    setComposition(item.composition);
    setRatio(item.ratio);
    setColorPalette(item.colorPalette);
  };

  const deleteHistory = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const currentStyleTip = STYLES.find((s) => s.id === style)?.tip ?? "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Image Prompt Workshop"
        description="Build detailed, structured prompts for AI image generators. Configure every aspect, then copy the prompt to use with DALL-E, Midjourney, or Stable Diffusion."
        icon={ImageIcon}
        badge="AI Studio"
        replaces="Manual prompt writing"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration */}
        <div className="lg:col-span-2 space-y-4">
          {/* Subject */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Camera className="h-3.5 w-3.5" />
                Subject
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Describe what you want in the image... e.g. 'A luxurious skincare product on white marble with soft pink lighting'"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <div className="flex flex-wrap gap-2">
                {SUBJECT_SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setSubject(s)}
                    className="text-[11px] px-2 py-1 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 transition-colors text-left"
                  >
                    {s.slice(0, 50)}...
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Style */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Palette className="h-3.5 w-3.5" />
                Style
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
              {currentStyleTip && (
                <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3 text-amber-500" />
                  {currentStyleTip}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Mood & Lighting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Mood
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-1.5">
                  {MOODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMood(m.id)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        mood === m.id
                          ? "bg-violet-500/15 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/30"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Sun className="h-3.5 w-3.5" />
                  Lighting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-1.5">
                  {LIGHTING_OPTIONS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLighting(l.id)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        lighting === l.id
                          ? "bg-violet-500/15 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/30"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Composition, Ratio, Color Palette */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Composition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-1.5">
                  {COMPOSITIONS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setComposition(c.id)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                        composition === c.id
                          ? "bg-violet-500/15 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/30"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Ratio className="h-3.5 w-3.5" />
                  Aspect Ratio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {RATIOS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRatio(r.id)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all ${
                        ratio === r.id
                          ? "bg-violet-500/15 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/30"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      <span className="font-bold">{r.label}</span>
                      <span className="text-[10px] opacity-70">{r.desc}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Color Palette
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {COLOR_PALETTES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setColorPalette(p.id)}
                      className={`w-full px-2 py-1.5 rounded-lg text-[11px] font-medium text-left transition-all ${
                        colorPalette === p.id
                          ? "bg-violet-500/15 text-violet-600 dark:text-violet-400 ring-1 ring-violet-500/30"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right: Built Prompt & History */}
        <div className="space-y-4">
          {/* Built Prompt Output */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Wand2 className="h-3.5 w-3.5" />
                Built Prompt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {builtPrompt ? (
                <>
                  <div className="p-3 rounded-xl bg-muted/40 border">
                    <p className="text-sm leading-relaxed">{builtPrompt}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleCopy(builtPrompt, "prompt-only")}
                      variant="outline"
                      size="sm"
                      className="flex-1 h-9"
                    >
                      {copied === "prompt-only" ? (
                        <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      {copied === "prompt-only" ? "Copied!" : "Copy Prompt"}
                    </Button>
                    <Button
                      onClick={handleBuildAndSave}
                      className="flex-1 h-9 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
                    >
                      {copied === "built" ? (
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      {copied === "built" ? "Saved & Copied!" : "Save & Copy"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Enter a subject above to start building your prompt
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Tool Tips */}
          <Card>
            <CardHeader className="pb-3">
              <button
                onClick={() => setShowTips(!showTips)}
                className="w-full flex items-center justify-between"
              >
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  Where to Use This Prompt
                </CardTitle>
                <span className="text-xs text-muted-foreground">{showTips ? "Hide" : "Show"}</span>
              </button>
            </CardHeader>
            {showTips && (
              <CardContent className="space-y-2.5 pt-0">
                {[
                  {
                    name: "DALL-E 3",
                    desc: "Paste directly into ChatGPT or the API. Great for photorealistic and illustration styles.",
                    badge: "Easy",
                  },
                  {
                    name: "Midjourney",
                    desc: "Paste in Discord with /imagine. Add --ar for aspect ratio (e.g. --ar 16:9). Add --v 6 for latest model.",
                    badge: "Best Quality",
                  },
                  {
                    name: "Stable Diffusion",
                    desc: "Use with ComfyUI or Automatic1111. Add negative prompts separately. Works well with anime/pixel-art checkpoints.",
                    badge: "Free & Local",
                  },
                  {
                    name: "Adobe Firefly",
                    desc: "Paste in Firefly or use in Photoshop Generative Fill. Good for commercial-safe images.",
                    badge: "Commercial",
                  },
                ].map((tool) => (
                  <div key={tool.name} className="p-2.5 rounded-lg border bg-muted/20">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">{tool.name}</span>
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                        {tool.badge}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{tool.desc}</p>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>

          {/* Prompt History */}
          {history.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Prompt History
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
                      <p className="text-xs font-medium line-clamp-2">{item.builtPrompt}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">{item.style}</Badge>
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">{item.ratio}</Badge>
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">{item.mood}</Badge>
                      </div>
                    </button>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => handleCopy(item.builtPrompt, item.id)}
                        className="p-1 hover:text-violet-500 transition-colors"
                      >
                        {copied === item.id ? (
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
          <p className="text-sm font-medium">How This Works</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            This tool builds optimized prompts from your configuration. Copy the generated prompt and paste it into your preferred AI image generator (DALL-E 3, Midjourney, Stable Diffusion, etc.) to create the actual image. Each tool may interpret prompts slightly differently, so experiment with variations.
          </p>
        </div>
      </div>
    </div>
  );
}
