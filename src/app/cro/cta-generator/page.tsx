"use client";

import { useState, useMemo } from "react";
import {
  MousePointerClick,
  RefreshCw,
  Copy,
  Plus,
  Trash2,
  ThumbsUp,
  ThumbsDown,
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

interface CTAVariant {
  id: string;
  text: string;
  clicks: number;
  impressions: number;
}

interface CTATest {
  id: string;
  action: string;
  audience: string;
  urgency: string;
  variants: CTAVariant[];
  createdAt: string;
}

const URGENCY_LEVELS = ["Low", "Medium", "High", "Critical"];

function generateCTAs(action: string, audience: string, urgency: string): string[] {
  const act = action || "Get Started";
  const aud = audience || "customers";

  const templates: string[][] = [
    // Direct
    [`${act} Now`, `${act} Today`, `${act} Free`],
    // Benefit-focused
    [`Yes, I Want to ${act}`, `Show Me How to ${act}`, `Help Me ${act}`],
    // Urgency
    [`${act} Before It's Gone`, `Limited Time: ${act}`, `Don't Miss Out - ${act}`],
    // Social proof
    [`Join 10,000+ ${aud}`, `See Why ${aud} Love This`, `Trusted by ${aud} Worldwide`],
    // Conversational
    [`Let's ${act}`, `Ready to ${act}?`, `I'm Ready to ${act}`],
    // Value
    [`${act} - It's Free`, `Try It Risk-Free`, `Start Your Free Trial`],
  ];

  const urgencyBoosts: Record<string, string[]> = {
    Low: [`Learn More About How to ${act}`, `Discover ${act}`],
    Medium: [`${act} - Limited Spots`, `Claim Your ${act}`],
    High: [`${act} NOW - 50% Off Today Only`, `Last Chance to ${act}`],
    Critical: [`HURRY: ${act} Ends Tonight!`, `Final Hours to ${act}`],
  };

  const all = templates.flat();
  const boost = urgencyBoosts[urgency] || [];
  return [...all, ...boost].slice(0, 10);
}

export default function CtaGeneratorPage() {
  const [tests, setTests, hydrated] = useLocalStorage<CTATest[]>("cro-cta-generator", []);
  const [action, setAction] = useState("");
  const [audience, setAudience] = useState("");
  const [urgency, setUrgency] = useState("Medium");
  const [copiedId, setCopiedId] = useState("");

  function handleGenerate() {
    if (!action.trim()) return;
    const ctaTexts = generateCTAs(action.trim(), audience.trim(), urgency);
    const test: CTATest = {
      id: generateId(),
      action: action.trim(),
      audience: audience.trim(),
      urgency,
      variants: ctaTexts.map((text) => ({ id: generateId(), text, clicks: 0, impressions: 0 })),
      createdAt: new Date().toISOString(),
    };
    setTests((prev) => [test, ...prev]);
    setAction("");
    setAudience("");
  }

  function recordClick(testId: string, variantId: string, type: "clicks" | "impressions") {
    setTests((prev) =>
      prev.map((t) =>
        t.id === testId
          ? { ...t, variants: t.variants.map((v) => (v.id === variantId ? { ...v, [type]: v[type] + 1 } : v)) }
          : t
      )
    );
  }

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 1500);
  }

  function copyCss(text: string) {
    const css = `.cta-button {
  display: inline-block;
  padding: 12px 32px;
  background: linear-gradient(135deg, #7c3aed, #ec4899);
  color: white;
  font-weight: 600;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  text-decoration: none;
}
.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.4);
}
/* Text: "${text}" */`;
    navigator.clipboard.writeText(css);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="CTA Button Generator"
        description="Generate 10 CTA text variations based on your action, audience, and urgency level. Track A/B test performance."
        icon={MousePointerClick}
        badge="CRO"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-violet-500" />
            Generate CTAs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label>Action / Verb *</Label>
              <Input placeholder="Get Started" value={action} onChange={(e) => setAction(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Target Audience</Label>
              <Input placeholder="marketers" value={audience} onChange={(e) => setAudience(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Urgency Level</Label>
              <Select value={urgency} onValueChange={(v) => { if (v) setUrgency(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {URGENCY_LEVELS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="invisible">Go</Label>
              <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleGenerate} disabled={!action.trim()}>
                <RefreshCw className="h-4 w-4" />
                Generate 10 CTAs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {tests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <MousePointerClick className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Enter an action to generate CTA variations.</p>
          </CardContent>
        </Card>
      ) : (
        tests.map((test) => (
          <Card key={test.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{test.action}</CardTitle>
                  <Badge variant="secondary" className="text-[10px]">{test.urgency} urgency</Badge>
                  {test.audience && <Badge variant="secondary" className="text-[10px]">{test.audience}</Badge>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setTests((prev) => prev.filter((x) => x.id !== test.id))}>
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {test.variants.map((v, i) => {
                  const ctr = v.impressions > 0 ? ((v.clicks / v.impressions) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={v.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                      <Badge variant="secondary" className="text-[10px] shrink-0">{i + 1}</Badge>
                      <div className="flex-1 min-w-0">
                        <button
                          className="inline-block px-4 py-1.5 rounded-md text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 transition-all hover:-translate-y-0.5"
                          onClick={() => copyText(v.text, v.id)}
                        >
                          {v.text}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-[10px] text-muted-foreground text-center">
                          <p>CTR: <span className="font-semibold">{ctr}%</span></p>
                          <p>{v.clicks}c / {v.impressions}i</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => recordClick(test.id, v.id, "clicks")} title="Record click">
                          <ThumbsUp className="h-3 w-3 text-emerald-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => recordClick(test.id, v.id, "impressions")} title="Record impression">
                          <ThumbsDown className="h-3 w-3 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyText(v.text, v.id)} title="Copy text">
                          <Copy className={`h-3 w-3 ${copiedId === v.id ? "text-emerald-500" : ""}`} />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => copyCss(v.text)} title="Copy CSS">
                          CSS
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
