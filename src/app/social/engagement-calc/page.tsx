"use client";

import { useState, useCallback, useMemo } from "react";
import { BarChart3, Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface EngagementEntry {
  id: string;
  label: string;
  followers: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  rate: number;
  recordedAt: string;
}

const BENCHMARKS: Record<string, { low: number; avg: number; high: number }> = {
  "Fashion": { low: 1.0, avg: 1.8, high: 3.5 },
  "Food": { low: 0.8, avg: 1.5, high: 3.0 },
  "Fitness": { low: 1.0, avg: 2.0, high: 4.0 },
  "Travel": { low: 0.7, avg: 1.4, high: 2.8 },
  "Tech": { low: 0.5, avg: 1.2, high: 2.5 },
  "Beauty": { low: 0.8, avg: 1.7, high: 3.2 },
  "Business": { low: 0.4, avg: 1.0, high: 2.0 },
  "Education": { low: 0.6, avg: 1.3, high: 2.5 },
  "Entertainment": { low: 1.0, avg: 2.2, high: 4.5 },
  "General": { low: 0.5, avg: 1.5, high: 3.0 },
};

function calcRate(followers: number, likes: number, comments: number, shares: number, saves: number): number {
  if (followers <= 0) return 0;
  return ((likes + comments + shares + saves) / followers) * 100;
}

export default function EngagementCalcPage() {
  const [followers, setFollowers] = useState("");
  const [likes, setLikes] = useState("");
  const [comments, setComments] = useState("");
  const [shares, setShares] = useState("");
  const [saves, setSaves] = useState("");
  const [label, setLabel] = useState("");
  const [industry, setIndustry] = useState("General");
  const [history, setHistory, hydrated] = useLocalStorage<EngagementEntry[]>("engagement-history", []);

  const rate = useMemo(() => {
    return calcRate(Number(followers) || 0, Number(likes) || 0, Number(comments) || 0, Number(shares) || 0, Number(saves) || 0);
  }, [followers, likes, comments, shares, saves]);

  const benchmark = BENCHMARKS[industry] || BENCHMARKS.General;

  const rateLabel = rate >= benchmark.high ? "Excellent" : rate >= benchmark.avg ? "Good" : rate >= benchmark.low ? "Average" : "Below Average";
  const rateColor = rate >= benchmark.high ? "text-emerald-500" : rate >= benchmark.avg ? "text-blue-500" : rate >= benchmark.low ? "text-amber-500" : "text-red-500";

  const handleSave = useCallback(() => {
    if (!followers) return;
    const entry: EngagementEntry = {
      id: generateId(),
      label: label.trim() || `Entry ${history.length + 1}`,
      followers: Number(followers) || 0,
      likes: Number(likes) || 0,
      comments: Number(comments) || 0,
      shares: Number(shares) || 0,
      saves: Number(saves) || 0,
      rate,
      recordedAt: new Date().toISOString(),
    };
    setHistory(prev => [entry, ...prev.slice(0, 49)]);
  }, [followers, likes, comments, shares, saves, rate, label, history.length, setHistory]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Engagement Rate Calculator"
        description="Calculate your engagement rate, benchmark against industry averages, and track over time."
        icon={BarChart3}
        badge="Free"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-violet-500" /> Enter Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Label (optional)</Label>
              <Input placeholder="e.g. March Week 1" value={label} onChange={e => setLabel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Followers</Label>
              <Input type="number" placeholder="10000" value={followers} onChange={e => setFollowers(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Likes</Label>
                <Input type="number" placeholder="500" value={likes} onChange={e => setLikes(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Comments</Label>
                <Input type="number" placeholder="50" value={comments} onChange={e => setComments(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Shares</Label>
                <Input type="number" placeholder="30" value={shares} onChange={e => setShares(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Saves</Label>
                <Input type="number" placeholder="20" value={saves} onChange={e => setSaves(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(BENCHMARKS).map(ind => (
                  <button key={ind} onClick={() => setIndustry(ind)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${industry === ind ? "border-violet-500 bg-violet-500/10 text-violet-600" : "border-border hover:border-violet-300"}`}
                  >{ind}</button>
                ))}
              </div>
            </div>
            <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleSave} disabled={!followers}>
              <Plus className="h-4 w-4" /> Save & Track
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Your Engagement Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className={`text-5xl font-bold ${rateColor}`}>{rate.toFixed(2)}%</p>
                <Badge variant="secondary" className={`mt-2 ${rateColor}`}>{rateLabel}</Badge>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Industry: {industry}</span>
                </div>
                <div className="h-3 rounded-full bg-muted relative overflow-hidden">
                  <div className="absolute h-full bg-red-400 rounded-l-full" style={{ width: `${(benchmark.low / 5) * 100}%` }} />
                  <div className="absolute h-full bg-amber-400" style={{ left: `${(benchmark.low / 5) * 100}%`, width: `${((benchmark.avg - benchmark.low) / 5) * 100}%` }} />
                  <div className="absolute h-full bg-emerald-400 rounded-r-full" style={{ left: `${(benchmark.avg / 5) * 100}%`, width: `${((benchmark.high - benchmark.avg) / 5) * 100}%` }} />
                  <div className="absolute h-full w-0.5 bg-foreground" style={{ left: `${Math.min(rate / 5, 1) * 100}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Low: {benchmark.low}%</span>
                  <span>Avg: {benchmark.avg}%</span>
                  <span>High: {benchmark.high}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">History</CardTitle>
                {history.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setHistory([])}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No entries tracked yet.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.map((entry, i) => {
                    const prev = history[i + 1];
                    const delta = prev ? entry.rate - prev.rate : 0;
                    return (
                      <div key={entry.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                        <div>
                          <p className="font-medium text-xs">{entry.label}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(entry.recordedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {delta !== 0 && (
                            <span className={`flex items-center text-[10px] ${delta > 0 ? "text-emerald-500" : "text-red-500"}`}>
                              {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {Math.abs(delta).toFixed(2)}%
                            </span>
                          )}
                          <Badge variant="secondary" className="text-xs">{entry.rate.toFixed(2)}%</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
