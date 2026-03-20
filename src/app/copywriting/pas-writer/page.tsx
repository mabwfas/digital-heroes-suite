"use client";

import { useState, useCallback } from "react";
import { AlertTriangle, Copy, RefreshCw, Trash2, History, X, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface PasCopy {
  id: string;
  variant: number;
  problem: string;
  agitate: string;
  solve: string;
}

interface SavedPas {
  id: string;
  painPoint: string;
  copies: PasCopy[];
  createdAt: string;
}

function generatePas(pain: string, product: string, audience: string): PasCopy[] {
  const variants = [
    {
      problem: `Are you tired of ${pain}? You're not alone. Thousands of ${audience || "people"} face this exact frustration every single day.`,
      agitate: `The longer you ignore ${pain}, the worse it gets. It drains your energy, wastes your time, and holds you back from achieving what you truly deserve. Every day without a solution is another day lost.`,
      solve: `That's exactly why ${product || "our solution"} exists. It eliminates ${pain} so you can focus on what actually matters. Start today and see the difference immediately.`,
    },
    {
      problem: `${pain} is one of the biggest challenges ${audience || "professionals"} face today. And most people just accept it as "the way things are."`,
      agitate: `But here's the truth: every moment you spend dealing with ${pain} is a moment you could be spending on growth, results, and real progress. The cost of inaction is far greater than you think.`,
      solve: `${product || "Our product"} was built specifically to solve ${pain} once and for all. No workarounds, no compromises. Just a clean, effective solution that works from day one.`,
    },
    {
      problem: `Let's be honest: ${pain} is frustrating, expensive, and it's not going away on its own.`,
      agitate: `You've probably tried everything. Quick fixes, workarounds, maybe even ignoring it completely. But ${pain} keeps coming back, costing you time, money, and peace of mind.`,
      solve: `Introducing ${product || "a better way"}. Purpose-built to eliminate ${pain} for ${audience || "people like you"}. Join the thousands who've already made the switch.`,
    },
  ];
  return variants.map((v, i) => ({ id: generateId(), variant: i + 1, ...v }));
}

export default function PasWriterPage() {
  const [pain, setPain] = useState("");
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [copies, setCopies] = useState<PasCopy[]>([]);
  const [saved, setSaved, hydrated] = useLocalStorage<SavedPas[]>("pas-copies", []);
  const [showSaved, setShowSaved] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const generate = useCallback(() => {
    if (!pain.trim()) return;
    setCopies(generatePas(pain, product, audience));
  }, [pain, product, audience]);

  const copyFull = useCallback((c: PasCopy) => {
    const text = `PROBLEM:\n${c.problem}\n\nAGITATE:\n${c.agitate}\n\nSOLVE:\n${c.solve}`;
    navigator.clipboard.writeText(text);
    setCopied(c.id);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  const handleSave = useCallback(() => {
    if (copies.length === 0) return;
    setSaved((prev) => [{ id: generateId(), painPoint: pain, copies, createdAt: new Date().toISOString() }, ...prev.slice(0, 19)]);
  }, [copies, pain, setSaved]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="PAS Copy Writer"
        description="Generate Problem-Agitate-Solve copy. Input a pain point and get multiple persuasive variants."
        icon={AlertTriangle}
        badge="Copywriting"
        actions={
          <Button variant="outline" size="sm" onClick={() => setShowSaved(!showSaved)}>
            <History className="h-4 w-4" /> Library ({saved.length})
          </Button>
        }
      />

      {showSaved ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Saved PAS Copy</CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowSaved(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {saved.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No saved copy yet.</p>
            ) : (
              <div className="space-y-3">
                {saved.map((s) => (
                  <div key={s.id} className="border rounded-lg p-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="font-medium text-sm">{s.painPoint}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.copies.length} variants</p>
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
            <CardHeader className="pb-3"><CardTitle className="text-base">Pain Point Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Pain Point / Problem *</Label>
                <Textarea placeholder="e.g. Spending hours on manual data entry every week" value={pain} onChange={(e) => setPain(e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Product / Solution</Label>
                  <Input placeholder="e.g. AutoData Pro" value={product} onChange={(e) => setProduct(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Target Audience</Label>
                  <Input placeholder="e.g. Operations managers" value={audience} onChange={(e) => setAudience(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={generate} disabled={!pain.trim()}>
                  <RefreshCw className="h-4 w-4" />Generate PAS Copy
                </Button>
                {copies.length > 0 && <Button variant="outline" onClick={handleSave}>Save to Library</Button>}
              </div>
            </CardContent>
          </Card>

          {copies.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              {copies.map((c) => (
                <Card key={c.id} className="border-border/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Variant {c.variant}</CardTitle>
                      <Button variant="ghost" size="icon-sm" onClick={() => copyFull(c)}>
                        <Copy className={`h-3.5 w-3.5 ${copied === c.id ? "text-emerald-500" : ""}`} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(["problem", "agitate", "solve"] as const).map((step) => (
                      <div key={step}>
                        <Badge variant="secondary" className={`text-[10px] mb-1 capitalize ${step === "problem" ? "bg-red-500/10 text-red-600" : step === "agitate" ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}`}>{step}</Badge>
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
