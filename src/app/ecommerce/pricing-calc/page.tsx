"use client";

import { useState } from "react";
import { Calculator, DollarSign, TrendingUp, Copy, Check, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocalStorage } from "@/lib/hooks";

interface BundleTier {
  qty: number;
  discount: number;
}

const CURRENCIES: { code: string; symbol: string; label: string }[] = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "\u20AC", label: "Euro" },
  { code: "GBP", symbol: "\u00A3", label: "British Pound" },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "JPY", symbol: "\u00A5", label: "Japanese Yen" },
  { code: "INR", symbol: "\u20B9", label: "Indian Rupee" },
];

const MARGIN_TIERS = [20, 30, 40, 50, 60];

function fmt(val: number, sym: string, decimals = 2): string {
  return `${sym}${val.toFixed(decimals)}`;
}

function psychPrice(price: number): number {
  if (price < 1) return price;
  if (price < 10) return Math.floor(price) - 0.01 + (price % 1 > 0.5 ? 1 : 0);
  const base = Math.ceil(price);
  return base - 0.01;
}

export default function PricingCalcPage() {
  const [savedConfigs, setSavedConfigs] = useLocalStorage<{ label: string; cost: number; shipping: number; packaging: number }[]>("ecommerce-pricing-saved", []);

  const [productCost, setProductCost] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [packagingCost, setPackagingCost] = useState("");
  const [desiredMargin, setDesiredMargin] = useState("40");
  const [platformFee, setPlatformFee] = useState("2.9");
  const [paymentFee, setPaymentFee] = useState("0.30");
  const [competitorPrice, setCompetitorPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [bundleTiers, setBundleTiers] = useState<BundleTier[]>([
    { qty: 2, discount: 5 },
    { qty: 5, discount: 10 },
    { qty: 10, discount: 15 },
  ]);

  const [copied, setCopied] = useState(false);

  const sym = CURRENCIES.find(c => c.code === currency)?.symbol || "$";

  const cost = parseFloat(productCost) || 0;
  const ship = parseFloat(shippingCost) || 0;
  const pack = parseFloat(packagingCost) || 0;
  const margin = parseFloat(desiredMargin) || 0;
  const platFee = parseFloat(platformFee) || 0;
  const payFee = parseFloat(paymentFee) || 0;
  const compPrice = parseFloat(competitorPrice) || 0;

  const totalCost = cost + ship + pack;
  const breakEven = totalCost > 0 ? totalCost / (1 - platFee / 100) + payFee : 0;
  const suggestedPrice = totalCost > 0 ? totalCost / (1 - (margin + platFee) / 100) + payFee : 0;
  const profitPerUnit = suggestedPrice - totalCost - (suggestedPrice * platFee / 100) - payFee;
  const roi = totalCost > 0 ? (profitPerUnit / totalCost) * 100 : 0;

  const calcForMargin = (m: number) => {
    if (totalCost === 0) return { price: 0, profit: 0, roi: 0 };
    const p = totalCost / (1 - (m + platFee) / 100) + payFee;
    const prof = p - totalCost - (p * platFee / 100) - payFee;
    return { price: p, profit: prof, roi: totalCost > 0 ? (prof / totalCost) * 100 : 0 };
  };

  const calcBundle = (tier: BundleTier) => {
    const unitPrice = suggestedPrice * (1 - tier.discount / 100);
    const bundleTotal = unitPrice * tier.qty;
    const savingsPerUnit = suggestedPrice - unitPrice;
    return { unitPrice, bundleTotal, savingsPerUnit };
  };

  const updateBundleTier = (idx: number, field: keyof BundleTier, val: string) => {
    setBundleTiers(prev => prev.map((t, i) => i === idx ? { ...t, [field]: parseFloat(val) || 0 } : t));
  };

  const addBundleTier = () => {
    setBundleTiers(prev => [...prev, { qty: prev.length + 2, discount: (prev.length + 1) * 5 }]);
  };

  const removeBundleTier = (idx: number) => {
    setBundleTiers(prev => prev.filter((_, i) => i !== idx));
  };

  const copySummary = async () => {
    const lines = [
      `Pricing Summary`,
      `Total Cost: ${fmt(totalCost, sym)}`,
      `Break-Even: ${fmt(breakEven, sym)}`,
      `Suggested Price (${margin}% margin): ${fmt(suggestedPrice, sym)}`,
      `Profit/Unit: ${fmt(profitPerUnit, sym)}`,
      `ROI: ${roi.toFixed(1)}%`,
      `Psychological Price: ${fmt(psychPrice(suggestedPrice), sym)}`,
      compPrice > 0 ? `Competitor Price: ${fmt(compPrice, sym)} (${suggestedPrice < compPrice ? "You're cheaper" : suggestedPrice > compPrice ? "You're more expensive" : "Same price"})` : "",
    ].filter(Boolean).join("\n");
    await navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing Strategy Calculator"
        description="Calculate optimal pricing with margin analysis, bundle discounts, and competitor comparison."
        icon={Calculator}
        badge="E-Commerce"
        replaces="Excel Pricing Sheets"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Cost Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Product Cost ({sym})</Label>
                <Input type="number" min="0" step="0.01" value={productCost} onChange={e => setProductCost(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Shipping Cost ({sym})</Label>
                <Input type="number" min="0" step="0.01" value={shippingCost} onChange={e => setShippingCost(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Packaging Cost ({sym})</Label>
                <Input type="number" min="0" step="0.01" value={packagingCost} onChange={e => setPackagingCost(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Desired Margin (%)</Label>
                <Input type="number" min="0" max="95" step="1" value={desiredMargin} onChange={e => setDesiredMargin(e.target.value)} placeholder="40" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Platform Fee (%)</Label>
                <Input type="number" min="0" step="0.1" value={platformFee} onChange={e => setPlatformFee(e.target.value)} placeholder="2.9" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Payment Processor Fee ({sym})</Label>
                <Input type="number" min="0" step="0.01" value={paymentFee} onChange={e => setPaymentFee(e.target.value)} placeholder="0.30" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Competitor Price ({sym})</Label>
                <Input type="number" min="0" step="0.01" value={competitorPrice} onChange={e => setCompetitorPrice(e.target.value)} placeholder="Optional" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Currency</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-1.5">
                {CURRENCIES.map(c => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                      currency === c.code
                        ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {c.symbol} {c.code}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Break-Even", value: fmt(breakEven, sym), icon: DollarSign, color: "text-amber-500" },
              { label: "Suggested Price", value: fmt(suggestedPrice, sym), icon: TrendingUp, color: "text-emerald-500" },
              { label: "Profit / Unit", value: fmt(profitPerUnit, sym), icon: BarChart3, color: "text-blue-500" },
              { label: "ROI", value: `${roi.toFixed(1)}%`, icon: TrendingUp, color: "text-violet-500" },
            ].map(item => (
              <Card key={item.label}>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                  </div>
                  <p className="text-lg font-bold">{totalCost > 0 ? item.value : "-"}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Psychological Pricing */}
          {totalCost > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Psychological Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Calculated</p>
                    <p className="text-lg font-mono">{fmt(suggestedPrice, sym)}</p>
                  </div>
                  <span className="text-muted-foreground">&rarr;</span>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Suggested</p>
                    <p className="text-lg font-mono font-bold text-emerald-600">{fmt(psychPrice(suggestedPrice), sym)}</p>
                  </div>
                  {compPrice > 0 && (
                    <>
                      <span className="text-muted-foreground">vs</span>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Competitor</p>
                        <p className="text-lg font-mono">{fmt(compPrice, sym)}</p>
                      </div>
                      <Badge variant={suggestedPrice <= compPrice ? "secondary" : "destructive"}>
                        {suggestedPrice < compPrice
                          ? `${fmt(compPrice - suggestedPrice, sym)} cheaper`
                          : suggestedPrice > compPrice
                          ? `${fmt(suggestedPrice - compPrice, sym)} more`
                          : "Same price"}
                      </Badge>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Margin Comparison Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Margin Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              {totalCost === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Enter cost inputs to see margin comparison.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Margin</TableHead>
                      <TableHead>Retail Price</TableHead>
                      <TableHead>Profit/Unit</TableHead>
                      <TableHead>ROI</TableHead>
                      <TableHead>Psych. Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MARGIN_TIERS.map(m => {
                      const r = calcForMargin(m);
                      const isSelected = m === margin;
                      return (
                        <TableRow key={m} className={isSelected ? "bg-violet-500/5" : ""}>
                          <TableCell>
                            <span className={isSelected ? "font-bold" : ""}>{m}%</span>
                            {isSelected && <Badge variant="secondary" className="ml-2 text-[10px]">Selected</Badge>}
                          </TableCell>
                          <TableCell className="font-mono">{fmt(r.price, sym)}</TableCell>
                          <TableCell className={`font-mono ${r.profit >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                            {fmt(r.profit, sym)}
                          </TableCell>
                          <TableCell className="font-mono">{r.roi.toFixed(1)}%</TableCell>
                          <TableCell className="font-mono">{fmt(psychPrice(r.price), sym)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Bundle Pricing */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Bundle Pricing</CardTitle>
                <Button size="sm" variant="outline" onClick={addBundleTier}>+ Add Tier</Button>
              </div>
            </CardHeader>
            <CardContent>
              {totalCost === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Enter cost inputs to calculate bundles.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Qty</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Bundle Total</TableHead>
                      <TableHead>Savings/Unit</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>1</TableCell>
                      <TableCell>0%</TableCell>
                      <TableCell className="font-mono">{fmt(suggestedPrice, sym)}</TableCell>
                      <TableCell className="font-mono">{fmt(suggestedPrice, sym)}</TableCell>
                      <TableCell className="font-mono">-</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    {bundleTiers.map((tier, idx) => {
                      const b = calcBundle(tier);
                      return (
                        <TableRow key={idx}>
                          <TableCell>
                            <Input
                              type="number"
                              min="2"
                              className="w-16 h-7 text-xs"
                              value={tier.qty}
                              onChange={e => updateBundleTier(idx, "qty", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                max="90"
                                className="w-16 h-7 text-xs"
                                value={tier.discount}
                                onChange={e => updateBundleTier(idx, "discount", e.target.value)}
                              />
                              <span className="text-xs text-muted-foreground">%</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{fmt(b.unitPrice, sym)}</TableCell>
                          <TableCell className="font-mono">{fmt(b.bundleTotal, sym)}</TableCell>
                          <TableCell className="font-mono text-emerald-600">{fmt(b.savingsPerUnit, sym)}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost" onClick={() => removeBundleTier(idx)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                              &times;
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {totalCost > 0 && (
            <Button onClick={copySummary} variant="outline" className="w-full">
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? "Copied!" : "Copy Pricing Summary"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
