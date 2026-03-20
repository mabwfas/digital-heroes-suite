"use client";

import { useState, useCallback } from "react";
import { Compass, Copy, RefreshCw, Trash2, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface Inputs {
  purpose: string;
  audience: string;
  impact: string;
  values: string;
  aspiration: string;
}

interface Generated {
  mission: string[];
  vision: string[];
  elevator: string[];
}

interface SavedSet {
  id: string;
  inputs: Inputs;
  generated: Generated;
  createdAt: string;
}

const EMPTY: Inputs = { purpose: "", audience: "", impact: "", values: "", aspiration: "" };

function generate(i: Inputs): Generated {
  const p = i.purpose || "make a difference";
  const a = i.audience || "our customers";
  const imp = i.impact || "positive change";
  const v = i.values || "integrity and innovation";
  const asp = i.aspiration || "a better future";

  return {
    mission: [
      `Our mission is to ${p} for ${a} by delivering ${imp} through ${v}.`,
      `We exist to empower ${a} to achieve ${imp}. Guided by ${v}, we are committed to ${p}.`,
      `At our core, we believe in ${p}. We serve ${a} with a commitment to ${v}, driving ${imp} every day.`,
    ],
    vision: [
      `We envision ${asp} where ${a} thrive through ${imp}.`,
      `Our vision is to be the leading force in creating ${asp}, powered by ${v} and unwavering commitment to ${a}.`,
      `We aspire to build ${asp} — a world where ${p} is the standard, not the exception.`,
    ],
    elevator: [
      `We help ${a} ${p} through ${imp}. Built on ${v}, we're creating ${asp}.`,
      `${a} deserve better. That's why we ${p}, delivering ${imp} grounded in ${v}. Our goal? ${asp}.`,
      `Imagine ${asp}. We make it real by helping ${a} ${p} through ${imp}.`,
    ],
  };
}

export default function MissionVisionPage() {
  const [inputs, setInputs] = useState<Inputs>(EMPTY);
  const [result, setResult] = useState<Generated | null>(null);
  const [saved, setSaved, hydrated] = useLocalStorage<SavedSet[]>("mission-vision", []);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = useCallback(() => {
    setResult(generate(inputs));
  }, [inputs]);

  const handleSave = useCallback(() => {
    if (!result) return;
    setSaved((prev) => [{ id: generateId(), inputs, generated: result, createdAt: new Date().toISOString() }, ...prev.slice(0, 9)]);
  }, [result, inputs, setSaved]);

  const copyText = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mission / Vision Generator"
        description="Generate mission statements, vision statements, and elevator pitches with multiple variants."
        icon={Compass}
        badge="Brand"
      />

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Core Inputs</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Purpose (what you do)</Label><Textarea placeholder="e.g. simplify project management" value={inputs.purpose} onChange={(e) => setInputs((i) => ({ ...i, purpose: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label>Target Audience</Label><Input placeholder="e.g. growing startups" value={inputs.audience} onChange={(e) => setInputs((i) => ({ ...i, audience: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label>Impact / Outcome</Label><Input placeholder="e.g. 10x productivity" value={inputs.impact} onChange={(e) => setInputs((i) => ({ ...i, impact: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Core Values</Label><Input placeholder="e.g. transparency, speed" value={inputs.values} onChange={(e) => setInputs((i) => ({ ...i, values: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Long-term Aspiration</Label><Input placeholder="e.g. a world without busywork" value={inputs.aspiration} onChange={(e) => setInputs((i) => ({ ...i, aspiration: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleGenerate}>
              <RefreshCw className="h-4 w-4" />Generate All
            </Button>
            {result && <Button variant="outline" onClick={handleSave}><Save className="h-4 w-4" />Save</Button>}
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-4 md:grid-cols-3">
          {(["mission", "vision", "elevator"] as const).map((type) => (
            <Card key={type}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm capitalize">{type === "elevator" ? "Elevator Pitch" : `${type} Statement`}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result[type].map((text, i) => (
                  <div key={i} className="rounded-lg border p-3 bg-muted/30 group">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Badge variant="secondary" className="text-[10px] mb-1">Variant {i + 1}</Badge>
                        <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                      </div>
                      <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={() => copyText(text, `${type}-${i}`)}>
                        <Copy className={`h-3 w-3 ${copied === `${type}-${i}` ? "text-emerald-500" : ""}`} />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {saved.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Saved Sets</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {saved.map((s) => (
              <div key={s.id} className="border rounded-lg p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.inputs.purpose || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setInputs(s.inputs); setResult(s.generated); }}>Load</Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setSaved((p) => p.filter((x) => x.id !== s.id))}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
