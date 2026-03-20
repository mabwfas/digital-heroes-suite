"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ClipboardCheck,
  Check,
  Copy,
  ChevronDown,
  ChevronRight,
  Download,
  StickyNote,
  RotateCcw,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface QAItem {
  id: string;
  label: string;
  checked: boolean;
  notes: string;
}

interface QACategory {
  id: string;
  name: string;
  items: QAItem[];
  expanded: boolean;
}

const DEFAULT_CATEGORIES: QACategory[] = [
  {
    id: "browser",
    name: "Cross-Browser Testing",
    expanded: true,
    items: [
      { id: "b1", label: "Chrome (latest) - layout and functionality verified", checked: false, notes: "" },
      { id: "b2", label: "Firefox (latest) - layout and functionality verified", checked: false, notes: "" },
      { id: "b3", label: "Safari (latest) - layout and functionality verified", checked: false, notes: "" },
      { id: "b4", label: "Edge (latest) - layout and functionality verified", checked: false, notes: "" },
      { id: "b5", label: "Mobile Safari (iOS) - responsive layout verified", checked: false, notes: "" },
      { id: "b6", label: "Samsung Internet - responsive layout verified", checked: false, notes: "" },
      { id: "b7", label: "Chrome Mobile (Android) - responsive layout verified", checked: false, notes: "" },
      { id: "b8", label: "Tablet landscape and portrait modes tested", checked: false, notes: "" },
    ],
  },
  {
    id: "accessibility",
    name: "Accessibility",
    expanded: true,
    items: [
      { id: "a1", label: "All images have descriptive alt text", checked: false, notes: "" },
      { id: "a2", label: "ARIA labels on interactive elements (buttons, links, forms)", checked: false, notes: "" },
      { id: "a3", label: "Full keyboard navigation (Tab, Enter, Escape) works", checked: false, notes: "" },
      { id: "a4", label: "Color contrast meets WCAG AA (4.5:1 minimum)", checked: false, notes: "" },
      { id: "a5", label: "Focus indicators visible on all interactive elements", checked: false, notes: "" },
      { id: "a6", label: "Skip-to-content link present and functional", checked: false, notes: "" },
      { id: "a7", label: "Form labels properly associated with inputs", checked: false, notes: "" },
      { id: "a8", label: "Screen reader testing completed (VoiceOver / NVDA)", checked: false, notes: "" },
    ],
  },
  {
    id: "performance",
    name: "Performance",
    expanded: true,
    items: [
      { id: "p1", label: "Images optimized (WebP format, compressed)", checked: false, notes: "" },
      { id: "p2", label: "Lazy loading implemented for below-fold images", checked: false, notes: "" },
      { id: "p3", label: "Critical CSS inlined for above-fold content", checked: false, notes: "" },
      { id: "p4", label: "JavaScript deferred or loaded async", checked: false, notes: "" },
      { id: "p5", label: "No render-blocking resources in head", checked: false, notes: "" },
      { id: "p6", label: "Google PageSpeed score above 70 (mobile)", checked: false, notes: "" },
      { id: "p7", label: "Google PageSpeed score above 80 (desktop)", checked: false, notes: "" },
      { id: "p8", label: "Fonts preloaded or using system fallbacks", checked: false, notes: "" },
    ],
  },
  {
    id: "functionality",
    name: "Functionality",
    expanded: true,
    items: [
      { id: "f1", label: "Add to cart works on all product pages", checked: false, notes: "" },
      { id: "f2", label: "Cart drawer / cart page updates correctly", checked: false, notes: "" },
      { id: "f3", label: "Checkout flow completes without errors", checked: false, notes: "" },
      { id: "f4", label: "Search returns relevant results", checked: false, notes: "" },
      { id: "f5", label: "Collection filters work correctly", checked: false, notes: "" },
      { id: "f6", label: "Product variant selector updates price and image", checked: false, notes: "" },
      { id: "f7", label: "Quantity selector works with min/max limits", checked: false, notes: "" },
      { id: "f8", label: "Discount codes apply correctly at checkout", checked: false, notes: "" },
    ],
  },
  {
    id: "content",
    name: "Content & SEO",
    expanded: false,
    items: [
      { id: "c1", label: "All pages have unique meta titles", checked: false, notes: "" },
      { id: "c2", label: "All pages have unique meta descriptions", checked: false, notes: "" },
      { id: "c3", label: "Heading hierarchy correct (single H1 per page)", checked: false, notes: "" },
      { id: "c4", label: "No broken links (internal and external)", checked: false, notes: "" },
      { id: "c5", label: "404 page is styled and helpful", checked: false, notes: "" },
      { id: "c6", label: "Structured data / schema markup present", checked: false, notes: "" },
      { id: "c7", label: "Sitemap.xml is accessible and up to date", checked: false, notes: "" },
      { id: "c8", label: "Robots.txt is configured correctly", checked: false, notes: "" },
    ],
  },
  {
    id: "theme",
    name: "Theme & Design",
    expanded: false,
    items: [
      { id: "t1", label: "Favicon and touch icons configured", checked: false, notes: "" },
      { id: "t2", label: "Logo displays correctly at all breakpoints", checked: false, notes: "" },
      { id: "t3", label: "Navigation menu works on mobile (hamburger menu)", checked: false, notes: "" },
      { id: "t4", label: "Footer links all functional", checked: false, notes: "" },
      { id: "t5", label: "Newsletter signup form works", checked: false, notes: "" },
      { id: "t6", label: "Social media links open in new tab", checked: false, notes: "" },
      { id: "t7", label: "Typography consistent across all pages", checked: false, notes: "" },
      { id: "t8", label: "Announcement bar displays and dismisses correctly", checked: false, notes: "" },
    ],
  },
];

export default function ThemeQAChecklistPage() {
  const [categories, setCategories] = useLocalStorage<QACategory[]>(
    "shopify-theme-qa-checklist",
    DEFAULT_CATEGORIES
  );
  const [copied, setCopied] = useState(false);
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
            ? {
                ...c,
                items: c.items.map((item) =>
                  item.id === itemId ? { ...item, checked: !item.checked } : item
                ),
              }
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
            ? {
                ...c,
                items: c.items.map((item) =>
                  item.id === itemId ? { ...item, notes } : item
                ),
              }
            : c
        )
      );
    },
    [setCategories]
  );

  const resetChecklist = useCallback(() => {
    setCategories(DEFAULT_CATEGORIES);
  }, [setCategories]);

  const stats = useMemo(() => {
    const allItems = categories.flatMap((c) => c.items);
    const totalChecked = allItems.filter((i) => i.checked).length;
    return {
      total: allItems.length,
      checked: totalChecked,
      percentage: allItems.length > 0 ? Math.round((totalChecked / allItems.length) * 100) : 0,
    };
  }, [categories]);

  const categoryStats = useCallback(
    (catId: string) => {
      const cat = categories.find((c) => c.id === catId);
      if (!cat) return { total: 0, checked: 0, percentage: 0 };
      const checked = cat.items.filter((i) => i.checked).length;
      return {
        total: cat.items.length,
        checked,
        percentage: cat.items.length > 0 ? Math.round((checked / cat.items.length) * 100) : 0,
      };
    },
    [categories]
  );

  const exportReport = useCallback(() => {
    const lines: string[] = [
      "THEME QA CHECKLIST REPORT",
      `Generated: ${new Date().toLocaleString()}`,
      `Overall Progress: ${stats.checked}/${stats.total} (${stats.percentage}%)`,
      "",
      "---",
      "",
    ];
    categories.forEach((cat) => {
      const cs = categoryStats(cat.id);
      lines.push(`## ${cat.name} (${cs.checked}/${cs.total})`);
      lines.push("");
      cat.items.forEach((item) => {
        lines.push(`  ${item.checked ? "[x]" : "[ ]"} ${item.label}`);
        if (item.notes) lines.push(`      Note: ${item.notes}`);
      });
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `theme-qa-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [categories, stats, categoryStats]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Theme QA Checklist"
        description="Comprehensive quality assurance checklist for Shopify themes with 48 items across 6 categories."
        icon={ClipboardCheck}
        badge="Shopify Dev"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetChecklist}>
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

      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm font-mono text-muted-foreground">
              {stats.checked}/{stats.total} ({stats.percentage}%)
            </span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const cs = categoryStats(cat.id);
          return (
            <Card key={cat.id}>
              <CardHeader
                className="cursor-pointer pb-3"
                onClick={() => toggleExpanded(cat.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {cat.expanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <CardTitle className="text-base">{cat.name}</CardTitle>
                    <Badge
                      variant="secondary"
                      className={
                        cs.percentage === 100
                          ? "bg-emerald-500/10 text-emerald-600"
                          : ""
                      }
                    >
                      {cs.checked}/{cs.total}
                    </Badge>
                  </div>
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cs.percentage === 100
                          ? "bg-emerald-500"
                          : "bg-gradient-to-r from-violet-500 to-pink-500"
                      }`}
                      style={{ width: `${cs.percentage}%` }}
                    />
                  </div>
                </div>
              </CardHeader>
              {cat.expanded && (
                <CardContent className="pt-0 space-y-1">
                  {cat.items.map((item) => (
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
                          <span
                            className={`text-sm ${
                              item.checked
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {item.label}
                          </span>
                          {item.notes && editingNote !== item.id && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              Note: {item.notes}
                            </p>
                          )}
                          {editingNote === item.id && (
                            <div className="mt-2">
                              <Input
                                placeholder="Add a note..."
                                value={item.notes}
                                onChange={(e) =>
                                  updateNote(cat.id, item.id, e.target.value)
                                }
                                onBlur={() => setEditingNote(null)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") setEditingNote(null);
                                }}
                                autoFocus
                                className="text-xs h-7"
                              />
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            setEditingNote(
                              editingNote === item.id ? null : item.id
                            )
                          }
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Add note"
                        >
                          <StickyNote className="h-3.5 w-3.5 text-muted-foreground hover:text-violet-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
