"use client";

import { useState, useMemo } from "react";
import { Layers, Plus, Trash2, Download, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface OptionSet {
  id: string;
  name: string;
  values: string[];
}

interface Variant {
  id: string;
  combination: Record<string, string>;
  price: number;
  sku: string;
  inventory: number;
}

export default function VariantBuilderPage() {
  const [options, setOptions] = useLocalStorage<OptionSet[]>("products-variant-options", []);
  const [variants, setVariants] = useLocalStorage<Variant[]>("products-variant-items", []);
  const [basePrice, setBasePrice] = useLocalStorage<number>("products-variant-baseprice", 0);
  const [optName, setOptName] = useState("");
  const [optValues, setOptValues] = useState("");

  function addOption() {
    if (!optName.trim() || !optValues.trim()) return;
    const values = optValues.split(",").map((v) => v.trim()).filter(Boolean);
    if (values.length === 0) return;
    setOptions((prev) => [...prev, { id: generateId(), name: optName.trim(), values }]);
    setOptName("");
    setOptValues("");
  }

  function removeOption(id: string) {
    setOptions((prev) => prev.filter((o) => o.id !== id));
    setVariants([]);
  }

  function generateVariants() {
    if (options.length === 0) return;
    const combos: Record<string, string>[] = [{}];
    for (const opt of options) {
      const next: Record<string, string>[] = [];
      for (const combo of combos) {
        for (const val of opt.values) {
          next.push({ ...combo, [opt.name]: val });
        }
      }
      combos.length = 0;
      combos.push(...next);
    }
    const newVariants: Variant[] = combos.map((combination) => {
      const existing = variants.find(
        (v) => JSON.stringify(v.combination) === JSON.stringify(combination)
      );
      return existing || {
        id: generateId(),
        combination,
        price: basePrice,
        sku: "",
        inventory: 0,
      };
    });
    setVariants(newVariants);
  }

  function updateVariant(id: string, field: keyof Variant, value: string | number) {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  }

  function exportCSV() {
    if (variants.length === 0) return;
    const optionNames = options.map((o) => o.name);
    const headers = [...optionNames, "Price", "SKU", "Inventory"];
    const rows = variants.map((v) => [
      ...optionNames.map((n) => v.combination[n] || ""),
      v.price,
      v.sku,
      v.inventory,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "variants.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Variant Builder"
        description="Define product options, auto-generate all variant combinations with individual pricing, inventory, and SKU fields."
        icon={Layers}
        badge="Products"
        replaces="Manual variant creation"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Product Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 items-end">
            <div className="space-y-1.5 flex-1">
              <Label>Option Name</Label>
              <Input value={optName} onChange={(e) => setOptName(e.target.value)} placeholder="e.g. Size, Color, Material" />
            </div>
            <div className="space-y-1.5 flex-[2]">
              <Label>Values (comma separated)</Label>
              <Input value={optValues} onChange={(e) => setOptValues(e.target.value)} placeholder="e.g. Small, Medium, Large" onKeyDown={(e) => e.key === "Enter" && addOption()} />
            </div>
            <Button onClick={addOption}><Plus className="h-4 w-4 mr-1" />Add</Button>
          </div>
          {options.length > 0 && (
            <div className="space-y-2">
              {options.map((opt) => (
                <div key={opt.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                  <span className="font-medium text-sm">{opt.name}:</span>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {opt.values.map((v, i) => (
                      <Badge key={i} variant="secondary">{v}</Badge>
                    ))}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => removeOption(opt.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label>Base Price ($)</Label>
              <Input type="number" min="0" step="0.01" value={basePrice || ""} onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)} className="w-32" />
            </div>
            <Button onClick={generateVariants} disabled={options.length === 0}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Variants ({options.reduce((acc, o) => acc * o.values.length, 1)} combos)
            </Button>
            <Button variant="outline" onClick={exportCSV} disabled={variants.length === 0}>
              <Download className="h-4 w-4 mr-2" />Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {variants.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Variants ({variants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {options.map((o) => (
                      <th key={o.id} className="text-left p-2 font-medium text-muted-foreground">{o.name}</th>
                    ))}
                    <th className="text-left p-2 font-medium text-muted-foreground">Price ($)</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">SKU</th>
                    <th className="text-left p-2 font-medium text-muted-foreground">Inventory</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v.id} className="border-b border-border/50">
                      {options.map((o) => (
                        <td key={o.id} className="p-2">
                          <Badge variant="outline">{v.combination[o.name]}</Badge>
                        </td>
                      ))}
                      <td className="p-2">
                        <Input type="number" min="0" step="0.01" value={v.price || ""} onChange={(e) => updateVariant(v.id, "price", parseFloat(e.target.value) || 0)} className="w-24 h-8" />
                      </td>
                      <td className="p-2">
                        <Input value={v.sku} onChange={(e) => updateVariant(v.id, "sku", e.target.value)} placeholder="SKU" className="w-32 h-8" />
                      </td>
                      <td className="p-2">
                        <Input type="number" min="0" value={v.inventory || ""} onChange={(e) => updateVariant(v.id, "inventory", parseInt(e.target.value) || 0)} className="w-20 h-8" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
