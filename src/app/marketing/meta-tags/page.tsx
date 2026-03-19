"use client";

import { useState, useMemo } from "react";
import { Tags, Copy, Check, RefreshCw, Globe, Share2, Code } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

type SchemaType = "product" | "organization" | "article";

interface MetaForm {
  pageTitle: string;
  description: string;
  keywords: string;
  author: string;
  ogImage: string;
  siteName: string;
  canonicalUrl: string;
  twitterHandle: string;
  noIndex: boolean;
  noFollow: boolean;
}

const DEFAULT: MetaForm = {
  pageTitle: "",
  description: "",
  keywords: "",
  author: "",
  ogImage: "",
  siteName: "",
  canonicalUrl: "",
  twitterHandle: "",
  noIndex: false,
  noFollow: false,
};

function buildMetaTags(f: MetaForm): string {
  const robots = [f.noIndex ? "noindex" : "index", f.noFollow ? "nofollow" : "follow"].join(", ");
  const lines: string[] = [];

  lines.push("<!-- Primary Meta Tags -->");
  if (f.pageTitle) lines.push(`<title>${f.pageTitle}</title>`);
  if (f.pageTitle) lines.push(`<meta name="title" content="${f.pageTitle}">`);
  if (f.description) lines.push(`<meta name="description" content="${f.description}">`);
  if (f.keywords) lines.push(`<meta name="keywords" content="${f.keywords}">`);
  if (f.author) lines.push(`<meta name="author" content="${f.author}">`);
  lines.push(`<meta name="robots" content="${robots}">`);
  if (f.canonicalUrl) lines.push(`<link rel="canonical" href="${f.canonicalUrl}">`);

  lines.push("");
  lines.push("<!-- Open Graph / Facebook -->");
  lines.push(`<meta property="og:type" content="website">`);
  if (f.canonicalUrl) lines.push(`<meta property="og:url" content="${f.canonicalUrl}">`);
  if (f.pageTitle) lines.push(`<meta property="og:title" content="${f.pageTitle}">`);
  if (f.description) lines.push(`<meta property="og:description" content="${f.description}">`);
  if (f.ogImage) lines.push(`<meta property="og:image" content="${f.ogImage}">`);
  if (f.siteName) lines.push(`<meta property="og:site_name" content="${f.siteName}">`);

  lines.push("");
  lines.push("<!-- Twitter Card -->");
  lines.push(`<meta name="twitter:card" content="summary_large_image">`);
  if (f.canonicalUrl) lines.push(`<meta name="twitter:url" content="${f.canonicalUrl}">`);
  if (f.pageTitle) lines.push(`<meta name="twitter:title" content="${f.pageTitle}">`);
  if (f.description) lines.push(`<meta name="twitter:description" content="${f.description}">`);
  if (f.ogImage) lines.push(`<meta name="twitter:image" content="${f.ogImage}">`);
  if (f.twitterHandle) lines.push(`<meta name="twitter:site" content="@${f.twitterHandle.replace("@", "")}">`);

  return lines.join("\n");
}

function buildJsonLd(type: SchemaType, f: MetaForm): string {
  const base = {
    "@context": "https://schema.org",
  };
  if (type === "product") {
    return JSON.stringify({
      ...base,
      "@type": "Product",
      "name": f.pageTitle || "Product Name",
      "description": f.description || "Product description",
      "image": f.ogImage || "https://example.com/image.jpg",
      "brand": { "@type": "Brand", "name": f.siteName || f.author || "Brand Name" },
      "offers": {
        "@type": "Offer",
        "url": f.canonicalUrl || "https://example.com/product",
        "priceCurrency": "USD",
        "price": "0.00",
        "availability": "https://schema.org/InStock",
      },
    }, null, 2);
  }
  if (type === "organization") {
    return JSON.stringify({
      ...base,
      "@type": "Organization",
      "name": f.siteName || "Organization Name",
      "url": f.canonicalUrl || "https://example.com",
      "logo": f.ogImage || "https://example.com/logo.png",
      "sameAs": [],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": "English",
      },
    }, null, 2);
  }
  // article
  return JSON.stringify({
    ...base,
    "@type": "Article",
    "headline": f.pageTitle || "Article Title",
    "description": f.description || "Article description",
    "image": f.ogImage || "https://example.com/image.jpg",
    "author": { "@type": "Person", "name": f.author || "Author Name" },
    "publisher": {
      "@type": "Organization",
      "name": f.siteName || "Publisher Name",
      "logo": { "@type": "ImageObject", "url": "https://example.com/logo.png" },
    },
    "datePublished": new Date().toISOString().split("T")[0],
    "mainEntityOfPage": { "@type": "WebPage", "@id": f.canonicalUrl || "https://example.com/article" },
  }, null, 2);
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 shrink-0">
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : (label || "Copy")}
    </Button>
  );
}

export default function MetaTagsPage() {
  const [form, setForm] = useState<MetaForm>(DEFAULT);
  const [schemaType, setSchemaType] = useState<SchemaType>("product");

  const metaTags = useMemo(() => buildMetaTags(form), [form]);
  const jsonLd = useMemo(() => buildJsonLd(schemaType, form), [schemaType, form]);

  const titleLen = form.pageTitle.length;
  const descLen = form.description.length;

  function update<K extends keyof MetaForm>(key: K, value: MetaForm[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function handleReset() { setForm(DEFAULT); }

  const displayTitle = form.pageTitle || "Your Page Title";
  const displayDesc = form.description || "Your meta description will appear here when your page shows up in Google search results.";
  const displayUrl = form.canonicalUrl || "https://yoursite.com/page";
  const displaySite = form.siteName || "Your Site";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meta Tag Generator"
        description="Generate SEO meta tags, Open Graph tags, Twitter Cards, and JSON-LD schema."
        icon={Tags}
        replaces="Yoast ($99/yr)"
      />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Input form */}
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tags className="h-4 w-4 text-violet-500" />
                  Page Details
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-xs gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Page Title</Label>
                  <span className={`text-xs font-mono ${titleLen > 60 ? "text-red-500" : titleLen >= 50 ? "text-emerald-500" : "text-muted-foreground"}`}>
                    {titleLen} / 60
                  </span>
                </div>
                <Input placeholder="My Awesome Product — Brand Name" value={form.pageTitle} onChange={e => update("pageTitle", e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Meta Description</Label>
                  <span className={`text-xs font-mono ${descLen > 160 ? "text-red-500" : descLen >= 140 ? "text-emerald-500" : "text-muted-foreground"}`}>
                    {descLen} / 160
                  </span>
                </div>
                <Textarea rows={2} placeholder="A concise description of your page. Include your main keyword naturally." value={form.description} onChange={e => update("description", e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Keywords <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
                <Input placeholder="keyword1, keyword2, keyword3" value={form.keywords} onChange={e => update("keywords", e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Author</Label>
                  <Input placeholder="John Doe" value={form.author} onChange={e => update("author", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Site Name</Label>
                  <Input placeholder="My Store" value={form.siteName} onChange={e => update("siteName", e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Canonical URL</Label>
                <Input placeholder="https://yoursite.com/page" value={form.canonicalUrl} onChange={e => update("canonicalUrl", e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>OG Image URL <span className="text-muted-foreground text-xs">(1200×630px)</span></Label>
                <Input placeholder="https://yoursite.com/og-image.jpg" value={form.ogImage} onChange={e => update("ogImage", e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Twitter Handle</Label>
                <Input placeholder="@yourhandle" value={form.twitterHandle} onChange={e => update("twitterHandle", e.target.value)} />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>No Index</Label>
                    <p className="text-xs text-muted-foreground">Prevent search engines from indexing this page</p>
                  </div>
                  <Switch checked={form.noIndex} onCheckedChange={v => update("noIndex", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>No Follow</Label>
                    <p className="text-xs text-muted-foreground">Prevent crawling links on this page</p>
                  </div>
                  <Switch checked={form.noFollow} onCheckedChange={v => update("noFollow", v)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Output + Previews */}
        <div className="xl:col-span-3 space-y-4">
          {/* Google Search Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-violet-500" />
                Google Search Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border bg-white dark:bg-zinc-900 p-4 font-sans">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-violet-500 to-pink-500" />
                  <div>
                    <p className="text-xs font-medium text-foreground">{displaySite}</p>
                    <p className="text-xs text-muted-foreground">{displayUrl}</p>
                  </div>
                </div>
                <p className="text-[#1a0dab] dark:text-[#8ab4f8] text-lg font-medium leading-snug hover:underline cursor-pointer truncate">
                  {displayTitle}
                </p>
                <p className="text-sm text-[#4d5156] dark:text-[#bdc1c6] mt-1 leading-relaxed line-clamp-2">
                  {displayDesc}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Title: {titleLen}/60 · Description: {descLen}/160
                {titleLen > 60 && <span className="text-red-500 ml-2">⚠ Title too long — may be truncated</span>}
                {descLen > 160 && <span className="text-red-500 ml-2">⚠ Description too long — may be truncated</span>}
              </p>
            </CardContent>
          </Card>

          {/* Social Share Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Share2 className="h-4 w-4 text-violet-500" />
                Social Share Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-hidden max-w-sm">
                {form.ogImage ? (
                  <img
                    src={form.ogImage}
                    alt="OG"
                    className="w-full h-40 object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="h-40 bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">OG image preview (1200×630px)</p>
                  </div>
                )}
                <div className="p-3 bg-[#f0f2f5] dark:bg-zinc-800 border-t">
                  <p className="text-[10px] uppercase text-muted-foreground tracking-wide">
                    {form.canonicalUrl ? (() => { try { return new URL(form.canonicalUrl.startsWith("http") ? form.canonicalUrl : "https://" + form.canonicalUrl).hostname; } catch { return "yoursite.com"; } })() : "yoursite.com"}
                  </p>
                  <p className="font-semibold text-sm mt-0.5 line-clamp-2">{displayTitle}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{displayDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generated Tags */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code className="h-4 w-4 text-violet-500" />
                  Generated Tags
                </CardTitle>
                <CopyButton text={metaTags} label="Copy All Tags" />
              </div>
            </CardHeader>
            <CardContent>
              <pre className="text-xs font-mono bg-zinc-950 text-zinc-100 rounded-lg p-4 overflow-auto max-h-72 leading-relaxed whitespace-pre-wrap">
                {metaTags}
              </pre>
            </CardContent>
          </Card>

          {/* JSON-LD Schema */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base">JSON-LD Schema</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={schemaType} onValueChange={v => setSchemaType(v as SchemaType)}>
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="organization">Organization</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                    </SelectContent>
                  </Select>
                  <CopyButton text={`<script type="application/ld+json">\n${jsonLd}\n</script>`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-zinc-950 p-4 overflow-auto max-h-72">
                <p className="text-[10px] text-zinc-500 mb-1 font-mono">&lt;script type="application/ld+json"&gt;</p>
                <pre className="text-xs font-mono text-zinc-100 leading-relaxed whitespace-pre-wrap">{jsonLd}</pre>
                <p className="text-[10px] text-zinc-500 mt-1 font-mono">&lt;/script&gt;</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Paste this in your page's <code className="text-xs bg-muted px-1 rounded">&lt;head&gt;</code> section to help search engines understand your content.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
