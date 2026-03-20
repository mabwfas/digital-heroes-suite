"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  Copy,
  Link2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface PageEntry {
  id: string;
  url: string;
  title: string;
  targetKeyword: string;
}

interface Conflict {
  pageA: PageEntry;
  pageB: PageEntry;
  overlappingKeywords: string[];
  severity: "high" | "medium" | "low";
  suggestion: string;
}

const SEVERITY_CONFIG = {
  high: { label: "High", icon: AlertTriangle, className: "bg-red-500/10 text-red-600 dark:text-red-400 border-0" },
  medium: { label: "Medium", icon: AlertCircle, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0" },
  low: { label: "Low", icon: Info, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0" },
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function findOverlap(a: string, b: string): string[] {
  const tokensA = new Set(tokenize(a));
  const tokensB = tokenize(b);
  return [...new Set(tokensB.filter((t) => tokensA.has(t)))];
}

function getSeverity(overlap: string[], a: PageEntry, b: PageEntry): "high" | "medium" | "low" {
  const kwA = tokenize(a.targetKeyword);
  const kwB = tokenize(b.targetKeyword);
  const exactMatch = kwA.join(" ") === kwB.join(" ");
  if (exactMatch) return "high";
  const keywordOverlap = kwA.filter((t) => kwB.includes(t));
  if (keywordOverlap.length >= 2 || overlap.length >= 4) return "high";
  if (keywordOverlap.length >= 1 || overlap.length >= 2) return "medium";
  return "low";
}

function getSuggestion(severity: "high" | "medium" | "low", a: PageEntry, b: PageEntry): string {
  switch (severity) {
    case "high":
      return `MERGE: Consider consolidating "${a.title}" and "${b.title}" into a single authoritative page, then 301 redirect the weaker page.`;
    case "medium":
      return `DIFFERENTIATE: Update the target keywords to be more distinct. Focus "${a.title}" on unique subtopics and "${b.title}" on different angles.`;
    case "low":
      return `MONITOR: Minor overlap detected. Ensure each page has unique title tags, meta descriptions, and H1s. Add canonical tags if needed.`;
  }
}

function detectConflicts(pages: PageEntry[]): Conflict[] {
  const conflicts: Conflict[] = [];
  for (let i = 0; i < pages.length; i++) {
    for (let j = i + 1; j < pages.length; j++) {
      const a = pages[i];
      const b = pages[j];
      const kwOverlap = findOverlap(a.targetKeyword, b.targetKeyword);
      const titleOverlap = findOverlap(a.title, b.title);
      const allOverlap = [...new Set([...kwOverlap, ...titleOverlap])];
      if (kwOverlap.length > 0 || allOverlap.length >= 3) {
        const severity = getSeverity(allOverlap, a, b);
        conflicts.push({
          pageA: a,
          pageB: b,
          overlappingKeywords: allOverlap,
          severity,
          suggestion: getSuggestion(severity, a, b),
        });
      }
    }
  }
  return conflicts.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });
}

export default function KeywordCannibalPage() {
  const [pages, setPages, hydrated] = useLocalStorage<PageEntry[]>("seo-cannibal-pages", []);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [copied, setCopied] = useState(false);

  const conflicts = useMemo(() => detectConflicts(pages), [pages]);
  const stats = useMemo(() => ({
    total: conflicts.length,
    high: conflicts.filter((c) => c.severity === "high").length,
    medium: conflicts.filter((c) => c.severity === "medium").length,
    low: conflicts.filter((c) => c.severity === "low").length,
  }), [conflicts]);

  function handleAdd() {
    if (!url.trim() || !title.trim() || !targetKeyword.trim()) return;
    setPages((prev) => [
      ...prev,
      { id: generateId(), url: url.trim(), title: title.trim(), targetKeyword: targetKeyword.trim() },
    ]);
    setUrl("");
    setTitle("");
    setTargetKeyword("");
  }

  function handleRemove(id: string) {
    setPages((prev) => prev.filter((p) => p.id !== id));
  }

  function handleExport() {
    let text = "KEYWORD CANNIBALIZATION REPORT\n" + "=".repeat(40) + "\n\n";
    text += `Pages Analyzed: ${pages.length}\nConflicts Found: ${conflicts.length}\n`;
    text += `High: ${stats.high} | Medium: ${stats.medium} | Low: ${stats.low}\n\n`;
    conflicts.forEach((c, i) => {
      text += `--- Conflict ${i + 1} (${c.severity.toUpperCase()}) ---\n`;
      text += `Page A: ${c.pageA.title} (${c.pageA.url})\n`;
      text += `Page B: ${c.pageB.title} (${c.pageB.url})\n`;
      text += `Overlapping: ${c.overlappingKeywords.join(", ")}\n`;
      text += `Suggestion: ${c.suggestion}\n\n`;
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Keyword Cannibalization Finder"
        description="Detect pages competing for the same keywords and get resolution suggestions."
        icon={Search}
        badge="SEO"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pages", value: pages.length, color: "text-violet-600 dark:text-violet-400" },
          { label: "High Severity", value: stats.high, color: "text-red-600 dark:text-red-400" },
          { label: "Medium Severity", value: stats.medium, color: "text-amber-600 dark:text-amber-400" },
          { label: "Low Severity", value: stats.low, color: "text-blue-600 dark:text-blue-400" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-violet-500" />Add Page
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label>URL <span className="text-red-500">*</span></Label>
              <Input placeholder="https://example.com/page" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Page Title <span className="text-red-500">*</span></Label>
              <Input placeholder="Page title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Target Keyword <span className="text-red-500">*</span></Label>
              <Input placeholder="target keyword" value={targetKeyword} onChange={(e) => setTargetKeyword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
            </div>
            <div className="space-y-1.5">
              <Label className="invisible">Add</Label>
              <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleAdd} disabled={!url.trim() || !title.trim() || !targetKeyword.trim()}>
                <Plus className="h-4 w-4" />Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {pages.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pages ({pages.length})</CardTitle>
              {conflicts.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Copy className="h-3.5 w-3.5" />{copied ? "Copied!" : "Export Report"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pages.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border p-2.5 group hover:bg-muted/50 transition-colors">
                  <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{p.url}</span>
                      <Badge variant="secondary" className="text-[10px] shrink-0">{p.targetKeyword}</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemove(p.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {conflicts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Cannibalization Conflicts ({conflicts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {conflicts.map((c, i) => {
              const SevIcon = SEVERITY_CONFIG[c.severity].icon;
              return (
                <div key={i} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <SevIcon className="h-4 w-4" />
                    <Badge className={SEVERITY_CONFIG[c.severity].className}>{SEVERITY_CONFIG[c.severity].label}</Badge>
                    <span className="text-xs text-muted-foreground">Conflict #{i + 1}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Page A</p>
                      <p className="text-sm font-medium truncate">{c.pageA.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.pageA.url}</p>
                      <Badge variant="secondary" className="text-[10px] mt-1">{c.pageA.targetKeyword}</Badge>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Page B</p>
                      <p className="text-sm font-medium truncate">{c.pageB.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.pageB.url}</p>
                      <Badge variant="secondary" className="text-[10px] mt-1">{c.pageB.targetKeyword}</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Overlapping Keywords</p>
                    <div className="flex flex-wrap gap-1">
                      {c.overlappingKeywords.map((k) => (
                        <Badge key={k} variant="secondary" className="text-[10px]">{k}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gradient-to-r from-violet-500/5 to-pink-500/5 p-3">
                    <p className="text-xs font-medium mb-1">Resolution Suggestion</p>
                    <p className="text-sm text-muted-foreground">{c.suggestion}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {pages.length > 0 && conflicts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Search className="h-7 w-7 text-emerald-500" />
            </div>
            <p className="font-medium text-emerald-600">No Cannibalization Detected</p>
            <p className="text-sm text-muted-foreground mt-1">Your pages appear to target distinct keywords. Add more pages for a broader analysis.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
