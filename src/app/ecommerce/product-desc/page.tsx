"use client";

import { useState } from "react";
import { FileText, Copy, Check, Plus, X, BookOpen, Sparkles, Tag, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface SavedDescription {
  id: string;
  productName: string;
  descriptions: { label: string; text: string }[];
  metaDescription: string;
  keywords: string[];
  createdAt: string;
}

const TONES = ["Professional", "Casual", "Luxury", "Playful", "Technical", "Eco-Friendly"] as const;
const CATEGORIES = [
  "Electronics", "Clothing", "Home & Garden", "Beauty", "Sports",
  "Food & Beverage", "Toys", "Health", "Automotive", "Pet Supplies",
] as const;

function extractKeywords(name: string, features: string[], audience: string, category: string): string[] {
  const words = [name, category, audience, ...features]
    .join(" ")
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(w => w.length > 2);
  const unique = [...new Set(words)];
  return unique.slice(0, 12);
}

function generateAIDA(name: string, features: string[], audience: string, tone: string, price: string, length: "short" | "medium" | "long"): string {
  const featureList = features.length > 0 ? features.join(", ") : "premium quality";
  const priceText = price ? ` Starting at just ${price}.` : "";
  const toneAdj = tone === "Luxury" ? "exquisite" : tone === "Playful" ? "awesome" : tone === "Eco-Friendly" ? "sustainable" : "remarkable";

  if (length === "short") {
    return `Discover the ${toneAdj} ${name}. Featuring ${featureList}, it's designed specifically for ${audience || "discerning customers"}. Transform your experience today.${priceText} Order now and see the difference.`;
  }
  if (length === "medium") {
    return `Attention: Meet the ${toneAdj} ${name} - the solution ${audience || "customers"} have been waiting for. Interest: Crafted with ${featureList}, this product sets a new standard in quality and performance. Every detail has been carefully considered to deliver an exceptional experience. Desire: Imagine having a product that not only meets but exceeds your expectations. Join thousands of satisfied customers who have already made the switch.${priceText} Action: Don't wait - add the ${name} to your cart today and experience the difference for yourself.`;
  }
  return `Attention: Introducing the ${toneAdj} ${name} - a game-changing product that's revolutionizing the market for ${audience || "customers everywhere"}.\n\nInterest: What makes the ${name} stand out? It comes packed with ${featureList}. Each feature has been meticulously designed to provide unmatched performance and reliability. Whether you're a first-time buyer or upgrading from a competitor, you'll notice the difference immediately.\n\nDesire: Picture this - a product that seamlessly integrates into your daily routine, saving you time and elevating your experience. The ${name} has already earned rave reviews from early adopters who can't stop talking about its ${features[0] || "outstanding quality"}. With premium materials and cutting-edge design, this isn't just another product - it's an investment in quality.${priceText}\n\nAction: Ready to transform your experience? Add the ${name} to your cart now. With our satisfaction guarantee, you have nothing to lose and everything to gain. Limited stock available - order today before it's gone!`;
}

function generatePAS(name: string, features: string[], audience: string, tone: string, price: string, length: "short" | "medium" | "long"): string {
  const featureList = features.length > 0 ? features.join(", ") : "premium quality";
  const priceText = price ? ` Available now for just ${price}.` : "";

  if (length === "short") {
    return `Tired of settling for less? The ${name} solves your biggest pain points with ${featureList}. Designed for ${audience || "people like you"}, it delivers results you can count on.${priceText}`;
  }
  if (length === "medium") {
    return `Problem: Finding the right product shouldn't be this hard. ${audience || "Customers"} everywhere struggle with subpar options that fail to deliver. Agitate: Every day without the right solution means wasted time, money, and frustration. You deserve better than products that break, disappoint, or simply don't work as promised. Solution: Enter the ${name}. With ${featureList}, it's the answer you've been looking for. Built with quality in mind and backed by our commitment to excellence.${priceText} Make the smart choice today.`;
  }
  return `Problem: Let's face it - ${audience || "customers"} are frustrated. The market is flooded with products that promise the world but deliver disappointment. You've probably experienced it yourself - spending hard-earned money on items that break down, underperform, or simply don't live up to the hype.\n\nAgitate: This isn't just annoying - it's costly. Every bad purchase means more money wasted, more time lost returning products, and more stress added to your day. The cycle of buy-regret-return is exhausting, and you shouldn't have to put up with it anymore.\n\nSolution: That's exactly why we created the ${name}. Featuring ${featureList}, this product was born from understanding your frustrations and engineering real solutions. Every component has been tested, refined, and perfected to ensure it not only meets your expectations but exceeds them.\n\nWhat sets the ${name} apart is our obsessive attention to detail. From the premium materials to the thoughtful design, everything serves a purpose.${priceText} Join the growing community of satisfied customers who finally found a product they can trust. Order your ${name} today and experience the difference quality makes.`;
}

function generateFeatureBenefit(name: string, features: string[], audience: string, tone: string, price: string, length: "short" | "medium" | "long"): string {
  const priceText = price ? ` Priced at ${price}.` : "";
  const featureBenefits = features.length > 0
    ? features.map(f => `${f} - giving you superior performance`).join(". ")
    : "Premium craftsmanship - giving you superior performance";

  if (length === "short") {
    return `The ${name}: ${featureBenefits}. Perfect for ${audience || "everyone"}. Quality you can feel, results you can see.${priceText}`;
  }
  if (length === "medium") {
    return `Introducing the ${name} - where every feature serves a purpose. ${features.map((f, i) => `${f}: ${["Enjoy unmatched reliability", "Experience superior comfort", "Get professional-grade results", "Save time with smart design", "Feel the premium difference"][i % 5]}`).join(". ")}. Designed with ${audience || "our customers"} in mind, the ${name} bridges the gap between what you need and what you deserve.${priceText} Elevate your standards today.`;
  }
  const detailedFeatures = features.length > 0
    ? features.map((f, i) => {
        const benefits = [
          `This means you get consistent, reliable performance every single time you use it.`,
          `The result? A smoother, more enjoyable experience that saves you both time and effort.`,
          `This translates to long-lasting durability that protects your investment for years to come.`,
          `You'll appreciate how this thoughtful addition simplifies your daily routine.`,
          `This ensures you're always getting the best possible results, no matter the conditions.`,
        ];
        return `**${f}**\n${benefits[i % benefits.length]}`;
      }).join("\n\n")
    : `**Premium Quality**\nThis means you get consistent, reliable performance every single time.`;

  return `# ${name} - Feature Breakdown\n\nEvery feature of the ${name} has been carefully engineered to deliver real benefits to ${audience || "our customers"}.\n\n${detailedFeatures}\n\nThe ${name} isn't just a product - it's a commitment to quality. We've listened to what ${audience || "customers"} really want and delivered a solution that checks every box.${priceText}\n\nReady to experience the difference? Order your ${name} today and discover why customers are calling it a must-have.`;
}

export default function ProductDescPage() {
  const [library, setLibrary, hydrated] = useLocalStorage<SavedDescription[]>("ecommerce-product-desc-library", []);

  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState<string>("Professional");
  const [price, setPrice] = useState("");

  const [generated, setGenerated] = useState<{ label: string; text: string }[] | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [metaDesc, setMetaDesc] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  const addFeature = () => {
    const trimmed = featureInput.trim();
    if (trimmed && !features.includes(trimmed)) {
      setFeatures(prev => [...prev, trimmed]);
      setFeatureInput("");
    }
  };

  const removeFeature = (idx: number) => {
    setFeatures(prev => prev.filter((_, i) => i !== idx));
  };

  const generate = () => {
    if (!productName.trim()) return;

    const short = generateAIDA(productName, features, audience, tone, price, "short");
    const medium = generatePAS(productName, features, audience, tone, price, "medium");
    const long = generateFeatureBenefit(productName, features, audience, tone, price, "long");

    const descs = [
      { label: "Short (AIDA Formula)", text: short },
      { label: "Medium (PAS Formula)", text: medium },
      { label: "Long (Feature-Benefit)", text: long },
    ];
    setGenerated(descs);

    const kws = extractKeywords(productName, features, audience, category);
    setKeywords(kws);

    const meta = `${productName} - ${features.slice(0, 2).join(", ")}${features.length > 2 ? " & more" : ""}. Perfect for ${audience || "everyone"}. Shop now!`;
    setMetaDesc(meta.length > 155 ? meta.slice(0, 152) + "..." : meta);
  };

  const copyText = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const copyAll = async () => {
    if (!generated) return;
    const all = generated.map(d => `--- ${d.label} ---\n${d.text}`).join("\n\n");
    await navigator.clipboard.writeText(all);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  };

  const saveToLibrary = () => {
    if (!generated || !productName.trim()) return;
    const entry: SavedDescription = {
      id: generateId(),
      productName,
      descriptions: generated,
      metaDescription: metaDesc,
      keywords,
      createdAt: new Date().toISOString(),
    };
    setLibrary(prev => [entry, ...prev]);
  };

  const removeFromLibrary = (id: string) => {
    setLibrary(prev => prev.filter(e => e.id !== id));
  };

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Description Writer"
        description="Generate compelling product descriptions using proven copywriting formulas with SEO optimization."
        icon={FileText}
        badge="E-Commerce"
        replaces="Jasper, Copy.ai"
      />

      <div className="flex gap-2 mb-4">
        <Button
          variant={showLibrary ? "outline" : "default"}
          size="sm"
          onClick={() => setShowLibrary(false)}
        >
          <Sparkles className="h-4 w-4 mr-1" /> Generator
        </Button>
        <Button
          variant={showLibrary ? "default" : "outline"}
          size="sm"
          onClick={() => setShowLibrary(true)}
        >
          <BookOpen className="h-4 w-4 mr-1" /> Library ({library.length})
        </Button>
      </div>

      {!showLibrary ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Product Name *</Label>
                  <Input value={productName} onChange={e => setProductName(e.target.value)} placeholder="e.g. Wireless Noise-Canceling Headphones" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Category</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map(c => (
                      <button
                        key={c}
                        onClick={() => setCategory(category === c ? "" : c)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                          category === c
                            ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Key Features</Label>
                  <div className="flex gap-2">
                    <Input
                      value={featureInput}
                      onChange={e => setFeatureInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addFeature())}
                      placeholder="Add a feature..."
                    />
                    <Button size="sm" variant="outline" onClick={addFeature}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {features.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {features.map((f, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          {f}
                          <button onClick={() => removeFeature(i)}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Target Audience</Label>
                  <Input value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g. music lovers, remote workers" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Price Point</Label>
                  <Input value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. $49.99" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Tone</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {TONES.map(t => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                          tone === t
                            ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={generate}
              disabled={!productName.trim()}
              className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
            >
              <Sparkles className="h-4 w-4 mr-2" /> Generate Descriptions
            </Button>
          </div>

          {/* Output */}
          <div className="space-y-4">
            {!generated ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Fill in product details and click generate to create descriptions.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {generated.map((desc, idx) => (
                  <Card key={idx}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{desc.label}</CardTitle>
                        <Button size="sm" variant="ghost" onClick={() => copyText(desc.text, idx)}>
                          {copiedIndex === idx ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{desc.text}</p>
                    </CardContent>
                  </Card>
                ))}

                {/* SEO Keywords */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Tag className="h-4 w-4" /> SEO Keywords
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {keywords.map((kw, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Meta Description */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Meta Description ({metaDesc.length}/155)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={metaDesc}
                      onChange={e => setMetaDesc(e.target.value.slice(0, 155))}
                      className="text-sm"
                      rows={2}
                    />
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button onClick={copyAll} variant="outline" className="flex-1">
                    {copiedAll ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copiedAll ? "All Copied!" : "Copy All"}
                  </Button>
                  <Button onClick={saveToLibrary} className="flex-1 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0">
                    <BookOpen className="h-4 w-4 mr-2" /> Save to Library
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Library View */
        <div className="space-y-4">
          {library.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No saved descriptions yet. Generate and save some first!</p>
              </CardContent>
            </Card>
          ) : (
            library.map(entry => (
              <Card key={entry.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">{entry.productName}</CardTitle>
                      <p className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removeFromLibrary(entry.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {entry.descriptions.map((d, i) => (
                    <div key={i} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{d.label}</span>
                        <Button size="sm" variant="ghost" onClick={() => copyText(d.text, -1)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{d.text.slice(0, 200)}...</p>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-1">
                    {entry.keywords.map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{kw}</Badge>
                    ))}
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
