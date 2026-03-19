"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Paintbrush,
  Copy,
  Check,
  Plus,
  Trash2,
  Heart,
  Star,
  RotateCcw,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type GradientType = "linear" | "radial";

interface ColorStop {
  id: string;
  color: string;
  position: number;
}

interface SavedGradient {
  id: string;
  css: string;
  name: string;
  timestamp: number;
}

const RADIAL_POSITIONS = [
  "center",
  "top",
  "top right",
  "right",
  "bottom right",
  "bottom",
  "bottom left",
  "left",
  "top left",
] as const;

const PRESET_GRADIENTS: { name: string; css: string }[] = [
  { name: "Sunset", css: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { name: "Ocean", css: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { name: "Emerald", css: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" },
  { name: "Flame", css: "linear-gradient(135deg, #f12711 0%, #f5af19 100%)" },
  { name: "Violet", css: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)" },
  { name: "Sky", css: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)" },
  { name: "Peach", css: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)" },
  { name: "Berry", css: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)" },
  { name: "Mint", css: "linear-gradient(135deg, #c3fae8 0%, #38d9a9 100%)" },
  { name: "Rose Gold", css: "linear-gradient(135deg, #fbd3e9 0%, #bb377d 100%)" },
  { name: "Night Sky", css: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" },
  { name: "Aurora", css: "linear-gradient(135deg, #00d2ff 0%, #3a7bd5 50%, #8e54e9 100%)" },
  { name: "Lavender", css: "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)" },
  { name: "Coral", css: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)" },
  { name: "Slate", css: "linear-gradient(135deg, #334d50 0%, #cbcaa5 100%)" },
  { name: "Citrus", css: "linear-gradient(135deg, #f7ff00 0%, #db36a4 100%)" },
  { name: "Frost", css: "linear-gradient(135deg, #e6e9f0 0%, #eef1f5 100%)" },
  { name: "Nebula", css: "linear-gradient(135deg, #43cea2 0%, #185a9d 100%)" },
  { name: "Mango", css: "linear-gradient(135deg, #ffe259 0%, #ffa751 100%)" },
  { name: "Steel", css: "linear-gradient(135deg, #485563 0%, #29323c 100%)" },
  { name: "Cherry", css: "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)" },
  { name: "Deep Sea", css: "linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)" },
];

function stopsToCSS(stops: ColorStop[]): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  return sorted.map((s) => `${s.color} ${s.position}%`).join(", ");
}

export default function CSSGradientPage() {
  const [gradientType, setGradientType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState(135);
  const [radialPos, setRadialPos] = useState<string>("center");
  const [stops, setStops] = useState<ColorStop[]>([
    { id: generateId(), color: "#7c3aed", position: 0 },
    { id: generateId(), color: "#db2777", position: 100 },
  ]);
  const [copied, setCopied] = useState(false);
  const [favorites, setFavorites, hydrated] = useLocalStorage<SavedGradient[]>(
    "css-gradient-favorites",
    []
  );

  const cssValue = useMemo(() => {
    const stopStr = stopsToCSS(stops);
    if (gradientType === "linear") {
      return `linear-gradient(${angle}deg, ${stopStr})`;
    }
    return `radial-gradient(circle at ${radialPos}, ${stopStr})`;
  }, [gradientType, angle, radialPos, stops]);

  const fullCSS = `background: ${cssValue};`;

  // Try to produce a Tailwind equivalent
  const tailwindClass = useMemo(() => {
    if (gradientType !== "linear" || stops.length !== 2) return null;
    const dirMap: Record<number, string> = {
      0: "bg-gradient-to-t",
      45: "bg-gradient-to-tr",
      90: "bg-gradient-to-r",
      135: "bg-gradient-to-br",
      180: "bg-gradient-to-b",
      225: "bg-gradient-to-bl",
      270: "bg-gradient-to-l",
      315: "bg-gradient-to-tl",
    };
    const dir = dirMap[angle];
    if (!dir) return null;
    return `${dir} from-[${stops[0].color}] to-[${stops[1].color}]`;
  }, [gradientType, angle, stops]);

  const handleCopy = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);

  const addStop = useCallback(() => {
    const lastPos = stops.length > 0 ? stops[stops.length - 1].position : 0;
    const newPos = Math.min(100, lastPos + 20);
    setStops((prev) => [...prev, { id: generateId(), color: "#6366f1", position: newPos }]);
  }, [stops]);

  const removeStop = useCallback((id: string) => {
    setStops((prev) => {
      if (prev.length <= 2) return prev;
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  const updateStop = useCallback((id: string, updates: Partial<ColorStop>) => {
    setStops((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const saveFavorite = useCallback(() => {
    const name = `Gradient ${(favorites.length + 1)}`;
    setFavorites((prev) => [
      { id: generateId(), css: cssValue, name, timestamp: Date.now() },
      ...prev,
    ]);
  }, [cssValue, favorites.length, setFavorites]);

  const loadPreset = useCallback((css: string) => {
    // Parse preset CSS to extract stops and angle
    const linearM = css.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);
    if (linearM) {
      setGradientType("linear");
      setAngle(Number(linearM[1]));
      const stopStrs = linearM[2].split(/,\s*(?=#)/);
      const newStops: ColorStop[] = stopStrs.map((s) => {
        const parts = s.trim().split(/\s+/);
        return {
          id: generateId(),
          color: parts[0],
          position: parseInt(parts[1]) || 0,
        };
      });
      if (newStops.length >= 2) setStops(newStops);
      return;
    }
    const radialM = css.match(/radial-gradient\(circle at (.+?),\s*(.+)\)/);
    if (radialM) {
      setGradientType("radial");
      setRadialPos(radialM[1]);
      const stopStrs = radialM[2].split(/,\s*(?=#)/);
      const newStops: ColorStop[] = stopStrs.map((s) => {
        const parts = s.trim().split(/\s+/);
        return {
          id: generateId(),
          color: parts[0],
          position: parseInt(parts[1]) || 0,
        };
      });
      if (newStops.length >= 2) setStops(newStops);
    }
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="CSS Gradient Generator"
        description="Create beautiful linear and radial CSS gradients with live preview and Tailwind class output."
        icon={Paintbrush}
        badge="Developer"
      />

      {/* Live Preview */}
      <Card>
        <CardContent className="p-0">
          <div
            className="w-full h-48 rounded-xl"
            style={{ background: cssValue }}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Gradient type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Gradient Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {(["linear", "radial"] as GradientType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setGradientType(type)}
                    className={`flex-1 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all capitalize ${
                      gradientType === type
                        ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        : "border-border hover:border-violet-300 text-muted-foreground"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {gradientType === "linear" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Angle</Label>
                    <span className="text-sm font-mono font-bold text-violet-600 dark:text-violet-400">
                      {angle}°
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={angle}
                      onChange={(e) => setAngle(Number(e.target.value))}
                      className="flex-1 accent-violet-500"
                    />
                    {/* Visual dial */}
                    <div className="relative h-12 w-12 rounded-full border-2 shrink-0">
                      <div
                        className="absolute top-1/2 left-1/2 w-5 h-0.5 bg-violet-500 origin-left rounded"
                        style={{
                          transform: `rotate(${angle - 90}deg)`,
                        }}
                      />
                      <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-violet-500 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                      <button
                        key={a}
                        onClick={() => setAngle(a)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                          angle === a
                            ? "border-violet-500 bg-violet-500/10 text-violet-600"
                            : "border-border text-muted-foreground hover:border-violet-300"
                        }`}
                      >
                        {a}°
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Position</Label>
                  <div className="grid grid-cols-3 gap-1">
                    {RADIAL_POSITIONS.map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setRadialPos(pos)}
                        className={`px-2 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          radialPos === pos
                            ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                            : "border-border hover:border-violet-300 text-muted-foreground"
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Color stops */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Color Stops
                </CardTitle>
                <Button variant="outline" size="sm" onClick={addStop}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Stop
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {stops.map((stop, i) => (
                <div key={stop.id} className="flex items-center gap-3 p-2 rounded-lg border bg-muted/20">
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => updateStop(stop.id, { color: e.target.value })}
                    className="h-8 w-10 rounded border cursor-pointer shrink-0"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground w-16">{stop.color}</span>
                      <span className="text-xs text-muted-foreground">{stop.position}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={stop.position}
                      onChange={(e) => updateStop(stop.id, { position: Number(e.target.value) })}
                      className="w-full accent-violet-500"
                    />
                  </div>
                  <button
                    onClick={() => removeStop(stop.id)}
                    disabled={stops.length <= 2}
                    className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}

              {/* Gradient bar preview of stops */}
              <div
                className="h-4 rounded-full border"
                style={{
                  background: `linear-gradient(90deg, ${stopsToCSS(stops)})`,
                }}
              />
            </CardContent>
          </Card>

          {/* Generated CSS */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Generated CSS
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveFavorite}
                  >
                    <Heart className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/30 border font-mono text-sm break-all">
                {fullCSS}
              </div>
              <Button
                onClick={() => handleCopy(fullCSS)}
                variant="outline"
                className="w-full"
              >
                {copied ? (
                  <><Check className="h-4 w-4 mr-2 text-emerald-500" />Copied!</>
                ) : (
                  <><Copy className="h-4 w-4 mr-2" />Copy CSS</>
                )}
              </Button>

              {tailwindClass && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Tailwind Equivalent</Label>
                  <div className="p-3 rounded-lg bg-muted/30 border font-mono text-sm break-all">
                    {tailwindClass}
                  </div>
                  <Button
                    onClick={() => handleCopy(tailwindClass)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Tailwind Class
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Presets + Favorites */}
        <div className="space-y-4">
          {/* Preset gallery */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Presets
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-auto">
                {PRESET_GRADIENTS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => loadPreset(preset.css)}
                    className="group space-y-1"
                  >
                    <div
                      className="h-12 rounded-lg border group-hover:ring-2 ring-violet-500 transition-all"
                      style={{ background: preset.css }}
                    />
                    <p className="text-[10px] text-muted-foreground text-center">{preset.name}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Saved favorites */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Favorites
                  </CardTitle>
                </div>
                {hydrated && favorites.length > 0 && (
                  <button
                    onClick={() => setFavorites([])}
                    className="p-1 rounded hover:bg-muted transition-colors"
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!hydrated || favorites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Save gradients to see them here
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-auto">
                  {favorites.map((fav) => (
                    <button
                      key={fav.id}
                      onClick={() => loadPreset(fav.css)}
                      className="group space-y-1"
                    >
                      <div
                        className="h-12 rounded-lg border group-hover:ring-2 ring-violet-500 transition-all"
                        style={{ background: fav.css }}
                      />
                      <p className="text-[10px] text-muted-foreground text-center truncate">{fav.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick tips */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "Use 2-3 color stops for clean gradients",
                "135° diagonal gives a modern look",
                "Radial gradients work great for spotlights",
                "Save favorites for your design system",
                "Tailwind class output for 2-stop linear only",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">{tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
