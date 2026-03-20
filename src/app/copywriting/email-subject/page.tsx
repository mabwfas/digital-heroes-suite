"use client";

import { useState, useCallback } from "react";
import { Mail, Copy, RefreshCw, Trash2, History, X, Star } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type Pattern = "question" | "number" | "urgency" | "curiosity" | "benefit";

interface SubjectLine {
  id: string;
  text: string;
  pattern: Pattern;
  charCount: number;
}

interface SavedSet {
  id: string;
  topic: string;
  subjects: SubjectLine[];
  createdAt: string;
}

const PATTERN_CONFIG: Record<Pattern, { label: string; color: string }> = {
  question: { label: "Question", color: "bg-blue-500/10 text-blue-600" },
  number: { label: "Number", color: "bg-violet-500/10 text-violet-600" },
  urgency: { label: "Urgency", color: "bg-red-500/10 text-red-600" },
  curiosity: { label: "Curiosity", color: "bg-amber-500/10 text-amber-600" },
  benefit: { label: "Benefit", color: "bg-emerald-500/10 text-emerald-600" },
};

function generateSubjects(topic: string, goal: string): SubjectLine[] {
  const g = goal || "better results";
  const templates: { pattern: Pattern; gen: () => string }[] = [
    { pattern: "question", gen: () => `Are you still struggling with ${topic}?` },
    { pattern: "question", gen: () => `What if ${topic} could actually be easy?` },
    { pattern: "question", gen: () => `Ready to transform your ${topic}?` },
    { pattern: "number", gen: () => `5 ${topic} strategies for ${g}` },
    { pattern: "number", gen: () => `3 mistakes killing your ${topic} results` },
    { pattern: "number", gen: () => `7 proven ${topic} tips you need today` },
    { pattern: "urgency", gen: () => `Last chance: Your ${topic} offer expires tonight` },
    { pattern: "urgency", gen: () => `Don't miss this ${topic} opportunity` },
    { pattern: "urgency", gen: () => `Only 24 hours left to master ${topic}` },
    { pattern: "curiosity", gen: () => `The ${topic} secret nobody talks about` },
    { pattern: "curiosity", gen: () => `This ${topic} trick changed everything for us` },
    { pattern: "curiosity", gen: () => `You won't believe what ${topic} can do` },
    { pattern: "benefit", gen: () => `Get ${g} with smarter ${topic}` },
    { pattern: "benefit", gen: () => `Unlock ${g} — your ${topic} guide inside` },
    { pattern: "benefit", gen: () => `Achieve ${g} in half the time with ${topic}` },
  ];
  return templates.map((t) => {
    const text = t.gen();
    return { id: generateId(), text, pattern: t.pattern, charCount: text.length };
  });
}

export default function EmailSubjectPage() {
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [subjects, setSubjects] = useState<SubjectLine[]>([]);
  const [saved, setSaved, hydrated] = useLocalStorage<SavedSet[]>("email-subjects", []);
  const [showSaved, setShowSaved] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const generate = useCallback(() => {
    if (!topic.trim()) return;
    setSubjects(generateSubjects(topic, goal));
  }, [topic, goal]);

  const copyText = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  const handleSave = useCallback(() => {
    if (subjects.length === 0) return;
    setSaved((prev) => [{ id: generateId(), topic, subjects, createdAt: new Date().toISOString() }, ...prev.slice(0, 19)]);
  }, [subjects, topic, setSaved]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Subject Line Generator"
        description="Generate 15 high-converting email subject lines using proven patterns."
        icon={Mail}
        badge="Copywriting"
        actions={
          <Button variant="outline" size="sm" onClick={() => setShowSaved(!showSaved)}>
            <History className="h-4 w-4" />Saved ({saved.length})
          </Button>
        }
      />

      {showSaved ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Saved Subject Lines</CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowSaved(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {saved.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No saved subjects yet.</p>
            ) : (
              <div className="space-y-3">
                {saved.map((s) => (
                  <div key={s.id} className="border rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{s.topic}</span>
                      <p className="text-xs text-muted-foreground">{s.subjects.length} lines &middot; {new Date(s.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => setSaved((p) => p.filter((x) => x.id !== s.id))}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Email Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Topic / Product *</Label>
                  <Input placeholder="e.g. email marketing" value={topic} onChange={(e) => setTopic(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Goal / Desired Outcome</Label>
                  <Input placeholder="e.g. more opens, higher CTR" value={goal} onChange={(e) => setGoal(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={generate} disabled={!topic.trim()}>
                  <RefreshCw className="h-4 w-4" />Generate 15 Subject Lines
                </Button>
                {subjects.length > 0 && <Button variant="outline" onClick={handleSave}>Save</Button>}
              </div>
            </CardContent>
          </Card>

          {subjects.length > 0 && (
            <div className="grid gap-2">
              {subjects.map((s) => (
                <Card key={s.id} className="border-border/50 hover:border-violet-500/30 transition-colors group">
                  <CardContent className="p-3 flex items-center gap-3">
                    <Badge className={`${PATTERN_CONFIG[s.pattern].color} border-0 text-[10px] shrink-0`}>
                      {PATTERN_CONFIG[s.pattern].label}
                    </Badge>
                    <p className="text-sm flex-1 min-w-0 truncate">{s.text}</p>
                    <span className={`text-xs font-mono shrink-0 ${s.charCount > 60 ? "text-amber-500" : s.charCount > 40 ? "text-emerald-500" : "text-muted-foreground"}`}>
                      {s.charCount}c
                    </span>
                    <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyText(s.text, s.id)}>
                      <Copy className={`h-3.5 w-3.5 ${copied === s.id ? "text-emerald-500" : ""}`} />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
