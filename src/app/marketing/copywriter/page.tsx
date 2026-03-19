"use client";

import { useState } from "react";
import { PenTool, Copy, Check, Trash2, BookOpen, Sparkles, ChevronDown } from "lucide-react";
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
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type Tone = "professional" | "casual" | "luxury" | "playful";
type TemplateType = "product-desc" | "about" | "collection" | "faq" | "email-subjects";

interface SavedCopy {
  id: string;
  title: string;
  type: TemplateType;
  tone: Tone;
  content: string;
  savedAt: string;
}

const TONES: { value: Tone; label: string; emoji: string }[] = [
  { value: "professional", label: "Professional", emoji: "💼" },
  { value: "casual", label: "Casual & Friendly", emoji: "😊" },
  { value: "luxury", label: "Luxury & Premium", emoji: "✨" },
  { value: "playful", label: "Playful & Fun", emoji: "🎉" },
];

const TEMPLATES: { value: TemplateType; label: string; description: string }[] = [
  { value: "product-desc", label: "Product Description", description: "Compelling product copy" },
  { value: "about", label: "About Page", description: "Brand story & mission" },
  { value: "collection", label: "Collection Description", description: "Category page intro text" },
  { value: "faq", label: "FAQ Section", description: "Common questions & answers" },
  { value: "email-subjects", label: "Email Subject Lines", description: "High-open-rate subject ideas" },
];

function generateSampleCopy(
  productName: string,
  productType: string,
  features: string,
  tone: Tone,
  template: TemplateType
): string {
  const name = productName || "Your Product";
  const type = productType || "product";
  const featureList = features.split(",").map(f => f.trim()).filter(Boolean);

  const tonePrefix = {
    professional: "Crafted with precision,",
    casual: "Hey, meet",
    luxury: "Introducing the pinnacle of refinement —",
    playful: "Get ready to love",
  }[tone];

  if (template === "product-desc") {
    const featuresStr = featureList.length
      ? featureList.map((f, i) => `• ${f}`).join("\n")
      : "• Premium quality materials\n• Expertly crafted\n• Built to last";
    if (tone === "professional") return `${name}\n\n${tonePrefix} ${name} is a ${type} engineered to elevate your everyday experience. Designed with meticulous attention to detail, it delivers uncompromising performance you can rely on.\n\n${featuresStr}\n\nExperience the difference that quality makes. Order ${name} today and receive free shipping on orders over $50.`;
    if (tone === "casual") return `${name}\n\n${tonePrefix} the ${name} — the ${type} you didn't know you needed! Seriously, once you try it, you'll wonder how you ever lived without it.\n\n${featuresStr}\n\nGrab yours today and join thousands of happy customers. Plus, free shipping on all orders! 🚀`;
    if (tone === "luxury") return `${name}\n\n${tonePrefix} the ${name}. An exceptional ${type} born from the highest standards of craftsmanship and an unwavering commitment to excellence.\n\n${featuresStr}\n\nFor those who demand nothing but the finest. ${name} — because extraordinary people deserve extraordinary things.`;
    return `${name}\n\n${tonePrefix} ${name}! 🎊 This amazing ${type} is about to become your new best friend. It's fun, it's fabulous, and it does everything you dreamed of!\n\n${featuresStr}\n\nDon't miss out — snag yours today before we sell out (again)! 🛒✨`;
  }

  if (template === "about") {
    return tone === "professional"
      ? `About Us\n\nFounded on a passion for excellence, we specialize in delivering premium ${type} solutions that empower our customers. The ${name} brand was born from a simple belief: quality should never be a compromise.\n\nOur team of dedicated craftspeople and designers work tirelessly to ensure every product meets the highest standards. From concept to delivery, we oversee every detail so you don't have to.\n\nWe're proud to serve thousands of satisfied customers worldwide and remain committed to innovation, integrity, and exceptional service.`
      : tone === "luxury"
      ? `Our Story\n\nSome brands are built. Ours was sculpted.\n\n${name} began as a singular vision — to create a ${type} experience so refined, so impeccably crafted, that it would redefine an entire category. Every stitch, every curve, every element was considered with obsessive care.\n\nWe believe luxury is not merely about price. It is about intention, mastery, and the quiet confidence that comes with owning something truly extraordinary. Welcome to ${name}.`
      : `Our Story 💫\n\nHi there! We're the team behind ${name}, and we're absolutely obsessed with making the best ${type} you've ever experienced.\n\nIt all started when our founder couldn't find a ${type} that was actually good — so we built one ourselves! Now we ship to customers all over the world and wake up every morning excited to do what we love.\n\nWe keep things real, our prices fair, and our customers happy. That's the ${name} promise. Thanks for being here! 🙌`;
  }

  if (template === "collection") {
    if (tone === "professional") return `Shop Our ${name} Collection\n\nExplore our carefully curated selection of ${type} products, designed to suit every need and style. Whether you're looking for everyday essentials or something truly special, our ${name} collection has exactly what you're searching for.\n\nEach piece in this collection has been hand-selected for quality, durability, and value. We believe you deserve the best — and that's exactly what we deliver.\n\nFree shipping on orders over $50 · 30-day returns · Customer support 7 days a week`;
    if (tone === "casual") return `Check Out Our ${name} Collection! 🛍️\n\nWe've put together an awesome lineup of ${type} products that we think you're going to love. From everyday must-haves to those special treat-yourself picks, there's something here for everyone.\n\nEvery item has been hand-picked by our team — because life's too short for boring ${type}!\n\nFree shipping over $50 · Easy 30-day returns · We're here 7 days a week 💬`;
    if (tone === "luxury") return `The ${name} Collection\n\nA meticulously curated assemblage of our finest ${type} offerings — each piece a testament to uncompromising quality and refined taste.\n\nFrom timeless essentials to exclusive statement pieces, the ${name} collection represents the pinnacle of craftsmanship. Every selection has been chosen with discerning attention to detail, material integrity, and enduring elegance.\n\nComplimentary shipping · White-glove 30-day returns · Dedicated concierge support`;
    return `Our ${name} Collection is HERE! 🎉\n\nOh. My. Goodness. We've put together the most amazing lineup of ${type} goodies and we literally can't stop smiling about it! There's something for every mood, every vibe, every "I deserve this" moment.\n\nSeriously — every single piece was hand-picked with love. You're welcome! 😉\n\nFree shipping over $50 · 30-day no-stress returns · We've got your back 7 days a week! 🙌`;
  }

  if (template === "faq") {
    const faqIntro = tone === "professional" ? `Frequently Asked Questions — ${name}` : tone === "casual" ? `Got Questions? We've Got Answers! — ${name}` : tone === "luxury" ? `${name} — Your Questions, Answered` : `FAQ Time! 🤓 — ${name}`;
    const a1 = tone === "professional" ? `We combine premium materials with expert craftsmanship to deliver a product that outlasts and outperforms the competition. Every detail is intentional.` : tone === "casual" ? `Great question! We obsess over quality and put a ton of care into every product. Once you try ${name}, you'll totally feel the difference!` : tone === "luxury" ? `${name} is distinguished by an unwavering commitment to excellence. From the finest materials to masterful artisanship, every element reflects a singular vision of perfection.` : `So glad you asked! ${name} is basically the superhero of ${type} — better materials, way more love, and that special something that makes you go "wow!" ✨`;
    const a2 = tone === "professional" ? `We offer a hassle-free 30-day return policy. If you're not 100% satisfied, contact our team and we'll make it right.` : tone === "casual" ? `No worries! You've got 30 days to decide. If it's not your thing, just reach out and we'll sort it — easy peasy.` : tone === "luxury" ? `We stand behind every piece with a gracious 30-day return policy. Your complete satisfaction is our highest priority.` : `30 days to love it or return it — no hard feelings! Just hit us up and we'll take care of everything. 🤝`;
    return `${faqIntro}\n\nQ: What makes ${name} different from other ${type} brands?\nA: ${a1}\n\nQ: What is your return policy?\nA: ${a2}\n\nQ: How long does shipping take?\nA: Standard shipping takes 3–5 business days. Express options are available at checkout. Free shipping on orders over $50.\n\nQ: Do you ship internationally?\nA: Yes! We ship to over 50 countries. International shipping times and rates vary by destination.\n\nQ: Is ${name} suitable for ${featureList[0] || "everyday use"}?\nA: Absolutely. ${name} is designed for real life — durable, reliable, and built to perform day after day.`;
  }

  if (template === "email-subjects") {
    const urgency = ["Last Chance:", "Ending Soon:", "Don't Miss:"];
    const curiosity = ["We Need to Talk About", "The Secret Behind", "Why Everyone's Obsessed With"];
    return `Email Subject Lines for ${name}\n\n🔥 HIGH URGENCY\n• ${urgency[0]} Get ${name} Before It Sells Out\n• Only 24 Hours Left — ${name} Sale Ends Tonight\n• Final Hours: ${name} at Our Lowest Price Ever\n\n🧠 CURIOSITY\n• ${curiosity[0]} ${name}\n• ${curiosity[1]} Our Best-Selling ${type}\n• This ${type} Changed Everything (Here's Why)\n\n💎 VALUE\n• Free Shipping on ${name} — Today Only\n• ${name}: Get More, Pay Less\n• Your Exclusive Offer: ${name} at 20% Off\n\n😊 PERSONAL\n• We Made This ${type} Just for You\n• A Quick Note About Your ${name} Order\n• You're Going to Love ${name}`;
  }

  return "Generated copy will appear here.";
}

export default function CopywriterPage() {
  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState("");
  const [features, setFeatures] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [template, setTemplate] = useState<TemplateType>("product-desc");
  const [generated, setGenerated] = useState("");
  const [copied, setCopied] = useState(false);
  const [library, setLibrary] = useLocalStorage<SavedCopy[]>("copywriter-library", []);

  function handleGenerate() {
    const copy = generateSampleCopy(productName, productType, features, tone, template);
    setGenerated(copy);
  }

  function handleCopy() {
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSave() {
    if (!generated) return;
    const item: SavedCopy = {
      id: generateId(),
      title: productName || "Untitled",
      type: template,
      tone,
      content: generated,
      savedAt: new Date().toLocaleDateString(),
    };
    setLibrary(prev => [item, ...prev]);
  }

  function handleDelete(id: string) {
    setLibrary(prev => prev.filter(i => i.id !== id));
  }

  const wordCount = generated.trim().split(/\s+/).filter(Boolean).length;
  const charCount = generated.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Copywriter"
        description="Generate product descriptions, about pages, FAQs, and more."
        icon={PenTool}
        badge="AI"
        replaces="Jasper ($49/mo)"
      />

      <Tabs defaultValue="generator">
        <TabsList>
          <TabsTrigger value="generator">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Generator
          </TabsTrigger>
          <TabsTrigger value="library">
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            Library
            {library.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{library.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Inputs */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Product Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Product Name</Label>
                    <Input placeholder="e.g. ArcWallet Pro" value={productName} onChange={e => setProductName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Product Type</Label>
                    <Input placeholder="e.g. leather wallet, skincare serum" value={productType} onChange={e => setProductType(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Key Features <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
                    <Textarea rows={3} placeholder="RFID blocking, full-grain leather, slim profile, 6-card slots" value={features} onChange={e => setFeatures(e.target.value)} />
                  </div>

                  <Separator />

                  <div className="space-y-1.5">
                    <Label>Tone of Voice</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {TONES.map(t => (
                        <button
                          key={t.value}
                          onClick={() => setTone(t.value)}
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-all ${tone === t.value ? "border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300 font-medium" : "border-border hover:border-violet-300 text-muted-foreground"}`}
                        >
                          <span>{t.emoji}</span>
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Template Type</Label>
                    <Select value={template} onValueChange={v => setTemplate(v as TemplateType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATES.map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            <div>
                              <div className="font-medium">{t.label}</div>
                              <div className="text-xs text-muted-foreground">{t.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
                    onClick={handleGenerate}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Copy
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Output */}
            <div className="lg:col-span-3 space-y-4">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Generated Copy</CardTitle>
                    {generated && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{wordCount}w · {charCount}c</span>
                        <Button size="sm" variant="outline" onClick={handleSave} className="h-7 text-xs">
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCopy} className="h-7 text-xs">
                          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied ? "Copied!" : "Copy"}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {generated ? (
                    <div className="relative">
                      <Textarea
                        value={generated}
                        onChange={e => setGenerated(e.target.value)}
                        rows={20}
                        className="font-mono text-sm resize-none"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center">
                        <PenTool className="h-7 w-7 text-violet-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Ready to write</p>
                        <p className="text-xs text-muted-foreground mt-1">Fill in product details and click Generate Copy</p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center max-w-xs">
                        {TEMPLATES.map(t => (
                          <Badge
                            key={t.value}
                            variant="secondary"
                            className="text-xs cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900 transition-colors"
                            onClick={() => setTemplate(t.value)}
                          >
                            {t.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="library" className="mt-4">
          {library.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center">
                  <BookOpen className="h-7 w-7 text-violet-400" />
                </div>
                <div className="text-center">
                  <p className="font-medium">No saved copies yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Generate copy and click Save to build your library.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {library.map(item => (
                <Card key={item.id} className="group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-sm">{item.title}</h3>
                        <div className="flex gap-1.5 mt-1">
                          <Badge variant="secondary" className="text-[10px] h-4">
                            {TEMPLATES.find(t => t.value === item.type)?.label}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] h-4 bg-gradient-to-r from-violet-500/10 to-pink-500/10 text-violet-600 dark:text-violet-400 border-0">
                            {TONES.find(t => t.value === item.tone)?.emoji} {item.tone}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => { navigator.clipboard.writeText(item.content); }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-line">{item.content}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-2">Saved {item.savedAt}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
