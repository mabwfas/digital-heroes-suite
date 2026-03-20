"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Zap,
  Check,
  Download,
  StickyNote,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  ArrowUp,
  ArrowRight,
  ArrowDown,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@/lib/hooks";

type Impact = "high" | "medium" | "low";

interface OptItem {
  id: string;
  label: string;
  impact: Impact;
  checked: boolean;
  notes: string;
}

interface OptCategory {
  id: string;
  name: string;
  items: OptItem[];
  expanded: boolean;
}

const IMPACT_COLORS: Record<Impact, string> = {
  high: "bg-red-500/10 text-red-600",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  low: "bg-blue-500/10 text-blue-600",
};

const IMPACT_ICONS: Record<Impact, typeof ArrowUp> = {
  high: ArrowUp,
  medium: ArrowRight,
  low: ArrowDown,
};

const DEFAULT_CATEGORIES: OptCategory[] = [
  {
    id: "images",
    name: "Images",
    expanded: true,
    items: [
      { id: "i1", label: "Convert images to WebP format", impact: "high", checked: false, notes: "" },
      { id: "i2", label: "Implement lazy loading for below-fold images", impact: "high", checked: false, notes: "" },
      { id: "i3", label: "Compress images (TinyPNG, ShortPixel)", impact: "high", checked: false, notes: "" },
      { id: "i4", label: "Use responsive image srcset attributes", impact: "medium", checked: false, notes: "" },
      { id: "i5", label: "Set explicit width and height on images", impact: "medium", checked: false, notes: "" },
      { id: "i6", label: "Use Shopify image_url filter with width parameter", impact: "medium", checked: false, notes: "" },
    ],
  },
  {
    id: "css",
    name: "CSS",
    expanded: true,
    items: [
      { id: "c1", label: "Inline critical CSS for above-fold content", impact: "high", checked: false, notes: "" },
      { id: "c2", label: "Remove unused CSS rules", impact: "high", checked: false, notes: "" },
      { id: "c3", label: "Minify CSS files", impact: "medium", checked: false, notes: "" },
      { id: "c4", label: "Reduce CSS specificity complexity", impact: "low", checked: false, notes: "" },
      { id: "c5", label: "Use CSS containment for complex layouts", impact: "medium", checked: false, notes: "" },
      { id: "c6", label: "Avoid CSS @import (use link tags instead)", impact: "medium", checked: false, notes: "" },
    ],
  },
  {
    id: "js",
    name: "JavaScript",
    expanded: true,
    items: [
      { id: "j1", label: "Defer non-critical JavaScript", impact: "high", checked: false, notes: "" },
      { id: "j2", label: "Use async attribute for independent scripts", impact: "high", checked: false, notes: "" },
      { id: "j3", label: "Implement code splitting for large bundles", impact: "high", checked: false, notes: "" },
      { id: "j4", label: "Minify and compress JavaScript files", impact: "medium", checked: false, notes: "" },
      { id: "j5", label: "Remove console.log and debug statements", impact: "low", checked: false, notes: "" },
      { id: "j6", label: "Tree-shake unused JavaScript modules", impact: "medium", checked: false, notes: "" },
    ],
  },
  {
    id: "fonts",
    name: "Fonts",
    expanded: false,
    items: [
      { id: "f1", label: "Preload critical web fonts", impact: "high", checked: false, notes: "" },
      { id: "f2", label: "Subset fonts to used characters only", impact: "medium", checked: false, notes: "" },
      { id: "f3", label: "Use system font stack as fallback", impact: "medium", checked: false, notes: "" },
      { id: "f4", label: "Use font-display: swap for FOUT prevention", impact: "medium", checked: false, notes: "" },
      { id: "f5", label: "Limit font weights and styles loaded", impact: "low", checked: false, notes: "" },
      { id: "f6", label: "Self-host fonts instead of Google Fonts CDN", impact: "medium", checked: false, notes: "" },
    ],
  },
  {
    id: "server",
    name: "Server & Caching",
    expanded: false,
    items: [
      { id: "s1", label: "Leverage Shopify CDN for all assets", impact: "high", checked: false, notes: "" },
      { id: "s2", label: "Set proper cache-control headers", impact: "high", checked: false, notes: "" },
      { id: "s3", label: "Enable Brotli/gzip compression", impact: "medium", checked: false, notes: "" },
      { id: "s4", label: "Minimize HTTP redirects", impact: "medium", checked: false, notes: "" },
      { id: "s5", label: "Reduce server response time (TTFB)", impact: "high", checked: false, notes: "" },
    ],
  },
  {
    id: "thirdparty",
    name: "Third-Party Scripts",
    expanded: false,
    items: [
      { id: "t1", label: "Use Google Tag Manager for script management", impact: "high", checked: false, notes: "" },
      { id: "t2", label: "Load third-party scripts asynchronously", impact: "high", checked: false, notes: "" },
      { id: "t3", label: "Add DNS prefetch for external domains", impact: "medium", checked: false, notes: "" },
      { id: "t4", label: "Audit and remove unused third-party scripts", impact: "high", checked: false, notes: "" },
      { id: "t5", label: "Implement consent-based script loading", impact: "medium", checked: false, notes: "" },
      { id: "t6", label: "Use resource hints (preconnect, prefetch)", impact: "medium", checked: false, notes: "" },
    ],
  },
];

export default function SpeedOptimizerPage() {
  const [categories, setCategories] = useLocalStorage<OptCategory[]>(
    "shopify-speed-optimizer",
    DEFAULT_CATEGORIES
  );
  const [editingNote, setEditingNote] = useState<string | null>(null);

  const toggleExpanded = useCallback(
    (catId: string) => {
      setCategories((prev) =>
        prev.map((c) => (c.id === catId ? { ...c, expanded: !c.expanded } : c))
      );
    },
    [setCategories]
  );

  const toggleItem = useCallback(
    (catId: string, itemId: string) => {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === catId
            ? { ...c, items: c.items.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item)) }
            : c
        )
      );
    },
    [setCategories]
  );

  const updateNote = useCallback(
    (catId: string, itemId: string, notes: string) => {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === catId
            ? { ...c, items: c.items.map((item) => (item.id === itemId ? { ...item, notes } : item)) }
            : c
        )
      );
    },
    [setCategories]
  );

  const stats = useMemo(() => {
    const all = categories.flatMap((c) => c.items);
    const checked = all.filter((i) => i.checked).length;
    const highDone = all.filter((i) => i.impact === "high" && i.checked).length;
    const highTotal = all.filter((i) => i.impact === "high").length;
    return {
      total: all.length,
      checked,
      pct: all.length > 0 ? Math.round((checked / all.length) * 100) : 0,
      highDone,
      highTotal,
      highPct: highTotal > 0 ? Math.round((highDone / highTotal) * 100) : 0,
    };
  }, [categories]);

  const catStats = useCallback(
    (catId: string) => {
      const cat = categories.find((c) => c.id === catId);
      if (!cat) return { total: 0, done: 0, pct: 0 };
      const done = cat.items.filter((i) => i.checked).length;
      return { total: cat.items.length, done, pct: cat.items.length > 0 ? Math.round((done / cat.items.length) * 100) : 0 };
    },
    [categories]
  );

  const exportReport = useCallback(() => {
    const lines = [
      "SPEED OPTIMIZATION REPORT",
      `Generated: ${new Date().toLocaleString()}`,
      `Overall: ${stats.checked}/${stats.total} (${stats.pct}%)`,
      `High Impact: ${stats.highDone}/${stats.highTotal} (${stats.highPct}%)`,
      "", "---", "",
    ];
    categories.forEach((cat) => {
      const cs = catStats(cat.id);
      lines.push(`## ${cat.name} (${cs.done}/${cs.total})`);
      cat.items.forEach((item) => {
        lines.push(`  ${item.checked ? "[x]" : "[ ]"} [${item.impact.toUpperCase()}] ${item.label}`);
        if (item.notes) lines.push(`      Note: ${item.notes}`);
      });
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `speed-optimization-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [categories, stats, catStats]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Speed Optimization Checklist"
        description="35+ performance optimization items with impact ratings for Shopify stores."
        icon={Zap}
        badge="Shopify Dev"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCategories(DEFAULT_CATEGORIES)}>
              <RotateCcw className="h-4 w-4 mr-1" /> Reset
            </Button>
            <Button
              size="sm"
              onClick={exportReport}
              className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
            >
              <Download className="h-4 w-4 mr-1" /> Export Report
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold font-mono">{stats.pct}%</p>
            <p className="text-xs text-muted-foreground">Overall Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold font-mono">{stats.checked}/{stats.total}</p>
            <p className="text-xs text-muted-foreground">Items Complete</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold font-mono text-red-500">{stats.highPct}%</p>
            <p className="text-xs text-muted-foreground">High Impact Done</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold font-mono">{stats.highDone}/{stats.highTotal}</p>
            <p className="text-xs text-muted-foreground">High Impact Items</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.pct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const cs = catStats(cat.id);
          return (
            <Card key={cat.id}>
              <CardHeader className="cursor-pointer pb-3" onClick={() => toggleExpanded(cat.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {cat.expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <CardTitle className="text-base">{cat.name}</CardTitle>
                    <Badge variant="secondary" className={cs.pct === 100 ? "bg-emerald-500/10 text-emerald-600" : ""}>
                      {cs.done}/{cs.total}
                    </Badge>
                  </div>
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${cs.pct === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-violet-500 to-pink-500"}`}
                      style={{ width: `${cs.pct}%` }}
                    />
                  </div>
                </div>
              </CardHeader>
              {cat.expanded && (
                <CardContent className="pt-0 space-y-1">
                  {cat.items.map((item) => {
                    const ImpactIcon = IMPACT_ICONS[item.impact];
                    return (
                      <div key={item.id} className="group">
                        <div className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-muted/50">
                          <button
                            onClick={() => toggleItem(cat.id, item.id)}
                            className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                              item.checked
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-muted-foreground/30 hover:border-violet-500"
                            }`}
                          >
                            {item.checked && <Check className="h-3 w-3" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm ${item.checked ? "line-through text-muted-foreground" : ""}`}>
                                {item.label}
                              </span>
                              <Badge className={`text-[9px] ${IMPACT_COLORS[item.impact]}`}>
                                <ImpactIcon className="h-2.5 w-2.5 mr-0.5" />
                                {item.impact}
                              </Badge>
                            </div>
                            {item.notes && editingNote !== item.id && (
                              <p className="text-xs text-muted-foreground mt-1 italic">Note: {item.notes}</p>
                            )}
                            {editingNote === item.id && (
                              <div className="mt-2">
                                <Input
                                  placeholder="Add a note..."
                                  value={item.notes}
                                  onChange={(e) => updateNote(cat.id, item.id, e.target.value)}
                                  onBlur={() => setEditingNote(null)}
                                  onKeyDown={(e) => { if (e.key === "Enter") setEditingNote(null); }}
                                  autoFocus
                                  className="text-xs h-7"
                                />
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => setEditingNote(editingNote === item.id ? null : item.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <StickyNote className="h-3.5 w-3.5 text-muted-foreground hover:text-violet-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
