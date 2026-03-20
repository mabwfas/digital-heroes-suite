"use client";

import { useState, useCallback } from "react";
import { Megaphone, Copy, RefreshCw, Trash2, History, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type Platform = "google" | "meta" | "linkedin";

interface AdVariant {
  id: string;
  headline: string;
  description: string;
  cta: string;
  headlineLimit: number;
  descLimit: number;
}

interface SavedAd {
  id: string;
  platform: Platform;
  product: string;
  variants: AdVariant[];
  createdAt: string;
}

const PLATFORM_CONFIG: Record<Platform, { label: string; headlineLimit: number; descLimit: number; color: string }> = {
  google: { label: "Google Ads", headlineLimit: 30, descLimit: 90, color: "bg-blue-500/10 text-blue-600" },
  meta: { label: "Meta (FB/IG)", headlineLimit: 40, descLimit: 125, color: "bg-indigo-500/10 text-indigo-600" },
  linkedin: { label: "LinkedIn Ads", headlineLimit: 70, descLimit: 150, color: "bg-sky-500/10 text-sky-600" },
};

function generateAds(platform: Platform, product: string, usp: string, cta: string): AdVariant[] {
  const cfg = PLATFORM_CONFIG[platform];
  const ctaText = cta || "Learn More";
  const templates = [
    { h: `${product} — ${usp || "Built for Results"}`, d: `Discover how ${product} helps you achieve more. ${usp || "Proven results"} with zero hassle. Try it today.` },
    { h: `Try ${product} Free Today`, d: `Stop wasting time. ${product} delivers ${usp || "what you need"} faster than any alternative. ${ctaText} now.` },
    { h: `Why ${product} Wins`, d: `${product}: ${usp || "The smarter choice"}. Join thousands who already made the switch. ${ctaText}.` },
    { h: `${product}: Proven Results`, d: `Get real results with ${product}. ${usp || "Industry-leading solution"} trusted by professionals everywhere.` },
  ];
  return templates.map((t) => ({
    id: generateId(),
    headline: t.h.slice(0, cfg.headlineLimit),
    description: t.d.slice(0, cfg.descLimit),
    cta: ctaText,
    headlineLimit: cfg.headlineLimit,
    descLimit: cfg.descLimit,
  }));
}

export default function AdCopyPage() {
  const [platform, setPlatform] = useState<Platform>("google");
  const [product, setProduct] = useState("");
  const [usp, setUsp] = useState("");
  const [cta, setCta] = useState("");
  const [variants, setVariants] = useState<AdVariant[]>([]);
  const [saved, setSaved, hydrated] = useLocalStorage<SavedAd[]>("ad-copies", []);
  const [showSaved, setShowSaved] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const generate = useCallback(() => {
    if (!product.trim()) return;
    setVariants(generateAds(platform, product, usp, cta));
  }, [platform, product, usp, cta]);

  const copyAd = useCallback((v: AdVariant) => {
    navigator.clipboard.writeText(`Headline: ${v.headline}\nDescription: ${v.description}\nCTA: ${v.cta}`);
    setCopied(v.id);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  const handleSave = useCallback(() => {
    if (variants.length === 0) return;
    setSaved((prev) => [{ id: generateId(), platform, product, variants, createdAt: new Date().toISOString() }, ...prev.slice(0, 19)]);
  }, [variants, platform, product, setSaved]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ad Copy Generator"
        description="Generate platform-specific ad copy with character limits for Google, Meta, and LinkedIn."
        icon={Megaphone}
        badge="Copywriting"
        actions={
          <Button variant="outline" size="sm" onClick={() => setShowSaved(!showSaved)}>
            <History className="h-4 w-4" />Saved ({saved.length})
          </Button>
        }
      />

      {showSaved ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Saved Ad Copy</CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowSaved(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {saved.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No saved ads yet.</p>
            ) : (
              <div className="space-y-3">
                {saved.map((s) => (
                  <div key={s.id} className="border rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{s.product}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`${PLATFORM_CONFIG[s.platform].color} border-0 text-[10px]`}>{PLATFORM_CONFIG[s.platform].label}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => setSaved((p) => p.filter((x) => x.id !== s.id))}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Ad Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Platform *</Label>
                  <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Ads</SelectItem>
                      <SelectItem value="meta">Meta (FB/IG)</SelectItem>
                      <SelectItem value="linkedin">LinkedIn Ads</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Product / Service *</Label>
                  <Input placeholder="e.g. CloudSync Pro" value={product} onChange={(e) => setProduct(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Unique Selling Point</Label>
                  <Textarea placeholder="What makes it special?" value={usp} onChange={(e) => setUsp(e.target.value)} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label>CTA Text</Label>
                  <Input placeholder="e.g. Sign Up Free" value={cta} onChange={(e) => setCta(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Limits:</span>
                <Badge variant="secondary" className="text-[10px]">Headline: {PLATFORM_CONFIG[platform].headlineLimit}c</Badge>
                <Badge variant="secondary" className="text-[10px]">Description: {PLATFORM_CONFIG[platform].descLimit}c</Badge>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={generate} disabled={!product.trim()}>
                  <RefreshCw className="h-4 w-4" />Generate Ad Copy
                </Button>
                {variants.length > 0 && <Button variant="outline" onClick={handleSave}>Save</Button>}
              </div>
            </CardContent>
          </Card>

          {variants.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {variants.map((v, i) => (
                <Card key={v.id} className="border-border/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Variant {i + 1}</CardTitle>
                      <Button variant="ghost" size="icon-sm" onClick={() => copyAd(v)}>
                        <Copy className={`h-3.5 w-3.5 ${copied === v.id ? "text-emerald-500" : ""}`} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">Headline</span>
                        <span className={`text-[10px] font-mono ${v.headline.length > v.headlineLimit ? "text-red-500" : "text-muted-foreground"}`}>{v.headline.length}/{v.headlineLimit}</span>
                      </div>
                      <p className="text-sm font-medium">{v.headline}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">Description</span>
                        <span className={`text-[10px] font-mono ${v.description.length > v.descLimit ? "text-red-500" : "text-muted-foreground"}`}>{v.description.length}/{v.descLimit}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{v.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">CTA: {v.cta}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
