"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Type,
  Trash2,
  Plus,
  History,
  X,
  Zap,
  Heart,
  Hash,
  HelpCircle,
  BookOpen,
  BarChart3,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface HeadlineResult {
  id: string;
  headline: string;
  overall: number;
  factors: Factor[];
  suggestions: string[];
  analyzedAt: string;
}

interface Factor {
  label: string;
  score: number;
  detail: string;
  icon: string;
}

const POWER_WORDS = [
  "ultimate", "proven", "secret", "exclusive", "essential", "powerful",
  "incredible", "remarkable", "stunning", "brilliant", "extraordinary",
  "revolutionary", "guaranteed", "instant", "effortless", "massive",
  "epic", "critical", "urgent", "breakthrough", "shocking", "surprising",
  "devastating", "mind-blowing", "life-changing", "game-changing",
  "unbelievable", "amazing", "awesome", "fantastic", "wonderful",
  "terrific", "magnificent", "spectacular", "tremendous", "phenomenal",
  "sensational", "thrilling", "captivating", "compelling", "irresistible",
  "unmissable", "vital", "crucial", "deadly", "dangerous", "forbidden",
  "hidden", "bizarre", "strange", "weird", "crazy", "insane",
  "free", "new", "best", "top", "first", "last", "only", "never",
  "always", "every", "complete", "definitive", "comprehensive",
];

const POSITIVE_WORDS = [
  "love", "happy", "joy", "great", "best", "beautiful", "wonderful",
  "amazing", "excellent", "perfect", "brilliant", "fantastic", "awesome",
  "incredible", "outstanding", "superb", "magnificent", "delightful",
  "inspiring", "success", "win", "triumph", "achievement", "reward",
  "boost", "improve", "grow", "thrive", "prosper", "benefit",
  "gain", "profit", "save", "easy", "simple", "quick", "fast",
  "free", "smart", "clever", "genius", "innovative", "creative",
];

const NEGATIVE_WORDS = [
  "worst", "terrible", "horrible", "awful", "bad", "ugly", "hate",
  "fail", "failure", "mistake", "error", "wrong", "problem", "crisis",
  "danger", "risk", "threat", "warning", "avoid", "stop", "never",
  "kill", "destroy", "ruin", "damage", "harm", "loss", "lose",
  "scam", "fraud", "lie", "fake", "toxic", "painful", "fear",
  "scary", "terrifying", "nightmare", "disaster", "catastrophe",
];

function analyzeHeadline(headline: string): Omit<HeadlineResult, "id" | "analyzedAt"> {
  const words = headline.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = headline.trim().length;
  const lower = headline.toLowerCase();
  const lowerWords = words.map((w) => w.toLowerCase().replace(/[^a-z]/g, ""));

  const factors: Factor[] = [];
  const suggestions: string[] = [];

  // Word count (ideal 6-12)
  let wordScore: number;
  if (wordCount >= 6 && wordCount <= 12) {
    wordScore = 100;
  } else if (wordCount >= 4 && wordCount <= 15) {
    wordScore = 70;
  } else if (wordCount >= 2) {
    wordScore = 40;
  } else {
    wordScore = 10;
  }
  factors.push({
    label: "Word Count",
    score: wordScore,
    detail: `${wordCount} words (ideal: 6-12)`,
    icon: "hash",
  });
  if (wordCount < 6) suggestions.push("Add more words. Headlines with 6-12 words get the highest engagement.");
  if (wordCount > 12) suggestions.push("Shorten your headline. Aim for 6-12 words for maximum impact.");

  // Character length (ideal 50-70)
  let charScore: number;
  if (charCount >= 50 && charCount <= 70) {
    charScore = 100;
  } else if (charCount >= 40 && charCount <= 80) {
    charScore = 70;
  } else if (charCount >= 20) {
    charScore = 40;
  } else {
    charScore = 10;
  }
  factors.push({
    label: "Character Length",
    score: charScore,
    detail: `${charCount} chars (ideal: 50-70)`,
    icon: "type",
  });
  if (charCount < 50) suggestions.push("Your headline is too short. Add descriptive words to reach 50-70 characters.");
  if (charCount > 70) suggestions.push("Trim your headline to under 70 characters to prevent truncation in search results.");

  // Power words
  const foundPower = lowerWords.filter((w) => POWER_WORDS.includes(w));
  const powerCount = foundPower.length;
  let powerScore: number;
  if (powerCount >= 2) {
    powerScore = 100;
  } else if (powerCount === 1) {
    powerScore = 70;
  } else {
    powerScore = 20;
  }
  factors.push({
    label: "Power Words",
    score: powerScore,
    detail: powerCount > 0 ? `Found: ${foundPower.join(", ")}` : "No power words detected",
    icon: "zap",
  });
  if (powerCount === 0) suggestions.push("Add a power word like \"proven\", \"essential\", or \"ultimate\" to boost engagement.");

  // Emotional score
  const posCount = lowerWords.filter((w) => POSITIVE_WORDS.includes(w)).length;
  const negCount = lowerWords.filter((w) => NEGATIVE_WORDS.includes(w)).length;
  const emotionTotal = posCount + negCount;
  let emotionScore: number;
  if (emotionTotal >= 2) {
    emotionScore = 100;
  } else if (emotionTotal === 1) {
    emotionScore = 70;
  } else {
    emotionScore = 30;
  }
  const emotionType = posCount > negCount ? "positive" : negCount > posCount ? "negative" : "neutral";
  factors.push({
    label: "Emotional Appeal",
    score: emotionScore,
    detail: `${emotionTotal} emotional word${emotionTotal !== 1 ? "s" : ""} (${emotionType})`,
    icon: "heart",
  });
  if (emotionTotal === 0) suggestions.push("Add emotional words to trigger a reader response. Use positive or negative sentiment words.");

  // Starts with number
  const startsNumber = /^\d/.test(headline.trim());
  const hasNumber = /\d/.test(headline);
  let numberScore: number;
  if (startsNumber) {
    numberScore = 100;
  } else if (hasNumber) {
    numberScore = 60;
  } else {
    numberScore = 30;
  }
  factors.push({
    label: "Number Usage",
    score: numberScore,
    detail: startsNumber ? "Starts with a number (great!)" : hasNumber ? "Contains a number" : "No numbers found",
    icon: "hash",
  });
  if (!hasNumber) suggestions.push("Start with a number (e.g., \"7 Ways to...\"). Numbered headlines get 36% more clicks.");

  // Contains question
  const isQuestion = headline.trim().endsWith("?");
  const hasQuestionWord = /^(how|what|why|when|where|who|which|can|do|does|is|are|will|should)\b/i.test(headline.trim());
  let questionScore: number;
  if (isQuestion && hasQuestionWord) {
    questionScore = 100;
  } else if (isQuestion || hasQuestionWord) {
    questionScore = 70;
  } else {
    questionScore = 40;
  }
  factors.push({
    label: "Question Format",
    score: questionScore,
    detail: isQuestion ? "Question headline detected" : hasQuestionWord ? "Starts with question word" : "Not a question",
    icon: "help",
  });

  // Readability (word complexity = avg word length)
  const avgWordLen = wordCount > 0 ? lowerWords.reduce((s, w) => s + w.length, 0) / wordCount : 0;
  let readScore: number;
  if (avgWordLen >= 3 && avgWordLen <= 6) {
    readScore = 100;
  } else if (avgWordLen <= 8) {
    readScore = 60;
  } else {
    readScore = 30;
  }
  factors.push({
    label: "Readability",
    score: readScore,
    detail: `Avg word length: ${avgWordLen.toFixed(1)} chars`,
    icon: "book",
  });
  if (avgWordLen > 6) suggestions.push("Use simpler, shorter words. Aim for an average word length under 6 characters.");

  // Calculate overall
  const overall = Math.round(
    factors.reduce((sum, f) => sum + f.score, 0) / factors.length
  );

  return { headline, overall, factors, suggestions };
}

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-red-500";
  const gradStart =
    score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const gradEnd =
    score >= 80 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";
  const label =
    score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Needs Work" : "Poor";
  const badgeColor =
    score >= 80
      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      : score >= 50
        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
        : "bg-red-500/10 text-red-600 border-red-500/20";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke="url(#headlineScoreGrad)"
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${score * 2.513} 251.3`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
          <defs>
            <linearGradient id="headlineScoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradStart} />
              <stop offset="100%" stopColor={gradEnd} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${color}`}>{score}</span>
          <span className="text-[10px] text-muted-foreground">/ 100</span>
        </div>
      </div>
      <Badge className={`${badgeColor} border text-xs`}>{label}</Badge>
    </div>
  );
}

function FactorIcon({ icon }: { icon: string }) {
  const cls = "h-4 w-4 shrink-0";
  switch (icon) {
    case "zap": return <Zap className={cls} />;
    case "heart": return <Heart className={cls} />;
    case "hash": return <Hash className={cls} />;
    case "help": return <HelpCircle className={cls} />;
    case "book": return <BookOpen className={cls} />;
    case "type": return <Type className={cls} />;
    default: return <BarChart3 className={cls} />;
  }
}

function scoreColor(s: number) {
  if (s >= 80) return "text-emerald-500";
  if (s >= 50) return "text-amber-500";
  return "text-red-500";
}

function scoreBg(s: number) {
  if (s >= 80) return "bg-emerald-500";
  if (s >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export default function HeadlineAnalyzerPage() {
  const [input, setInput] = useState("");
  const [compareInputs, setCompareInputs] = useState(["", ""]);
  const [results, setResults] = useState<HeadlineResult[]>([]);
  const [history, setHistory, hydrated] = useLocalStorage<HeadlineResult[]>(
    "headline-history",
    []
  );
  const [showHistory, setShowHistory] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  const handleAnalyze = useCallback(() => {
    const h = input.trim();
    if (!h) return;
    const analysis = analyzeHeadline(h);
    const result: HeadlineResult = {
      ...analysis,
      id: generateId(),
      analyzedAt: new Date().toISOString(),
    };
    setResults([result]);
    setHistory((prev) => [result, ...prev.slice(0, 49)]);
    setCompareMode(false);
  }, [input, setHistory]);

  const handleCompare = useCallback(() => {
    const headlines = [input.trim(), ...compareInputs.map((c) => c.trim())].filter(Boolean);
    if (headlines.length < 2) return;
    const newResults = headlines.map((h) => {
      const analysis = analyzeHeadline(h);
      return {
        ...analysis,
        id: generateId(),
        analyzedAt: new Date().toISOString(),
      };
    });
    setResults(newResults);
    newResults.forEach((r) => {
      setHistory((prev) => [r, ...prev.slice(0, 49)]);
    });
  }, [input, compareInputs, setHistory]);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  const handleLoadFromHistory = useCallback(
    (item: HeadlineResult) => {
      setInput(item.headline);
      setResults([item]);
      setShowHistory(false);
      setCompareMode(false);
    },
    []
  );

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Headline Analyzer"
        description="Score your headlines on engagement factors and get actionable suggestions."
        icon={Type}
        badge="Free"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="h-4 w-4" />
            History ({history.length})
          </Button>
        }
      />

      {showHistory ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Analysis History</CardTitle>
              <div className="flex gap-2">
                {history.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleClearHistory}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    Clear
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm" onClick={() => setShowHistory(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No headlines analyzed yet. Start by entering a headline above.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleLoadFromHistory(item)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm truncate flex-1">{item.headline}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-sm font-bold ${scoreColor(item.overall)}`}>
                          {item.overall}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.analyzedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Type className="h-4 w-4 text-violet-500" />
                {compareMode ? "Compare Headlines" : "Analyze Headline"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Headline {compareMode ? "1" : ""}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {input.trim().length} chars
                  </span>
                </div>
                <Input
                  placeholder="Enter your headline here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !compareMode && handleAnalyze()}
                />
              </div>

              {compareMode && (
                <>
                  {compareInputs.map((ci, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Headline {idx + 2}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {ci.trim().length} chars
                        </span>
                      </div>
                      <Input
                        placeholder={`Enter headline ${idx + 2}...`}
                        value={ci}
                        onChange={(e) => {
                          const next = [...compareInputs];
                          next[idx] = e.target.value;
                          setCompareInputs(next);
                        }}
                      />
                    </div>
                  ))}
                </>
              )}

              <div className="flex gap-2">
                {compareMode ? (
                  <Button
                    className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
                    onClick={handleCompare}
                    disabled={!input.trim() || compareInputs.every((c) => !c.trim())}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Compare Headlines
                  </Button>
                ) : (
                  <Button
                    className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
                    onClick={handleAnalyze}
                    disabled={!input.trim()}
                  >
                    <Zap className="h-4 w-4" />
                    Analyze Headline
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setCompareMode(!compareMode);
                    if (!compareMode) setCompareInputs(["", ""]);
                  }}
                >
                  {compareMode ? "Single" : "Compare"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {results.length > 0 && (
            <div className={`grid gap-6 ${results.length > 1 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 lg:grid-cols-3"}`}>
              {results.map((r) => (
                <div key={r.id} className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm truncate">
                        {r.headline}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScoreGauge score={r.overall} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Factor Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2.5">
                      {r.factors.map((f) => (
                        <div key={f.label} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FactorIcon icon={f.icon} />
                            <span className="text-xs font-medium flex-1">
                              {f.label}
                            </span>
                            <span className={`text-xs font-bold ${scoreColor(f.score)}`}>
                              {f.score}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground pl-6">
                            {f.detail}
                          </p>
                          <div className="h-1 rounded-full bg-muted overflow-hidden ml-6">
                            <div
                              className={`h-full rounded-full ${scoreBg(f.score)}`}
                              style={{ width: `${f.score}%`, transition: "width 0.6s ease" }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {r.suggestions.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Suggestions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {r.suggestions.map((s, i) => (
                          <div
                            key={i}
                            className="flex gap-2 text-xs text-muted-foreground"
                          >
                            <span className="text-amber-500 shrink-0">&#9679;</span>
                            {s}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
