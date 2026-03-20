"use client";

import { useState, useMemo } from "react";
import { DollarSign, Plus, Trash2, TrendingUp, Calculator, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface PricingItem {
  id: string;
  name: string;
  cost: number;
  desiredMargin: number;
  competitorPrices: number[];
  createdAt: string;
}

interface BulkItem {
  id: string;
  name: string;
  currentPrice: number;
  adjustPercent: number;
}

export default function PriceOptimizerPage() {
  const [items, setItems] = useLocalStorage<PricingItem[]>("products-pricing", []);
  const [bulkItems, setBulkItems] = useLocalStorage<BulkItem[]>("products-pricing-bulk", []);
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [margin, setMargin] = useState("40");
  const [competitors, setCompetitors] = useState("");
  const [bulkAdjust, setBulkAdjust] = useState("10");

  function addItem() {
    if (!name.trim() || !cost) return;
    const compPrices = competitors
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);
    const item: PricingItem = {
      id: generateId(),
      name: name.trim(),
      cost: parseFloat(cost) || 0,
      desiredMargin: parseFloat(margin) || 40,
      competitorPrices: compPrices,
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => [item, ...prev]);
    setName("");
    setCost("");
    setCompetitors("");
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function getOptimalPrice(item: PricingItem) {
    const marginPrice = item.cost / (1 - item.desiredMargin / 100);
    if (item.competitorPrices.length === 0) return marginPrice;
    const avgComp = item.competitorPrices.reduce((a, b) => a + b, 0) / item.competitorPrices.length;
    const minComp = Math.min(...item.competitorPrices);
    const suggested = (marginPrice * 0.4 + avgComp * 0.4 + (minComp - 0.01) * 0.2);
    return Math.max(suggested, marginPrice);
  }

  function addBulkItem() {
    setBulkItems((prev) => [
      ...prev,
      { id: generateId(), name: "", currentPrice: 0, adjustPercent: parseFloat(bulkAdjust) || 10 },
    ]);
  }

  function updateBulkItem(id: string, field: keyof BulkItem, value: string | number) {
    setBulkItems((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  }

  function removeBulkItem(id: string) {
    setBulkItems((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dynamic Pricing Tool"
        description="Input cost and desired margin, compare vs competitor prices, get optimal price suggestions and bulk adjustments."
        icon={DollarSign}
        badge="Products"
        replaces="Spreadsheet pricing"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            <Calculator className="h-4 w-4 inline mr-2" />Price Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label>Product Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" />
            </div>
            <div className="space-y-1.5">
              <Label>Cost ($)</Label>
              <Input type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Desired Margin (%)</Label>
              <Input type="number" min="0" max="99" value={margin} onChange={(e) => setMargin(e.target.value)} placeholder="40" />
            </div>
            <div className="space-y-1.5">
              <Label>Competitor Prices (comma sep.)</Label>
              <Input value={competitors} onChange={(e) => setCompetitors(e.target.value)} placeholder="29.99, 34.99, 39.99" />
            </div>
          </div>
          <Button onClick={addItem} disabled={!name.trim() || !cost}>
            <Plus className="h-4 w-4 mr-2" />Analyze Price
          </Button>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <div className="grid gap-3">
          {items.map((item) => {
            const marginPrice = item.cost / (1 - item.desiredMargin / 100);
            const optimal = getOptimalPrice(item);
            const actualMargin = ((optimal - item.cost) / optimal) * 100;
            const avgComp = item.competitorPrices.length > 0
              ? item.competitorPrices.reduce((a, b) => a + b, 0) / item.competitorPrices.length
              : null;

            return (
              <Card key={item.id} className="border-border/50 group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="font-semibold">{item.name}</span>
                      <p className="text-sm text-muted-foreground">Cost: ${item.cost.toFixed(2)} &middot; Target Margin: {item.desiredMargin}%</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive opacity-0 group-hover:opacity-100" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-muted/30 border">
                      <p className="text-xs text-muted-foreground mb-1">Margin-Based Price</p>
                      <p className="text-lg font-bold">${marginPrice.toFixed(2)}</p>
                    </div>
                    {avgComp !== null && (
                      <div className="p-3 rounded-lg bg-muted/30 border">
                        <p className="text-xs text-muted-foreground mb-1">Avg Competitor Price</p>
                        <p className="text-lg font-bold">${avgComp.toFixed(2)}</p>
                      </div>
                    )}
                    <div className="p-3 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20">
                      <p className="text-xs text-violet-600 dark:text-violet-400 mb-1 font-medium flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />Optimal Price
                      </p>
                      <p className="text-lg font-bold text-violet-600 dark:text-violet-400">${optimal.toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border">
                      <p className="text-xs text-muted-foreground mb-1">Actual Margin</p>
                      <p className="text-lg font-bold">{actualMargin.toFixed(1)}%</p>
                    </div>
                  </div>
                  {item.competitorPrices.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-xs text-muted-foreground">Competitors:</span>
                      {item.competitorPrices.map((cp, i) => (
                        <Badge key={i} variant="outline" className="text-xs">${cp.toFixed(2)}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Bulk Price Adjustment
          </CardTitle>
          <Button size="sm" variant="outline" onClick={addBulkItem}>
            <Plus className="h-3.5 w-3.5 mr-1" />Add Row
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {bulkItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Add products for bulk price adjustments.</p>
          ) : (
            bulkItems.map((b) => {
              const newPrice = b.currentPrice * (1 + b.adjustPercent / 100);
              return (
                <div key={b.id} className="flex items-center gap-3">
                  <Input value={b.name} onChange={(e) => updateBulkItem(b.id, "name", e.target.value)} placeholder="Product name" className="flex-1" />
                  <Input type="number" min="0" step="0.01" value={b.currentPrice || ""} onChange={(e) => updateBulkItem(b.id, "currentPrice", parseFloat(e.target.value) || 0)} className="w-28" placeholder="Current $" />
                  <Input type="number" value={b.adjustPercent} onChange={(e) => updateBulkItem(b.id, "adjustPercent", parseFloat(e.target.value) || 0)} className="w-20" />
                  <span className="text-xs text-muted-foreground">%</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-bold text-sm w-24">${newPrice.toFixed(2)}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => removeBulkItem(b.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
