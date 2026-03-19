"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Palette,
  Copy,
  Check,
  Eye,
  Contrast,
  History,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

// ---- Color math utilities ----

interface RGB { r: number; g: number; b: number }
interface HSL { h: number; s: number; l: number }
interface HSV { h: number; s: number; v: number }
interface CMYK { c: number; m: number; y: number; k: number }

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }

function hexToRgb(hex: string): RGB | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(rgb: RGB): string {
  return "#" + [rgb.r, rgb.g, rgb.b].map((c) => clamp(Math.round(c), 0, 255).toString(16).padStart(2, "0")).join("");
}

function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360, s = hsl.s / 100, l = hsl.l / 100;
  if (s === 0) { const v = Math.round(l * 255); return { r: v, g: v, b: v }; }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1/3) * 255),
  };
}

function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  const v = max;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
}

function hsvToRgb(hsv: HSV): RGB {
  const h = hsv.h / 360, s = hsv.s / 100, v = hsv.v / 100;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function rgbToCmyk(rgb: RGB): CMYK {
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: Math.round(((1 - r - k) / (1 - k)) * 100),
    m: Math.round(((1 - g - k) / (1 - k)) * 100),
    y: Math.round(((1 - b - k) / (1 - k)) * 100),
    k: Math.round(k * 100),
  };
}

function cmykToRgb(cmyk: CMYK): RGB {
  const c = cmyk.c / 100, m = cmyk.m / 100, y = cmyk.y / 100, k = cmyk.k / 100;
  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k)),
  };
}

// Detect and parse any color format
function parseColor(input: string): RGB | null {
  const s = input.trim().toLowerCase();

  // HEX
  const hexM = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexM) return hexToRgb(s);

  // RGB
  const rgbM = s.match(/^rgba?\s*\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})/);
  if (rgbM) return { r: +rgbM[1], g: +rgbM[2], b: +rgbM[3] };

  // HSL
  const hslM = s.match(/^hsla?\s*\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})%?\s*[,\s]\s*(\d{1,3})%?/);
  if (hslM) return hslToRgb({ h: +hslM[1], s: +hslM[2], l: +hslM[3] });

  // HSV/HSB
  const hsvM = s.match(/^hs[vb]\s*\(\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})%?\s*[,\s]\s*(\d{1,3})%?/);
  if (hsvM) return hsvToRgb({ h: +hsvM[1], s: +hsvM[2], v: +hsvM[3] });

  // CMYK
  const cmykM = s.match(/^cmyk\s*\(\s*(\d{1,3})%?\s*[,\s]\s*(\d{1,3})%?\s*[,\s]\s*(\d{1,3})%?\s*[,\s]\s*(\d{1,3})%?/);
  if (cmykM) return cmykToRgb({ c: +cmykM[1], m: +cmykM[2], y: +cmykM[3], k: +cmykM[4] });

  return null;
}

// Relative luminance
function luminance(rgb: RGB): number {
  const [rs, gs, bs] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(fg: RGB, bg: RGB): number {
  const l1 = luminance(fg), l2 = luminance(bg);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Color blindness simulation (simplified Brettel)
function simulateProtanopia(rgb: RGB): RGB {
  return {
    r: clamp(Math.round(0.56667 * rgb.r + 0.43333 * rgb.g + 0 * rgb.b), 0, 255),
    g: clamp(Math.round(0.55833 * rgb.r + 0.44167 * rgb.g + 0 * rgb.b), 0, 255),
    b: clamp(Math.round(0 * rgb.r + 0.24167 * rgb.g + 0.75833 * rgb.b), 0, 255),
  };
}

function simulateDeuteranopia(rgb: RGB): RGB {
  return {
    r: clamp(Math.round(0.625 * rgb.r + 0.375 * rgb.g + 0 * rgb.b), 0, 255),
    g: clamp(Math.round(0.7 * rgb.r + 0.3 * rgb.g + 0 * rgb.b), 0, 255),
    b: clamp(Math.round(0 * rgb.r + 0.3 * rgb.g + 0.7 * rgb.b), 0, 255),
  };
}

function simulateTritanopia(rgb: RGB): RGB {
  return {
    r: clamp(Math.round(0.95 * rgb.r + 0.05 * rgb.g + 0 * rgb.b), 0, 255),
    g: clamp(Math.round(0 * rgb.r + 0.43333 * rgb.g + 0.56667 * rgb.b), 0, 255),
    b: clamp(Math.round(0 * rgb.r + 0.475 * rgb.g + 0.525 * rgb.b), 0, 255),
  };
}

// Color harmony helpers
function hslShift(rgb: RGB, hShift: number): RGB {
  const hsl = rgbToHsl(rgb);
  return hslToRgb({ ...hsl, h: (hsl.h + hShift + 360) % 360 });
}

interface HistoryEntry {
  id: string;
  hex: string;
  timestamp: number;
}

export default function ColorConverterPage() {
  const [input, setInput] = useState("#7c3aed");
  const [fgInput, setFgInput] = useState("#ffffff");
  const [bgInput, setBgInput] = useState("#7c3aed");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [history, setHistory, hydrated] = useLocalStorage<HistoryEntry[]>("color-converter-history", []);

  const rgb = useMemo(() => parseColor(input), [input]);
  const hex = rgb ? rgbToHex(rgb) : null;
  const hsl = rgb ? rgbToHsl(rgb) : null;
  const hsv = rgb ? rgbToHsv(rgb) : null;
  const cmyk = rgb ? rgbToCmyk(rgb) : null;

  const fgRgb = useMemo(() => parseColor(fgInput), [fgInput]);
  const bgRgb = useMemo(() => parseColor(bgInput), [bgInput]);
  const contrast = fgRgb && bgRgb ? contrastRatio(fgRgb, bgRgb) : null;

  const colorBlindSims = useMemo(() => {
    if (!rgb) return null;
    return {
      protanopia: simulateProtanopia(rgb),
      deuteranopia: simulateDeuteranopia(rgb),
      tritanopia: simulateTritanopia(rgb),
    };
  }, [rgb]);

  const harmonies = useMemo(() => {
    if (!rgb) return null;
    return {
      complementary: hslShift(rgb, 180),
      analogous1: hslShift(rgb, 30),
      analogous2: hslShift(rgb, -30),
      triadic1: hslShift(rgb, 120),
      triadic2: hslShift(rgb, 240),
    };
  }, [rgb]);

  const addToHistory = useCallback(() => {
    if (!hex) return;
    setHistory((prev) => {
      const filtered = prev.filter((e) => e.hex !== hex);
      const newEntry: HistoryEntry = { id: generateId(), hex, timestamp: Date.now() };
      return [newEntry, ...filtered].slice(0, 20);
    });
  }, [hex, setHistory]);

  // Auto-add to history when color changes and is valid
  const lastHexRef = useMemo(() => ({ current: "" }), []);
  if (hex && hex !== lastHexRef.current) {
    lastHexRef.current = hex;
    // Schedule for after render
    if (hydrated && hex) {
      setTimeout(() => addToHistory(), 0);
    }
  }

  const handleCopy = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch { /* fallback */ }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }, []);

  const CopyBtn = ({ text, field }: { text: string; field: string }) => (
    <button
      onClick={() => handleCopy(text, field)}
      className="ml-auto shrink-0 p-1 rounded hover:bg-muted transition-colors"
    >
      {copiedField === field ? (
        <Check className="h-3 w-3 text-emerald-500" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Color Converter"
        description="Convert between HEX, RGB, HSL, HSV, CMYK with contrast checker and color blindness simulation."
        icon={Palette}
        badge="Developer"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input + preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Color Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Enter any color format</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={hex || "#000000"}
                    onChange={(e) => setInput(e.target.value)}
                    className="h-9 w-14 rounded-lg border cursor-pointer shrink-0"
                  />
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="#7c3aed, rgb(124,58,237), hsl(263,84%,58%)..."
                    className="font-mono text-sm"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Accepts HEX, RGB, HSL, HSV/HSB, CMYK
                </p>
              </div>

              {/* Large preview */}
              {hex ? (
                <div
                  className="w-full h-32 rounded-xl border-2 shadow-inner"
                  style={{ backgroundColor: hex }}
                />
              ) : (
                <div className="w-full h-32 rounded-xl border-2 border-dashed flex items-center justify-center text-muted-foreground text-sm">
                  Enter a valid color
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                All Formats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!rgb ? (
                <p className="text-sm text-muted-foreground text-center py-4">No valid color</p>
              ) : (
                <>
                  {[
                    { label: "HEX", value: hex!, field: "hex" },
                    { label: "RGB", value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, field: "rgb" },
                    { label: "HSL", value: `hsl(${hsl!.h}, ${hsl!.s}%, ${hsl!.l}%)`, field: "hsl" },
                    { label: "HSV", value: `hsv(${hsv!.h}, ${hsv!.s}%, ${hsv!.v}%)`, field: "hsv" },
                    { label: "CMYK", value: `cmyk(${cmyk!.c}%, ${cmyk!.m}%, ${cmyk!.y}%, ${cmyk!.k}%)`, field: "cmyk" },
                  ].map((item) => (
                    <div
                      key={item.field}
                      className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20"
                    >
                      <Badge variant="secondary" className="text-[10px] shrink-0 w-12 justify-center">
                        {item.label}
                      </Badge>
                      <span className="font-mono text-sm truncate">{item.value}</span>
                      <CopyBtn text={item.value} field={item.field} />
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center: Contrast + Harmonies */}
        <div className="space-y-4">
          {/* Contrast checker */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Contrast className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Contrast Checker
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Foreground</Label>
                  <Input
                    value={fgInput}
                    onChange={(e) => setFgInput(e.target.value)}
                    className="font-mono text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Background</Label>
                  <Input
                    value={bgInput}
                    onChange={(e) => setBgInput(e.target.value)}
                    className="font-mono text-xs h-8"
                  />
                </div>
              </div>

              {fgRgb && bgRgb && (
                <>
                  <div
                    className="p-4 rounded-lg border text-center"
                    style={{
                      backgroundColor: rgbToHex(bgRgb),
                      color: rgbToHex(fgRgb),
                    }}
                  >
                    <p className="text-lg font-bold">Sample Text</p>
                    <p className="text-sm">The quick brown fox jumps</p>
                  </div>

                  <div className="text-center">
                    <p className="text-2xl font-bold font-mono">{contrast!.toFixed(2)}:1</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "AA Normal", pass: contrast! >= 4.5 },
                      { label: "AA Large", pass: contrast! >= 3 },
                      { label: "AAA Normal", pass: contrast! >= 7 },
                      { label: "AAA Large", pass: contrast! >= 4.5 },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`p-2 rounded-lg border text-center text-xs font-medium ${
                          item.pass
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                        }`}
                      >
                        {item.label}: {item.pass ? "Pass" : "Fail"}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Color harmonies */}
          {harmonies && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Color Harmonies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Complementary", colors: [harmonies.complementary] },
                  { label: "Analogous", colors: [harmonies.analogous1, harmonies.analogous2] },
                  { label: "Triadic", colors: [harmonies.triadic1, harmonies.triadic2] },
                ].map((group) => (
                  <div key={group.label} className="space-y-1">
                    <p className="text-[10px] text-muted-foreground">{group.label}</p>
                    <div className="flex gap-2">
                      {rgb && (
                        <button
                          onClick={() => handleCopy(rgbToHex(rgb), `h-orig`)}
                          className="h-8 flex-1 rounded-lg border shadow-sm"
                          style={{ backgroundColor: rgbToHex(rgb) }}
                          title={rgbToHex(rgb)}
                        />
                      )}
                      {group.colors.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => handleCopy(rgbToHex(c), `h-${group.label}-${i}`)}
                          className="h-8 flex-1 rounded-lg border shadow-sm"
                          style={{ backgroundColor: rgbToHex(c) }}
                          title={rgbToHex(c)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Color blindness + History */}
        <div className="space-y-4">
          {/* Color blindness simulation */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Color Blindness
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {!colorBlindSims ? (
                <p className="text-sm text-muted-foreground text-center py-4">Enter a color to simulate</p>
              ) : (
                <>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground">Normal Vision</p>
                    <div
                      className="h-10 rounded-lg border"
                      style={{ backgroundColor: hex! }}
                    />
                  </div>
                  {[
                    { label: "Protanopia (no red)", color: colorBlindSims.protanopia },
                    { label: "Deuteranopia (no green)", color: colorBlindSims.deuteranopia },
                    { label: "Tritanopia (no blue)", color: colorBlindSims.tritanopia },
                  ].map((sim) => (
                    <div key={sim.label} className="space-y-1">
                      <p className="text-[10px] text-muted-foreground">{sim.label}</p>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-10 flex-1 rounded-lg border"
                          style={{ backgroundColor: rgbToHex(sim.color) }}
                        />
                        <span className="text-[10px] font-mono text-muted-foreground w-16 text-right">
                          {rgbToHex(sim.color)}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Recent Colors
                  </CardTitle>
                </div>
                {hydrated && history.length > 0 && (
                  <button
                    onClick={() => setHistory([])}
                    className="p-1 rounded hover:bg-muted transition-colors"
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!hydrated || history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No colors yet
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {history.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => setInput(entry.hex)}
                      className="group relative h-8 w-8 rounded-lg border shadow-sm hover:scale-110 transition-transform"
                      style={{ backgroundColor: entry.hex }}
                      title={entry.hex}
                    />
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
