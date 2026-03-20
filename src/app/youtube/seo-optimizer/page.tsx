"use client";

import { useState, useMemo } from "react";
import {
  Search,
  TrendingUp,
  Copy,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Hash,
  FileText,
  Tag,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";

interface SEOAnalysis {
  titleScore: number;
  titleIssues: string[];
  titleSuggestions: string[];
  descScore: number;
  descIssues: string[];
  descSuggestions: string[];
  tagScore: number;
  tagIssues: string[];
  tagSuggestions: string[];
  overallScore: number;
}

function analyzeTitle(title: string): { score: number; issues: string[]; suggestions: string[] } {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  if (!title.trim()) return { score: 0, issues: ["Title is empty"], suggestions: ["Add a descriptive title"] };

  if (title.length < 30) { issues.push("Title is too short (under 30 characters)"); suggestions.push("Aim for 50-60 characters for optimal display"); score -= 20; }
  if (title.length > 70) { issues.push("Title is too long (over 70 characters) — may get truncated"); suggestions.push("Shorten to under 60 characters for best display"); score -= 15; }
  if (title.length >= 50 && title.length <= 65) { suggestions.push("Great length! Title is in the optimal 50-65 character range"); }

  if (!/[0-9]/.test(title)) { suggestions.push("Consider adding a number (e.g., '5 Ways...' or '2024')"); score -= 5; }
  if (!/[?!|—:]/.test(title)) { suggestions.push("Consider using a power punctuation mark (?, !, |, :, or —)"); score -= 5; }

  const powerWords = ["ultimate", "proven", "secret", "free", "best", "top", "how", "why", "new", "easy", "fast", "complete", "guide"];
  const hasP = powerWords.some((w) => title.toLowerCase().includes(w));
  if (!hasP) { suggestions.push("Add a power word like 'Ultimate', 'Proven', 'Free', 'Best', or 'Complete'"); score -= 10; }

  if (title === title.toLowerCase()) { issues.push("Title is all lowercase"); suggestions.push("Use Title Case for better readability"); score -= 10; }

  return { score: Math.max(0, score), issues, suggestions };
}

function analyzeDescription(desc: string): { score: number; issues: string[]; suggestions: string[] } {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  if (!desc.trim()) return { score: 0, issues: ["Description is empty"], suggestions: ["Add a detailed description (200+ words recommended)"] };

  const wordCount = desc.split(/\s+/).filter(Boolean).length;
  if (wordCount < 50) { issues.push(`Only ${wordCount} words — very short`); suggestions.push("Aim for 200+ words for better SEO"); score -= 30; }
  else if (wordCount < 100) { issues.push(`${wordCount} words — could be longer`); suggestions.push("Aim for 200+ words for optimal ranking"); score -= 20; }
  else if (wordCount < 200) { suggestions.push(`${wordCount} words — good, but 200+ is ideal`); score -= 10; }
  else { suggestions.push(`${wordCount} words — excellent description length`); }

  if (!/https?:\/\//.test(desc)) { suggestions.push("Add relevant links (social media, resources, website)"); score -= 10; }
  if (!/#\w+/.test(desc)) { issues.push("No hashtags found"); suggestions.push("Add 3-5 hashtags at the end (they appear above the title)"); score -= 10; }
  if (!/\d{1,2}:\d{2}/.test(desc)) { suggestions.push("Add timestamps (00:00) for better viewer navigation"); score -= 5; }

  const lines = desc.split("\n").filter((l) => l.trim());
  if (lines.length < 3) { suggestions.push("Break description into multiple paragraphs for readability"); score -= 5; }

  return { score: Math.max(0, score), issues, suggestions };
}

function analyzeTags(tags: string): { score: number; issues: string[]; suggestions: string[] } {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  if (!tags.trim()) return { score: 0, issues: ["No tags provided"], suggestions: ["Add 15-30 tags separated by commas"] };

  const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
  if (tagList.length < 5) { issues.push(`Only ${tagList.length} tags — too few`); suggestions.push("Use at least 15 tags for better discoverability"); score -= 30; }
  else if (tagList.length < 15) { suggestions.push(`${tagList.length} tags — add more (aim for 15-30)`); score -= 15; }
  else if (tagList.length > 30) { issues.push("Too many tags (over 30) — YouTube may ignore excess"); score -= 10; }
  else { suggestions.push(`${tagList.length} tags — great count`); }

  const hasLong = tagList.some((t) => t.split(" ").length >= 3);
  if (!hasLong) { suggestions.push("Include some long-tail keywords (3+ words)"); score -= 10; }

  const hasShort = tagList.some((t) => t.split(" ").length === 1);
  if (!hasShort) { suggestions.push("Include some single-word broad keywords"); score -= 5; }

  return { score: Math.max(0, score), issues, suggestions };
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreBg(score: number) {
  if (score >= 80) return "bg-emerald-500/10";
  if (score >= 60) return "bg-amber-500/10";
  return "bg-red-500/10";
}

function ScoreIcon({ score }: { score: number }) {
  if (score >= 80) return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (score >= 60) return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
}

export default function SEOOptimizerPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [copied, setCopied] = useState(false);

  const analysis = useMemo<SEOAnalysis | null>(() => {
    if (!title.trim() && !description.trim() && !tags.trim()) return null;
    const t = analyzeTitle(title);
    const d = analyzeDescription(description);
    const tg = analyzeTags(tags);
    const overall = Math.round((t.score + d.score + tg.score) / 3);
    return {
      titleScore: t.score, titleIssues: t.issues, titleSuggestions: t.suggestions,
      descScore: d.score, descIssues: d.issues, descSuggestions: d.suggestions,
      tagScore: tg.score, tagIssues: tg.issues, tagSuggestions: tg.suggestions,
      overallScore: overall,
    };
  }, [title, description, tags]);

  function generateTemplate() {
    const template = `${title}

${description ? description + "\n\n" : ""}--- TIMESTAMPS ---
00:00 - Introduction
01:00 - [Section 1]
03:00 - [Section 2]
05:00 - [Section 3]
08:00 - Conclusion

--- CONNECT ---
Website: [Your URL]
Instagram: [Your Handle]
Twitter: [Your Handle]

--- ABOUT ---
[Brief channel description]

${tags ? tags.split(",").slice(0, 5).map((t) => "#" + t.trim().replace(/\s+/g, "")).join(" ") : "#YouTube #Content"}`;
    navigator.clipboard.writeText(template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="YouTube SEO Optimizer"
        description="Analyze and optimize your video title, description, and tags for maximum reach"
        icon={Search}
        badge="YouTube"
        replaces="VidIQ / TubeBuddy SEO"
      />

      {analysis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Overall Score", value: analysis.overallScore, icon: TrendingUp },
            { label: "Title Score", value: analysis.titleScore, icon: FileText },
            { label: "Description Score", value: analysis.descScore, icon: FileText },
            { label: "Tags Score", value: analysis.tagScore, icon: Tag },
          ].map((s) => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <s.icon className={`h-4 w-4 ${getScoreColor(s.value)}`} />
                  <ScoreIcon score={s.value} />
                </div>
                <p className={`text-2xl font-bold ${getScoreColor(s.value)}`}>{s.value}/100</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Video Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Video Title ({title.length}/60 chars)</Label>
                <Input placeholder="Enter your video title..." value={title} onChange={(e) => setTitle(e.target.value)} />
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all rounded-full ${title.length <= 60 ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${Math.min(100, (title.length / 70) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description ({description.split(/\s+/).filter(Boolean).length} words)</Label>
                <Textarea placeholder="Enter your video description..." value={description} onChange={(e) => setDescription(e.target.value)} rows={8} />
              </div>
              <div className="space-y-1.5">
                <Label>Tags (comma-separated)</Label>
                <Textarea placeholder="tag1, tag2, long-tail keyword, ..." value={tags} onChange={(e) => setTags(e.target.value)} rows={3} />
                <p className="text-xs text-muted-foreground">{tags.split(",").filter((t) => t.trim()).length} tags</p>
              </div>
              <Button onClick={generateTemplate} className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
                <Copy className="h-4 w-4 mr-2" />
                {copied ? "Copied!" : "Copy Optimized Description Template"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Results */}
        <div className="space-y-4">
          {analysis ? (
            <>
              {[
                { label: "Title Analysis", score: analysis.titleScore, issues: analysis.titleIssues, suggestions: analysis.titleSuggestions, icon: FileText },
                { label: "Description Analysis", score: analysis.descScore, issues: analysis.descIssues, suggestions: analysis.descSuggestions, icon: FileText },
                { label: "Tags Analysis", score: analysis.tagScore, issues: analysis.tagIssues, suggestions: analysis.tagSuggestions, icon: Hash },
              ].map((section) => (
                <Card key={section.label}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <section.icon className="h-4 w-4 text-violet-500" />
                        {section.label}
                      </CardTitle>
                      <Badge className={`${getScoreBg(section.score)} ${getScoreColor(section.score)} border-0`}>
                        {section.score}/100
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {section.issues.map((issue, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <span>{issue}</span>
                      </div>
                    ))}
                    {section.suggestions.map((sug, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{sug}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <Card>
              <CardContent className="py-16">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center">
                    <Search className="h-7 w-7 text-violet-400" />
                  </div>
                  <h3 className="text-sm font-medium">Enter Video Details to Analyze</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Add your video title, description, and tags to get an SEO score with actionable improvement suggestions.
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
