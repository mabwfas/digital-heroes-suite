"use client";

import { useState } from "react";
import { Monitor, Copy, Check, Download, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/lib/hooks";

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  error: string;
}

interface ThemeConfig {
  name: string;
  colors: ThemeColors;
  font: string;
  borderRadius: string;
  buttonStyle: string;
}

const DEFAULT_THEME: ThemeConfig = {
  name: "My Theme",
  colors: {
    primary: "#5B21B6",
    secondary: "#DB2777",
    accent: "#F59E0B",
    background: "#FFFFFF",
    surface: "#F8FAFC",
    text: "#0F172A",
    textMuted: "#64748B",
    border: "#E2E8F0",
    success: "#10B981",
    error: "#EF4444",
  },
  font: "Inter",
  borderRadius: "8",
  buttonStyle: "solid",
};

const THEME_PRESETS: { name: string; theme: Partial<ThemeConfig> }[] = [
  {
    name: "Violet Pro",
    theme: {
      colors: { primary: "#5B21B6", secondary: "#DB2777", accent: "#F59E0B", background: "#FFFFFF", surface: "#F5F3FF", text: "#1E1B4B", textMuted: "#6D6A88", border: "#DDD6FE", success: "#10B981", error: "#EF4444" },
    },
  },
  {
    name: "Ocean Breeze",
    theme: {
      colors: { primary: "#0284C7", secondary: "#0891B2", accent: "#06B6D4", background: "#FFFFFF", surface: "#F0F9FF", text: "#0C4A6E", textMuted: "#4B7FA8", border: "#BAE6FD", success: "#10B981", error: "#EF4444" },
    },
  },
  {
    name: "Forest & Gold",
    theme: {
      colors: { primary: "#15803D", secondary: "#854D0E", accent: "#CA8A04", background: "#FAFAF9", surface: "#F0FDF4", text: "#14532D", textMuted: "#6B7280", border: "#BBF7D0", success: "#10B981", error: "#EF4444" },
    },
  },
  {
    name: "Dark Luxury",
    theme: {
      colors: { primary: "#D4AF37", secondary: "#C0C0C0", accent: "#E5C06A", background: "#0A0A0A", surface: "#1A1A1A", text: "#F5F5F5", textMuted: "#9CA3AF", border: "#2D2D2D", success: "#10B981", error: "#EF4444" },
    },
  },
  {
    name: "Blush & Sand",
    theme: {
      colors: { primary: "#BE123C", secondary: "#D97706", accent: "#F472B6", background: "#FFFBF7", surface: "#FFF1F2", text: "#1C1917", textMuted: "#78716C", border: "#FECDD3", success: "#10B981", error: "#EF4444" },
    },
  },
];

const FONTS = ["Inter", "Playfair Display", "Montserrat", "Lato", "Raleway", "Nunito", "Oswald", "Merriweather"];
const RADII = [{ id: "0", label: "Sharp" }, { id: "4", label: "Slight" }, { id: "8", label: "Rounded" }, { id: "12", label: "Soft" }, { id: "9999", label: "Pill" }];

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
      <div className="flex gap-2 items-center">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="h-8 w-8 rounded-md cursor-pointer border shrink-0" />
        <Input value={value} onChange={e => onChange(e.target.value)} className="font-mono text-xs" />
      </div>
    </div>
  );
}

export default function ThemePreviewerPage() {
  const [theme, setTheme] = useLocalStorage<ThemeConfig>("shopify-theme-config", DEFAULT_THEME);
  const [copied, setCopied] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState<"home" | "product" | "cart">("home");

  const updateColor = (key: keyof ThemeColors, value: string) => {
    setTheme(prev => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  };

  const applyPreset = (preset: typeof THEME_PRESETS[number]) => {
    setTheme(prev => ({
      ...prev,
      ...preset.theme,
      colors: { ...prev.colors, ...(preset.theme.colors ?? {}) },
    }));
  };

  const resetTheme = () => setTheme(DEFAULT_THEME);

  const exportJSON = () => {
    const json = JSON.stringify(theme, null, 2);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const { colors, font, borderRadius, buttonStyle } = theme;
  const br = `${borderRadius}px`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shopify Theme Previewer"
        description="Customize your store's color scheme and typography with a live mini-store preview."
        icon={Monitor}
        badge="Design"
        replaces="Shopify Theme Editor"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controls */}
        <div className="space-y-4">
          {/* Presets */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Theme Presets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {THEME_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/50 transition-all text-left"
                >
                  <div className="flex gap-1 shrink-0">
                    {["primary", "secondary", "accent"].map(k => (
                      <div key={k} className="h-5 w-5 rounded-full border" style={{ backgroundColor: preset.theme.colors?.[k as keyof ThemeColors] }} />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{preset.name}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Font */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Typography</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Font Family</Label>
                <div className="grid grid-cols-2 gap-1">
                  {FONTS.map(f => (
                    <button
                      key={f}
                      onClick={() => setTheme(prev => ({ ...prev, font: f }))}
                      className={`py-1.5 px-2 rounded-lg text-xs text-left transition-all truncate ${
                        font === f ? "bg-gradient-to-r from-violet-500/15 to-pink-500/15 text-violet-700 dark:text-violet-300 font-semibold" : "bg-muted/30 hover:bg-muted/60 text-muted-foreground"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Border Radius</Label>
                <div className="flex gap-1.5">
                  {RADII.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setTheme(prev => ({ ...prev, borderRadius: r.id }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${
                        borderRadius === r.id ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(Object.entries(colors) as [keyof ThemeColors, string][]).map(([key, val]) => (
                <ColorField
                  key={key}
                  label={key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}
                  value={val}
                  onChange={v => updateColor(key, v)}
                />
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={resetTheme} variant="outline" size="sm" className="flex-1">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
            <Button onClick={exportJSON} size="sm" className="flex-1 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0">
              {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
              {copied ? "Copied!" : "Export JSON"}
            </Button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden sticky top-4">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between mb-3">
                <CardTitle className="text-sm">Store Preview</CardTitle>
                <div className="flex gap-1">
                  {(["home", "product", "cart"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActivePreviewTab(tab)}
                      className={`px-3 py-1 rounded-md text-xs capitalize transition-all ${
                        activePreviewTab === tab ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white" : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Browser Chrome */}
              <div className="mx-4 mb-0 rounded-t-xl border bg-muted/40 overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-2 border-b bg-muted/60">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <div className="flex-1 mx-2 h-5 rounded-md bg-background/80 px-2 flex items-center">
                    <span className="text-[10px] text-muted-foreground">mystore.myshopify.com</span>
                  </div>
                </div>

                {/* Store Content */}
                <div className="overflow-auto" style={{ backgroundColor: colors.background, maxHeight: 520, fontFamily: `'${font}', sans-serif` }}>
                  {/* Nav */}
                  <nav className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: colors.border, backgroundColor: colors.background }}>
                    <span className="font-bold text-sm" style={{ color: colors.text }}>{theme.name}</span>
                    <div className="flex gap-4">
                      {["Home", "Shop", "About", "Blog"].map(item => (
                        <span key={item} className="text-xs cursor-pointer" style={{ color: colors.textMuted }}>{item}</span>
                      ))}
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs px-2 py-1 rounded-md font-medium" style={{ backgroundColor: colors.primary, color: "#fff", borderRadius: br }}>Cart (2)</span>
                    </div>
                  </nav>

                  {activePreviewTab === "home" && (
                    <div>
                      {/* Hero */}
                      <div className="px-5 py-8 text-center" style={{ backgroundColor: colors.surface }}>
                        <Badge className="mb-3 text-[10px]" style={{ backgroundColor: `${colors.accent}20`, color: colors.accent, border: "none" }}>New Collection</Badge>
                        <h1 className="text-xl font-bold mb-2" style={{ color: colors.text }}>Welcome to {theme.name}</h1>
                        <p className="text-xs mb-4 max-w-xs mx-auto" style={{ color: colors.textMuted }}>Discover our curated selection of premium products.</p>
                        <button className="px-4 py-2 text-xs font-semibold" style={{ backgroundColor: colors.primary, color: "#fff", borderRadius: br }}>Shop Now</button>
                      </div>
                      {/* Products */}
                      <div className="px-5 py-5">
                        <h2 className="text-sm font-semibold mb-3" style={{ color: colors.text }}>Featured Products</h2>
                        <div className="grid grid-cols-3 gap-3">
                          {["Mug", "Candle", "Journal"].map((name, i) => (
                            <div key={name} className="rounded-lg overflow-hidden border" style={{ backgroundColor: colors.surface, borderColor: colors.border, borderRadius: br }}>
                              <div className="h-20 flex items-center justify-center text-2xl" style={{ backgroundColor: `${colors.secondary}20` }}>
                                {["☕", "🕯️", "📓"][i]}
                              </div>
                              <div className="p-2">
                                <p className="text-xs font-medium" style={{ color: colors.text }}>{name}</p>
                                <p className="text-xs font-bold" style={{ color: colors.primary }}>$24.99</p>
                                <button className="mt-1.5 w-full text-[10px] py-1 font-medium" style={{ backgroundColor: colors.primary, color: "#fff", borderRadius: br }}>Add to Cart</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activePreviewTab === "product" && (
                    <div className="flex gap-5 p-5">
                      <div className="h-40 w-40 flex-shrink-0 rounded-xl flex items-center justify-center text-4xl" style={{ backgroundColor: `${colors.primary}15`, borderRadius: br }}>
                        ☕
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] mb-1" style={{ color: colors.textMuted }}>HOME &gt; PRODUCTS</p>
                        <h1 className="text-base font-bold mb-1" style={{ color: colors.text }}>Premium Ceramic Mug</h1>
                        <p className="text-lg font-bold mb-2" style={{ color: colors.primary }}>$24.99</p>
                        <p className="text-xs mb-3" style={{ color: colors.textMuted }}>Handcrafted with care. Each piece is unique.</p>
                        <div className="flex gap-2 mb-3">
                          {["S", "M", "L"].map(s => (
                            <button key={s} className="h-7 w-7 rounded-md text-xs border" style={{ borderColor: colors.border, color: colors.text }}>{s}</button>
                          ))}
                        </div>
                        <button className="w-full py-2 text-sm font-semibold mb-2" style={{ backgroundColor: colors.primary, color: "#fff", borderRadius: br }}>Add to Cart</button>
                        <button className="w-full py-2 text-sm font-semibold border" style={{ borderColor: colors.primary, color: colors.primary, borderRadius: br }}>Buy Now</button>
                      </div>
                    </div>
                  )}

                  {activePreviewTab === "cart" && (
                    <div className="p-5">
                      <h1 className="text-base font-bold mb-4" style={{ color: colors.text }}>Your Cart (2 items)</h1>
                      {[{ name: "Premium Mug", price: "$24.99", emoji: "☕" }, { name: "Soy Candle", price: "$18.99", emoji: "🕯️" }].map(item => (
                        <div key={item.name} className="flex items-center gap-3 p-3 mb-2 rounded-lg" style={{ backgroundColor: colors.surface, borderRadius: br }}>
                          <div className="h-12 w-12 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: `${colors.secondary}20` }}>{item.emoji}</div>
                          <div className="flex-1">
                            <p className="text-xs font-medium" style={{ color: colors.text }}>{item.name}</p>
                            <p className="text-xs font-bold" style={{ color: colors.primary }}>{item.price}</p>
                          </div>
                          <span className="text-xs" style={{ color: colors.textMuted }}>×1</span>
                        </div>
                      ))}
                      <div className="mt-4 p-3 rounded-lg border" style={{ borderColor: colors.border }}>
                        <div className="flex justify-between text-xs mb-1" style={{ color: colors.textMuted }}><span>Subtotal</span><span>$43.98</span></div>
                        <div className="flex justify-between text-xs mb-3" style={{ color: colors.textMuted }}><span>Shipping</span><span>Free</span></div>
                        <div className="flex justify-between text-sm font-bold" style={{ color: colors.text }}><span>Total</span><span>$43.98</span></div>
                      </div>
                      <button className="w-full py-2.5 text-sm font-bold mt-3" style={{ backgroundColor: colors.primary, color: "#fff", borderRadius: br }}>Checkout</button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
