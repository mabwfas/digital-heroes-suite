"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Bug,
  CheckCircle2,
  Circle,
  Copy,
  Download,
  Filter,
  Globe,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type Priority = "critical" | "high" | "medium" | "low";
type Category = "crawlability" | "indexing" | "performance" | "mobile" | "security" | "structured-data" | "content" | "links";
type ItemStatus = "pass" | "fail" | "warning" | "unchecked";

interface CheckItem {
  id: string;
  title: string;
  category: Category;
  priority: Priority;
  status: ItemStatus;
  notes: string;
}

interface Audit {
  id: string;
  siteUrl: string;
  items: CheckItem[];
  createdAt: string;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  critical: { label: "Critical", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-0" },
  high: { label: "High", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-0" },
  medium: { label: "Medium", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0" },
  low: { label: "Low", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0" },
};

const STATUS_CONFIG: Record<ItemStatus, { label: string; className: string }> = {
  pass: { label: "Pass", className: "text-emerald-600 dark:text-emerald-400" },
  fail: { label: "Fail", className: "text-red-600 dark:text-red-400" },
  warning: { label: "Warning", className: "text-amber-600 dark:text-amber-400" },
  unchecked: { label: "Unchecked", className: "text-muted-foreground" },
};

const CATEGORY_LABELS: Record<Category, string> = {
  crawlability: "Crawlability",
  indexing: "Indexing",
  performance: "Performance",
  mobile: "Mobile",
  security: "Security",
  "structured-data": "Structured Data",
  content: "Content",
  links: "Links",
};

const DEFAULT_ITEMS: Omit<CheckItem, "id">[] = [
  { title: "robots.txt file exists and is valid", category: "crawlability", priority: "critical", status: "unchecked", notes: "" },
  { title: "XML sitemap exists and is submitted", category: "crawlability", priority: "critical", status: "unchecked", notes: "" },
  { title: "No critical pages blocked by robots.txt", category: "crawlability", priority: "critical", status: "unchecked", notes: "" },
  { title: "Crawl budget is optimized (no duplicate URLs)", category: "crawlability", priority: "high", status: "unchecked", notes: "" },
  { title: "URL structure is clean and descriptive", category: "crawlability", priority: "medium", status: "unchecked", notes: "" },
  { title: "Canonical tags are correctly implemented", category: "indexing", priority: "critical", status: "unchecked", notes: "" },
  { title: "No duplicate content issues detected", category: "indexing", priority: "critical", status: "unchecked", notes: "" },
  { title: "Meta robots tags allow indexing on key pages", category: "indexing", priority: "critical", status: "unchecked", notes: "" },
  { title: "Hreflang tags are correct (if multilingual)", category: "indexing", priority: "high", status: "unchecked", notes: "" },
  { title: "Pagination uses rel=prev/next or load-more", category: "indexing", priority: "medium", status: "unchecked", notes: "" },
  { title: "301 redirects are properly configured", category: "indexing", priority: "high", status: "unchecked", notes: "" },
  { title: "No redirect chains or loops", category: "indexing", priority: "high", status: "unchecked", notes: "" },
  { title: "Page load time under 3 seconds", category: "performance", priority: "critical", status: "unchecked", notes: "" },
  { title: "Largest Contentful Paint (LCP) under 2.5s", category: "performance", priority: "critical", status: "unchecked", notes: "" },
  { title: "First Input Delay (FID) under 100ms", category: "performance", priority: "high", status: "unchecked", notes: "" },
  { title: "Cumulative Layout Shift (CLS) under 0.1", category: "performance", priority: "high", status: "unchecked", notes: "" },
  { title: "Images are optimized (WebP, lazy loading)", category: "performance", priority: "high", status: "unchecked", notes: "" },
  { title: "CSS and JS are minified and compressed", category: "performance", priority: "medium", status: "unchecked", notes: "" },
  { title: "Browser caching is enabled", category: "performance", priority: "medium", status: "unchecked", notes: "" },
  { title: "CDN is configured for static assets", category: "performance", priority: "medium", status: "unchecked", notes: "" },
  { title: "GZIP or Brotli compression enabled", category: "performance", priority: "medium", status: "unchecked", notes: "" },
  { title: "Mobile-friendly test passes", category: "mobile", priority: "critical", status: "unchecked", notes: "" },
  { title: "Viewport meta tag is correctly set", category: "mobile", priority: "critical", status: "unchecked", notes: "" },
  { title: "Touch targets are appropriately sized", category: "mobile", priority: "medium", status: "unchecked", notes: "" },
  { title: "Font sizes are readable on mobile", category: "mobile", priority: "medium", status: "unchecked", notes: "" },
  { title: "No horizontal scrolling on mobile", category: "mobile", priority: "medium", status: "unchecked", notes: "" },
  { title: "HTTPS is enabled site-wide", category: "security", priority: "critical", status: "unchecked", notes: "" },
  { title: "SSL certificate is valid and not expiring", category: "security", priority: "critical", status: "unchecked", notes: "" },
  { title: "HTTP to HTTPS redirects are working", category: "security", priority: "high", status: "unchecked", notes: "" },
  { title: "No mixed content warnings", category: "security", priority: "high", status: "unchecked", notes: "" },
  { title: "JSON-LD structured data is implemented", category: "structured-data", priority: "high", status: "unchecked", notes: "" },
  { title: "Schema markup validates (no errors)", category: "structured-data", priority: "high", status: "unchecked", notes: "" },
  { title: "Organization/LocalBusiness schema present", category: "structured-data", priority: "medium", status: "unchecked", notes: "" },
  { title: "Breadcrumb schema is implemented", category: "structured-data", priority: "medium", status: "unchecked", notes: "" },
  { title: "FAQ or HowTo schema on relevant pages", category: "structured-data", priority: "low", status: "unchecked", notes: "" },
  { title: "Title tags are unique and under 60 chars", category: "content", priority: "critical", status: "unchecked", notes: "" },
  { title: "Meta descriptions are unique and under 160 chars", category: "content", priority: "high", status: "unchecked", notes: "" },
  { title: "H1 tags are unique per page", category: "content", priority: "high", status: "unchecked", notes: "" },
  { title: "Images have descriptive alt text", category: "content", priority: "high", status: "unchecked", notes: "" },
  { title: "No thin content pages (under 300 words)", category: "content", priority: "medium", status: "unchecked", notes: "" },
  { title: "Open Graph and Twitter Card tags present", category: "content", priority: "medium", status: "unchecked", notes: "" },
  { title: "No broken internal links (404s)", category: "links", priority: "critical", status: "unchecked", notes: "" },
  { title: "No broken external links", category: "links", priority: "high", status: "unchecked", notes: "" },
  { title: "Internal linking structure is logical", category: "links", priority: "high", status: "unchecked", notes: "" },
  { title: "Orphan pages are linked from navigation or content", category: "links", priority: "medium", status: "unchecked", notes: "" },
  { title: "Outbound links use nofollow where appropriate", category: "links", priority: "low", status: "unchecked", notes: "" },
];

export default function TechnicalCrawlerPage() {
  const [audits, setAudits, hydrated] = useLocalStorage<Audit[]>("seo-tech-audits", []);
  const [siteUrl, setSiteUrl] = useState("");
  const [currentAudit, setCurrentAudit] = useState<Audit | null>(null);
  const [filterCategory, setFilterCategory] = useState<"all" | Category>("all");
  const [filterPriority, setFilterPriority] = useState<"all" | Priority>("all");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [copied, setCopied] = useState(false);

  const filteredItems = useMemo(() => {
    if (!currentAudit) return [];
    return currentAudit.items.filter((item) => {
      const catMatch = filterCategory === "all" || item.category === filterCategory;
      const priMatch = filterPriority === "all" || item.priority === filterPriority;
      return catMatch && priMatch;
    });
  }, [currentAudit, filterCategory, filterPriority]);

  const stats = useMemo(() => {
    if (!currentAudit) return { total: 0, pass: 0, fail: 0, warning: 0, unchecked: 0 };
    const items = currentAudit.items;
    return {
      total: items.length,
      pass: items.filter((i) => i.status === "pass").length,
      fail: items.filter((i) => i.status === "fail").length,
      warning: items.filter((i) => i.status === "warning").length,
      unchecked: items.filter((i) => i.status === "unchecked").length,
    };
  }, [currentAudit]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filteredItems> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  function startAudit() {
    if (!siteUrl.trim()) return;
    const audit: Audit = {
      id: generateId(),
      siteUrl: siteUrl.trim(),
      items: DEFAULT_ITEMS.map((item) => ({ ...item, id: generateId() })),
      createdAt: new Date().toISOString(),
    };
    setCurrentAudit(audit);
  }

  function updateItemStatus(itemId: string, status: ItemStatus) {
    if (!currentAudit) return;
    const updated = {
      ...currentAudit,
      items: currentAudit.items.map((i) => (i.id === itemId ? { ...i, status } : i)),
    };
    setCurrentAudit(updated);
  }

  function saveNotes(itemId: string) {
    if (!currentAudit) return;
    const updated = {
      ...currentAudit,
      items: currentAudit.items.map((i) => (i.id === itemId ? { ...i, notes: noteText } : i)),
    };
    setCurrentAudit(updated);
    setEditingNotes(null);
    setNoteText("");
  }

  function saveAudit() {
    if (!currentAudit) return;
    setAudits((prev) => {
      const exists = prev.find((a) => a.id === currentAudit.id);
      if (exists) return prev.map((a) => (a.id === currentAudit.id ? currentAudit : a));
      return [currentAudit, ...prev];
    });
  }

  const handleExport = useCallback(() => {
    if (!currentAudit) return;
    let text = `TECHNICAL SEO AUDIT REPORT\n${"=".repeat(40)}\nSite: ${currentAudit.siteUrl}\nDate: ${new Date(currentAudit.createdAt).toLocaleDateString()}\n`;
    text += `Pass: ${stats.pass} | Fail: ${stats.fail} | Warning: ${stats.warning} | Unchecked: ${stats.unchecked}\n\n`;
    Object.entries(grouped).forEach(([cat, items]) => {
      text += `## ${CATEGORY_LABELS[cat as Category]}\n`;
      items.forEach((item) => {
        const icon = item.status === "pass" ? "[PASS]" : item.status === "fail" ? "[FAIL]" : item.status === "warning" ? "[WARN]" : "[----]";
        text += `  ${icon} ${item.title}`;
        if (item.notes) text += ` (Note: ${item.notes})`;
        text += "\n";
      });
      text += "\n";
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentAudit, grouped, stats]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Technical SEO Checklist" description="Audit your site with 45+ technical SEO checks across 8 categories." icon={Bug} badge="SEO" />

      {!currentAudit ? (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Start New Audit</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Site URL <span className="text-red-500">*</span></Label>
                <Input placeholder="https://example.com" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && startAudit()} />
              </div>
              <Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={startAudit} disabled={!siteUrl.trim()}>
                <Globe className="h-4 w-4" />Start Audit ({DEFAULT_ITEMS.length} checks)
              </Button>
            </CardContent>
          </Card>
          {audits.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Previous Audits</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {audits.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{a.siteUrl}</p>
                        <p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()} &middot; {a.items.filter((i) => i.status === "pass").length}/{a.items.length} passed</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => setCurrentAudit(a)}>Resume</Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAudits((prev) => prev.filter((x) => x.id !== a.id))}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">{currentAudit.siteUrl}</h2>
              <p className="text-xs text-muted-foreground">{stats.pass} pass &middot; {stats.fail} fail &middot; {stats.warning} warning &middot; {stats.unchecked} unchecked</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as typeof filterCategory)}>
                <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as typeof filterPriority)}>
                <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Copy className="h-3.5 w-3.5" />{copied ? "Copied!" : "Export"}
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={saveAudit}>Save Audit</Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrentAudit(null)}>
                <X className="h-3.5 w-3.5" />Close
              </Button>
            </div>
          </div>

          {Object.entries(grouped).map(([cat, items]) => (
            <Card key={cat}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{CATEGORY_LABELS[cat as Category]} ({items.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex gap-1 shrink-0 mt-0.5">
                        {(["pass", "fail", "warning", "unchecked"] as ItemStatus[]).map((s) => (
                          <button key={s} onClick={() => updateItemStatus(item.id, s)} className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${item.status === s ? (s === "pass" ? "bg-emerald-500 border-emerald-500" : s === "fail" ? "bg-red-500 border-red-500" : s === "warning" ? "bg-amber-500 border-amber-500" : "bg-muted border-muted-foreground/30") : "border-muted-foreground/20 hover:border-muted-foreground/40"}`}>
                            {item.status === s && <CheckCircle2 className="h-3 w-3 text-white" />}
                          </button>
                        ))}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${item.status === "pass" ? "line-through text-muted-foreground" : ""}`}>{item.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={PRIORITY_CONFIG[item.priority].className + " text-[10px]"}>{PRIORITY_CONFIG[item.priority].label}</Badge>
                          <Badge variant="secondary" className={"text-[10px] " + STATUS_CONFIG[item.status].className}>{STATUS_CONFIG[item.status].label}</Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { setEditingNotes(item.id); setNoteText(item.notes); }}>
                        <StickyNote className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {item.notes && editingNotes !== item.id && (
                      <p className="text-xs text-muted-foreground pl-[76px]">{item.notes}</p>
                    )}
                    {editingNotes === item.id && (
                      <div className="flex gap-2 pl-[76px]">
                        <Input placeholder="Add notes..." value={noteText} onChange={(e) => setNoteText(e.target.value)} className="flex-1 h-8 text-xs" onKeyDown={(e) => e.key === "Enter" && saveNotes(item.id)} />
                        <Button variant="outline" size="sm" className="h-8" onClick={() => saveNotes(item.id)}>Save</Button>
                        <Button variant="ghost" size="sm" className="h-8" onClick={() => setEditingNotes(null)}><X className="h-3 w-3" /></Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
