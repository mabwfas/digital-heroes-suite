"use client";

import { useState, useMemo } from "react";
import {
  BadgeDollarSign,
  Sparkles,
  Copy,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";

interface PriceResult {
  technique: string;
  description: string;
  formatted: string;
  suggestion: string;
  abTest: string;
}

function applyTechniques(price: number, productName: string): PriceResult[] {
  const name = productName || "Product";
  return [
    {
      technique: "Charm Pricing (.99)",
      description: "Prices ending in 9 feel significantly lower due to left-digit bias",
      formatted: `$${(Math.floor(price) - 0.01).toFixed(2)}`,
      suggestion: `Price ${name} at $${(Math.floor(price) - 0.01).toFixed(2)} instead of $${price.toFixed(2)}`,
      abTest: `Test $${(Math.floor(price) - 0.01).toFixed(2)} vs $${price.toFixed(2)} - expect 8-20% more conversions`,
    },
    {
      technique: "Charm Pricing (.97)",
      description: ".97 ending feels more hand-picked and deliberate than .99",
      formatted: `$${(Math.floor(price) - 0.03).toFixed(2)}`,
      suggestion: `Use $${(Math.floor(price) - 0.03).toFixed(2)} for a more premium feel than .99`,
      abTest: `Test .97 vs .99 ending - .97 can increase trust perception`,
    },
    {
      technique: "Anchoring (Higher First)",
      description: "Show a higher price first to make the actual price feel like a deal",
      formatted: `~~$${(price * 1.5).toFixed(0)}~~ → $${price.toFixed(2)}`,
      suggestion: `Display original price of $${(price * 1.5).toFixed(0)} crossed out next to $${price.toFixed(2)}`,
      abTest: `Test with/without anchor price - anchoring can boost conversions 20-40%`,
    },
    {
      technique: "Decoy Pricing",
      description: "Add a less attractive option to make your target option look better",
      formatted: `Basic: $${(price * 0.6).toFixed(0)} | Pro: $${price.toFixed(0)} | Enterprise: $${(price * 1.1).toFixed(0)}`,
      suggestion: `Create 3 tiers where Pro ($${price.toFixed(0)}) is clearly the best value vs Enterprise ($${(price * 1.1).toFixed(0)})`,
      abTest: `Test 2-tier vs 3-tier with decoy - expect 30-50% shift toward target tier`,
    },
    {
      technique: "Bundling",
      description: "Bundle items together to obscure individual prices and increase AOV",
      formatted: `Bundle: $${(price * 2.5).toFixed(0)} (Save $${(price * 0.5).toFixed(0)})`,
      suggestion: `Bundle ${name} with complementary items at $${(price * 2.5).toFixed(0)} (vs $${(price * 3).toFixed(0)} separately)`,
      abTest: `Test individual pricing vs bundle - bundles increase AOV 20-35%`,
    },
    {
      technique: "Per-Day Framing",
      description: "Break price into daily cost to make it feel trivial",
      formatted: `Just $${(price / 30).toFixed(2)}/day`,
      suggestion: `Frame ${name} as "Just $${(price / 30).toFixed(2)} per day" instead of $${price.toFixed(2)}/month`,
      abTest: `Test monthly vs daily framing - daily framing reduces price objections`,
    },
    {
      technique: "Remove Dollar Sign",
      description: "Removing currency symbols reduces pain of paying",
      formatted: `${price.toFixed(0)}`,
      suggestion: `Display price as "${price.toFixed(0)}" without the $ symbol (works best in premium contexts)`,
      abTest: `Test with/without $ sign - removal can increase spend 8-12% in premium contexts`,
    },
    {
      technique: "Comparative Value",
      description: "Compare price to a familiar daily expense",
      formatted: `Less than a coffee a day`,
      suggestion: `"${name} costs less than your daily coffee - just $${(price / 30).toFixed(2)}/day"`,
      abTest: `Test with/without comparison - relatable comparisons reduce perceived cost`,
    },
  ];
}

export default function PricePsychologyPage() {
  const [price, setPrice, hydrated] = useLocalStorage<string>("cro-price-psychology-price", "");
  const [productName, setProductName] = useLocalStorage<string>("cro-price-psychology-name", "");
  const [copiedIdx, setCopiedIdx] = useState(-1);

  const results = useMemo(() => {
    const p = parseFloat(price);
    if (!p || p <= 0) return [];
    return applyTechniques(p, productName);
  }, [price, productName]);

  function handleCopy(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(-1), 1500);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing Psychology Tool"
        description="Apply psychological pricing techniques and get A/B test suggestions for your product pricing."
        icon={BadgeDollarSign}
        badge="CRO"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            Enter Your Price
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <div className="space-y-1.5">
              <Label>Current Price ($) *</Label>
              <Input type="number" step="0.01" placeholder="49.00" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Product Name</Label>
              <Input placeholder="Pro Plan" value={productName} onChange={(e) => setProductName(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {results.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <BadgeDollarSign className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Enter a price to see psychological pricing options.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {results.map((r, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-sm">{r.technique}</h3>
                      <Badge className="bg-violet-500/10 text-violet-600 border-0 text-[10px]">Technique {i + 1}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{r.description}</p>

                    <div className="p-3 bg-muted/30 rounded-lg mb-2">
                      <p className="text-lg font-bold text-center">{r.formatted}</p>
                    </div>

                    <p className="text-xs text-foreground mb-1"><strong>Suggestion:</strong> {r.suggestion}</p>
                    <p className="text-xs text-muted-foreground"><strong>A/B Test:</strong> {r.abTest}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleCopy(r.formatted, i)} title="Copy formatted price">
                    <Copy className={`h-3 w-3 ${copiedIdx === i ? "text-emerald-500" : ""}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
