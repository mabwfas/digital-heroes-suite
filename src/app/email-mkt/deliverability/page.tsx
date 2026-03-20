"use client";

import { useState, useCallback } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Zap } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface CheckResult {
  id: string;
  score: number;
  checks: { label: string; status: "pass" | "warn" | "fail"; detail: string }[];
  spamWords: string[];
  checkedAt: string;
}

const SPAM_TRIGGER_WORDS = [
  "free", "buy", "order", "click here", "subscribe", "deal", "discount", "offer", "cash",
  "money", "earn", "income", "profit", "winner", "congratulations", "act now", "limited time",
  "urgent", "expire", "don't miss", "exclusive deal", "no cost", "risk free", "guarantee",
  "no obligation", "credit", "cheap", "bargain", "lowest price", "save big", "apply now",
  "sign up free", "double your", "extra income", "fast cash", "get paid", "work from home",
  "as seen on", "call now", "click below", "buy now", "order now", "special promotion",
  "this isn't spam", "what are you waiting for", "while supplies last", "100% free",
  "no strings attached", "you have been selected", "million dollars", "once in a lifetime",
];

function analyzeDeliverability(content: string): Omit<CheckResult, "id" | "checkedAt"> {
  const lower = content.toLowerCase();
  const words = content.split(/\s+/).filter(Boolean);
  const checks: CheckResult["checks"] = [];
  let totalPoints = 0;
  let maxPoints = 0;

  // Spam words
  const foundSpam = SPAM_TRIGGER_WORDS.filter(w => lower.includes(w));
  const spamRatio = foundSpam.length / Math.max(words.length, 1);
  if (foundSpam.length === 0) { checks.push({ label: "Spam Trigger Words", status: "pass", detail: "No spam trigger words found" }); totalPoints += 20; }
  else if (foundSpam.length <= 3) { checks.push({ label: "Spam Trigger Words", status: "warn", detail: `${foundSpam.length} spam words found: ${foundSpam.slice(0, 3).join(", ")}` }); totalPoints += 10; }
  else { checks.push({ label: "Spam Trigger Words", status: "fail", detail: `${foundSpam.length} spam words found — high risk` }); }
  maxPoints += 20;

  // ALL CAPS
  const capsWords = words.filter(w => w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w));
  const capsRatio = capsWords.length / Math.max(words.length, 1);
  if (capsRatio === 0) { checks.push({ label: "ALL CAPS Detection", status: "pass", detail: "No excessive caps — clean" }); totalPoints += 15; }
  else if (capsRatio < 0.1) { checks.push({ label: "ALL CAPS Detection", status: "warn", detail: `${capsWords.length} ALL CAPS words — borderline` }); totalPoints += 8; }
  else { checks.push({ label: "ALL CAPS Detection", status: "fail", detail: `${capsWords.length} ALL CAPS words (${(capsRatio * 100).toFixed(0)}%) — spam filters will flag this` }); }
  maxPoints += 15;

  // Exclamation marks
  const exclamations = (content.match(/!/g) || []).length;
  if (exclamations <= 1) { checks.push({ label: "Exclamation Marks", status: "pass", detail: `${exclamations} found — acceptable` }); totalPoints += 10; }
  else if (exclamations <= 3) { checks.push({ label: "Exclamation Marks", status: "warn", detail: `${exclamations} found — reduce to 1` }); totalPoints += 5; }
  else { checks.push({ label: "Exclamation Marks", status: "fail", detail: `${exclamations} found — major spam indicator` }); }
  maxPoints += 10;

  // Link density (count URLs)
  const links = (content.match(/https?:\/\/|www\./gi) || []).length;
  if (links <= 2) { checks.push({ label: "Link Density", status: "pass", detail: `${links} links — good balance` }); totalPoints += 15; }
  else if (links <= 5) { checks.push({ label: "Link Density", status: "warn", detail: `${links} links — slightly high` }); totalPoints += 8; }
  else { checks.push({ label: "Link Density", status: "fail", detail: `${links} links — too many, reduce to 2-3` }); }
  maxPoints += 15;

  // Content length
  if (words.length >= 50 && words.length <= 500) { checks.push({ label: "Content Length", status: "pass", detail: `${words.length} words — ideal range` }); totalPoints += 10; }
  else if (words.length >= 20 && words.length <= 800) { checks.push({ label: "Content Length", status: "warn", detail: `${words.length} words — ${words.length < 50 ? "could be longer" : "could be shorter"}` }); totalPoints += 5; }
  else { checks.push({ label: "Content Length", status: "fail", detail: `${words.length} words — ${words.length < 20 ? "too short" : "too long"}` }); }
  maxPoints += 10;

  // Image tags (estimating from [img] or <img patterns)
  const imgTags = (content.match(/<img|!\[.*?\]/gi) || []).length;
  const textToImageRatio = words.length / Math.max(imgTags, 1);
  if (imgTags === 0) { checks.push({ label: "Image-to-Text Ratio", status: "pass", detail: "Text-only — good for deliverability" }); totalPoints += 15; }
  else if (textToImageRatio >= 20) { checks.push({ label: "Image-to-Text Ratio", status: "pass", detail: `Good ratio — ${imgTags} images, ${words.length} words` }); totalPoints += 15; }
  else if (textToImageRatio >= 5) { checks.push({ label: "Image-to-Text Ratio", status: "warn", detail: "Add more text to balance images" }); totalPoints += 8; }
  else { checks.push({ label: "Image-to-Text Ratio", status: "fail", detail: "Too many images vs text — will trigger filters" }); }
  maxPoints += 15;

  // Special characters
  const specialChars = (content.match(/[$$$$]/g) || []).length;
  if (specialChars === 0) { checks.push({ label: "Special Characters", status: "pass", detail: "No $$ symbols — clean" }); totalPoints += 15; }
  else if (specialChars <= 2) { checks.push({ label: "Special Characters", status: "warn", detail: `${specialChars} $$ symbols found — use sparingly` }); totalPoints += 8; }
  else { checks.push({ label: "Special Characters", status: "fail", detail: `${specialChars} $$ symbols — triggers spam filters` }); }
  maxPoints += 15;

  const score = Math.round((totalPoints / maxPoints) * 100);
  return { score, checks, spamWords: foundSpam };
}

export default function DeliverabilityPage() {
  const [content, setContent] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [history, setHistory, hydrated] = useLocalStorage<CheckResult[]>("deliverability-history", []);

  const handleCheck = useCallback(() => {
    if (!content.trim()) return;
    const data = analyzeDeliverability(content.trim());
    const r: CheckResult = { ...data, id: generateId(), checkedAt: new Date().toISOString() };
    setResult(r);
    setHistory(prev => [r, ...prev.slice(0, 9)]);
  }, [content, setHistory]);

  const statusIcon = (s: string) => s === "pass" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : s === "warn" ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
  const scoreColor = (s: number) => s >= 80 ? "text-emerald-500" : s >= 50 ? "text-amber-500" : "text-red-500";
  const scoreLabel = (s: number) => s >= 80 ? "High Deliverability" : s >= 50 ? "Medium Risk" : "High Risk";

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deliverability Checker"
        description="Scan email content for spam triggers, ALL CAPS, link density, and image-to-text ratio."
        icon={ShieldCheck}
        badge="Free"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-violet-500" /> Email Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Paste your email content (HTML or plain text)</Label>
            <Textarea rows={8} placeholder="Paste your full email content here..." value={content} onChange={e => setContent(e.target.value)} className="font-mono text-sm" />
          </div>
          <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleCheck} disabled={!content.trim()}>
            <Zap className="h-4 w-4" /> Check Deliverability
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardContent className="py-6 text-center">
              <p className={`text-5xl font-bold ${scoreColor(result.score)}`}>{result.score}</p>
              <p className="text-xs text-muted-foreground mt-1">/ 100</p>
              <Badge variant="secondary" className={`mt-2 ${scoreColor(result.score)}`}>{scoreLabel(result.score)}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Detailed Checks</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {result.checks.map(c => (
                <div key={c.label} className="flex items-start gap-3 rounded-lg border p-3">
                  {statusIcon(c.status)}
                  <div>
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{c.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {result.spamWords.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-red-500">Spam Trigger Words Found</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.spamWords.map((w, i) => <Badge key={i} variant="secondary" className="text-[10px] bg-red-500/10 text-red-600">{w}</Badge>)}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
