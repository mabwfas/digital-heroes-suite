"use client";

import { useState, useCallback } from "react";
import { Palette, RefreshCw, Copy, Lock, Unlock, Download, Check, Shuffle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface ColorSwatch {
  hex: string;
  locked: boolean;
}

interface SavedPalette {
  id: string;
  name: string;
  colors: string[];
  harmony: string;
  createdAt: string;
}

type HarmonyType = "complementary" | "analogous" | "triadic" | "tetradic" | "monochromatic" | "random";

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));
  const hNorm = h / 360, sNorm = s / 100, lNorm = l / 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = lNorm;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    r = hue2rgb(p, q, hNorm + 1/3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1/3);
  }
  return "#" + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
}

function randomHex(): string {
  return "#" + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, "0");
}

function generatePalette(harmony: HarmonyType, existing?: ColorSwatch[]): ColorSwatch[] {
  const baseHex = randomHex();
  const [h, s, l] = hexToHsl(baseHex);

  let colors: string[] = [];
  switch (harmony) {
    case "complementary":
      colors = [
        hslToHex(h, s, l),
        hslToHex(h + 20, s, l + 10),
        hslToHex(h + 10, s - 10, l + 20),
        hslToHex(h + 180, s, l),
        hslToHex(h + 160, s, l - 10),
      ];
      break;
    case "analogous":
      colors = [
        hslToHex(h - 40, s, l),
        hslToHex(h - 20, s, l),
        hslToHex(h, s, l),
        hslToHex(h + 20, s, l),
        hslToHex(h + 40, s, l),
      ];
      break;
    case "triadic":
      colors = [
        hslToHex(h, s, l),
        hslToHex(h, s, l - 15),
        hslToHex(h + 120, s, l),
        hslToHex(h + 120, s, l - 15),
        hslToHex(h + 240, s, l),
      ];
      break;
    case "tetradic":
      colors = [
        hslToHex(h, s, l),
        hslToHex(h + 90, s, l),
        hslToHex(h + 180, s, l),
        hslToHex(h + 270, s, l),
        hslToHex(h, s, l - 20),
      ];
      break;
    case "monochromatic":
      colors = [
        hslToHex(h, s, 20),
        hslToHex(h, s, 35),
        hslToHex(h, s, 50),
        hslToHex(h, s, 65),
        hslToHex(h, s, 80),
      ];
      break;
    default:
      colors = Array.from({ length: 5 }, () => randomHex());
  }

  return colors.map((hex, i) => ({
    hex,
    locked: existing?.[i]?.locked ?? false,
  }));
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

const HARMONY_LABELS: Record<HarmonyType, string> = {
  complementary: "Complementary",
  analogous: "Analogous",
  triadic: "Triadic",
  tetradic: "Tetradic",
  monochromatic: "Monochromatic",
  random: "Random",
};

export default function ColorPalettePage() {
  const [savedPalettes, setSavedPalettes] = useLocalStorage<SavedPalette[]>("shopify-color-palettes", []);
  const [harmony, setHarmony] = useState<HarmonyType>("analogous");
  const [palette, setPalette] = useState<ColorSwatch[]>(() => generatePalette("analogous"));
  const [copied, setCopied] = useState<string | null>(null);
  const [exportCopied, setExportCopied] = useState(false);

  const regenerate = useCallback(() => {
    setPalette(prev => {
      const next = generatePalette(harmony, prev);
      return next.map((swatch, i) => prev[i]?.locked ? { ...prev[i] } : swatch);
    });
  }, [harmony]);

  const changeHarmony = (h: HarmonyType) => {
    setHarmony(h);
    setPalette(prev => generatePalette(h, prev).map((swatch, i) => prev[i]?.locked ? { ...prev[i] } : swatch));
  };

  const toggleLock = (i: number) => {
    setPalette(prev => prev.map((s, idx) => idx === i ? { ...s, locked: !s.locked } : s));
  };

  const copyHex = async (hex: string) => {
    await navigator.clipboard.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied(null), 1500);
  };

  const savePalette = () => {
    const newPalette: SavedPalette = {
      id: generateId(),
      name: `${HARMONY_LABELS[harmony]} ${new Date().toLocaleDateString()}`,
      colors: palette.map(s => s.hex),
      harmony,
      createdAt: new Date().toISOString(),
    };
    setSavedPalettes(prev => [newPalette, ...prev]);
  };

  const deletePalette = (id: string) => {
    setSavedPalettes(prev => prev.filter(p => p.id !== id));
  };

  const loadPalette = (p: SavedPalette) => {
    setPalette(p.colors.map(hex => ({ hex, locked: false })));
    setHarmony(p.harmony as HarmonyType);
  };

  const exportCSS = () => {
    const css = `:root {\n${palette.map((s, i) => `  --color-${i + 1}: ${s.hex};`).join("\n")}\n}`;
    navigator.clipboard.writeText(css);
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Color Palette Generator"
        description="Generate beautiful color palettes for your Shopify store with harmony-based color theory."
        icon={Palette}
        badge="Design"
        replaces="Coolors, Adobe Color"
      />

      {/* Harmony Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Color Harmony</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(Object.keys(HARMONY_LABELS) as HarmonyType[]).map(h => (
            <button
              key={h}
              onClick={() => changeHarmony(h)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                harmony === h
                  ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              {HARMONY_LABELS[h]}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Palette Display */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex h-48 sm:h-64">
            {palette.map((swatch, i) => (
              <div
                key={i}
                className="flex-1 relative group cursor-pointer transition-all hover:flex-[1.4]"
                style={{ backgroundColor: swatch.hex }}
                onClick={() => copyHex(swatch.hex)}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                  <div className="rounded-lg px-2 py-1 text-xs font-mono font-bold backdrop-blur-sm" style={{ backgroundColor: "rgba(0,0,0,0.3)", color: "#fff" }}>
                    {swatch.hex.toUpperCase()}
                  </div>
                  {copied === swatch.hex ? (
                    <Check className="h-4 w-4 text-white drop-shadow" />
                  ) : (
                    <Copy className="h-4 w-4 text-white drop-shadow" />
                  )}
                </div>
                <button
                  className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                  style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
                  onClick={e => { e.stopPropagation(); toggleLock(i); }}
                >
                  {swatch.locked
                    ? <Lock className="h-3.5 w-3.5 text-white" />
                    : <Unlock className="h-3.5 w-3.5 text-white" />
                  }
                </button>
                {swatch.locked && (
                  <div className="absolute top-2 left-2">
                    <Lock className="h-3 w-3" style={{ color: getContrastColor(swatch.hex) + "aa" }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Hex Row */}
          <div className="flex border-t">
            {palette.map((swatch, i) => (
              <div key={i} className="flex-1 flex flex-col items-center py-3 gap-1 border-r last:border-r-0">
                <div className="h-5 w-5 rounded-full border-2 border-muted shadow-sm" style={{ backgroundColor: swatch.hex }} />
                <button
                  className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => copyHex(swatch.hex)}
                >
                  {swatch.hex.toUpperCase()}
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={regenerate} className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0">
          <Shuffle className="h-4 w-4 mr-2" />
          Regenerate
        </Button>
        <Button onClick={regenerate} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Unlocked
        </Button>
        <Button onClick={savePalette} variant="outline">
          Save Palette
        </Button>
        <Button onClick={exportCSS} variant="outline">
          {exportCopied ? <Check className="h-4 w-4 mr-2 text-emerald-500" /> : <Download className="h-4 w-4 mr-2" />}
          Export CSS Variables
        </Button>
      </div>

      {/* Saved Palettes */}
      {savedPalettes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saved Palettes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {savedPalettes.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex gap-1 shrink-0">
                  {p.colors.map((c, i) => (
                    <div key={i} className="h-7 w-7 rounded-md shadow-sm" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <Badge variant="secondary" className="text-[10px] mt-0.5">{HARMONY_LABELS[p.harmony as HarmonyType]}</Badge>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => loadPalette(p)}>Load</Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deletePalette(p.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
