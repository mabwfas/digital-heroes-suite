"use client";

import { useState } from "react";
import { LayoutTemplate, Copy, Check, AlignLeft, AlignCenter, AlignRight, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";

interface BannerConfig {
  heading: string;
  subheading: string;
  ctaText: string;
  ctaUrl: string;
  textColor: string;
  ctaBg: string;
  ctaTextColor: string;
  align: "left" | "center" | "right";
  gradientFrom: string;
  gradientTo: string;
  gradientDir: string;
  overlayOpacity: number;
  headingSize: number;
  subSize: number;
  paddingY: number;
}

const PRESETS = [
  {
    label: "Violet Dusk",
    gradientFrom: "#4c1d95",
    gradientTo: "#be185d",
    textColor: "#ffffff",
    ctaBg: "#ffffff",
    ctaTextColor: "#4c1d95",
  },
  {
    label: "Ocean Depth",
    gradientFrom: "#0c4a6e",
    gradientTo: "#0891b2",
    textColor: "#ffffff",
    ctaBg: "#f0f9ff",
    ctaTextColor: "#0c4a6e",
  },
  {
    label: "Sunset Fire",
    gradientFrom: "#7c2d12",
    gradientTo: "#f97316",
    textColor: "#ffffff",
    ctaBg: "#fff7ed",
    ctaTextColor: "#7c2d12",
  },
  {
    label: "Forest Calm",
    gradientFrom: "#14532d",
    gradientTo: "#4ade80",
    textColor: "#ffffff",
    ctaBg: "#f0fdf4",
    ctaTextColor: "#14532d",
  },
  {
    label: "Midnight Rose",
    gradientFrom: "#1e1b4b",
    gradientTo: "#9d174d",
    textColor: "#fce7f3",
    ctaBg: "#fce7f3",
    ctaTextColor: "#1e1b4b",
  },
  {
    label: "Light Minimal",
    gradientFrom: "#f8fafc",
    gradientTo: "#e2e8f0",
    textColor: "#0f172a",
    ctaBg: "#0f172a",
    ctaTextColor: "#f8fafc",
  },
];

const GRADIENT_DIRS: { id: string; label: string; value: string }[] = [
  { id: "to right", label: "→ Right", value: "to right" },
  { id: "to bottom right", label: "↘ Diagonal", value: "to bottom right" },
  { id: "to bottom", label: "↓ Down", value: "to bottom" },
  { id: "135deg", label: "↙ Alt Diag", value: "135deg" },
];

export default function BannerDesignerPage() {
  const [config, setConfig] = useLocalStorage<BannerConfig>("shopify-banner-config", {
    heading: "Summer Sale — Up to 50% Off",
    subheading: "Free shipping on orders over $75. Limited time only.",
    ctaText: "Shop Now",
    ctaUrl: "#",
    textColor: "#ffffff",
    ctaBg: "#ffffff",
    ctaTextColor: "#4c1d95",
    align: "center",
    gradientFrom: "#4c1d95",
    gradientTo: "#be185d",
    gradientDir: "to right",
    overlayOpacity: 0,
    headingSize: 36,
    subSize: 16,
    paddingY: 64,
  });

  const [copiedCSS, setCopiedCSS] = useState(false);
  const [copiedHTML, setCopiedHTML] = useState(false);

  const update = <K extends keyof BannerConfig>(key: K, value: BannerConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: typeof PRESETS[number]) => {
    setConfig(prev => ({
      ...prev,
      gradientFrom: preset.gradientFrom,
      gradientTo: preset.gradientTo,
      textColor: preset.textColor,
      ctaBg: preset.ctaBg,
      ctaTextColor: preset.ctaTextColor,
    }));
  };

  const gradientCSS = `linear-gradient(${config.gradientDir}, ${config.gradientFrom}, ${config.gradientTo})`;

  const textAlignClass = {
    left: "text-left items-start",
    center: "text-center items-center",
    right: "text-right items-end",
  }[config.align];

  const exportCSS = `/* Banner Styles */
.banner {
  background: ${gradientCSS};
  padding: ${config.paddingY}px 48px;
  display: flex;
  flex-direction: column;
  align-items: ${config.align === "left" ? "flex-start" : config.align === "right" ? "flex-end" : "center"};
  text-align: ${config.align};
  color: ${config.textColor};
}

.banner h1 {
  font-size: ${config.headingSize}px;
  font-weight: 700;
  margin-bottom: 12px;
  color: ${config.textColor};
}

.banner p {
  font-size: ${config.subSize}px;
  margin-bottom: 24px;
  opacity: 0.9;
}

.banner .cta-btn {
  background: ${config.ctaBg};
  color: ${config.ctaTextColor};
  padding: 12px 32px;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
}`;

  const exportHTML = `<section class="banner">
  <h1>${config.heading}</h1>
  <p>${config.subheading}</p>
  <a href="${config.ctaUrl}" class="cta-btn">${config.ctaText}</a>
</section>

<style>
${exportCSS}
</style>`;

  const copyCSS = async () => {
    await navigator.clipboard.writeText(exportCSS);
    setCopiedCSS(true);
    setTimeout(() => setCopiedCSS(false), 1500);
  };

  const copyHTML = async () => {
    await navigator.clipboard.writeText(exportHTML);
    setCopiedHTML(true);
    setTimeout(() => setCopiedHTML(false), 1500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banner Designer"
        description="Design beautiful store banners with live preview and export-ready HTML/CSS code."
        icon={LayoutTemplate}
        badge="Design"
        replaces="Canva Banners, Bannersnack"
      />

      {/* Live Preview */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Live Preview</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div
            className={`relative flex flex-col ${textAlignClass} px-10 transition-all`}
            style={{
              background: gradientCSS,
              paddingTop: config.paddingY,
              paddingBottom: config.paddingY,
              color: config.textColor,
            }}
          >
            {config.overlayOpacity > 0 && (
              <div
                className="absolute inset-0"
                style={{ backgroundColor: `rgba(0,0,0,${config.overlayOpacity / 100})` }}
              />
            )}
            <div className="relative z-10 max-w-3xl w-full">
              <h1
                className="font-bold leading-tight mb-3"
                style={{ fontSize: config.headingSize, color: config.textColor }}
              >
                {config.heading || "Your Heading Here"}
              </h1>
              {config.subheading && (
                <p className="mb-6 opacity-90" style={{ fontSize: config.subSize, color: config.textColor }}>
                  {config.subheading}
                </p>
              )}
              {config.ctaText && (
                <a
                  href="#"
                  onClick={e => e.preventDefault()}
                  className="inline-block px-8 py-3 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
                  style={{ backgroundColor: config.ctaBg, color: config.ctaTextColor }}
                >
                  {config.ctaText}
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Text Controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Text Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Heading</Label>
                <Input value={config.heading} onChange={e => update("heading", e.target.value)} placeholder="Main headline..." />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Subheading</Label>
                <Input value={config.subheading} onChange={e => update("subheading", e.target.value)} placeholder="Supporting text..." />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">CTA Button Text</Label>
                <Input value={config.ctaText} onChange={e => update("ctaText", e.target.value)} placeholder="Shop Now" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">CTA Link URL</Label>
                <Input value={config.ctaUrl} onChange={e => update("ctaUrl", e.target.value)} placeholder="https://..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Text Alignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {([
                  { align: "left", icon: AlignLeft },
                  { align: "center", icon: AlignCenter },
                  { align: "right", icon: AlignRight },
                ] as const).map(({ align, icon: Icon }) => (
                  <button
                    key={align}
                    onClick={() => update("align", align)}
                    className={`flex-1 flex items-center justify-center h-10 rounded-lg transition-all ${
                      config.align === align
                        ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Style Controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Gradient Presets</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {PRESETS.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className="h-12 rounded-xl overflow-hidden border-2 border-transparent hover:border-violet-400 transition-all relative"
                  style={{ background: `linear-gradient(to right, ${preset.gradientFrom}, ${preset.gradientTo})` }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium" style={{ color: preset.textColor }}>
                    {preset.label}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Custom Gradient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">From</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={config.gradientFrom} onChange={e => update("gradientFrom", e.target.value)} className="h-9 w-9 rounded-lg cursor-pointer border" />
                    <Input value={config.gradientFrom} onChange={e => update("gradientFrom", e.target.value)} className="font-mono text-xs" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">To</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={config.gradientTo} onChange={e => update("gradientTo", e.target.value)} className="h-9 w-9 rounded-lg cursor-pointer border" />
                    <Input value={config.gradientTo} onChange={e => update("gradientTo", e.target.value)} className="font-mono text-xs" />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Direction</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {GRADIENT_DIRS.map(dir => (
                    <button
                      key={dir.id}
                      onClick={() => update("gradientDir", dir.value)}
                      className={`py-1.5 rounded-lg text-xs transition-all ${
                        config.gradientDir === dir.value
                          ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {dir.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Color + Size + Export */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {([
                { label: "Text Color", key: "textColor" },
                { label: "CTA Background", key: "ctaBg" },
                { label: "CTA Text", key: "ctaTextColor" },
              ] as const).map(({ label, key }) => (
                <div key={key}>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={config[key]} onChange={e => update(key, e.target.value)} className="h-8 w-8 rounded-lg cursor-pointer border shrink-0" />
                    <Input value={config[key]} onChange={e => update(key, e.target.value)} className="font-mono text-xs" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Sizing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Heading: {config.headingSize}px</Label>
                <input type="range" min="20" max="72" value={config.headingSize} onChange={e => update("headingSize", Number(e.target.value))} className="w-full accent-violet-500" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Subheading: {config.subSize}px</Label>
                <input type="range" min="12" max="28" value={config.subSize} onChange={e => update("subSize", Number(e.target.value))} className="w-full accent-violet-500" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Vertical Padding: {config.paddingY}px</Label>
                <input type="range" min="24" max="160" value={config.paddingY} onChange={e => update("paddingY", Number(e.target.value))} className="w-full accent-violet-500" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Dark Overlay: {config.overlayOpacity}%</Label>
                <input type="range" min="0" max="70" value={config.overlayOpacity} onChange={e => update("overlayOpacity", Number(e.target.value))} className="w-full accent-violet-500" />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button onClick={copyHTML} className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0">
              {copiedHTML ? <Check className="h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              {copiedHTML ? "HTML Copied!" : "Copy HTML + CSS"}
            </Button>
            <Button onClick={copyCSS} variant="outline" className="w-full">
              {copiedCSS ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copiedCSS ? "Copied!" : "Copy CSS Only"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
