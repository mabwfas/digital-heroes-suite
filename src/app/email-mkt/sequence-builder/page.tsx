"use client";

import { useState, useCallback } from "react";
import { GitBranch, Plus, Trash2, Save, Edit2, ArrowDown, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface SequenceEmail {
  id: string;
  subject: string;
  previewText: string;
  body: string;
  delayDays: number;
}

interface Sequence {
  id: string;
  name: string;
  type: string;
  emails: SequenceEmail[];
  savedAt: string;
}

const SEQUENCE_TYPES = ["Welcome", "Nurture", "Onboarding", "Re-engagement", "Post-Purchase", "Custom"];

const PRESETS: Record<string, Omit<SequenceEmail, "id">[]> = {
  Welcome: [
    { subject: "Welcome to {Brand}!", previewText: "We're so glad you're here", body: "Welcome aboard! Here's what you can expect from us...", delayDays: 0 },
    { subject: "Here's your exclusive offer", previewText: "A special gift just for you", body: "As a thank you for joining, here's 10% off your first purchase...", delayDays: 1 },
    { subject: "Get to know us better", previewText: "Our story and what we stand for", body: "We wanted to share a bit about who we are and why we do what we do...", delayDays: 3 },
  ],
  Nurture: [
    { subject: "Quick tip: {topic}", previewText: "Something useful for your day", body: "Here's a quick tip that our community loves...", delayDays: 0 },
    { subject: "The guide you've been waiting for", previewText: "Our most popular resource", body: "We put together a comprehensive guide on...", delayDays: 3 },
    { subject: "What our customers say", previewText: "Real stories, real results", body: "Don't just take our word for it...", delayDays: 7 },
    { subject: "Ready to take the next step?", previewText: "Your special invitation", body: "You've been on our list for a while and we think you'll love...", delayDays: 10 },
  ],
  Onboarding: [
    { subject: "Let's get you started", previewText: "Step 1 of your journey", body: "Welcome! Here's how to get the most out of your account...", delayDays: 0 },
    { subject: "Did you try this feature?", previewText: "Most users miss this", body: "Many of our new users don't know about this powerful feature...", delayDays: 2 },
    { subject: "Pro tips from power users", previewText: "Level up your experience", body: "Here are the top tips from our most successful users...", delayDays: 5 },
  ],
  "Re-engagement": [
    { subject: "We miss you!", previewText: "It's been a while", body: "Hey! We noticed you haven't been around lately...", delayDays: 0 },
    { subject: "Look what's new", previewText: "A lot has changed", body: "Since you've been away, we've added some exciting features...", delayDays: 3 },
    { subject: "Last chance: exclusive comeback offer", previewText: "This won't last", body: "We'd love to have you back. Here's a special offer just for you...", delayDays: 7 },
  ],
};

function emptyEmail(delay: number = 0): SequenceEmail {
  return { id: generateId(), subject: "", previewText: "", body: "", delayDays: delay };
}

export default function SequenceBuilderPage() {
  const [seqName, setSeqName] = useState("My Sequence");
  const [seqType, setSeqType] = useState("Welcome");
  const [emails, setEmails] = useState<SequenceEmail[]>([emptyEmail()]);
  const [saved, setSaved, hydrated] = useLocalStorage<Sequence[]>("email-sequences", []);
  const [showSaved, setShowSaved] = useState(false);

  const handleLoadPreset = useCallback((type: string) => {
    setSeqType(type);
    const preset = PRESETS[type];
    if (preset) {
      setEmails(preset.map(p => ({ ...p, id: generateId() })));
      setSeqName(`${type} Sequence`);
    }
  }, []);

  const updateEmail = useCallback((id: string, field: keyof SequenceEmail, value: string | number) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  }, []);

  const addEmail = useCallback(() => {
    const lastDelay = emails[emails.length - 1]?.delayDays || 0;
    setEmails(prev => [...prev, emptyEmail(lastDelay + 2)]);
  }, [emails]);

  const removeEmail = useCallback((id: string) => {
    setEmails(prev => prev.length > 1 ? prev.filter(e => e.id !== id) : prev);
  }, []);

  const handleSave = useCallback(() => {
    const seq: Sequence = { id: generateId(), name: seqName.trim() || "Untitled", type: seqType, emails, savedAt: new Date().toISOString() };
    setSaved(prev => [seq, ...prev.slice(0, 19)]);
  }, [seqName, seqType, emails, setSaved]);

  const loadSeq = (s: Sequence) => { setSeqName(s.name); setSeqType(s.type); setEmails(s.emails); setShowSaved(false); };

  if (!hydrated) return null;

  const totalDays = emails.reduce((max, e) => Math.max(max, e.delayDays), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Sequence Builder"
        description="Build drip email sequences with delays, templates, and flow preview."
        icon={GitBranch}
        badge="Free"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSaved(!showSaved)}>Saved ({saved.length})</Button>
            <Button variant="outline" size="sm" onClick={handleSave}><Save className="h-4 w-4" /> Save</Button>
          </div>
        }
      />

      {showSaved ? (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Saved Sequences</CardTitle></CardHeader>
          <CardContent>
            {saved.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No saved sequences.</p> : (
              <div className="space-y-2">
                {saved.map(s => (
                  <div key={s.id} className="rounded-lg border p-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer" onClick={() => loadSeq(s)}>
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.emails.length} emails | {s.type}</p>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={e => { e.stopPropagation(); setSaved(prev => prev.filter(x => x.id !== s.id)); }}>
                      <Trash2 className="h-3 w-3 text-red-500" />
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
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sequence Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Sequence Name</Label>
                <Input value={seqName} onChange={e => setSeqName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Type (click to load preset)</Label>
                <div className="flex flex-wrap gap-2">
                  {SEQUENCE_TYPES.map(t => (
                    <button key={t} onClick={() => handleLoadPreset(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${seqType === t ? "border-violet-500 bg-violet-500/10 text-violet-600" : "border-border hover:border-violet-300"}`}
                    >{t}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <Badge variant="secondary">{emails.length} emails</Badge>
                <Badge variant="secondary">~{totalDays} day span</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-1">
            {emails.map((email, i) => (
              <div key={email.id}>
                {i > 0 && (
                  <div className="flex items-center justify-center py-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ArrowDown className="h-4 w-4" />
                      <Clock className="h-3 w-3" />
                      <span>Wait {email.delayDays} day{email.delayDays !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                )}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Email {i + 1} {i === 0 ? "(Trigger)" : ""}</CardTitle>
                      <Button variant="ghost" size="icon-sm" onClick={() => removeEmail(email.id)} disabled={emails.length <= 1}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {i > 0 && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Delay (days after previous)</Label>
                        <Input type="number" min={0} value={email.delayDays} onChange={e => updateEmail(email.id, "delayDays", Number(e.target.value) || 0)} className="w-24" />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Subject Line</Label>
                      <Input placeholder="Email subject..." value={email.subject} onChange={e => updateEmail(email.id, "subject", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Preview Text</Label>
                      <Input placeholder="Preview text..." value={email.previewText} onChange={e => updateEmail(email.id, "previewText", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Email Body</Label>
                      <Textarea rows={3} placeholder="Email content..." value={email.body} onChange={e => updateEmail(email.id, "body", e.target.value)} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full" onClick={addEmail}>
            <Plus className="h-4 w-4" /> Add Email to Sequence
          </Button>
        </>
      )}
    </div>
  );
}
