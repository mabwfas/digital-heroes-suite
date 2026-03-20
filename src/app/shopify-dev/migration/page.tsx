"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ArrowRightLeft,
  Check,
  Download,
  StickyNote,
  ChevronDown,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";

interface MigrationItem {
  id: string;
  label: string;
  migrated: boolean;
  notes: string;
}

interface MigrationCategory {
  id: string;
  name: string;
  items: MigrationItem[];
  expanded: boolean;
}

interface MigrationState {
  sourceTheme: string;
  targetTheme: string;
  categories: MigrationCategory[];
}

const DEFAULT_STATE: MigrationState = {
  sourceTheme: "",
  targetTheme: "",
  categories: [
    {
      id: "pages",
      name: "Pages",
      expanded: true,
      items: [
        { id: "p1", label: "Home page content and layout migrated", migrated: false, notes: "" },
        { id: "p2", label: "About page migrated", migrated: false, notes: "" },
        { id: "p3", label: "Contact page migrated with form", migrated: false, notes: "" },
        { id: "p4", label: "FAQ page migrated", migrated: false, notes: "" },
        { id: "p5", label: "Policy pages (Privacy, Terms, Refund, Shipping) migrated", migrated: false, notes: "" },
        { id: "p6", label: "Custom landing pages migrated", migrated: false, notes: "" },
      ],
    },
    {
      id: "blog",
      name: "Blog Posts",
      expanded: true,
      items: [
        { id: "bl1", label: "All blog posts transferred with content", migrated: false, notes: "" },
        { id: "bl2", label: "Blog post images re-uploaded or linked", migrated: false, notes: "" },
        { id: "bl3", label: "Blog categories and tags preserved", migrated: false, notes: "" },
        { id: "bl4", label: "Blog post SEO meta titles and descriptions", migrated: false, notes: "" },
        { id: "bl5", label: "Blog comments migrated (if applicable)", migrated: false, notes: "" },
      ],
    },
    {
      id: "nav",
      name: "Navigation",
      expanded: true,
      items: [
        { id: "n1", label: "Main menu structure recreated", migrated: false, notes: "" },
        { id: "n2", label: "Footer menu links migrated", migrated: false, notes: "" },
        { id: "n3", label: "Mega menu configuration (if applicable)", migrated: false, notes: "" },
        { id: "n4", label: "Mobile menu verified", migrated: false, notes: "" },
      ],
    },
    {
      id: "metafields",
      name: "Metafields",
      expanded: false,
      items: [
        { id: "m1", label: "Product metafields exported and imported", migrated: false, notes: "" },
        { id: "m2", label: "Collection metafields migrated", migrated: false, notes: "" },
        { id: "m3", label: "Shop metafields migrated", migrated: false, notes: "" },
        { id: "m4", label: "Customer metafields migrated", migrated: false, notes: "" },
        { id: "m5", label: "Metafield definitions recreated in new theme", migrated: false, notes: "" },
      ],
    },
    {
      id: "redirects",
      name: "URL Redirects",
      expanded: false,
      items: [
        { id: "r1", label: "301 redirects exported from old theme/store", migrated: false, notes: "" },
        { id: "r2", label: "Redirects imported to new theme/store", migrated: false, notes: "" },
        { id: "r3", label: "Broken links tested and fixed", migrated: false, notes: "" },
        { id: "r4", label: "Canonical URLs verified", migrated: false, notes: "" },
      ],
    },
    {
      id: "custom",
      name: "Custom Code",
      expanded: false,
      items: [
        { id: "cc1", label: "Custom CSS ported to new theme", migrated: false, notes: "" },
        { id: "cc2", label: "Custom JavaScript migrated and tested", migrated: false, notes: "" },
        { id: "cc3", label: "Liquid customizations adapted to new theme structure", migrated: false, notes: "" },
        { id: "cc4", label: "Third-party script integrations verified", migrated: false, notes: "" },
      ],
    },
    {
      id: "assets",
      name: "Assets & Media",
      expanded: false,
      items: [
        { id: "a1", label: "Theme images re-uploaded or referenced", migrated: false, notes: "" },
        { id: "a2", label: "Custom fonts uploaded to new theme", migrated: false, notes: "" },
        { id: "a3", label: "Favicon and app icons migrated", migrated: false, notes: "" },
        { id: "a4", label: "Video embeds verified", migrated: false, notes: "" },
      ],
    },
    {
      id: "i18n",
      name: "Translations",
      expanded: false,
      items: [
        { id: "t1", label: "Locale files exported from source theme", migrated: false, notes: "" },
        { id: "t2", label: "Translation keys mapped to new theme", migrated: false, notes: "" },
        { id: "t3", label: "Custom translation strings added", migrated: false, notes: "" },
        { id: "t4", label: "Multi-language storefront verified", migrated: false, notes: "" },
      ],
    },
  ],
};

export default function MigrationAssistantPage() {
  const [state, setState] = useLocalStorage<MigrationState>(
    "shopify-migration-assistant",
    DEFAULT_STATE
  );
  const [editingNote, setEditingNote] = useState<string | null>(null);

  const toggleExpanded = useCallback(
    (catId: string) => {
      setState((prev) => ({
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === catId ? { ...c, expanded: !c.expanded } : c
        ),
      }));
    },
    [setState]
  );

  const toggleItem = useCallback(
    (catId: string, itemId: string) => {
      setState((prev) => ({
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === catId
            ? {
                ...c,
                items: c.items.map((item) =>
                  item.id === itemId ? { ...item, migrated: !item.migrated } : item
                ),
              }
            : c
        ),
      }));
    },
    [setState]
  );

  const updateNote = useCallback(
    (catId: string, itemId: string, notes: string) => {
      setState((prev) => ({
        ...prev,
        categories: prev.categories.map((c) =>
          c.id === catId
            ? {
                ...c,
                items: c.items.map((item) =>
                  item.id === itemId ? { ...item, notes } : item
                ),
              }
            : c
        ),
      }));
    },
    [setState]
  );

  const stats = useMemo(() => {
    const allItems = state.categories.flatMap((c) => c.items);
    const done = allItems.filter((i) => i.migrated).length;
    return { total: allItems.length, done, pct: allItems.length > 0 ? Math.round((done / allItems.length) * 100) : 0 };
  }, [state.categories]);

  const catStats = useCallback(
    (catId: string) => {
      const cat = state.categories.find((c) => c.id === catId);
      if (!cat) return { total: 0, done: 0, pct: 0 };
      const done = cat.items.filter((i) => i.migrated).length;
      return { total: cat.items.length, done, pct: cat.items.length > 0 ? Math.round((done / cat.items.length) * 100) : 0 };
    },
    [state.categories]
  );

  const exportReport = useCallback(() => {
    const lines = [
      "THEME MIGRATION REPORT",
      `Generated: ${new Date().toLocaleString()}`,
      `Source Theme: ${state.sourceTheme || "(not specified)"}`,
      `Target Theme: ${state.targetTheme || "(not specified)"}`,
      `Overall: ${stats.done}/${stats.total} (${stats.pct}%)`,
      "",
      "---",
      "",
    ];
    state.categories.forEach((cat) => {
      const cs = catStats(cat.id);
      lines.push(`## ${cat.name} (${cs.done}/${cs.total})`);
      cat.items.forEach((item) => {
        lines.push(`  ${item.migrated ? "[x]" : "[ ]"} ${item.label}`);
        if (item.notes) lines.push(`      Note: ${item.notes}`);
      });
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `migration-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state, stats, catStats]);

  const resetMigration = useCallback(() => {
    setState(DEFAULT_STATE);
  }, [setState]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Theme Migration Assistant"
        description="Track and manage Shopify theme migrations with detailed checklists and progress tracking."
        icon={ArrowRightLeft}
        badge="Shopify Dev"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetMigration}>
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

      {/* Theme Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Source Theme</Label>
              <Input
                value={state.sourceTheme}
                onChange={(e) => setState((prev) => ({ ...prev, sourceTheme: e.target.value }))}
                placeholder="e.g., Dawn 2.0, Debut, Brooklyn"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Target Theme</Label>
              <Input
                value={state.targetTheme}
                onChange={(e) => setState((prev) => ({ ...prev, targetTheme: e.target.value }))}
                placeholder="e.g., Dawn 11.0, Custom Theme"
                className="text-sm"
              />
            </div>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Migration Progress</span>
            <span className="text-sm font-mono text-muted-foreground">
              {stats.done}/{stats.total} ({stats.pct}%)
            </span>
          </div>
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
        {state.categories.map((cat) => {
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
                  {cat.items.map((item) => (
                    <div key={item.id} className="group">
                      <div className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-muted/50">
                        <button
                          onClick={() => toggleItem(cat.id, item.id)}
                          className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                            item.migrated
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-muted-foreground/30 hover:border-violet-500"
                          }`}
                        >
                          {item.migrated && <Check className="h-3 w-3" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm ${item.migrated ? "line-through text-muted-foreground" : ""}`}>
                            {item.label}
                          </span>
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
