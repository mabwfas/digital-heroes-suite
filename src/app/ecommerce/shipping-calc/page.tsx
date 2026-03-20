"use client";

import { useState } from "react";
import { Truck, Plus, Trash2, Copy, Check, Info, Package } from "lucide-react";
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
import { generateId } from "@/lib/store";

interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  flatRate: number;
}

const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Germany", "France",
  "Australia", "Japan", "China", "India", "Brazil",
  "Mexico", "South Korea", "Italy", "Spain", "Netherlands",
  "Sweden", "Switzerland", "Singapore", "New Zealand", "Ireland",
  "Poland", "Belgium", "Austria", "Norway", "Denmark",
] as const;

type Country = (typeof COUNTRIES)[number];

const DOMESTIC_COUNTRIES = ["United States", "Canada", "United Kingdom", "Australia"];

const CARRIERS = ["USPS", "UPS", "FedEx", "DHL"] as const;

function getZone(origin: string, dest: string): "domestic" | "regional" | "international" {
  if (origin === dest) return "domestic";
  const sameRegion = (a: string, b: string) => {
    const na = ["United States", "Canada", "Mexico"];
    const eu = ["United Kingdom", "Germany", "France", "Italy", "Spain", "Netherlands", "Sweden", "Switzerland", "Ireland", "Poland", "Belgium", "Austria", "Norway", "Denmark"];
    const ap = ["Australia", "Japan", "China", "India", "South Korea", "Singapore", "New Zealand"];
    const sa = ["Brazil"];
    for (const region of [na, eu, ap, sa]) {
      if (region.includes(a) && region.includes(b)) return true;
    }
    return false;
  };
  return sameRegion(origin, dest) ? "regional" : "international";
}

function calcDimWeight(l: number, w: number, h: number, carrier: string): number {
  const divisor = carrier === "DHL" ? 5000 : 5000;
  return (l * w * h) / divisor;
}

function estimateRate(weight: number, dimWeight: number, zone: "domestic" | "regional" | "international", carrier: string): number {
  const billableWeight = Math.max(weight, dimWeight);
  const baseRates: Record<string, Record<string, number>> = {
    USPS: { domestic: 4.50, regional: 14.00, international: 26.00 },
    UPS: { domestic: 8.50, regional: 18.00, international: 35.00 },
    FedEx: { domestic: 9.00, regional: 19.50, international: 38.00 },
    DHL: { domestic: 10.00, regional: 16.00, international: 28.00 },
  };
  const perKgRates: Record<string, Record<string, number>> = {
    USPS: { domestic: 0.80, regional: 2.50, international: 5.00 },
    UPS: { domestic: 1.20, regional: 3.00, international: 6.50 },
    FedEx: { domestic: 1.30, regional: 3.20, international: 7.00 },
    DHL: { domestic: 1.50, regional: 2.80, international: 5.50 },
  };
  const base = baseRates[carrier]?.[zone] ?? 10;
  const perKg = perKgRates[carrier]?.[zone] ?? 2;
  return base + billableWeight * perKg;
}

function estimateDays(zone: "domestic" | "regional" | "international", carrier: string): string {
  const days: Record<string, Record<string, string>> = {
    USPS: { domestic: "2-5", regional: "6-10", international: "10-21" },
    UPS: { domestic: "1-5", regional: "3-7", international: "5-12" },
    FedEx: { domestic: "1-5", regional: "3-7", international: "4-10" },
    DHL: { domestic: "2-5", regional: "3-6", international: "3-8" },
  };
  return days[carrier]?.[zone] ?? "5-14";
}

export default function ShippingCalcPage() {
  const [zones, setZones, hydrated] = useLocalStorage<ShippingZone[]>("ecommerce-shipping-zones", []);

  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [origin, setOrigin] = useState<string>("United States");
  const [destination, setDestination] = useState<string>("United Kingdom");

  const [freeShipThreshold, setFreeShipThreshold] = useState("");
  const [avgOrderValue, setAvgOrderValue] = useState("");
  const [avgShipCost, setAvgShipCost] = useState("");

  // Zone editor
  const [zoneName, setZoneName] = useState("");
  const [zoneCountries, setZoneCountries] = useState<string[]>([]);
  const [zoneFlatRate, setZoneFlatRate] = useState("");

  const [copied, setCopied] = useState(false);

  const l = parseFloat(length) || 0;
  const w = parseFloat(width) || 0;
  const h = parseFloat(height) || 0;
  const wt = parseFloat(weight) || 0;
  const zone = getZone(origin, destination);

  const hasPackage = l > 0 && w > 0 && h > 0 && wt > 0;

  const carrierResults = CARRIERS.map(carrier => {
    const dw = calcDimWeight(l, w, h, carrier);
    const rate = estimateRate(wt, dw, zone, carrier);
    const days = estimateDays(zone, carrier);
    return { carrier, dimWeight: dw, rate, days, billableWeight: Math.max(wt, dw) };
  });

  const freeThresh = parseFloat(freeShipThreshold) || 0;
  const avgOV = parseFloat(avgOrderValue) || 0;
  const avgSC = parseFloat(avgShipCost) || 0;
  const freeShipMarginImpact = freeThresh > 0 && avgOV > 0 && avgSC > 0
    ? ((avgSC / avgOV) * 100)
    : null;

  const addZone = () => {
    if (!zoneName.trim() || zoneCountries.length === 0) return;
    const newZone: ShippingZone = {
      id: generateId(),
      name: zoneName,
      countries: zoneCountries,
      flatRate: parseFloat(zoneFlatRate) || 0,
    };
    setZones(prev => [...prev, newZone]);
    setZoneName("");
    setZoneCountries([]);
    setZoneFlatRate("");
  };

  const removeZone = (id: string) => {
    setZones(prev => prev.filter(z => z.id !== id));
  };

  const toggleZoneCountry = (c: string) => {
    setZoneCountries(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  const copyResults = async () => {
    if (!hasPackage) return;
    const lines = [
      `Shipping Estimate: ${origin} -> ${destination} (${zone})`,
      `Package: ${l}x${w}x${h} cm, ${wt} kg`,
      "",
      ...carrierResults.map(r => `${r.carrier}: $${r.rate.toFixed(2)} (${r.days} days, billable: ${r.billableWeight.toFixed(2)} kg)`),
    ].join("\n");
    await navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shipping Cost Calculator"
        description="Compare carrier rates, calculate dimensional weight, and manage shipping zones."
        icon={Truck}
        badge="E-Commerce"
        replaces="ShipStation Calculator, Pirate Ship"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" /> Package Dimensions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Length (cm)</Label>
                  <Input type="number" min="0" value={length} onChange={e => setLength(e.target.value)} placeholder="30" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Width (cm)</Label>
                  <Input type="number" min="0" value={width} onChange={e => setWidth(e.target.value)} placeholder="20" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Height (cm)</Label>
                  <Input type="number" min="0" value={height} onChange={e => setHeight(e.target.value)} placeholder="15" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Weight (kg)</Label>
                <Input type="number" min="0" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="2.5" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Origin Country</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {COUNTRIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setOrigin(c)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                      origin === c
                        ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Destination Country</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {COUNTRIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setDestination(c)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                      destination === c
                        ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Route Info */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{origin}</Badge>
                <span className="text-muted-foreground">&rarr;</span>
                <Badge variant="outline">{destination}</Badge>
                <Badge variant="secondary" className="ml-auto capitalize">{zone}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Carrier Comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Carrier Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              {!hasPackage ? (
                <p className="text-sm text-muted-foreground text-center py-6">Enter package dimensions and weight to compare carriers.</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Carrier</TableHead>
                        <TableHead>Est. Cost</TableHead>
                        <TableHead>Delivery</TableHead>
                        <TableHead>Dim. Weight</TableHead>
                        <TableHead>Billable</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {carrierResults
                        .sort((a, b) => a.rate - b.rate)
                        .map((r, idx) => (
                          <TableRow key={r.carrier}>
                            <TableCell className="font-medium">
                              {r.carrier}
                              {idx === 0 && <Badge variant="secondary" className="ml-2 text-[10px]">Cheapest</Badge>}
                            </TableCell>
                            <TableCell className="font-mono font-bold">${r.rate.toFixed(2)}</TableCell>
                            <TableCell>{r.days} days</TableCell>
                            <TableCell className="font-mono text-muted-foreground">{r.dimWeight.toFixed(2)} kg</TableCell>
                            <TableCell className="font-mono">
                              {r.billableWeight.toFixed(2)} kg
                              {r.dimWeight > wt && (
                                <Badge variant="destructive" className="ml-1 text-[10px]">DIM</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>

                  <Button onClick={copyResults} variant="outline" size="sm" className="mt-3">
                    {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    {copied ? "Copied!" : "Copy Results"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Dimensional Weight Explanation */}
          {hasPackage && carrierResults.some(r => r.dimWeight > wt) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Info className="h-4 w-4" /> Dimensional Weight Notice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your package&apos;s dimensional weight ({carrierResults[0].dimWeight.toFixed(2)} kg) exceeds its actual weight ({wt} kg).
                  Carriers calculate dimensional weight as (L &times; W &times; H) / 5000. You&apos;ll be billed for the higher of actual vs dimensional weight.
                  Consider reducing package size to save on shipping costs.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Free Shipping Threshold Calculator */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Free Shipping Threshold Calculator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Free Ship Above ($)</Label>
                  <Input type="number" min="0" value={freeShipThreshold} onChange={e => setFreeShipThreshold(e.target.value)} placeholder="50" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Avg Order Value ($)</Label>
                  <Input type="number" min="0" value={avgOrderValue} onChange={e => setAvgOrderValue(e.target.value)} placeholder="65" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Avg Ship Cost ($)</Label>
                  <Input type="number" min="0" value={avgShipCost} onChange={e => setAvgShipCost(e.target.value)} placeholder="8" />
                </div>
              </div>
              {freeShipMarginImpact !== null && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">
                    If you offer free shipping above <strong>${freeThresh}</strong>, absorbing an average shipping cost of <strong>${avgSC.toFixed(2)}</strong> on orders averaging <strong>${avgOV.toFixed(2)}</strong>:
                  </p>
                  <p className="text-sm mt-1">
                    Margin impact: <strong className={freeShipMarginImpact > 15 ? "text-destructive" : "text-amber-600"}>-{freeShipMarginImpact.toFixed(1)}%</strong> per qualifying order.
                    {avgOV >= freeThresh
                      ? " Most orders already qualify - this could significantly impact margins."
                      : ` Orders need to increase by $${(freeThresh - avgOV).toFixed(2)} to qualify. This may encourage upsells.`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Zones */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Shipping Zones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Zones */}
              {zones.length > 0 && (
                <div className="space-y-2">
                  {zones.map(z => (
                    <div key={z.id} className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{z.name} - ${z.flatRate.toFixed(2)} flat rate</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {z.countries.map(c => (
                            <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                          ))}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeZone(z.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Zone */}
              <div className="border rounded-lg p-3 space-y-3">
                <p className="text-xs font-medium">Add New Zone</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Zone Name</Label>
                    <Input value={zoneName} onChange={e => setZoneName(e.target.value)} placeholder="e.g. North America" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Flat Rate ($)</Label>
                    <Input type="number" min="0" value={zoneFlatRate} onChange={e => setZoneFlatRate(e.target.value)} placeholder="9.99" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Countries</Label>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {COUNTRIES.map(c => (
                      <button
                        key={c}
                        onClick={() => toggleZoneCountry(c)}
                        className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                          zoneCountries.includes(c)
                            ? "bg-violet-500 text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <Button size="sm" onClick={addZone} disabled={!zoneName.trim() || zoneCountries.length === 0}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Zone
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
