"use client";

import { useState, useMemo } from "react";
import { Search, CheckCircle2, AlertCircle, XCircle, Copy, RotateCcw, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Metric {
  label: string;
  score: number;
  status: "good" | "warn" | "bad";
  detail: string;
  suggestion?: string;
}

function StatusIcon({ status }: { status: "good" | "warn" | "bad" }) {
  if (status === "good") return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
  if (status === "warn") return <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />;
  return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
}

function statusBg(status: "good" | "warn" | "bad") {
  if (status === "good") return "bg-emerald-500/10 border-emerald-500/20";
  if (status === "warn") return "bg-amber-500/10 border-amber-500/20";
  return "bg-red-500/10 border-red-500/20";
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "the","a","an","and","or","but","in","on","at","to","for","of","with","by",
    "from","is","are","was","were","be","been","being","have","has","had","do",
    "does","did","will","would","could","should","may","might","shall","can","this",
    "that","these","those","it","its","we","our","your","their","they","he","she","i",
    "you","we","us","my","me","his","her","him","them","what","which","who","how",
  ]);
  const words = text.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (w.length > 3 && !stopWords.has(w)) freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([w]) => w);
}

function analyzeMetrics(title: string, meta: string, h1: string, body: string): Metric[] {
  const metrics: Metric[] = [];

  // Title length
  const tLen = title.trim().length;
  metrics.push({
    label: "Title Length",
    score: tLen >= 50 && tLen <= 60 ? 100 : tLen >= 40 && tLen <= 70 ? 70 : tLen > 0 ? 40 : 0,
    status: tLen >= 50 && tLen <= 60 ? "good" : tLen >= 40 && tLen <= 70 ? "warn" : "bad",
    detail: `${tLen} characters (ideal: 50–60)`,
    suggestion: tLen < 50 ? "Add more descriptive words to reach 50–60 characters." : tLen > 60 ? "Shorten title to under 60 characters to avoid truncation." : undefined,
  });

  // Meta description length
  const mLen = meta.trim().length;
  metrics.push({
    label: "Meta Description Length",
    score: mLen >= 140 && mLen <= 160 ? 100 : mLen >= 120 && mLen <= 175 ? 70 : mLen > 0 ? 40 : 0,
    status: mLen >= 140 && mLen <= 160 ? "good" : mLen >= 120 && mLen <= 175 ? "warn" : "bad",
    detail: `${mLen} characters (ideal: 140–160)`,
    suggestion: mLen < 140 ? "Expand the meta description to 140–160 characters for best CTR." : mLen > 160 ? "Trim meta description to under 160 characters." : undefined,
  });

  // H1 presence
  const h1Words = h1.trim().split(/\s+/).filter(Boolean).length;
  metrics.push({
    label: "H1 Heading",
    score: h1.trim().length > 0 && h1Words <= 10 ? 100 : h1.trim().length > 0 ? 70 : 0,
    status: h1.trim().length > 0 && h1Words <= 10 ? "good" : h1.trim().length > 0 ? "warn" : "bad",
    detail: h1.trim().length > 0 ? `Present · ${h1Words} words` : "Missing H1",
    suggestion: !h1.trim().length ? "Add an H1 that contains your primary keyword." : h1Words > 10 ? "Keep H1 concise — under 10 words is ideal." : undefined,
  });

  // Keyword density (title keyword in body)
  const titleWords = title.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(w => w.length > 4);
  const bodyLower = body.toLowerCase();
  const bodyWords = bodyLower.split(/\s+/).filter(Boolean).length;
  let matchCount = 0;
  for (const w of titleWords) { const re = new RegExp(`\\b${w}\\b`, "g"); matchCount += (bodyLower.match(re) || []).length; }
  const density = bodyWords > 0 ? (matchCount / bodyWords) * 100 : 0;
  metrics.push({
    label: "Keyword Density",
    score: density >= 1 && density <= 3 ? 100 : density > 0 && density <= 5 ? 70 : bodyWords > 0 ? 30 : 0,
    status: density >= 1 && density <= 3 ? "good" : density > 0.5 && density <= 5 ? "warn" : "bad",
    detail: `${density.toFixed(2)}% (ideal: 1–3%)`,
    suggestion: density < 1 ? "Include primary keywords from your title more naturally in body text." : density > 3 ? "Reduce keyword frequency to avoid keyword stuffing." : undefined,
  });

  // Readability (avg sentence length proxy)
  const sentences = body.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentLen = sentences.length > 0 ? bodyWords / sentences.length : 0;
  metrics.push({
    label: "Readability",
    score: avgSentLen > 0 && avgSentLen <= 20 ? 100 : avgSentLen <= 30 ? 70 : bodyWords > 0 ? 40 : 0,
    status: avgSentLen > 0 && avgSentLen <= 20 ? "good" : avgSentLen <= 30 ? "warn" : "bad",
    detail: avgSentLen > 0 ? `Avg. ${avgSentLen.toFixed(0)} words/sentence` : "No body text",
    suggestion: avgSentLen > 20 ? "Break long sentences into shorter ones for better readability." : !body.trim() ? "Add body text content for analysis." : undefined,
  });

  // Content length
  metrics.push({
    label: "Content Length",
    score: bodyWords >= 300 ? 100 : bodyWords >= 150 ? 70 : bodyWords > 0 ? 40 : 0,
    status: bodyWords >= 300 ? "good" : bodyWords >= 150 ? "warn" : "bad",
    detail: `${bodyWords} words (ideal: 300+)`,
    suggestion: bodyWords < 300 ? `Add ${300 - bodyWords} more words for better content depth.` : undefined,
  });

  return metrics;
}

export default function SEOAnalyzerPage() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [meta, setMeta] = useState("");
  const [h1, setH1] = useState("");
  const [body, setBody] = useState("");
  const [analyzed, setAnalyzed] = useState(false);

  const metrics = useMemo(() => analyzeMetrics(title, meta, h1, body), [title, meta, h1, body]);
  const keywords = useMemo(() => extractKeywords(body + " " + title + " " + h1), [body, title, h1]);
  const overallScore = useMemo(() => {
    if (metrics.length === 0) return 0;
    return Math.round(metrics.reduce((sum, m) => sum + m.score, 0) / metrics.length);
  }, [metrics]);

  const scoreColor = overallScore >= 80 ? "text-emerald-500" : overallScore >= 50 ? "text-amber-500" : "text-red-500";
  const scoreGradient = overallScore >= 80 ? "from-emerald-500 to-emerald-400" : overallScore >= 50 ? "from-amber-500 to-amber-400" : "from-red-500 to-red-400";

  function handleAnalyze() {
    setAnalyzed(true);
  }

  function handleReset() {
    setUrl(""); setTitle(""); setMeta(""); setH1(""); setBody(""); setAnalyzed(false);
  }

  const hasSuggestions = metrics.filter(m => m.suggestion).length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO Analyzer"
        description="Audit your page content and get an actionable SEO score."
        icon={Search}
        badge="Free"
        replaces="Semrush ($130/mo)"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4 text-violet-500" />
                Page Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="url">Page URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input id="url" placeholder="https://yourstore.com/products/my-product" value={url} onChange={e => setUrl(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title">Page Title <span className="text-red-500">*</span></Label>
                  <span className={`text-xs font-mono ${title.length > 60 ? "text-red-500" : title.length >= 50 ? "text-emerald-500" : "text-muted-foreground"}`}>
                    {title.length} / 60
                  </span>
                </div>
                <Input id="title" placeholder="Handmade Leather Wallets — Shop Premium Minimalist Wallets" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="meta">Meta Description <span className="text-red-500">*</span></Label>
                  <span className={`text-xs font-mono ${meta.length > 160 ? "text-red-500" : meta.length >= 140 ? "text-emerald-500" : "text-muted-foreground"}`}>
                    {meta.length} / 160
                  </span>
                </div>
                <Textarea id="meta" rows={2} placeholder="Discover our handcrafted leather wallets. Slim, durable, and minimal. Free shipping on orders over $50. Shop now." value={meta} onChange={e => setMeta(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="h1">H1 Heading <span className="text-red-500">*</span></Label>
                  <span className="text-xs text-muted-foreground font-mono">{h1.length} chars</span>
                </div>
                <Input id="h1" placeholder="Premium Handmade Leather Wallets" value={h1} onChange={e => setH1(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="body">Body Text Sample <span className="text-red-500">*</span></Label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {body.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <Textarea id="body" rows={6} placeholder="Paste a portion of your page's main body content here for keyword density and readability analysis…" value={body} onChange={e => setBody(e.target.value)} />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
                  onClick={handleAnalyze}
                  disabled={!title || !meta || !h1 || !body}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Analyze SEO
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Metrics */}
          {analyzed && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Metric Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {metrics.map((m) => (
                  <div key={m.label} className={`rounded-lg border p-3 ${statusBg(m.status)}`}>
                    <div className="flex items-start gap-2">
                      <StatusIcon status={m.status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{m.label}</span>
                          <span className="text-xs font-mono text-muted-foreground shrink-0">{m.score}/100</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.detail}</p>
                        {m.suggestion && (
                          <p className="text-xs mt-1 text-foreground/70 italic">↳ {m.suggestion}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${m.status === "good" ? "from-emerald-500 to-emerald-400" : m.status === "warn" ? "from-amber-500 to-amber-400" : "from-red-500 to-red-400"}`}
                        style={{ width: `${m.score}%`, transition: "width 0.6s ease" }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Score Gauge */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-violet-500" />
                SEO Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyzed ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative h-32 w-32">
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                      <circle
                        cx="50" cy="50" r="40" fill="none"
                        stroke="url(#scoreGrad)" strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${overallScore * 2.513} 251.3`}
                        style={{ transition: "stroke-dasharray 0.8s ease" }}
                      />
                      <defs>
                        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={overallScore >= 80 ? "#10b981" : overallScore >= 50 ? "#f59e0b" : "#ef4444"} />
                          <stop offset="100%" stopColor={overallScore >= 80 ? "#34d399" : overallScore >= 50 ? "#fbbf24" : "#f87171"} />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-3xl font-bold ${scoreColor}`}>{overallScore}</span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <Badge className={`${overallScore >= 80 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : overallScore >= 50 ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"} border text-xs`}>
                      {overallScore >= 80 ? "Excellent" : overallScore >= 60 ? "Good" : overallScore >= 40 ? "Needs Work" : "Poor"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">
                      {metrics.filter(m => m.status === "good").length} of {metrics.length} metrics passing
                    </p>
                  </div>
                  <div className="w-full space-y-1.5">
                    {[
                      { label: "Good", count: metrics.filter(m => m.status === "good").length, color: "bg-emerald-500" },
                      { label: "Warn", count: metrics.filter(m => m.status === "warn").length, color: "bg-amber-500" },
                      { label: "Failed", count: metrics.filter(m => m.status === "bad").length, color: "bg-red-500" },
                    ].map(s => (
                      <div key={s.label} className="flex items-center gap-2 text-xs">
                        <div className={`h-2 w-2 rounded-full ${s.color}`} />
                        <span className="text-muted-foreground flex-1">{s.label}</span>
                        <span className="font-medium">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center">
                    <Search className="h-8 w-8 text-violet-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">Fill in the fields and click Analyze to see your SEO score.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Keywords */}
          {analyzed && keywords.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Extracted Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.map(kw => (
                    <Badge key={kw} variant="secondary" className="text-xs bg-gradient-to-r from-violet-500/10 to-pink-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          {analyzed && hasSuggestions && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Wins</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {metrics.filter(m => m.suggestion).map(m => (
                  <div key={m.label} className="flex gap-2 text-xs">
                    <StatusIcon status={m.status} />
                    <div>
                      <span className="font-medium">{m.label}:</span>{" "}
                      <span className="text-muted-foreground">{m.suggestion}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Google Preview */}
          {analyzed && (title || meta) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Google Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-white dark:bg-zinc-900 p-3 text-xs space-y-0.5 font-sans">
                  <p className="text-muted-foreground truncate">{url || "yourstore.com"}</p>
                  <p className="text-[#1a0dab] dark:text-[#8ab4f8] font-medium text-sm truncate">
                    {title || "Page Title"}
                  </p>
                  <p className="text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed line-clamp-2">
                    {meta || "Meta description will appear here..."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
