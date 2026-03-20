"use client";

import { useState, useCallback } from "react";
import {
  Mail,
  Plus,
  Trash2,
  Copy,
  Save,
  Eye,
  BookOpen,
  X,
  ChevronDown,
  ChevronRight,
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
import { generateId } from "@/lib/store";

interface EmailStep {
  id: string;
  label: string;
  subject: string;
  body: string;
  delayDays: number;
}

interface Sequence {
  id: string;
  name: string;
  steps: EmailStep[];
  sampleData: Record<string, string>;
  createdAt: string;
}

const TEMPLATE_VARS = ["{name}", "{company}", "{pain_point}", "{solution}"];

const DEFAULT_STEPS: Omit<EmailStep, "id">[] = [
  {
    label: "Email 1: Introduction",
    subject: "Quick question about {company}'s {pain_point}",
    body: "Hi {name},\n\nI noticed that {company} might be dealing with {pain_point}. Many companies in your space face this challenge.\n\nWe have helped similar businesses solve this with {solution}, resulting in measurable improvements.\n\nWould you be open to a quick 15-minute call this week?\n\nBest regards",
    delayDays: 0,
  },
  {
    label: "Email 2: Follow-up",
    subject: "Re: Quick question about {company}'s {pain_point}",
    body: "Hi {name},\n\nI wanted to follow up on my previous email. I understand you are busy, so I will keep this brief.\n\nI have put together a quick case study showing how we helped a company similar to {company} address their {pain_point} using {solution}.\n\nWould you like me to send it over?\n\nBest regards",
    delayDays: 3,
  },
  {
    label: "Email 3: Value-Add",
    subject: "A resource for {company}'s {pain_point} challenge",
    body: "Hi {name},\n\nI came across an interesting insight about {pain_point} in your industry that I thought you might find valuable.\n\nMany leaders at companies like {company} have been implementing {solution} to stay ahead. I would love to share some specific strategies that have worked well.\n\nNo strings attached — just hoping to be helpful. Would a brief chat work for you?\n\nBest regards",
    delayDays: 5,
  },
  {
    label: "Email 4: Final",
    subject: "Last note from me about {pain_point}",
    body: "Hi {name},\n\nI do not want to be a pest, so this will be my last email on this topic.\n\nIf {pain_point} is still on {company}'s radar, I would love to help with {solution}. If the timing is not right, no worries at all.\n\nFeel free to reach out anytime in the future. I am always happy to help.\n\nAll the best",
    delayDays: 7,
  },
];

const DEFAULT_SAMPLE: Record<string, string> = {
  "{name}": "Sarah",
  "{company}": "TechCorp",
  "{pain_point}": "lead generation",
  "{solution}": "our AI-powered outreach platform",
};

function fillTemplate(text: string, data: Record<string, string>): string {
  let result = text;
  Object.entries(data).forEach(([key, value]) => {
    result = result.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
  });
  return result;
}

export default function ColdEmailPage() {
  const [sequences, setSequences, hydrated] = useLocalStorage<Sequence[]>("sales-cold-sequences", []);
  const [name, setName] = useState("New Sequence");
  const [steps, setSteps] = useState<EmailStep[]>(DEFAULT_STEPS.map((s) => ({ ...s, id: generateId() })));
  const [sampleData, setSampleData] = useState<Record<string, string>>({ ...DEFAULT_SAMPLE });
  const [showPreview, setShowPreview] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  function updateStep(stepId: string, updates: Partial<EmailStep>) {
    setSteps((prev) => prev.map((s) => s.id === stepId ? { ...s, ...updates } : s));
  }

  function addStep() {
    setSteps((prev) => [...prev, { id: generateId(), label: `Email ${prev.length + 1}`, subject: "", body: "", delayDays: prev.length * 3 }]);
  }

  function removeStep(stepId: string) { setSteps((prev) => prev.filter((s) => s.id !== stepId)); }

  function saveSequence() {
    const seq: Sequence = { id: generateId(), name: name.trim() || "Untitled", steps: [...steps], sampleData: { ...sampleData }, createdAt: new Date().toISOString() };
    setSequences((prev) => [seq, ...prev]);
  }

  function loadSequence(seq: Sequence) {
    setName(seq.name);
    setSteps(seq.steps.map((s) => ({ ...s, id: generateId() })));
    setSampleData({ ...seq.sampleData });
    setShowLibrary(false);
  }

  function copyEmail(step: EmailStep) {
    const text = showPreview ? `Subject: ${fillTemplate(step.subject, sampleData)}\n\n${fillTemplate(step.body, sampleData)}` : `Subject: ${step.subject}\n\n${step.body}`;
    navigator.clipboard.writeText(text);
    setCopied(step.id);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Cold Email Sequencer" description="Build email sequences with template variables and live preview." icon={Mail} badge="Sales" actions={
        <Button variant="outline" size="sm" onClick={() => setShowLibrary(!showLibrary)}><BookOpen className="h-4 w-4" />Library ({sequences.length})</Button>
      } />

      {showLibrary ? (
        <Card>
          <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base">Saved Sequences</CardTitle><Button variant="ghost" size="icon" onClick={() => setShowLibrary(false)}><X className="h-4 w-4" /></Button></div></CardHeader>
          <CardContent>{sequences.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No saved sequences.</p> : <div className="space-y-2">{sequences.map((s) => (<div key={s.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"><div><p className="text-sm font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.steps.length} emails &middot; {new Date(s.createdAt).toLocaleDateString()}</p></div><div className="flex gap-1"><Button variant="outline" size="sm" onClick={() => loadSequence(s)}>Load</Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSequences((prev) => prev.filter((x) => x.id !== s.id))}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button></div></div>))}</div>}</CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1.5"><Label>Sequence Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}><Eye className="h-3.5 w-3.5" />{showPreview ? "Edit Mode" : "Preview"}</Button>
            <Button variant="outline" size="sm" onClick={addStep}><Plus className="h-3.5 w-3.5" />Add Email</Button>
            <Button size="sm" className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={saveSequence}><Save className="h-3.5 w-3.5" />Save</Button>
          </div>

          {showPreview && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Sample Data</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {TEMPLATE_VARS.map((v) => (
                    <div key={v} className="space-y-1">
                      <Label className="text-xs">{v}</Label>
                      <Input value={sampleData[v] || ""} onChange={(e) => setSampleData((prev) => ({ ...prev, [v]: e.target.value }))} className="h-8 text-xs" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {steps.map((step, idx) => {
              const isExpanded = expandedStep === step.id;
              return (
                <Card key={step.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setExpandedStep(isExpanded ? null : step.id)} className="shrink-0">{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>
                      <Badge variant="secondary" className="text-xs shrink-0">Day {step.delayDays}</Badge>
                      {!isExpanded ? <span className="text-sm font-medium truncate">{step.label}: {showPreview ? fillTemplate(step.subject, sampleData) : step.subject}</span> : <Input value={step.label} onChange={(e) => updateStep(step.id, { label: e.target.value })} className="font-medium" />}
                      <div className="flex gap-1 ml-auto shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyEmail(step)}><Copy className="h-3 w-3" /></Button>
                        {steps.length > 1 && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeStep(step.id)}><Trash2 className="h-3 w-3 text-red-500" /></Button>}
                      </div>
                    </div>
                    {copied === step.id && <p className="text-xs text-emerald-600 mt-1">Copied to clipboard!</p>}
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-4 gap-3">
                        <div className="col-span-3 space-y-1.5"><Label>Subject Line</Label>
                          {showPreview ? <div className="text-sm bg-muted/50 rounded-lg p-2.5">{fillTemplate(step.subject, sampleData)}</div> : <Input value={step.subject} onChange={(e) => updateStep(step.id, { subject: e.target.value })} placeholder="Subject..." />}
                        </div>
                        <div className="space-y-1.5"><Label>Delay (days)</Label><Input type="number" value={step.delayDays} onChange={(e) => updateStep(step.id, { delayDays: parseInt(e.target.value) || 0 })} /></div>
                      </div>
                      <div className="space-y-1.5"><Label>Email Body</Label>
                        {showPreview ? <div className="text-sm bg-muted/50 rounded-lg p-3 whitespace-pre-wrap">{fillTemplate(step.body, sampleData)}</div> : <Textarea value={step.body} onChange={(e) => updateStep(step.id, { body: e.target.value })} rows={8} />}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-xs text-muted-foreground mr-1">Variables:</span>
                        {TEMPLATE_VARS.map((v) => <Badge key={v} variant="secondary" className="text-[10px] cursor-pointer" onClick={() => { if (!showPreview) { const el = document.activeElement as HTMLTextAreaElement; if (el?.tagName === "TEXTAREA") { const start = el.selectionStart; const end = el.selectionEnd; const newVal = el.value.slice(0, start) + v + el.value.slice(end); updateStep(step.id, { body: newVal }); } } }}>{v}</Badge>)}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
