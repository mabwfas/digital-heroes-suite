"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, Wand2, ImageIcon, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/lib/hooks";

interface LogoConfig {
  businessName: string;
  tagline: string;
  style: string;
  colorScheme: string;
  industry: string;
  prompt: string;
}

const STYLES = [
  { id: "minimal", label: "Minimal", desc: "Clean, simple, timeless", emoji: "○" },
  { id: "bold", label: "Bold", desc: "Strong, impactful, memorable", emoji: "◆" },
  { id: "vintage", label: "Vintage", desc: "Classic, nostalgic, crafted", emoji: "✦" },
  { id: "modern", label: "Modern", desc: "Contemporary, tech-forward", emoji: "◈" },
  { id: "playful", label: "Playful", desc: "Fun, energetic, approachable", emoji: "★" },
  { id: "luxury", label: "Luxury", desc: "Premium, elegant, exclusive", emoji: "◇" },
];

const COLOR_SCHEMES = [
  { id: "monochrome", label: "Monochrome", colors: ["#000000", "#404040", "#808080"] },
  { id: "earth", label: "Earth Tones", colors: ["#8B5E3C", "#C4906A", "#E8D5B7"] },
  { id: "ocean", label: "Ocean Blue", colors: ["#003459", "#007EA7", "#80CED7"] },
  { id: "forest", label: "Forest Green", colors: ["#1B4332", "#40916C", "#95D5B2"] },
  { id: "sunset", label: "Sunset", colors: ["#9B2226", "#CA6702", "#EE9B00"] },
  { id: "lavender", label: "Lavender", colors: ["#6A0572", "#AB83A1", "#E8C8F0"] },
  { id: "gold", label: "Gold & Black", colors: ["#1A1A1A", "#B8860B", "#FFD700"] },
  { id: "coral", label: "Coral & Cream", colors: ["#FF6B6B", "#F7C59F", "#FFFFF0"] },
];

const INDUSTRIES = ["Fashion", "Food & Beverage", "Technology", "Health & Beauty", "Home & Garden", "Sports", "Jewelry", "Art & Craft", "Other"];

function buildPrompt(config: LogoConfig): string {
  return `Create a ${config.style} logo for "${config.businessName}"${config.tagline ? `, tagline: "${config.tagline}"` : ""}. Industry: ${config.industry || "e-commerce"}. Color scheme: ${config.colorScheme}. The logo should be professional, scalable as an SVG, and suitable for a Shopify store. ${config.prompt}`.trim();
}

export default function LogoGeneratorPage() {
  const [config, setConfig] = useLocalStorage<LogoConfig>("shopify-logo-config", {
    businessName: "",
    tagline: "",
    style: "modern",
    colorScheme: "monochrome",
    industry: "Fashion",
    prompt: "",
  });
  const [promptCopied, setPromptCopied] = useState(false);
  const [showPromptTip, setShowPromptTip] = useState(false);

  const update = (key: keyof LogoConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const fullPrompt = buildPrompt(config);

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(fullPrompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 1500);
  };

  const selectedScheme = COLOR_SCHEMES.find(s => s.id === config.colorScheme);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Logo Generator"
        description="Design your perfect logo with AI. Customize your style, then generate via your preferred AI tool."
        icon={Sparkles}
        badge="AI-Powered"
        replaces="Looka, Canva Logo Maker"
      />

      {/* AI Connection Banner */}
      <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-500/5 to-pink-500/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0 mt-0.5">
              <Wand2 className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold mb-1">Connect to an AI Image Generator</p>
              <p className="text-xs text-muted-foreground">
                Configure your brand details below, then copy the optimized prompt to use with{" "}
                <span className="font-medium text-violet-600 dark:text-violet-400">DALL-E 3, Midjourney, Stable Diffusion,</span>{" "}
                or <span className="font-medium text-violet-600 dark:text-violet-400">Adobe Firefly</span>.
                For direct generation, connect an AI Studio API key in Settings.
              </p>
            </div>
            <Badge className="bg-gradient-to-r from-violet-500 to-pink-500 text-white border-0 shrink-0">Step 1 of 2</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Brand Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Brand Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Business Name *</Label>
                <Input
                  placeholder="e.g. Luminary Studio"
                  value={config.businessName}
                  onChange={e => update("businessName", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Tagline (optional)</Label>
                <Input
                  placeholder="e.g. Crafted with purpose"
                  value={config.tagline}
                  onChange={e => update("tagline", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Industry</Label>
                <div className="flex flex-wrap gap-1.5">
                  {INDUSTRIES.map(ind => (
                    <button
                      key={ind}
                      onClick={() => update("industry", ind)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        config.industry === ind
                          ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Logo Style</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => update("style", style.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      config.style === style.id
                        ? "border-violet-500 bg-violet-500/5 shadow-sm"
                        : "border-border bg-muted/20 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{style.emoji}</span>
                      <span className="text-sm font-medium">{style.label}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{style.desc}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Color Scheme + Prompt Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Color Scheme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_SCHEMES.map(scheme => (
                  <button
                    key={scheme.id}
                    onClick={() => update("colorScheme", scheme.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      config.colorScheme === scheme.id
                        ? "border-violet-500 bg-violet-500/5 shadow-sm"
                        : "border-border bg-muted/20 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex gap-1.5 mb-2">
                      {scheme.colors.map((c, i) => (
                        <div key={i} className="h-5 flex-1 rounded-md" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <p className="text-xs font-medium">{scheme.label}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Additional Prompt Details</CardTitle>
                <button onClick={() => setShowPromptTip(v => !v)} className="text-muted-foreground hover:text-foreground">
                  <Lightbulb className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {showPromptTip && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
                  Tips: Mention icon ideas (e.g. "include a leaf icon"), composition (e.g. "text below symbol"), or describe the feeling you want to evoke.
                </div>
              )}
              <Textarea
                placeholder="e.g. Include a geometric mountain icon, flat design, no gradients, suitable for dark backgrounds..."
                value={config.prompt}
                onChange={e => update("prompt", e.target.value)}
                className="min-h-[100px] text-sm"
              />
            </CardContent>
          </Card>

          {/* Generated Prompt */}
          <Card className="border-violet-200 dark:border-violet-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Generated AI Prompt</CardTitle>
                <Badge variant="secondary" className="text-[10px]">Step 2: Copy & use</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 text-sm leading-relaxed font-mono text-muted-foreground min-h-[80px]">
                {config.businessName ? fullPrompt : <span className="italic">Fill in your business name above to generate a prompt...</span>}
              </div>

              {/* Placeholder Preview */}
              <div className="flex items-center justify-center h-32 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-gradient-to-br from-violet-500/5 to-pink-500/5">
                <div className="text-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Your logo will appear here after AI generation</p>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
                onClick={copyPrompt}
                disabled={!config.businessName}
              >
                {promptCopied ? (
                  <><Check className="h-4 w-4 mr-2" /> Copied!</>
                ) : (
                  <><Copy className="h-4 w-4 mr-2" /> Copy Prompt for AI Generator</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
