"use client";

import { useState, useMemo } from "react";
import {
  Palette,
  Copy,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";

interface StyleConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  borderRadius: number;
  spacingBase: number;
}

const DEFAULT_CONFIG: StyleConfig = {
  primaryColor: "#6D28D9",
  secondaryColor: "#EC4899",
  accentColor: "#F59E0B",
  headingFont: "Inter",
  bodyFont: "Inter",
  borderRadius: 8,
  spacingBase: 4,
};

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
}

function adjustBrightness(hex: string, factor: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const adjust = (v: number) => Math.min(255, Math.max(0, Math.round(v + (factor > 0 ? (255 - v) * factor : v * factor))));
  const r = adjust(rgb.r).toString(16).padStart(2, "0");
  const g = adjust(rgb.g).toString(16).padStart(2, "0");
  const b = adjust(rgb.b).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

function generateTints(hex: string): string[] {
  return [0.8, 0.6, 0.4, 0.2, 0, -0.2, -0.4, -0.6, -0.8].map((f) => adjustBrightness(hex, f));
}

const TYPE_SCALE = [
  { name: "Display", size: 48, weight: "800", leading: "1.1" },
  { name: "H1", size: 36, weight: "700", leading: "1.2" },
  { name: "H2", size: 30, weight: "700", leading: "1.2" },
  { name: "H3", size: 24, weight: "600", leading: "1.3" },
  { name: "H4", size: 20, weight: "600", leading: "1.4" },
  { name: "H5", size: 16, weight: "600", leading: "1.4" },
  { name: "Body Large", size: 18, weight: "400", leading: "1.6" },
  { name: "Body", size: 16, weight: "400", leading: "1.6" },
  { name: "Body Small", size: 14, weight: "400", leading: "1.5" },
  { name: "Caption", size: 12, weight: "400", leading: "1.5" },
];

function generateCSS(config: StyleConfig): string {
  const pTints = generateTints(config.primaryColor);
  const sTints = generateTints(config.secondaryColor);
  const aTints = generateTints(config.accentColor);
  return `:root {
  /* Primary */
  --primary-50: ${pTints[0]};
  --primary-100: ${pTints[1]};
  --primary-200: ${pTints[2]};
  --primary-300: ${pTints[3]};
  --primary-400: ${pTints[4]};
  --primary-500: ${config.primaryColor};
  --primary-600: ${pTints[5]};
  --primary-700: ${pTints[6]};
  --primary-800: ${pTints[7]};
  --primary-900: ${pTints[8]};

  /* Secondary */
  --secondary-50: ${sTints[0]};
  --secondary-500: ${config.secondaryColor};
  --secondary-900: ${sTints[8]};

  /* Accent */
  --accent-50: ${aTints[0]};
  --accent-500: ${config.accentColor};
  --accent-900: ${aTints[8]};

  /* Typography */
  --font-heading: '${config.headingFont}', sans-serif;
  --font-body: '${config.bodyFont}', sans-serif;

  /* Border Radius */
  --radius-sm: ${Math.max(2, config.borderRadius - 4)}px;
  --radius-md: ${config.borderRadius}px;
  --radius-lg: ${config.borderRadius + 4}px;
  --radius-xl: ${config.borderRadius + 8}px;

  /* Spacing */
  --space-1: ${config.spacingBase}px;
  --space-2: ${config.spacingBase * 2}px;
  --space-3: ${config.spacingBase * 3}px;
  --space-4: ${config.spacingBase * 4}px;
  --space-6: ${config.spacingBase * 6}px;
  --space-8: ${config.spacingBase * 8}px;
  --space-12: ${config.spacingBase * 12}px;
  --space-16: ${config.spacingBase * 16}px;
}`;
}

function generateJSON(config: StyleConfig): string {
  const pTints = generateTints(config.primaryColor);
  return JSON.stringify({
    colors: {
      primary: { 50: pTints[0], 100: pTints[1], 200: pTints[2], 300: pTints[3], 400: pTints[4], 500: config.primaryColor, 600: pTints[5], 700: pTints[6], 800: pTints[7], 900: pTints[8] },
      secondary: config.secondaryColor,
      accent: config.accentColor,
    },
    typography: { heading: config.headingFont, body: config.bodyFont },
    borderRadius: config.borderRadius,
    spacing: config.spacingBase,
  }, null, 2);
}

export default function StyleGuidePage() {
  const [config, setConfig, hydrated] = useLocalStorage<StyleConfig>("style-guide-config", DEFAULT_CONFIG);
  const [copied, setCopied] = useState<string | null>(null);

  const primaryTints = useMemo(() => generateTints(config.primaryColor), [config.primaryColor]);
  const secondaryTints = useMemo(() => generateTints(config.secondaryColor), [config.secondaryColor]);
  const accentTints = useMemo(() => generateTints(config.accentColor), [config.accentColor]);

  function handleCopy(content: string, key: string) {
    navigator.clipboard.writeText(content);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Style Guide Generator" description="Generate a complete style guide with colors, typography, and design tokens" icon={Palette} badge="Design" replaces="Figma Style Guides" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Primary Color</Label>
              <div className="flex gap-2"><input type="color" value={config.primaryColor} onChange={(e) => setConfig((c) => ({ ...c, primaryColor: e.target.value }))} className="h-8 w-10 rounded cursor-pointer" /><Input value={config.primaryColor} onChange={(e) => setConfig((c) => ({ ...c, primaryColor: e.target.value }))} className="flex-1" /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Secondary Color</Label>
              <div className="flex gap-2"><input type="color" value={config.secondaryColor} onChange={(e) => setConfig((c) => ({ ...c, secondaryColor: e.target.value }))} className="h-8 w-10 rounded cursor-pointer" /><Input value={config.secondaryColor} onChange={(e) => setConfig((c) => ({ ...c, secondaryColor: e.target.value }))} className="flex-1" /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Accent Color</Label>
              <div className="flex gap-2"><input type="color" value={config.accentColor} onChange={(e) => setConfig((c) => ({ ...c, accentColor: e.target.value }))} className="h-8 w-10 rounded cursor-pointer" /><Input value={config.accentColor} onChange={(e) => setConfig((c) => ({ ...c, accentColor: e.target.value }))} className="flex-1" /></div>
            </div>
            <Separator />
            <div className="space-y-1.5"><Label>Heading Font</Label><Input value={config.headingFont} onChange={(e) => setConfig((c) => ({ ...c, headingFont: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Body Font</Label><Input value={config.bodyFont} onChange={(e) => setConfig((c) => ({ ...c, bodyFont: e.target.value }))} /></div>
            <Separator />
            <div className="space-y-1.5">
              <Label>Border Radius: {config.borderRadius}px</Label>
              <input type="range" min={0} max={24} value={config.borderRadius} onChange={(e) => setConfig((c) => ({ ...c, borderRadius: parseInt(e.target.value) }))} className="w-full accent-violet-600" />
            </div>
            <div className="space-y-1.5">
              <Label>Spacing Base: {config.spacingBase}px</Label>
              <input type="range" min={2} max={8} value={config.spacingBase} onChange={(e) => setConfig((c) => ({ ...c, spacingBase: parseInt(e.target.value) }))} className="w-full accent-violet-600" />
            </div>
            <Separator />
            <Button variant="outline" size="sm" className="w-full" onClick={() => handleCopy(generateCSS(config), "css")}>
              <Copy className="h-3.5 w-3.5 mr-1" />{copied === "css" ? "Copied!" : "Export CSS Variables"}
            </Button>
            <Button variant="outline" size="sm" className="w-full" onClick={() => handleCopy(generateJSON(config), "json")}>
              <Download className="h-3.5 w-3.5 mr-1" />{copied === "json" ? "Copied!" : "Export JSON"}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="lg:col-span-3 space-y-4">
          {/* Color Palette */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Color Palette</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Primary", tints: primaryTints, base: config.primaryColor },
                { label: "Secondary", tints: secondaryTints, base: config.secondaryColor },
                { label: "Accent", tints: accentTints, base: config.accentColor },
              ].map((palette) => (
                <div key={palette.label}>
                  <p className="text-sm font-medium mb-2">{palette.label}</p>
                  <div className="flex gap-1">
                    {palette.tints.map((color, idx) => (
                      <div key={idx} className="flex-1 group cursor-pointer" onClick={() => handleCopy(color, `color-${palette.label}-${idx}`)}>
                        <div className="h-12 rounded-t" style={{ backgroundColor: color }} />
                        <div className="text-[9px] text-center py-1 bg-muted rounded-b font-mono">
                          {copied === `color-${palette.label}-${idx}` ? "Copied!" : color}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Typography Scale</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {TYPE_SCALE.map((t) => (
                <div key={t.name} className="flex items-baseline gap-4 py-1">
                  <div className="w-24 shrink-0 text-xs text-muted-foreground">{t.name}<br />{t.size}px / {t.weight}</div>
                  <p style={{ fontSize: `${Math.min(t.size, 36)}px`, fontWeight: parseInt(t.weight), lineHeight: t.leading, fontFamily: t.name.startsWith("Body") || t.name === "Caption" ? config.bodyFont : config.headingFont }}>
                    The quick brown fox
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Buttons */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Button Styles</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-3 flex-wrap">
                <button className="px-4 py-2 text-white text-sm font-medium transition-all" style={{ backgroundColor: config.primaryColor, borderRadius: `${config.borderRadius}px` }}>Primary Button</button>
                <button className="px-4 py-2 text-sm font-medium border-2 transition-all" style={{ borderColor: config.primaryColor, color: config.primaryColor, borderRadius: `${config.borderRadius}px` }}>Outline Button</button>
                <button className="px-4 py-2 text-white text-sm font-medium transition-all" style={{ backgroundColor: config.secondaryColor, borderRadius: `${config.borderRadius}px` }}>Secondary</button>
                <button className="px-4 py-2 text-white text-sm font-medium transition-all" style={{ backgroundColor: config.accentColor, borderRadius: `${config.borderRadius}px` }}>Accent</button>
                <button className="px-3 py-1.5 text-white text-xs font-medium transition-all" style={{ backgroundColor: config.primaryColor, borderRadius: `${Math.max(2, config.borderRadius - 2)}px` }}>Small</button>
                <button className="px-6 py-3 text-white text-base font-medium transition-all" style={{ backgroundColor: config.primaryColor, borderRadius: `${config.borderRadius + 2}px` }}>Large Button</button>
              </div>
            </CardContent>
          </Card>

          {/* Spacing */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Spacing Tokens</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3, 4, 6, 8, 12, 16].map((mult) => (
                  <div key={mult} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16 font-mono">--space-{mult}</span>
                    <div className="h-4 bg-gradient-to-r from-violet-500 to-pink-500 rounded" style={{ width: `${config.spacingBase * mult}px` }} />
                    <span className="text-xs text-muted-foreground">{config.spacingBase * mult}px</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
