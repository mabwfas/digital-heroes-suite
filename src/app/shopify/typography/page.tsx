"use client";

import { useState, useEffect } from "react";
import { Type, Check, Copy, Heart, Download, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface FontPairing {
  id: string;
  heading: string;
  body: string;
  label: string;
  category: string;
}

interface SavedPairing {
  id: string;
  pairing: FontPairing;
  headingSize: number;
  bodySize: number;
  lineHeight: number;
  savedAt: string;
}

const FONT_PAIRINGS: FontPairing[] = [
  { id: "1", heading: "Playfair Display", body: "Source Sans Pro", label: "Editorial", category: "Serif + Sans" },
  { id: "2", heading: "Montserrat", body: "Merriweather", label: "Modern Classic", category: "Sans + Serif" },
  { id: "3", heading: "Raleway", body: "Lato", label: "Clean & Modern", category: "Sans + Sans" },
  { id: "4", heading: "Oswald", body: "Lora", label: "Bold & Elegant", category: "Condensed + Serif" },
  { id: "5", heading: "Nunito", body: "Open Sans", label: "Friendly & Clear", category: "Rounded + Sans" },
  { id: "6", heading: "Cormorant Garamond", body: "Proza Libre", label: "Luxury Editorial", category: "Serif + Humanist" },
  { id: "7", heading: "DM Serif Display", body: "DM Sans", label: "Contemporary", category: "Serif + Geometric" },
  { id: "8", heading: "Space Grotesk", body: "Inter", label: "Tech Forward", category: "Geometric + Neo-grotesque" },
  { id: "9", heading: "Fraunces", body: "Figtree", label: "Quirky Premium", category: "Variable + Sans" },
  { id: "10", heading: "Libre Baskerville", body: "Libre Franklin", label: "Newspaper", category: "Slab + Grotesque" },
];

const SAMPLE_TEXTS = {
  heading: "Crafted for Those Who Demand Excellence",
  subheading: "Premium Quality Since 2024",
  body: "Discover our curated collection of handpicked products, each selected for unparalleled quality and timeless design. We believe that everyday objects should be both functional and beautiful.",
  price: "$129.99",
  cta: "Shop the Collection",
};

function loadGoogleFont(families: string[]) {
  const id = "dynamic-google-fonts";
  let link = document.getElementById(id) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  const encoded = families.map(f => f.replace(/ /g, "+") + ":wght@400;500;600;700").join("&family=");
  link.href = `https://fonts.googleapis.com/css2?family=${encoded}&display=swap`;
}

export default function TypographyPage() {
  const [savedPairings, setSavedPairings] = useLocalStorage<SavedPairing[]>("shopify-typography-pairings", []);
  const [selectedPairing, setSelectedPairing] = useState<FontPairing>(FONT_PAIRINGS[0]);
  const [headingSize, setHeadingSize] = useState(36);
  const [bodySize, setBodySize] = useState(16);
  const [lineHeight, setLineHeight] = useState(160);
  const [headingWeight, setHeadingWeight] = useState("700");
  const [copied, setCopied] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const allFonts = FONT_PAIRINGS.flatMap(p => [p.heading, p.body]);
    const unique = [...new Set(allFonts)];
    loadGoogleFont(unique);
    setTimeout(() => setFontsLoaded(true), 800);
  }, []);

  const savePairing = () => {
    const entry: SavedPairing = {
      id: generateId(),
      pairing: selectedPairing,
      headingSize,
      bodySize,
      lineHeight,
      savedAt: new Date().toISOString(),
    };
    setSavedPairings(prev => [entry, ...prev]);
  };

  const deleteSaved = (id: string) => setSavedPairings(prev => prev.filter(p => p.id !== id));

  const loadSaved = (s: SavedPairing) => {
    setSelectedPairing(s.pairing);
    setHeadingSize(s.headingSize);
    setBodySize(s.bodySize);
    setLineHeight(s.lineHeight);
  };

  const exportCSS = () => {
    const css = `/* Typography: ${selectedPairing.label} */
@import url('https://fonts.googleapis.com/css2?family=${selectedPairing.heading.replace(/ /g, "+")}:wght@400;700&family=${selectedPairing.body.replace(/ /g, "+")}:wght@400;500&display=swap');

:root {
  --font-heading: '${selectedPairing.heading}', serif;
  --font-body: '${selectedPairing.body}', sans-serif;
  --font-size-heading: ${headingSize}px;
  --font-size-body: ${bodySize}px;
  --line-height-body: ${lineHeight / 100};
}

h1, h2, h3 {
  font-family: var(--font-heading);
  font-weight: ${headingWeight};
  font-size: var(--font-size-heading);
}

body, p {
  font-family: var(--font-body);
  font-size: var(--font-size-body);
  line-height: var(--line-height-body);
}`;
    navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Typography Pairing Tool"
        description="Find the perfect font combination for your Shopify store. Preview with real sample text."
        icon={Type}
        badge="Design"
        replaces="Fontpair, Typ.io"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Controls */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Font Pairings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-80 overflow-y-auto">
              {FONT_PAIRINGS.map(pair => (
                <button
                  key={pair.id}
                  onClick={() => setSelectedPairing(pair)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedPairing.id === pair.id
                      ? "border-violet-500 bg-violet-500/5"
                      : "border-transparent bg-muted/30 hover:bg-muted/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{pair.label}</span>
                    {selectedPairing.id === pair.id && <Check className="h-3.5 w-3.5 text-violet-500" />}
                  </div>
                  <span className="text-xs text-muted-foreground">{pair.category}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Heading Size: {headingSize}px</Label>
                <input
                  type="range" min="20" max="72" value={headingSize}
                  onChange={e => setHeadingSize(Number(e.target.value))}
                  className="w-full accent-violet-500"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Body Size: {bodySize}px</Label>
                <input
                  type="range" min="12" max="24" value={bodySize}
                  onChange={e => setBodySize(Number(e.target.value))}
                  className="w-full accent-violet-500"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Line Height: {lineHeight}%</Label>
                <input
                  type="range" min="100" max="220" value={lineHeight}
                  onChange={e => setLineHeight(Number(e.target.value))}
                  className="w-full accent-violet-500"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Heading Weight</Label>
                <div className="grid grid-cols-4 gap-1">
                  {["400", "500", "600", "700"].map(w => (
                    <button
                      key={w}
                      onClick={() => setHeadingWeight(w)}
                      className={`py-1.5 rounded-md text-xs transition-all ${
                        headingWeight === w
                          ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={savePairing} variant="outline" className="flex-1" size="sm">
              <Heart className="h-3.5 w-3.5 mr-1.5" />
              Save
            </Button>
            <Button onClick={exportCSS} size="sm" className="flex-1 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0">
              {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
              Copy CSS
            </Button>
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Live Preview</CardTitle>
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-[10px]">{selectedPairing.heading}</Badge>
                  <span className="text-muted-foreground text-xs">+</span>
                  <Badge variant="secondary" className="text-[10px]">{selectedPairing.body}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!fontsLoaded ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Loading fonts...</div>
              ) : (
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border space-y-4">
                  {/* Shopify-like product page preview */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest" style={{ fontFamily: `'${selectedPairing.body}', sans-serif`, fontSize: 11 }}>
                      {SAMPLE_TEXTS.subheading}
                    </p>
                    <h1
                      style={{
                        fontFamily: `'${selectedPairing.heading}', serif`,
                        fontSize: headingSize,
                        fontWeight: headingWeight,
                        lineHeight: 1.15,
                      }}
                    >
                      {SAMPLE_TEXTS.heading}
                    </h1>
                  </div>
                  <p
                    style={{
                      fontFamily: `'${selectedPairing.body}', sans-serif`,
                      fontSize: bodySize,
                      lineHeight: lineHeight / 100,
                      color: "var(--muted-foreground)",
                    }}
                  >
                    {SAMPLE_TEXTS.body}
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <span style={{ fontFamily: `'${selectedPairing.heading}', serif`, fontSize: headingSize * 0.65, fontWeight: "700" }} className="text-violet-600">
                      {SAMPLE_TEXTS.price}
                    </span>
                    <button
                      className="px-6 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium"
                      style={{ fontFamily: `'${selectedPairing.body}', sans-serif`, fontSize: bodySize * 0.875 }}
                    >
                      {SAMPLE_TEXTS.cta}
                    </button>
                  </div>
                  <div className="pt-4 border-t">
                    <h3 style={{ fontFamily: `'${selectedPairing.heading}', serif`, fontSize: headingSize * 0.5, fontWeight: "600", marginBottom: 8 }}>
                      About the Collection
                    </h3>
                    <p style={{ fontFamily: `'${selectedPairing.body}', sans-serif`, fontSize: bodySize * 0.875, lineHeight: lineHeight / 100, color: "var(--muted-foreground)" }}>
                      Every piece tells a story. Inspired by natural textures and timeless silhouettes, our collection bridges the gap between art and everyday living.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Pairings */}
          {savedPairings.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Saved Pairings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {savedPairings.map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.pairing.label}</p>
                      <p className="text-xs text-muted-foreground">{s.pairing.heading} + {s.pairing.body}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">{s.headingSize}px / {s.bodySize}px</div>
                    <Button size="sm" variant="ghost" onClick={() => loadSaved(s)}>Load</Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteSaved(s.id)}>×</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
