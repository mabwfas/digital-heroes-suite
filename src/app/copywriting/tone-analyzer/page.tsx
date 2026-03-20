"use client";

import { useState, useCallback } from "react";
import { FileText, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface Analysis {
  tone: string;
  readability: number;
  grade: string;
  wordCount: number;
  sentenceCount: number;
  avgSentenceLen: number;
  avgWordLen: number;
  paragraphCount: number;
  suggestions: string[];
}

function analyzeText(text: string): Analysis {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(sentences.length, 1);
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const paragraphCount = Math.max(paragraphs.length, 1);
  const avgSentenceLen = Math.round((wordCount / sentenceCount) * 10) / 10;
  const syllableCount = words.reduce((sum, w) => {
    const s = w.toLowerCase().replace(/[^a-z]/g, "");
    let count = 0;
    if (s.length <= 3) return sum + 1;
    const vowels = s.match(/[aeiouy]+/g);
    count = vowels ? vowels.length : 1;
    if (s.endsWith("e")) count = Math.max(1, count - 1);
    return sum + count;
  }, 0);
  const avgWordLen = wordCount > 0 ? Math.round(words.reduce((s, w) => s + w.length, 0) / wordCount * 10) / 10 : 0;

  // Flesch-Kincaid readability
  const fk = wordCount > 0 ? 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount) : 0;
  const readability = Math.max(0, Math.min(100, Math.round(fk)));

  let grade: string;
  if (readability >= 80) grade = "Very Easy (5th grade)";
  else if (readability >= 70) grade = "Easy (6th grade)";
  else if (readability >= 60) grade = "Standard (7th-8th grade)";
  else if (readability >= 50) grade = "Moderate (9th-10th grade)";
  else if (readability >= 30) grade = "Difficult (College)";
  else grade = "Very Difficult (Graduate)";

  // Simple tone detection
  const lower = text.toLowerCase();
  const formalWords = ["furthermore", "therefore", "consequently", "nevertheless", "accordingly", "henceforth", "hereby", "whereas"];
  const casualWords = ["hey", "cool", "awesome", "gonna", "wanna", "gotta", "yeah", "btw", "lol"];
  const friendlyWords = ["love", "great", "happy", "wonderful", "excited", "amazing", "enjoy", "thank"];
  const professionalWords = ["strategy", "implement", "optimize", "leverage", "stakeholder", "deliverable", "scalable", "roi"];
  const formalCount = formalWords.filter((w) => lower.includes(w)).length;
  const casualCount = casualWords.filter((w) => lower.includes(w)).length;
  const friendlyCount = friendlyWords.filter((w) => lower.includes(w)).length;
  const proCount = professionalWords.filter((w) => lower.includes(w)).length;

  let tone = "Neutral";
  const max = Math.max(formalCount, casualCount, friendlyCount, proCount);
  if (max > 0) {
    if (formalCount === max) tone = "Formal";
    else if (casualCount === max) tone = "Casual";
    else if (friendlyCount === max) tone = "Friendly";
    else if (proCount === max) tone = "Professional";
  }
  if (avgSentenceLen > 20 && formalCount === 0 && casualCount === 0) tone = "Professional";
  if (avgSentenceLen < 10 && casualCount === 0) tone = "Concise";

  const suggestions: string[] = [];
  if (avgSentenceLen > 25) suggestions.push("Shorten your sentences. Aim for 15-20 words per sentence for better readability.");
  if (avgWordLen > 6) suggestions.push("Use simpler words. Shorter words improve clarity and engagement.");
  if (readability < 50) suggestions.push("Your text is quite complex. Consider simplifying for a broader audience.");
  if (paragraphCount === 1 && wordCount > 100) suggestions.push("Break your text into multiple paragraphs for easier scanning.");
  if (wordCount < 10) suggestions.push("Add more content for a more thorough analysis.");
  if (!text.includes("?") && !text.includes("!")) suggestions.push("Consider adding questions or exclamations to increase engagement.");

  return { tone, readability, grade, wordCount, sentenceCount, avgSentenceLen, avgWordLen, paragraphCount, suggestions };
}

export default function ToneAnalyzerPage() {
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const analyze = useCallback(() => {
    if (!text.trim()) return;
    setAnalysis(analyzeText(text));
  }, [text]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tone Analyzer"
        description="Analyze your copy for tone, readability, and get improvement suggestions."
        icon={FileText}
        badge="Copywriting"
      />

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Paste Your Text</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Textarea placeholder="Paste your copy here to analyze its tone and readability..." value={text} onChange={(e) => setText(e.target.value)} rows={8} />
          <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={analyze} disabled={!text.trim()}>
            <BarChart3 className="h-4 w-4" />Analyze Text
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Tone & Readability</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Detected Tone</span>
                <Badge className="bg-violet-500/10 text-violet-600 border-0">{analysis.tone}</Badge>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Readability Score</span>
                  <span className={`text-sm font-bold ${analysis.readability >= 60 ? "text-emerald-500" : analysis.readability >= 40 ? "text-amber-500" : "text-red-500"}`}>{analysis.readability}/100</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${analysis.readability >= 60 ? "bg-emerald-500" : analysis.readability >= 40 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${analysis.readability}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{analysis.grade}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Statistics</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Words", value: analysis.wordCount },
                  { label: "Sentences", value: analysis.sentenceCount },
                  { label: "Paragraphs", value: analysis.paragraphCount },
                  { label: "Avg Sentence Length", value: `${analysis.avgSentenceLen} words` },
                  { label: "Avg Word Length", value: `${analysis.avgWordLen} chars` },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border p-2.5">
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {analysis.suggestions.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-base">Suggestions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {analysis.suggestions.map((s, i) => (
                  <div key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="text-amber-500 shrink-0">&#9679;</span>{s}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
