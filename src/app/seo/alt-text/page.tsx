"use client";

import { useState, useCallback } from "react";
import {
  Image,
  Copy,
  RefreshCw,
  Plus,
  Trash2,
  Type,
  Eye,
  Search,
  Accessibility,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface AltTextResult {
  id: string;
  description: string;
  productName: string;
  brand: string;
  context: string;
  descriptive: string;
  keywordFocused: string;
  accessibilityFocused: string;
  createdAt: string;
}

interface BulkItem {
  id: string;
  description: string;
  descriptive: string;
  keywordFocused: string;
  accessibilityFocused: string;
}

const MAX_ALT_LENGTH = 125;

function generateDescriptive(desc: string, product: string, brand: string): string {
  const parts: string[] = [];
  if (brand) parts.push(brand);
  if (product) parts.push(product);
  parts.push(desc.toLowerCase());
  let alt = parts.join(" - ");
  if (alt.length > MAX_ALT_LENGTH) alt = alt.slice(0, MAX_ALT_LENGTH - 3) + "...";
  return alt;
}

function generateKeywordFocused(desc: string, product: string, brand: string, context: string): string {
  const parts: string[] = [];
  if (product) parts.push(product);
  if (desc) parts.push(desc.toLowerCase());
  if (brand) parts.push(`by ${brand}`);
  if (context) parts.push(`for ${context.toLowerCase()}`);
  let alt = parts.join(" ");
  if (alt.length > MAX_ALT_LENGTH) alt = alt.slice(0, MAX_ALT_LENGTH - 3) + "...";
  return alt;
}

function generateAccessibilityFocused(desc: string, product: string, context: string): string {
  let alt = "";
  if (product) {
    alt = `Image of ${product.toLowerCase()}: ${desc.toLowerCase()}`;
  } else {
    alt = desc;
  }
  if (context) alt += ` in ${context.toLowerCase()} context`;
  if (alt.length > MAX_ALT_LENGTH) alt = alt.slice(0, MAX_ALT_LENGTH - 3) + "...";
  return alt;
}

function charCountBadge(text: string) {
  const len = text.length;
  const color = len <= MAX_ALT_LENGTH ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0" : "bg-red-500/10 text-red-600 dark:text-red-400 border-0";
  return <Badge className={`${color} text-[10px]`}>{len}/{MAX_ALT_LENGTH}</Badge>;
}

export default function AltTextPage() {
  const [description, setDescription] = useState("");
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [context, setContext] = useState("");
  const [results, setResults] = useState<AltTextResult | null>(null);
  const [savedResults, setSavedResults, hydrated] = useLocalStorage<AltTextResult[]>("seo-alt-texts", []);
  const [copied, setCopied] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkResults, setBulkResults] = useState<BulkItem[]>([]);

  const handleGenerate = useCallback(() => {
    if (!description.trim()) return;
    const d = description.trim();
    const p = productName.trim();
    const b = brand.trim();
    const c = context.trim();
    const result: AltTextResult = {
      id: generateId(),
      description: d,
      productName: p,
      brand: b,
      context: c,
      descriptive: generateDescriptive(d, p, b),
      keywordFocused: generateKeywordFocused(d, p, b, c),
      accessibilityFocused: generateAccessibilityFocused(d, p, c),
      createdAt: new Date().toISOString(),
    };
    setResults(result);
  }, [description, productName, brand, context]);

  const handleBulkGenerate = useCallback(() => {
    const lines = bulkInput.split("\n").filter((l) => l.trim());
    const items: BulkItem[] = lines.map((line) => {
      const d = line.trim();
      return {
        id: generateId(),
        description: d,
        descriptive: generateDescriptive(d, productName.trim(), brand.trim()),
        keywordFocused: generateKeywordFocused(d, productName.trim(), brand.trim(), context.trim()),
        accessibilityFocused: generateAccessibilityFocused(d, productName.trim(), context.trim()),
      };
    });
    setBulkResults(items);
  }, [bulkInput, productName, brand, context]);

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleSave = useCallback(() => {
    if (!results) return;
    setSavedResults((prev) => [results, ...prev]);
  }, [results, setSavedResults]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Image Alt Text Generator"
        description="Generate descriptive, keyword-focused, and accessible alt text for your images."
        icon={Image}
        badge="SEO"
        actions={
          <Button variant="outline" size="sm" onClick={() => setBulkMode(!bulkMode)}>
            {bulkMode ? <Type className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {bulkMode ? "Single Mode" : "Bulk Mode"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Image className="h-4 w-4 text-violet-500" />Image Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!bulkMode ? (
                <div className="space-y-1.5">
                  <Label>Image Description <span className="text-red-500">*</span></Label>
                  <Textarea placeholder="e.g., A woman holding a coffee cup at a modern office desk" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Image Descriptions (one per line) <span className="text-red-500">*</span></Label>
                  <Textarea placeholder={"Woman holding coffee at desk\nTeam meeting in conference room\nProduct packaging close-up"} value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} rows={6} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Product Name</Label>
                <Input placeholder="e.g., Ergonomic Standing Desk" value={productName} onChange={(e) => setProductName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Brand</Label>
                  <Input placeholder="e.g., Acme Co" value={brand} onChange={(e) => setBrand(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Context</Label>
                  <Input placeholder="e.g., homepage hero" value={context} onChange={(e) => setContext(e.target.value)} />
                </div>
              </div>
              <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={bulkMode ? handleBulkGenerate : handleGenerate} disabled={bulkMode ? !bulkInput.trim() : !description.trim()}>
                <RefreshCw className="h-4 w-4" />Generate Alt Text{bulkMode ? "s" : ""}
              </Button>
            </CardContent>
          </Card>
          {results && !bulkMode && (
            <Button className="w-full" variant="outline" size="sm" onClick={handleSave}><Plus className="h-3.5 w-3.5" />Save to Library</Button>
          )}
        </div>

        <div className="lg:col-span-2">
          {!bulkMode && results ? (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Generated Alt Texts</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Descriptive", icon: Eye, text: results.descriptive, id: "desc" },
                  { label: "Keyword-Focused", icon: Search, text: results.keywordFocused, id: "kw" },
                  { label: "Accessibility-Focused", icon: Accessibility, text: results.accessibilityFocused, id: "a11y" },
                ].map((item) => (
                  <div key={item.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 text-violet-500" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {charCountBadge(item.text)}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(item.text, item.id)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm bg-muted/50 rounded-lg p-3">{item.text}</p>
                    {copied === item.id && <p className="text-xs text-emerald-600">Copied to clipboard!</p>}
                  </div>
                ))}
                <Separator />
                <div className="text-xs text-muted-foreground">
                  <p>Ideal alt text length is under {MAX_ALT_LENGTH} characters. Alt text should describe the image content accurately for screen readers and SEO.</p>
                </div>
              </CardContent>
            </Card>
          ) : bulkMode && bulkResults.length > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Bulk Results ({bulkResults.length})</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => {
                    const text = bulkResults.map((r) => `Description: ${r.description}\nDescriptive: ${r.descriptive}\nKeyword: ${r.keywordFocused}\nAccessibility: ${r.accessibilityFocused}`).join("\n\n");
                    navigator.clipboard.writeText(text);
                    setCopied("bulk");
                    setTimeout(() => setCopied(null), 2000);
                  }}>
                    <Copy className="h-3.5 w-3.5" />{copied === "bulk" ? "Copied!" : "Copy All"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {bulkResults.map((item) => (
                  <div key={item.id} className="rounded-lg border p-3 space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">{item.description}</p>
                    <div className="grid gap-1.5">
                      {[
                        { label: "Descriptive", text: item.descriptive },
                        { label: "Keyword", text: item.keywordFocused },
                        { label: "A11y", text: item.accessibilityFocused },
                      ].map((v) => (
                        <div key={v.label} className="flex items-start gap-2">
                          <Badge variant="secondary" className="text-[10px] shrink-0 mt-0.5">{v.label}</Badge>
                          <span className="text-xs flex-1">{v.text}</span>
                          <div className="shrink-0">{charCountBadge(v.text)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-16">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center">
                    <Image className="h-7 w-7 text-violet-400" />
                  </div>
                  <h3 className="text-sm font-medium">No Alt Text Generated Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {bulkMode ? "Paste image descriptions (one per line) and click Generate to create alt texts in bulk." : "Describe your image and click Generate to create multiple alt text variations."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {savedResults.length > 0 && !bulkMode && (
            <Card className="mt-4">
              <CardHeader className="pb-3"><CardTitle className="text-base">Saved Alt Texts ({savedResults.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {savedResults.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-lg border p-2.5 group hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.description}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.descriptive}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setSavedResults((prev) => prev.filter((x) => x.id !== r.id))}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
