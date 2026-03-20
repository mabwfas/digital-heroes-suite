"use client";

import { useState, useMemo } from "react";
import {
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Star,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface Competitor {
  id: string;
  name: string;
  price: number;
  pricePeriod: string;
  features: string[];
}

export default function PriceComparisonPage() {
  const [competitors, setCompetitors] = useLocalStorage<Competitor[]>("price-comparison-data", []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", price: 0, pricePeriod: "month", features: "" });

  const allFeatures = useMemo(() => {
    const set = new Set<string>();
    competitors.forEach((c) => c.features.forEach((f) => set.add(f.toLowerCase().trim())));
    return Array.from(set).sort();
  }, [competitors]);

  const uniqueFeatures = useMemo(() => {
    const map = new Map<string, string[]>();
    competitors.forEach((c) => {
      c.features.forEach((f) => {
        const key = f.toLowerCase().trim();
        const others = competitors.filter((o) => o.id !== c.id && o.features.some((of) => of.toLowerCase().trim() === key));
        if (others.length === 0) {
          const existing = map.get(c.id) || [];
          existing.push(f);
          map.set(c.id, existing);
        }
      });
    });
    return map;
  }, [competitors]);

  const priceStats = useMemo(() => {
    if (competitors.length === 0) return null;
    const prices = competitors.map((c) => c.price).sort((a, b) => a - b);
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
    const median = prices.length % 2 === 0
      ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
      : prices[Math.floor(prices.length / 2)];
    return { min: prices[0], max: prices[prices.length - 1], avg, median };
  }, [competitors]);

  function openAdd() {
    setForm({ name: "", price: 0, pricePeriod: "month", features: "" });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(c: Competitor) {
    setForm({ name: c.name, price: c.price, pricePeriod: c.pricePeriod, features: c.features.join("\n") });
    setEditingId(c.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    const features = form.features.split("\n").map((f) => f.trim()).filter(Boolean);
    if (editingId) {
      setCompetitors((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, name: form.name, price: form.price, pricePeriod: form.pricePeriod, features } : c))
      );
    } else {
      setCompetitors((prev) => [
        ...prev,
        { id: generateId(), name: form.name, price: form.price, pricePeriod: form.pricePeriod, features },
      ]);
    }
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Price Comparison Tool"
        description="Compare competitor services, features, and find your pricing sweet spot"
        icon={DollarSign}
        badge="Research"
        replaces="Spreadsheets / Notion tables"
        actions={
          <Button
            onClick={openAdd}
            className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Competitor
          </Button>
        }
      />

      {/* Price Stats */}
      {priceStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Lowest Price", value: `$${priceStats.min}`, icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Highest Price", value: `$${priceStats.max}`, icon: TrendingUp, color: "text-red-600 dark:text-red-400" },
            { label: "Average Price", value: `$${priceStats.avg.toFixed(0)}`, icon: DollarSign, color: "text-violet-600 dark:text-violet-400" },
            { label: "Sweet Spot (Median)", value: `$${priceStats.median.toFixed(0)}`, icon: Sparkles, color: "text-amber-600 dark:text-amber-400" },
          ].map((s) => (
            <Card key={s.label} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center">
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                </div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {competitors.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center mb-4">
              <DollarSign className="h-7 w-7 text-violet-400" />
            </div>
            <p className="font-medium text-muted-foreground mb-1">No competitors added</p>
            <p className="text-sm text-muted-foreground/70">Add competitor services to start comparing</p>
            <Button onClick={openAdd} className="mt-4" variant="outline">
              <Plus className="h-4 w-4 mr-2" /> Add First Competitor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Comparison Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Feature Comparison Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Feature</th>
                      {competitors.map((c) => (
                        <th key={c.id} className="text-center py-2 px-3 font-medium min-w-[120px]">
                          <div>{c.name}</div>
                          <div className="text-xs font-normal text-muted-foreground">${c.price}/{c.pricePeriod}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allFeatures.map((feature) => (
                      <tr key={feature} className="border-b border-border/30">
                        <td className="py-2 px-3 text-sm">{feature}</td>
                        {competitors.map((c) => {
                          const has = c.features.some((f) => f.toLowerCase().trim() === feature);
                          return (
                            <td key={c.id} className="text-center py-2 px-3">
                              {has ? (
                                <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Unique Features */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitors.map((c) => {
              const unique = uniqueFeatures.get(c.id) || [];
              return (
                <Card key={c.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-lg font-bold text-violet-600 dark:text-violet-400">${c.price}<span className="text-xs text-muted-foreground font-normal">/{c.pricePeriod}</span></p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">{c.features.length} features total</p>
                      {unique.length > 0 && (
                        <div>
                          <p className="text-xs font-medium flex items-center gap-1 mb-1">
                            <Star className="h-3 w-3 text-amber-500" /> Unique Features
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {unique.map((f) => (
                              <Badge key={f} className="text-[10px] bg-amber-500/10 text-amber-600 border-0">{f}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Competitor" : "Add Competitor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Service Name *</Label>
              <Input
                placeholder="e.g., Competitor X"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.price || ""}
                  onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Period</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={form.pricePeriod}
                  onChange={(e) => setForm((f) => ({ ...f, pricePeriod: e.target.value }))}
                >
                  <option value="month">Per Month</option>
                  <option value="year">Per Year</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Features (one per line)</Label>
              <Textarea
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                value={form.features}
                onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                rows={6}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0"
            >
              {editingId ? "Save Changes" : "Add Competitor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
