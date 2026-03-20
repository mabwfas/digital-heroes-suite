"use client";

import { useState, useCallback } from "react";
import {
  FileText,
  Copy,
  Save,
  Trash2,
  Plus,
  X,
  BookOpen,
  RefreshCw,
  Search,
  Target,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type SearchIntent = "informational" | "commercial" | "transactional" | "navigational";

interface Brief {
  id: string;
  keyword: string;
  intent: SearchIntent;
  wordCountTarget: number;
  competitorUrls: string[];
  suggestedTitle: string;
  headings: string[];
  keyTopics: string[];
  relatedKeywords: string[];
  recommendedWordCount: { min: number; max: number };
  internalLinkingSuggestions: string[];
  createdAt: string;
}

const INTENT_LABELS: Record<SearchIntent, { label: string; color: string }> = {
  informational: { label: "Informational", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0" },
  commercial: { label: "Commercial", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0" },
  transactional: { label: "Transactional", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0" },
  navigational: { label: "Navigational", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-0" },
};

const HEADING_TEMPLATES: Record<SearchIntent, string[]> = {
  informational: [
    "What Is [KEYWORD]?",
    "How [KEYWORD] Works: A Complete Overview",
    "Key Benefits of [KEYWORD]",
    "Common Misconceptions About [KEYWORD]",
    "Step-by-Step Guide to [KEYWORD]",
    "[KEYWORD] Best Practices for Beginners",
    "Advanced Tips for [KEYWORD]",
    "Frequently Asked Questions About [KEYWORD]",
    "The Future of [KEYWORD]",
    "Expert Insights on [KEYWORD]",
  ],
  commercial: [
    "Top [KEYWORD] Solutions Compared",
    "What to Look for in [KEYWORD]",
    "[KEYWORD] Features That Matter Most",
    "Pricing and Value: [KEYWORD] Options",
    "Pros and Cons of Leading [KEYWORD] Tools",
    "Who Should Use [KEYWORD]?",
    "[KEYWORD] for Small Business vs Enterprise",
    "Real User Reviews of [KEYWORD]",
    "How to Choose the Right [KEYWORD]",
    "[KEYWORD] ROI: What to Expect",
  ],
  transactional: [
    "How to Get Started with [KEYWORD]",
    "[KEYWORD] Pricing Plans Explained",
    "Setting Up Your [KEYWORD] Account",
    "Exclusive [KEYWORD] Deals and Offers",
    "Step-by-Step [KEYWORD] Purchase Guide",
    "What You Get with [KEYWORD]",
    "[KEYWORD] Onboarding Checklist",
    "Money-Back Guarantee and [KEYWORD] Policies",
    "Common Setup Issues with [KEYWORD]",
    "Maximizing Your [KEYWORD] Investment",
  ],
  navigational: [
    "Official [KEYWORD] Resources",
    "How to Access [KEYWORD]",
    "[KEYWORD] Login and Dashboard Guide",
    "[KEYWORD] Support and Help Center",
    "[KEYWORD] Documentation Overview",
    "Getting the Most from [KEYWORD]",
    "[KEYWORD] Updates and Changelog",
    "[KEYWORD] Community and Forums",
  ],
};

const TOPIC_TEMPLATES: Record<SearchIntent, string[]> = {
  informational: [
    "Definition and core concepts",
    "Historical background and evolution",
    "Key statistics and data points",
    "Comparison with alternatives",
    "Use cases and real-world examples",
    "Common challenges and solutions",
    "Tools and resources needed",
    "Industry expert opinions",
  ],
  commercial: [
    "Feature comparison matrix",
    "Pricing tiers and value analysis",
    "Integration capabilities",
    "Customer support quality",
    "Scalability considerations",
    "Security and compliance",
    "Migration and onboarding",
    "Competitive advantages",
  ],
  transactional: [
    "Clear pricing breakdown",
    "Step-by-step purchase process",
    "Available discounts and promotions",
    "Payment methods accepted",
    "Delivery and setup timeline",
    "Return and refund policy",
    "Customer success stories",
    "FAQ for new buyers",
  ],
  navigational: [
    "Official website URLs",
    "Account login instructions",
    "Navigation shortcuts",
    "Key feature locations",
    "Support contact information",
    "Mobile app availability",
    "Social media profiles",
    "Community resources",
  ],
};

function generateRelatedKeywords(keyword: string): string[] {
  const words = keyword.toLowerCase().split(/\s+/);
  const prefixes = ["best", "top", "how to", "what is", "guide to", "free", "affordable"];
  const suffixes = ["tools", "software", "tips", "examples", "strategies", "template", "checklist", "guide"];
  const modifiers = ["for beginners", "for small business", "in 2024", "alternatives", "vs"];
  const related: string[] = [];
  prefixes.forEach((p) => related.push(`${p} ${keyword.toLowerCase()}`));
  suffixes.forEach((s) => related.push(`${keyword.toLowerCase()} ${s}`));
  modifiers.forEach((m) => related.push(`${keyword.toLowerCase()} ${m}`));
  if (words.length > 1) {
    related.push(words.join(" ") + " review");
    related.push(words.join(" ") + " pricing");
  }
  return related.sort(() => Math.random() - 0.5).slice(0, 12);
}

function generateBrief(
  keyword: string,
  intent: SearchIntent,
  wordCountTarget: number,
  competitorUrls: string[]
): Omit<Brief, "id" | "createdAt"> {
  const allHeadings = [...HEADING_TEMPLATES[intent]].sort(() => Math.random() - 0.5);
  const numHeadings = Math.min(Math.max(5, Math.floor(wordCountTarget / 250)), 8);
  const headings = allHeadings.slice(0, numHeadings).map((h) => h.replace(/\[KEYWORD\]/g, keyword));

  const allTopics = [...TOPIC_TEMPLATES[intent]].sort(() => Math.random() - 0.5);
  const keyTopics = allTopics.slice(0, 6);

  const titleTemplates = [
    `The Ultimate Guide to ${keyword}: Everything You Need to Know`,
    `${keyword}: A Comprehensive ${intent === "commercial" ? "Comparison" : "Guide"} for 2024`,
    `How to Master ${keyword} — Expert Strategies and Tips`,
    `${keyword} Explained: ${numHeadings} Key Insights You Cannot Miss`,
  ];
  const suggestedTitle = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];

  const relatedKeywords = generateRelatedKeywords(keyword);

  const min = Math.max(300, wordCountTarget - 300);
  const max = wordCountTarget + 500;

  const linkSuggestions = [
    `Link to your "${keyword} beginner guide" from the introduction`,
    `Cross-link to related service/product pages`,
    `Add contextual links to case studies or testimonials`,
    `Link to your pricing page from commercial sections`,
    `Reference your FAQ page for common questions`,
    `Link to related blog posts about ${keyword.split(" ")[0]} topics`,
  ].slice(0, 4);

  return {
    keyword,
    intent,
    wordCountTarget,
    competitorUrls,
    suggestedTitle,
    headings,
    keyTopics,
    relatedKeywords,
    recommendedWordCount: { min, max },
    internalLinkingSuggestions: linkSuggestions,
  };
}

export default function ContentBriefPage() {
  const [keyword, setKeyword] = useState("");
  const [intent, setIntent] = useState<SearchIntent>("informational");
  const [wordCountTarget, setWordCountTarget] = useState(1500);
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([]);
  const [currentBrief, setCurrentBrief] = useState<Brief | null>(null);
  const [savedBriefs, setSavedBriefs, hydrated] = useLocalStorage<Brief[]>("seo-content-briefs", []);
  const [copied, setCopied] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  const handleAddCompetitor = useCallback(() => {
    const url = competitorUrl.trim();
    if (!url || competitorUrls.includes(url)) return;
    setCompetitorUrls((prev) => [...prev, url]);
    setCompetitorUrl("");
  }, [competitorUrl, competitorUrls]);

  const handleRemoveCompetitor = useCallback((url: string) => {
    setCompetitorUrls((prev) => prev.filter((u) => u !== url));
  }, []);

  const handleGenerate = useCallback(() => {
    if (!keyword.trim()) return;
    const raw = generateBrief(keyword.trim(), intent, wordCountTarget, competitorUrls);
    setCurrentBrief({ ...raw, id: generateId(), createdAt: new Date().toISOString() });
    setCopied(false);
  }, [keyword, intent, wordCountTarget, competitorUrls]);

  const briefToText = useCallback((b: Brief) => {
    let t = `SEO CONTENT BRIEF\n${"=".repeat(40)}\n\n`;
    t += `Target Keyword: ${b.keyword}\nSearch Intent: ${b.intent}\n`;
    t += `Recommended Word Count: ${b.recommendedWordCount.min}–${b.recommendedWordCount.max}\n\n`;
    t += `Suggested Title:\n${b.suggestedTitle}\n\n`;
    t += `H2 Headings:\n${b.headings.map((h, i) => `  ${i + 1}. ${h}`).join("\n")}\n\n`;
    t += `Key Topics to Cover:\n${b.keyTopics.map((k) => `  - ${k}`).join("\n")}\n\n`;
    t += `Related Keywords:\n${b.relatedKeywords.map((k) => `  - ${k}`).join("\n")}\n\n`;
    t += `Internal Linking Suggestions:\n${b.internalLinkingSuggestions.map((s) => `  - ${s}`).join("\n")}\n`;
    if (b.competitorUrls.length > 0) {
      t += `\nCompetitor URLs:\n${b.competitorUrls.map((u) => `  - ${u}`).join("\n")}\n`;
    }
    return t;
  }, []);

  const handleCopy = useCallback(() => {
    if (!currentBrief) return;
    navigator.clipboard.writeText(briefToText(currentBrief));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentBrief, briefToText]);

  const handleSave = useCallback(() => {
    if (!currentBrief) return;
    setSavedBriefs((prev) => [currentBrief, ...prev]);
  }, [currentBrief, setSavedBriefs]);

  const handleDelete = useCallback(
    (id: string) => setSavedBriefs((prev) => prev.filter((b) => b.id !== id)),
    [setSavedBriefs]
  );

  const handleLoad = useCallback((b: Brief) => {
    setCurrentBrief(b);
    setKeyword(b.keyword);
    setIntent(b.intent);
    setWordCountTarget(b.wordCountTarget);
    setCompetitorUrls(b.competitorUrls);
    setShowLibrary(false);
  }, []);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO Content Brief Generator"
        description="Generate comprehensive content briefs with headings, topics, and keyword suggestions."
        icon={FileText}
        badge="SEO"
        actions={
          <Button variant="outline" size="sm" onClick={() => setShowLibrary(!showLibrary)}>
            <BookOpen className="h-4 w-4" />
            Library ({savedBriefs.length})
          </Button>
        }
      />

      {showLibrary ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Saved Briefs</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowLibrary(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {savedBriefs.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No saved briefs yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedBriefs.map((b) => (
                  <div key={b.id} className="rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{b.keyword}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={INTENT_LABELS[b.intent].color}>{INTENT_LABELS[b.intent].label}</Badge>
                          <span className="text-xs text-muted-foreground">{new Date(b.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleLoad(b)}>
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(b.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-violet-500" />
                  Brief Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Target Keyword <span className="text-red-500">*</span></Label>
                  <Input placeholder="e.g., content marketing strategy" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Search Intent</Label>
                  <Select value={intent} onValueChange={(v) => { if (v) setIntent(v as SearchIntent); }}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="informational">Informational</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                      <SelectItem value="navigational">Navigational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Word Count Target:{" "}
                    <span className="font-mono text-violet-600">{wordCountTarget.toLocaleString()}</span>
                  </Label>
                  <input type="range" min={500} max={5000} step={100} value={wordCountTarget} onChange={(e) => setWordCountTarget(Number(e.target.value))} className="w-full accent-violet-600" />
                  <div className="flex justify-between text-[10px] text-muted-foreground"><span>500</span><span>5,000</span></div>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <Label>Competitor URLs</Label>
                  <div className="flex gap-1.5">
                    <Input placeholder="https://competitor.com/page" value={competitorUrl} onChange={(e) => setCompetitorUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddCompetitor()} className="flex-1" />
                    <Button variant="outline" size="icon" onClick={handleAddCompetitor}><Plus className="h-4 w-4" /></Button>
                  </div>
                  {competitorUrls.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {competitorUrls.map((url) => (
                        <div key={url} className="flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1">
                          <span className="truncate flex-1">{url}</span>
                          <button onClick={() => handleRemoveCompetitor(url)} className="shrink-0 hover:text-red-500"><X className="h-3 w-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleGenerate} disabled={!keyword.trim()}>
                  <RefreshCw className="h-4 w-4" />Generate Brief
                </Button>
              </CardContent>
            </Card>
            {currentBrief && (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" size="sm" onClick={handleCopy}>
                  <Copy className="h-3.5 w-3.5" />{copied ? "Copied!" : "Copy"}
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" size="sm" onClick={handleSave}>
                  <Save className="h-3.5 w-3.5" />Save
                </Button>
              </div>
            )}
          </div>
          <div className="lg:col-span-2">
            {currentBrief ? (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Generated Brief</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Suggested Title</h3>
                    <div className="rounded-lg border p-3 bg-gradient-to-r from-violet-500/5 to-pink-500/5 text-sm font-medium">{currentBrief.suggestedTitle}</div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold mb-2">H2 Headings ({currentBrief.headings.length})</h3>
                    <div className="space-y-1.5">
                      {currentBrief.headings.map((h, i) => (
                        <div key={i} className="rounded-lg border p-2.5 text-sm">
                          <span className="text-violet-500 font-mono mr-2 text-xs">H2</span>{h}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Key Topics to Cover</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {currentBrief.keyTopics.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="text-violet-400 shrink-0">&bull;</span>{t}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Related Keywords</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {currentBrief.relatedKeywords.map((k) => (
                        <Badge key={k} variant="secondary" className="text-xs">{k}</Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Word Count Recommendation</h3>
                    <p className="text-sm text-muted-foreground">{currentBrief.recommendedWordCount.min.toLocaleString()} &ndash; {currentBrief.recommendedWordCount.max.toLocaleString()} words</p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Internal Linking Suggestions</h3>
                    <div className="space-y-1.5">
                      {currentBrief.internalLinkingSuggestions.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Search className="h-3.5 w-3.5 mt-0.5 shrink-0 text-violet-400" />{s}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap pt-2">
                    <Badge className={INTENT_LABELS[currentBrief.intent].color}>{INTENT_LABELS[currentBrief.intent].label}</Badge>
                    <Badge variant="secondary" className="text-xs">{currentBrief.headings.length} headings</Badge>
                    <Badge variant="secondary" className="text-xs">{currentBrief.relatedKeywords.length} keywords</Badge>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-16">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center">
                      <FileText className="h-7 w-7 text-violet-400" />
                    </div>
                    <h3 className="text-sm font-medium">No Brief Generated Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">Enter your target keyword and search intent, then click Generate to create a comprehensive content brief.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
