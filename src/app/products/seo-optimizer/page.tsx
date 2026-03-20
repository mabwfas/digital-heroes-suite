"use client";

import { useState } from "react";
import { Search, Sparkles, Copy, Check, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface SeoAnalysis {
  id: string;
  title: string;
  description: string;
  url: string;
  keyword: string;
  scores: {
    titleKeyword: number;
    titleLength: number;
    descKeyword: number;
    descLength: number;
    urlStructure: number;
    overall: number;
  };
  suggestions: string[];
  optimizedTitle: string;
  optimizedDesc: string;
  optimizedUrl: string;
  createdAt: string;
}

function scoreSeo(title: string, description: string, url: string, keyword: string) {
  const kw = keyword.toLowerCase();
  const scores = { titleKeyword: 0, titleLength: 0, descKeyword: 0, descLength: 0, urlStructure: 0, overall: 0 };
  const suggestions: string[] = [];

  // Title keyword
  if (title.toLowerCase().includes(kw)) {
    scores.titleKeyword = title.toLowerCase().startsWith(kw) ? 100 : 80;
  } else {
    scores.titleKeyword = 0;
    suggestions.push("Include your target keyword in the product title, ideally near the beginning.");
  }

  // Title length
  if (title.length >= 30 && title.length <= 60) scores.titleLength = 100;
  else if (title.length >= 20 && title.length <= 70) scores.titleLength = 70;
  else { scores.titleLength = 30; suggestions.push("Title should be 30-60 characters for optimal display in search results."); }

  // Description keyword
  if (description.toLowerCase().includes(kw)) {
    const firstIdx = description.toLowerCase().indexOf(kw);
    scores.descKeyword = firstIdx < 80 ? 100 : 70;
  } else {
    scores.descKeyword = 0;
    suggestions.push("Include your target keyword in the product description, preferably in the first sentence.");
  }

  // Description length
  if (description.length >= 120 && description.length <= 160) scores.descLength = 100;
  else if (description.length >= 80 && description.length <= 200) scores.descLength = 60;
  else { scores.descLength = 20; suggestions.push("Meta description should be 120-160 characters."); }

  // URL structure
  const slug = url.split("/").pop() || url;
  if (slug.toLowerCase().includes(kw.replace(/\s+/g, "-"))) scores.urlStructure = 100;
  else if (slug.length < 60 && /^[a-z0-9-]+$/.test(slug)) { scores.urlStructure = 60; suggestions.push("Include the keyword in the URL slug."); }
  else { scores.urlStructure = 20; suggestions.push("Use a clean, keyword-rich URL with hyphens (no special chars or IDs)."); }

  scores.overall = Math.round((scores.titleKeyword + scores.titleLength + scores.descKeyword + scores.descLength + scores.urlStructure) / 5);
  return { scores, suggestions };
}

function generateOptimized(title: string, description: string, url: string, keyword: string) {
  const kw = keyword.trim();
  let optTitle = title;
  if (!title.toLowerCase().includes(kw.toLowerCase())) {
    optTitle = `${kw} - ${title}`;
  }
  if (optTitle.length > 60) optTitle = optTitle.slice(0, 57) + "...";

  let optDesc = description;
  if (!description.toLowerCase().includes(kw.toLowerCase())) {
    optDesc = `${kw}. ${description}`;
  }
  if (optDesc.length > 160) optDesc = optDesc.slice(0, 157) + "...";

  const slug = kw.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const optUrl = url.includes("/") ? url.replace(/[^/]+$/, slug) : `/${slug}`;

  return { optimizedTitle: optTitle, optimizedDesc: optDesc, optimizedUrl: optUrl };
}

export default function SeoOptimizerPage() {
  const [analyses, setAnalyses] = useLocalStorage<SeoAnalysis[]>("products-seo", []);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  function analyze() {
    if (!title.trim() || !keyword.trim()) return;
    const { scores, suggestions } = scoreSeo(title, description, url, keyword);
    const { optimizedTitle, optimizedDesc, optimizedUrl } = generateOptimized(title, description, url, keyword);
    const analysis: SeoAnalysis = {
      id: generateId(),
      title, description, url, keyword, scores, suggestions,
      optimizedTitle, optimizedDesc, optimizedUrl,
      createdAt: new Date().toISOString(),
    };
    setAnalyses((prev) => [analysis, ...prev]);
  }

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function getScoreColor(score: number) {
    if (score >= 80) return "text-emerald-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  }

  function getScoreBg(score: number) {
    if (score >= 80) return "bg-emerald-500/10";
    if (score >= 50) return "bg-amber-500/10";
    return "bg-red-500/10";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product SEO Optimizer"
        description="Score your product pages on keyword placement, meta length, URL structure, and generate optimized versions."
        icon={Search}
        badge="Products"
        replaces="Yoast / Manual SEO checks"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Analyze Product SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Product Title *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Premium Organic Cotton T-Shirt" />
              <p className="text-xs text-muted-foreground">{title.length} chars (30-60 ideal)</p>
            </div>
            <div className="space-y-1.5">
              <Label>Target Keyword *</Label>
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="organic cotton t-shirt" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Meta Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Shop our premium organic cotton t-shirt..." />
            <p className="text-xs text-muted-foreground">{description.length} chars (120-160 ideal)</p>
          </div>
          <div className="space-y-1.5">
            <Label>Product URL / Slug</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/products/organic-cotton-tshirt" />
          </div>
          <Button onClick={analyze} disabled={!title.trim() || !keyword.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
            <Sparkles className="h-4 w-4 mr-2" />Analyze & Optimize
          </Button>
        </CardContent>
      </Card>

      {analyses.map((a) => (
        <Card key={a.id} className="border-border/50">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">{a.title}</span>
                <p className="text-xs text-muted-foreground">Keyword: {a.keyword}</p>
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(a.scores.overall)}`}>
                {a.scores.overall}
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[
                { label: "Title KW", score: a.scores.titleKeyword },
                { label: "Title Len", score: a.scores.titleLength },
                { label: "Desc KW", score: a.scores.descKeyword },
                { label: "Desc Len", score: a.scores.descLength },
                { label: "URL", score: a.scores.urlStructure },
              ].map((s) => (
                <div key={s.label} className={`p-2 rounded-lg ${getScoreBg(s.score)} text-center`}>
                  <p className={`text-lg font-bold ${getScoreColor(s.score)}`}>{s.score}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {a.suggestions.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Suggestions:</p>
                {a.suggestions.map((s, i) => (
                  <p key={i} className="text-xs text-muted-foreground pl-3">- {s}</p>
                ))}
              </div>
            )}

            <div className="space-y-2 p-3 rounded-lg bg-muted/30 border">
              <p className="text-xs font-medium text-violet-600 dark:text-violet-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Optimized Versions
              </p>
              {[
                { label: "Title", value: a.optimizedTitle, key: `title-${a.id}` },
                { label: "Description", value: a.optimizedDesc, key: `desc-${a.id}` },
                { label: "URL", value: a.optimizedUrl, key: `url-${a.id}` },
              ].map((item) => (
                <div key={item.key} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16 shrink-0">{item.label}:</span>
                  <span className="text-xs flex-1 truncate">{item.value}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyText(item.value, item.key)}>
                    {copied === item.key ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
