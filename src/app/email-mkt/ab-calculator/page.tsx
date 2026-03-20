"use client";

import { useState, useMemo } from "react";
import { FlaskConical, BarChart3, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface ABResult {
  id: string;
  rateA: number;
  rateB: number;
  sampleA: number;
  sampleB: number;
  zScore: number;
  pValue: number;
  confidence: number;
  significant: boolean;
  winner: "A" | "B" | "None";
  testedAt: string;
}

function normalCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

function calcABTest(rateA: number, sampleA: number, rateB: number, sampleB: number) {
  const pA = rateA / 100;
  const pB = rateB / 100;
  const pPool = (pA * sampleA + pB * sampleB) / (sampleA + sampleB);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / sampleA + 1 / sampleB));
  if (se === 0) return { zScore: 0, pValue: 1, confidence: 0, significant: false, winner: "None" as const };
  const z = (pA - pB) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  const confidence = (1 - pValue) * 100;
  const significant = pValue < 0.05;
  const winner = !significant ? "None" as const : pA > pB ? "A" as const : "B" as const;
  return { zScore: z, pValue, confidence, significant, winner };
}

export default function ABCalculatorPage() {
  const [rateA, setRateA] = useState("");
  const [sampleA, setSampleA] = useState("");
  const [rateB, setRateB] = useState("");
  const [sampleB, setSampleB] = useState("");
  const [result, setResult] = useState<ABResult | null>(null);
  const [history, setHistory, hydrated] = useLocalStorage<ABResult[]>("ab-calc-history", []);

  const handleCalculate = () => {
    const ra = Number(rateA) || 0;
    const sa = Number(sampleA) || 0;
    const rb = Number(rateB) || 0;
    const sb = Number(sampleB) || 0;
    if (sa <= 0 || sb <= 0) return;
    const calc = calcABTest(ra, sa, rb, sb);
    const r: ABResult = { ...calc, id: generateId(), rateA: ra, rateB: rb, sampleA: sa, sampleB: sb, testedAt: new Date().toISOString() };
    setResult(r);
    setHistory(prev => [r, ...prev.slice(0, 19)]);
  };

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email A/B Test Calculator"
        description="Calculate statistical significance between two email variants."
        icon={FlaskConical}
        badge="Free"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Variant A</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Open Rate (%)</Label>
              <Input type="number" step="0.1" placeholder="25.5" value={rateA} onChange={e => setRateA(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Sample Size (emails sent)</Label>
              <Input type="number" placeholder="5000" value={sampleA} onChange={e => setSampleA(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Variant B</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Open Rate (%)</Label>
              <Input type="number" step="0.1" placeholder="28.3" value={rateB} onChange={e => setRateB(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Sample Size (emails sent)</Label>
              <Input type="number" placeholder="5000" value={sampleB} onChange={e => setSampleB(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleCalculate}
        disabled={!rateA || !rateB || !sampleA || !sampleB}>
        <FlaskConical className="h-4 w-4" /> Calculate Significance
      </Button>

      {result && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="py-4 text-center">
              <p className={`text-3xl font-bold ${result.significant ? "text-emerald-500" : "text-amber-500"}`}>{result.confidence.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Confidence Level</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold">{result.zScore.toFixed(3)}</p>
              <p className="text-xs text-muted-foreground">Z-Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold">{result.pValue.toFixed(4)}</p>
              <p className="text-xs text-muted-foreground">P-Value</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className={`text-3xl font-bold ${result.winner === "None" ? "text-muted-foreground" : "text-emerald-500"}`}>
                {result.winner === "None" ? "No Winner" : `Variant ${result.winner}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {result.significant ? "Statistically significant (p < 0.05)" : "Not significant — need more data"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Test History</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setHistory([])}><Trash2 className="h-3 w-3 text-red-500" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="flex items-center justify-between rounded-lg border p-2.5 text-xs">
                  <div>A: {h.rateA}% ({h.sampleA}) vs B: {h.rateB}% ({h.sampleB})</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-[10px] ${h.significant ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                      {h.confidence.toFixed(1)}% — {h.winner === "None" ? "No winner" : `${h.winner} wins`}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
