"use client";

import { useState } from "react";
import {
  Link2,
  Copy,
  Check,
  Clock,
  Trash2,
  Zap,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface SavedUTM {
  id: string;
  name: string;
  baseUrl: string;
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
  fullUrl: string;
  createdAt: string;
}

const TEMPLATES = [
  {
    name: "Google Ads",
    source: "google",
    medium: "cpc",
    campaign: "brand-search",
    term: "{keyword}",
    content: "ad-v1",
    icon: "🔍",
  },
  {
    name: "Facebook Ads",
    source: "facebook",
    medium: "paid-social",
    campaign: "awareness-q1",
    term: "",
    content: "carousel-v1",
    icon: "📘",
  },
  {
    name: "Email Campaign",
    source: "email",
    medium: "newsletter",
    campaign: "weekly-digest",
    term: "",
    content: "header-cta",
    icon: "📧",
  },
  {
    name: "Instagram Bio",
    source: "instagram",
    medium: "social",
    campaign: "bio-link",
    term: "",
    content: "profile",
    icon: "📸",
  },
];

function buildUrl(
  base: string,
  source: string,
  medium: string,
  campaign: string,
  term: string,
  content: string
): string {
  if (!base) return "";
  try {
    const url = new URL(base.startsWith("http") ? base : `https://${base}`);
    if (source) url.searchParams.set("utm_source", source);
    if (medium) url.searchParams.set("utm_medium", medium);
    if (campaign) url.searchParams.set("utm_campaign", campaign);
    if (term) url.searchParams.set("utm_term", term);
    if (content) url.searchParams.set("utm_content", content);
    return url.toString();
  } catch {
    return base;
  }
}

export default function UTMPage() {
  const [saved, setSaved] = useLocalStorage<SavedUTM[]>("utm-links", []);
  const [baseUrl, setBaseUrl] = useState("https://yourstore.com/products");
  const [source, setSource] = useState("google");
  const [medium, setMedium] = useState("cpc");
  const [campaign, setCampaign] = useState("");
  const [term, setTerm] = useState("");
  const [content, setContent] = useState("");
  const [linkName, setLinkName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"build" | "history">("build");

  const fullUrl = buildUrl(baseUrl, source, medium, campaign, term, content);

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 1500);
  };

  const applyTemplate = (t: (typeof TEMPLATES)[0]) => {
    setSource(t.source);
    setMedium(t.medium);
    setCampaign(t.campaign);
    setTerm(t.term);
    setContent(t.content);
    setLinkName(t.name);
  };

  const saveLink = () => {
    if (!fullUrl) return;
    const item: SavedUTM = {
      id: generateId(),
      name: linkName || campaign || `UTM ${new Date().toLocaleDateString()}`,
      baseUrl,
      source,
      medium,
      campaign,
      term,
      content,
      fullUrl,
      createdAt: new Date().toISOString(),
    };
    setSaved((prev) => [item, ...prev]);
    setLinkName("");
  };

  const deleteLink = (id: string) => setSaved((prev) => prev.filter((s) => s.id !== id));

  const utmParams = [
    { label: "utm_source", value: source },
    { label: "utm_medium", value: medium },
    { label: "utm_campaign", value: campaign },
    { label: "utm_term", value: term },
    { label: "utm_content", value: content },
  ].filter((p) => p.value);

  return (
    <div className="space-y-6">
      <PageHeader
        title="UTM Link Builder"
        description="Build and track marketing URLs with UTM parameters. Save campaigns and copy ready-to-use links."
        icon={Link2}
        badge="Utilities"
        replaces="UTM.io ($19/mo)"
      />

      <div className="flex gap-2 p-1 bg-muted/40 rounded-xl w-fit">
        {(["build", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
              activeTab === tab
                ? "bg-white dark:bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "history" ? `Saved (${saved.length})` : "Build URL"}
          </button>
        ))}
      </div>

      {activeTab === "build" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Builder Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Quick Templates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Quick Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.name}
                      onClick={() => applyTemplate(t)}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border hover:border-violet-400 hover:bg-violet-500/5 transition-all text-sm"
                    >
                      <span className="text-xl">{t.icon}</span>
                      <span className="font-medium text-xs">{t.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* URL Inputs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  URL Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="base-url">Base URL <span className="text-red-500">*</span></Label>
                  <Input
                    id="base-url"
                    placeholder="https://yourstore.com/products/item"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="utm-source">
                      Campaign Source <span className="text-red-500">*</span>
                      <Badge variant="secondary" className="ml-2 text-[9px] px-1">utm_source</Badge>
                    </Label>
                    <Input
                      id="utm-source"
                      placeholder="e.g. google, facebook"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="utm-medium">
                      Campaign Medium <span className="text-red-500">*</span>
                      <Badge variant="secondary" className="ml-2 text-[9px] px-1">utm_medium</Badge>
                    </Label>
                    <Input
                      id="utm-medium"
                      placeholder="e.g. cpc, email, social"
                      value={medium}
                      onChange={(e) => setMedium(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="utm-campaign">
                      Campaign Name
                      <Badge variant="secondary" className="ml-2 text-[9px] px-1">utm_campaign</Badge>
                    </Label>
                    <Input
                      id="utm-campaign"
                      placeholder="e.g. spring-sale-2025"
                      value={campaign}
                      onChange={(e) => setCampaign(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="utm-term">
                      Campaign Term
                      <Badge variant="secondary" className="ml-2 text-[9px] px-1">utm_term</Badge>
                    </Label>
                    <Input
                      id="utm-term"
                      placeholder="e.g. running+shoes"
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="utm-content">
                      Campaign Content
                      <Badge variant="secondary" className="ml-2 text-[9px] px-1">utm_content</Badge>
                    </Label>
                    <Input
                      id="utm-content"
                      placeholder="e.g. logolink, textlink, banner-v1"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save */}
            <div className="flex gap-2">
              <Input
                placeholder="Link name (optional)"
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={saveLink}
                disabled={!fullUrl}
                variant="outline"
              >
                Save Link
              </Button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Generated URL
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fullUrl ? (
                  <>
                    <div className="p-3 rounded-lg bg-muted/40 border">
                      <p className="text-xs font-mono break-all leading-relaxed text-violet-600 dark:text-violet-400">
                        {fullUrl}
                      </p>
                    </div>

                    <Button
                      onClick={() => copyUrl(fullUrl)}
                      className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
                    >
                      {copied === fullUrl ? (
                        <><Check className="h-4 w-4 mr-2" />Copied!</>
                      ) : (
                        <><Copy className="h-4 w-4 mr-2" />Copy URL</>
                      )}
                    </Button>

                    <a
                      href={fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border text-sm text-muted-foreground hover:text-foreground hover:border-violet-400 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Link
                    </a>

                    <Separator />

                    {/* UTM Breakdown */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Parameters</p>
                      {utmParams.map((p) => (
                        <div key={p.label} className="flex items-center justify-between gap-2">
                          <Badge variant="secondary" className="text-[10px] font-mono shrink-0">{p.label}</Badge>
                          <span className="text-xs text-right text-muted-foreground truncate">{p.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Link2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Enter a base URL to generate your tracking link</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-violet-500/5 to-pink-500/5 border-violet-500/10">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-medium">Character Count</p>
                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                  {fullUrl.length}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {fullUrl.length > 2000 ? "⚠ URL may be too long for some platforms" : "✓ URL length is acceptable"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* History Tab */
        <div className="space-y-3">
          {saved.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No saved UTM links yet</p>
              </CardContent>
            </Card>
          ) : (
            saved.map((item) => (
              <Card key={item.id} className="hover:border-violet-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold">{item.name}</h3>
                        <Badge variant="secondary" className="text-[10px]">{item.source}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{item.medium}</Badge>
                      </div>
                      <p className="text-xs font-mono text-violet-600 dark:text-violet-400 truncate">{item.fullUrl}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => copyUrl(item.fullUrl)}
                      >
                        {copied === item.fullUrl ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => deleteLink(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
