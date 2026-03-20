"use client";

import { useState, useCallback } from "react";
import {
  Megaphone,
  Plus,
  Trash2,
  Copy,
  Save,
  ChevronDown,
  ChevronRight,
  BookOpen,
  X,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface Ad {
  id: string;
  headline: string;
  description: string;
  finalUrl: string;
}

interface AdGroup {
  id: string;
  name: string;
  keywords: string[];
  targetAudience: string;
  ads: Ad[];
  expanded: boolean;
}

interface Campaign {
  id: string;
  name: string;
  budget: number;
  biddingStrategy: string;
  targeting: string;
  adGroups: AdGroup[];
  createdAt: string;
}

const BIDDING_STRATEGIES = ["Maximize Clicks", "Maximize Conversions", "Target CPA", "Target ROAS", "Manual CPC", "Enhanced CPC"];

export default function CampaignBuilderPage() {
  const [campaigns, setCampaigns, hydrated] = useLocalStorage<Campaign[]>("ads-campaigns", []);
  const [current, setCurrent] = useState<Campaign | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState("");
  const [budget, setBudget] = useState("50");
  const [bidding, setBidding] = useState(BIDDING_STRATEGIES[0]);
  const [targeting, setTargeting] = useState("");

  function startCampaign() {
    if (!name.trim()) return;
    const campaign: Campaign = {
      id: generateId(),
      name: name.trim(),
      budget: parseFloat(budget) || 50,
      biddingStrategy: bidding,
      targeting: targeting.trim(),
      adGroups: [],
      createdAt: new Date().toISOString(),
    };
    setCurrent(campaign);
  }

  function addAdGroup() {
    if (!current) return;
    const newGroup: AdGroup = { id: generateId(), name: "", keywords: [], targetAudience: "", ads: [], expanded: true };
    setCurrent({ ...current, adGroups: [...current.adGroups, newGroup] });
  }

  function updateAdGroup(groupId: string, updates: Partial<AdGroup>) {
    if (!current) return;
    setCurrent({ ...current, adGroups: current.adGroups.map((g) => g.id === groupId ? { ...g, ...updates } : g) });
  }

  function removeAdGroup(groupId: string) {
    if (!current) return;
    setCurrent({ ...current, adGroups: current.adGroups.filter((g) => g.id !== groupId) });
  }

  function addKeyword(groupId: string, kw: string) {
    if (!current || !kw.trim()) return;
    const group = current.adGroups.find((g) => g.id === groupId);
    if (!group || group.keywords.includes(kw.trim())) return;
    updateAdGroup(groupId, { keywords: [...group.keywords, kw.trim()] });
  }

  function removeKeyword(groupId: string, kw: string) {
    if (!current) return;
    const group = current.adGroups.find((g) => g.id === groupId);
    if (!group) return;
    updateAdGroup(groupId, { keywords: group.keywords.filter((k) => k !== kw) });
  }

  function addAd(groupId: string) {
    if (!current) return;
    const group = current.adGroups.find((g) => g.id === groupId);
    if (!group) return;
    const newAd: Ad = { id: generateId(), headline: "", description: "", finalUrl: "" };
    updateAdGroup(groupId, { ads: [...group.ads, newAd] });
  }

  function updateAd(groupId: string, adId: string, updates: Partial<Ad>) {
    if (!current) return;
    const group = current.adGroups.find((g) => g.id === groupId);
    if (!group) return;
    updateAdGroup(groupId, { ads: group.ads.map((a) => a.id === adId ? { ...a, ...updates } : a) });
  }

  function removeAd(groupId: string, adId: string) {
    if (!current) return;
    const group = current.adGroups.find((g) => g.id === groupId);
    if (!group) return;
    updateAdGroup(groupId, { ads: group.ads.filter((a) => a.id !== adId) });
  }

  function saveCampaign() {
    if (!current) return;
    setCampaigns((prev) => {
      const exists = prev.find((c) => c.id === current.id);
      if (exists) return prev.map((c) => c.id === current.id ? current : c);
      return [current, ...prev];
    });
  }

  function exportCampaign() {
    if (!current) return;
    const json = JSON.stringify(current, null, 2);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Campaign Structure Builder" description="Build ad campaign hierarchies with ad groups, keywords, and ads." icon={Megaphone} badge="Ads" actions={
        <Button variant="outline" size="sm" onClick={() => setShowLibrary(!showLibrary)}><BookOpen className="h-4 w-4" />Templates ({campaigns.length})</Button>
      } />

      {showLibrary ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between"><CardTitle className="text-base">Saved Campaigns</CardTitle><Button variant="ghost" size="icon" onClick={() => setShowLibrary(false)}><X className="h-4 w-4" /></Button></div>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No saved campaigns yet.</p>
            ) : (
              <div className="space-y-2">
                {campaigns.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">${c.budget}/day &middot; {c.adGroups.length} ad groups &middot; {new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => { setCurrent(c); setShowLibrary(false); }}>Load</Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCampaigns((prev) => prev.filter((x) => x.id !== c.id))}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : !current ? (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">New Campaign</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Campaign Name *</Label><Input placeholder="e.g., Spring Sale 2024" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Daily Budget ($)</Label><Input type="number" placeholder="50" value={budget} onChange={(e) => setBudget(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Bidding Strategy</Label>
                <Select value={bidding} onValueChange={(v) => { if (v) setBidding(v); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BIDDING_STRATEGIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1.5"><Label>Targeting</Label><Input placeholder="e.g., US, 25-45, Interests: marketing" value={targeting} onChange={(e) => setTargeting(e.target.value)} /></div>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={startCampaign} disabled={!name.trim()}><Plus className="h-4 w-4" />Create Campaign</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{current.name}</h2>
              <div className="flex gap-2 flex-wrap mt-1">
                <Badge variant="secondary" className="text-xs">${current.budget}/day</Badge>
                <Badge variant="secondary" className="text-xs">{current.biddingStrategy}</Badge>
                {current.targeting && <Badge variant="secondary" className="text-xs">{current.targeting}</Badge>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addAdGroup}><Plus className="h-3.5 w-3.5" />Ad Group</Button>
              <Button variant="outline" size="sm" onClick={exportCampaign}><Copy className="h-3.5 w-3.5" />{copied ? "Copied!" : "Export JSON"}</Button>
              <Button size="sm" className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={saveCampaign}><Save className="h-3.5 w-3.5" />Save</Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrent(null)}><X className="h-3.5 w-3.5" /></Button>
            </div>
          </div>

          {current.adGroups.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No ad groups yet. Click &quot;Ad Group&quot; to add one.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {current.adGroups.map((group) => (
                <Card key={group.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateAdGroup(group.id, { expanded: !group.expanded })} className="shrink-0">
                        {group.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      <Input placeholder="Ad Group Name" value={group.name} onChange={(e) => updateAdGroup(group.id, { name: e.target.value })} className="font-medium" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeAdGroup(group.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                    </div>
                  </CardHeader>
                  {group.expanded && (
                    <CardContent className="space-y-4">
                      <div className="space-y-1.5">
                        <Label>Target Audience</Label>
                        <Input placeholder="Audience for this ad group" value={group.targetAudience} onChange={(e) => updateAdGroup(group.id, { targetAudience: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Keywords</Label>
                        <div className="flex gap-1.5">
                          <Input placeholder="Add keyword..." id={`kw-${group.id}`} onKeyDown={(e) => {
                            if (e.key === "Enter") { addKeyword(group.id, (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ""; }
                          }} className="flex-1" />
                          <Button variant="outline" size="icon" onClick={() => {
                            const input = document.getElementById(`kw-${group.id}`) as HTMLInputElement;
                            if (input) { addKeyword(group.id, input.value); input.value = ""; }
                          }}><Plus className="h-4 w-4" /></Button>
                        </div>
                        {group.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {group.keywords.map((kw) => (
                              <Badge key={kw} variant="secondary" className="text-xs gap-1 pr-1">{kw}<button onClick={() => removeKeyword(group.id, kw)} className="ml-0.5 hover:text-red-500"><X className="h-3 w-3" /></button></Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Ads ({group.ads.length})</Label>
                          <Button variant="outline" size="sm" onClick={() => addAd(group.id)}><Plus className="h-3.5 w-3.5" />Ad</Button>
                        </div>
                        {group.ads.map((ad) => (
                          <div key={ad.id} className="rounded-lg border p-3 space-y-2">
                            <div className="flex gap-2">
                              <Input placeholder="Headline (30 chars)" value={ad.headline} onChange={(e) => updateAd(group.id, ad.id, { headline: e.target.value })} className="flex-1" />
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeAd(group.id, ad.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                            </div>
                            <Textarea placeholder="Description (90 chars)" value={ad.description} onChange={(e) => updateAd(group.id, ad.id, { description: e.target.value })} rows={2} />
                            <Input placeholder="Final URL" value={ad.finalUrl} onChange={(e) => updateAd(group.id, ad.id, { finalUrl: e.target.value })} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
