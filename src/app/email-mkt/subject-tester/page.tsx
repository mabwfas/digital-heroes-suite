"use client";

import { useState, useCallback, useMemo } from "react";
import { Mail, Zap, AlertTriangle, BarChart3, History, Trash2, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface SubjectResult {
  id: string;
  subject: string;
  overall: number;
  factors: { label: string; score: number; detail: string }[];
  warnings: string[];
  testedAt: string;
}

const SPAM_WORDS = [
  "free", "buy", "order", "click", "subscribe", "deal", "discount", "offer",
  "cash", "money", "earn", "income", "profit", "winner", "congratulations",
  "act now", "limited time", "urgent", "expire", "don't miss", "exclusive deal",
  "no cost", "risk free", "guarantee", "no obligation", "credit", "cheap",
  "bargain", "lowest price", "save big", "apply now", "sign up free",
  "double your", "extra income", "fast cash", "get paid", "work from home",
  "as seen on", "call now", "click here", "click below", "buy now",
  "order now", "special promotion", "this isn't spam", "what are you waiting for",
  "while supplies last", "you have been selected", "100% free", "no strings attached",
];

function analyzeSubject(subject: string): Omit<SubjectResult, "id" | "testedAt"> {
  const words = subject.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const lower = subject.toLowerCase();
  const factors: SubjectResult["factors"] = [];
  const warnings: string[] = [];

  // Length (6-10 words ideal)
  let lengthScore: number;
  if (wordCount >= 6 && wordCount <= 10) lengthScore = 100;
  else if (wordCount >= 4 && wordCount <= 12) lengthScore = 70;
  else if (wordCount >= 2) lengthScore = 40;
  else lengthScore = 10;
  factors.push({ label: "Length", score: lengthScore, detail: `${wordCount} words (ideal: 6-10)` });

  // Personalization
  const hasPersonalization = /\{.*?\}|(\[name\]|\[first_name\])/.test(subject);
  const personScore = hasPersonalization ? 100 : 30;
  factors.push({ label: "Personalization", score: personScore, detail: hasPersonalization ? "Merge tags detected" : "No personalization found — try adding {name}" });

  // Urgency
  const urgencyWords = ["now", "today", "limited", "last chance", "ending", "hurry", "soon", "final", "deadline", "expires"];
  const hasUrgency = urgencyWords.some(w => lower.includes(w));
  factors.push({ label: "Urgency", score: hasUrgency ? 90 : 40, detail: hasUrgency ? "Urgency words detected" : "No urgency — adding time-sensitivity can boost opens" });

  // Curiosity
  const hasQuestion = subject.includes("?");
  const curiosityWords = ["how", "why", "what", "secret", "revealed", "discover", "truth", "surprising"];
  const hasCuriosity = hasQuestion || curiosityWords.some(w => lower.includes(w));
  factors.push({ label: "Curiosity", score: hasCuriosity ? 90 : 40, detail: hasCuriosity ? "Curiosity-triggering elements found" : "Try posing a question or teasing info" });

  // Spam words
  const foundSpam = SPAM_WORDS.filter(w => lower.includes(w));
  const spamScore = foundSpam.length === 0 ? 100 : foundSpam.length <= 2 ? 50 : 10;
  factors.push({ label: "Spam Detection", score: spamScore, detail: foundSpam.length > 0 ? `Found: ${foundSpam.slice(0, 5).join(", ")}` : "No spam triggers found" });
  if (foundSpam.length > 0) warnings.push(`Spam trigger words detected: ${foundSpam.join(", ")}`);

  // Emoji usage
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  const hasEmoji = emojiRegex.test(subject);
  factors.push({ label: "Emoji Usage", score: hasEmoji ? 85 : 50, detail: hasEmoji ? "Emoji found — can boost open rates 5-10%" : "No emoji — consider adding one for visual appeal" });

  // ALL CAPS check
  const capsWords = words.filter(w => w.length > 2 && w === w.toUpperCase());
  if (capsWords.length > 1) {
    warnings.push("Excessive ALL CAPS detected — this triggers spam filters");
    factors.push({ label: "Caps Check", score: 20, detail: `${capsWords.length} ALL CAPS words found` });
  } else {
    factors.push({ label: "Caps Check", score: capsWords.length === 0 ? 100 : 70, detail: capsWords.length === 0 ? "Clean — no ALL CAPS abuse" : "1 caps word — borderline acceptable" });
  }

  const overall = Math.round(factors.reduce((s, f) => s + f.score, 0) / factors.length);
  return { subject, overall, factors, warnings };
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "bg-emerald-500/10 text-emerald-600" : score >= 50 ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600";
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Needs Work" : "Poor";
  return <Badge variant="secondary" className={`${color} text-xs`}>{score} — {label}</Badge>;
}

export default function SubjectTesterPage() {
  const [subjectA, setSubjectA] = useState("");
  const [subjectB, setSubjectB] = useState("");
  const [resultA, setResultA] = useState<SubjectResult | null>(null);
  const [resultB, setResultB] = useState<SubjectResult | null>(null);
  const [history, setHistory, hydrated] = useLocalStorage<SubjectResult[]>("subject-tester-history", []);
  const [showHistory, setShowHistory] = useState(false);

  const handleTest = useCallback(() => {
    if (!subjectA.trim()) return;
    const a = analyzeSubject(subjectA.trim());
    const rA: SubjectResult = { ...a, id: generateId(), testedAt: new Date().toISOString() };
    setResultA(rA);
    setHistory(prev => [rA, ...prev.slice(0, 29)]);

    if (subjectB.trim()) {
      const b = analyzeSubject(subjectB.trim());
      const rB: SubjectResult = { ...b, id: generateId(), testedAt: new Date().toISOString() };
      setResultB(rB);
      setHistory(prev => [rB, ...prev.slice(0, 29)]);
    } else {
      setResultB(null);
    }
  }, [subjectA, subjectB, setHistory]);

  if (!hydrated) return null;

  const renderResult = (r: SubjectResult, label: string) => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{label}</CardTitle>
          <ScoreBadge score={r.overall} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm font-medium truncate">{r.subject}</p>
        {r.warnings.length > 0 && (
          <div className="space-y-1">
            {r.warnings.map((w, i) => (
              <div key={i} className="flex gap-2 text-xs text-amber-600 bg-amber-500/10 rounded-lg p-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {w}
              </div>
            ))}
          </div>
        )}
        <div className="space-y-2">
          {r.factors.map(f => (
            <div key={f.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{f.label}</span>
                <span className={`text-xs font-bold ${f.score >= 80 ? "text-emerald-500" : f.score >= 50 ? "text-amber-500" : "text-red-500"}`}>{f.score}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{f.detail}</p>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${f.score >= 80 ? "bg-emerald-500" : f.score >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${f.score}%`, transition: "width 0.6s ease" }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Subject Line Tester"
        description="Score subject lines on length, personalization, urgency, curiosity, spam words, and emoji usage."
        icon={Mail}
        badge="Free"
        actions={
          <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
            <History className="h-4 w-4" /> History ({history.length})
          </Button>
        }
      />

      {showHistory ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Test History</CardTitle>
              <div className="flex gap-2">
                {history.length > 0 && <Button variant="ghost" size="sm" onClick={() => setHistory([])}><Trash2 className="h-3.5 w-3.5 text-red-500" /> Clear</Button>}
                <Button variant="ghost" size="icon-sm" onClick={() => setShowHistory(false)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No tests yet.</p>
            ) : (
              <div className="space-y-2">
                {history.map(h => (
                  <div key={h.id} className="rounded-lg border p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-muted/50" onClick={() => { setSubjectA(h.subject); setResultA(h); setResultB(null); setShowHistory(false); }}>
                    <p className="text-sm truncate flex-1">{h.subject}</p>
                    <ScoreBadge score={h.overall} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-violet-500" /> Test Subject Lines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Subject Line A</Label>
                <Input placeholder="Your email subject line..." value={subjectA} onChange={e => setSubjectA(e.target.value)} onKeyDown={e => e.key === "Enter" && handleTest()} />
              </div>
              <div className="space-y-1.5">
                <Label>Subject Line B (optional — for A/B compare)</Label>
                <Input placeholder="Alternative subject line..." value={subjectB} onChange={e => setSubjectB(e.target.value)} />
              </div>
              <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleTest} disabled={!subjectA.trim()}>
                <Zap className="h-4 w-4" /> Test Subject Line{subjectB.trim() ? "s" : ""}
              </Button>
            </CardContent>
          </Card>

          {resultA && (
            <div className={`grid gap-6 ${resultB ? "md:grid-cols-2" : "grid-cols-1"}`}>
              {renderResult(resultA, resultB ? "Subject A" : "Results")}
              {resultB && renderResult(resultB, "Subject B")}
              {resultB && resultA && (
                <Card className="md:col-span-2">
                  <CardContent className="py-4 text-center">
                    <p className="text-sm font-medium">
                      Winner: <span className={resultA.overall >= resultB.overall ? "text-emerald-500" : "text-violet-500"}>
                        {resultA.overall >= resultB.overall ? "Subject A" : "Subject B"}
                      </span> ({Math.max(resultA.overall, resultB.overall)} vs {Math.min(resultA.overall, resultB.overall)})
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
