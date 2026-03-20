"use client";

import { useState, useCallback } from "react";
import { PenLine, Copy, RefreshCw, Trash2, History, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type Tone = "professional" | "casual" | "urgent" | "friendly" | "luxurious";
type Length = "short" | "medium" | "long";

interface AidaCopy {
  id: string;
  length: Length;
  attention: string;
  interest: string;
  desire: string;
  action: string;
}

interface SavedCopy {
  id: string;
  product: string;
  audience: string;
  tone: Tone;
  copies: AidaCopy[];
  createdAt: string;
}

const TONE_LABELS: Record<Tone, string> = {
  professional: "Professional", casual: "Casual", urgent: "Urgent", friendly: "Friendly", luxurious: "Luxurious",
};

function generateAida(product: string, audience: string, usp: string, tone: Tone): AidaCopy[] {
  const toneAdj: Record<Tone, { hook: string; style: string; cta: string }> = {
    professional: { hook: "Discover how", style: "Our solution", cta: "Schedule a consultation today" },
    casual: { hook: "Ever wondered why", style: "Here's the thing", cta: "Give it a try" },
    urgent: { hook: "Don't miss out.", style: "Time is running out.", cta: "Act now before it's too late" },
    friendly: { hook: "Hey there!", style: "We totally get it", cta: "Come join us" },
    luxurious: { hook: "Introducing an exquisite", style: "Crafted with precision", cta: "Experience the difference" },
  };
  const t = toneAdj[tone];
  const lengths: { key: Length; mul: number }[] = [
    { key: "short", mul: 1 },
    { key: "medium", mul: 2 },
    { key: "long", mul: 3 },
  ];

  return lengths.map(({ key, mul }) => {
    const extra = mul > 1 ? ` ${audience} have been searching for a better way to achieve their goals.` : "";
    const extraDesire = mul > 2 ? ` With ${usp || product}, you get a proven approach that delivers real, measurable results every single time.` : "";
    return {
      id: generateId(),
      length: key,
      attention: `${t.hook} ${product} is transforming the way ${audience} approach their biggest challenges.${mul > 1 ? ` What if you could unlock the full potential of ${product}?` : ""}`,
      interest: `${t.style} provides ${usp || "an unmatched advantage"} that sets it apart from everything else on the market.${extra}`,
      desire: `Imagine achieving your goals faster and with less effort. ${product} makes that possible by delivering ${usp || "exceptional results"} consistently.${extraDesire}`,
      action: `${t.cta}. Start using ${product} and see the difference for yourself.${mul > 1 ? " Join thousands of satisfied customers." : ""}`,
    };
  });
}

export default function AidaWriterPage() {
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [usp, setUsp] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [copies, setCopies] = useState<AidaCopy[]>([]);
  const [saved, setSaved, hydrated] = useLocalStorage<SavedCopy[]>("aida-copies", []);
  const [showSaved, setShowSaved] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const generate = useCallback(() => {
    if (!product.trim()) return;
    setCopies(generateAida(product, audience || "your customers", usp, tone));
  }, [product, audience, usp, tone]);

  const copyFull = useCallback((c: AidaCopy) => {
    const text = `ATTENTION:\n${c.attention}\n\nINTEREST:\n${c.interest}\n\nDESIRE:\n${c.desire}\n\nACTION:\n${c.action}`;
    navigator.clipboard.writeText(text);
    setCopied(c.id);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  const handleSave = useCallback(() => {
    if (copies.length === 0) return;
    setSaved((prev) => [{ id: generateId(), product, audience, tone, copies, createdAt: new Date().toISOString() }, ...prev.slice(0, 19)]);
  }, [copies, product, audience, tone, setSaved]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AIDA Copy Writer"
        description="Generate Attention-Interest-Desire-Action copy in 3 length variants with tone control."
        icon={PenLine}
        badge="Copywriting"
        actions={
          <Button variant="outline" size="sm" onClick={() => setShowSaved(!showSaved)}>
            <History className="h-4 w-4" />
            Saved ({saved.length})
          </Button>
        }
      />

      {showSaved ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Saved AIDA Copy</CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowSaved(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {saved.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No saved copy yet.</p>
            ) : (
              <div className="space-y-3">
                {saved.map((s) => (
                  <div key={s.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{s.product}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">{TONE_LABELS[s.tone]}</Badge>
                        <Button variant="ghost" size="icon-sm" onClick={() => setSaved((p) => p.filter((x) => x.id !== s.id))}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{s.copies[0]?.attention}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Product / Service Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Product / Service *</Label>
                  <Input placeholder="e.g. CloudSync Pro" value={product} onChange={(e) => setProduct(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Target Audience</Label>
                  <Input placeholder="e.g. SaaS founders" value={audience} onChange={(e) => setAudience(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Unique Selling Point</Label>
                  <Textarea placeholder="What makes this special?" value={usp} onChange={(e) => setUsp(e.target.value)} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(TONE_LABELS) as [Tone, string][]).map(([k, l]) => (
                        <SelectItem key={k} value={k}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={generate} disabled={!product.trim()}>
                  <RefreshCw className="h-4 w-4" />Generate AIDA Copy
                </Button>
                {copies.length > 0 && <Button variant="outline" onClick={handleSave}>Save</Button>}
              </div>
            </CardContent>
          </Card>

          {copies.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              {copies.map((c) => (
                <Card key={c.id} className="border-border/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm capitalize">{c.length} Version</CardTitle>
                      <Button variant="ghost" size="icon-sm" onClick={() => copyFull(c)}>
                        <Copy className={`h-3.5 w-3.5 ${copied === c.id ? "text-emerald-500" : ""}`} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(["attention", "interest", "desire", "action"] as const).map((step) => (
                      <div key={step}>
                        <Badge variant="secondary" className="text-[10px] mb-1 capitalize">{step}</Badge>
                        <p className="text-xs text-muted-foreground leading-relaxed">{c[step]}</p>
                      </div>
                    ))}
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
