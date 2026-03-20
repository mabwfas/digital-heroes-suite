"use client";

import { useState, useCallback, useMemo } from "react";
import { UserMinus, Plus, Trash2, BarChart3, Lightbulb } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface UnsubEntry {
  id: string;
  campaign: string;
  reason: string;
  category: string;
  date: string;
}

const CATEGORIES = ["Too Frequent", "Not Relevant", "Too Promotional", "Never Subscribed", "Content Quality", "Found Alternative", "Other"];

const SUGGESTIONS: Record<string, string[]> = {
  "Too Frequent": [
    "Reduce sending frequency or offer frequency preferences",
    "Let subscribers choose how often they hear from you",
    "Segment active vs less-active subscribers and adjust cadence",
  ],
  "Not Relevant": [
    "Improve segmentation to send targeted content",
    "Use preference centers to learn what topics subscribers want",
    "Personalize content based on past behavior and interests",
  ],
  "Too Promotional": [
    "Balance promotional content with value-driven content (80/20 rule)",
    "Lead with education and stories, not just sales pitches",
    "Add useful tips, guides, or entertainment alongside promotions",
  ],
  "Never Subscribed": [
    "Audit your signup process and ensure double opt-in",
    "Make unsubscribe easy to maintain list health",
    "Review third-party data sources for quality",
  ],
  "Content Quality": [
    "Invest in better copywriting and design",
    "A/B test subject lines and content formats",
    "Survey remaining subscribers on what they want",
  ],
  "Found Alternative": [
    "Analyze what competitors offer and differentiate",
    "Create exclusive content that can't be found elsewhere",
    "Strengthen your unique value proposition",
  ],
  "Other": [
    "Follow up with a short feedback survey",
    "Review overall email strategy quarterly",
    "Monitor industry trends for new engagement ideas",
  ],
};

const catColor = (c: string) => c === "Too Frequent" ? "bg-red-500/10 text-red-600" : c === "Not Relevant" ? "bg-amber-500/10 text-amber-600" : c === "Too Promotional" ? "bg-orange-500/10 text-orange-600" : "bg-gray-500/10 text-gray-600";

export default function UnsubscribeAnalyzerPage() {
  const [entries, setEntries, hydrated] = useLocalStorage<UnsubEntry[]>("unsub-analyzer", []);
  const [campaign, setCampaign] = useState("");
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("Too Frequent");

  const handleAdd = useCallback(() => {
    if (!campaign.trim()) return;
    const entry: UnsubEntry = { id: generateId(), campaign: campaign.trim(), reason: reason.trim(), category, date: new Date().toISOString() };
    setEntries(prev => [entry, ...prev]);
    setCampaign("");
    setReason("");
  }, [campaign, reason, category, setEntries]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach(c => { counts[c] = 0; });
    entries.forEach(e => { counts[e.category] = (counts[e.category] || 0) + 1; });
    return counts;
  }, [entries]);

  const topCategory = useMemo(() => {
    let max = 0, top = "";
    Object.entries(categoryCounts).forEach(([k, v]) => { if (v > max) { max = v; top = k; } });
    return top;
  }, [categoryCounts]);

  const totalEntries = entries.length;
  const maxCount = Math.max(...Object.values(categoryCounts), 1);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unsubscribe Analyzer"
        description="Log unsubscribe reasons, categorize trends, and get actionable suggestions."
        icon={UserMinus}
        badge="Free"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-violet-500" /> Log Unsubscribe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Campaign Name</Label>
              <Input placeholder="March Newsletter" value={campaign} onChange={e => setCampaign(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Reason (optional)</Label>
              <Input placeholder="User feedback..." value={reason} onChange={e => setReason(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${category === c ? "border-violet-500 bg-violet-500/10 text-violet-600" : "border-border hover:border-violet-300"}`}
                >{c}</button>
              ))}
            </div>
          </div>
          <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleAdd} disabled={!campaign.trim()}>
            <Plus className="h-4 w-4" /> Log Entry
          </Button>
        </CardContent>
      </Card>

      {totalEntries > 0 && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Category Breakdown ({totalEntries} total)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {CATEGORIES.filter(c => categoryCounts[c] > 0).sort((a, b) => categoryCounts[b] - categoryCounts[a]).map(c => (
                <div key={c} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{c}</span>
                    <span className="text-muted-foreground">{categoryCounts[c]} ({((categoryCounts[c] / totalEntries) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-violet-500" style={{ width: `${(categoryCounts[c] / maxCount) * 100}%`, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {topCategory && SUGGESTIONS[topCategory] && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" /> Suggestions for &quot;{topCategory}&quot;
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {SUGGESTIONS[topCategory].map((s, i) => (
                  <div key={i} className="flex gap-2 text-xs text-muted-foreground">
                    <span className="text-violet-500 shrink-0">&#9679;</span> {s}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Recent Entries</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setEntries([])}><Trash2 className="h-3 w-3 text-red-500" /> Clear</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {entries.slice(0, 20).map(e => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg border p-2.5 text-xs">
                    <div>
                      <span className="font-medium">{e.campaign}</span>
                      {e.reason && <span className="text-muted-foreground ml-2">— {e.reason}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={`text-[10px] ${catColor(e.category)}`}>{e.category}</Badge>
                      <span className="text-muted-foreground">{new Date(e.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
