"use client";

import { useState } from "react";
import { Mail, Copy, Check, Trash2, Eye, Code, Save, Palette } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface EmailTemplate {
  id: string;
  name: string;
  headerText: string;
  heroImageUrl: string;
  heading: string;
  bodyText: string;
  ctaText: string;
  ctaColor: string;
  footerText: string;
  savedAt: string;
}

interface PresetTemplate {
  id: string;
  name: string;
  badge: string;
  headerText: string;
  heroImageUrl: string;
  heading: string;
  bodyText: string;
  ctaText: string;
  ctaColor: string;
  footerText: string;
}

const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: "welcome",
    name: "Welcome Email",
    badge: "Onboarding",
    headerText: "Welcome to Our Store 🎉",
    heroImageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=200&fit=crop",
    heading: "You're in! Welcome to the family.",
    bodyText: "Thank you for joining us! We're thrilled to have you as part of our community. As a new member, you get exclusive access to our best deals, early product launches, and members-only content.\n\nHere's what you can look forward to:\n• 10% off your first order\n• Early access to new collections\n• Free shipping on orders over $50\n\nWe can't wait for you to explore everything we have to offer. If you ever need help, our support team is available 7 days a week.",
    ctaText: "Shop Now →",
    ctaColor: "#7c3aed",
    footerText: "You're receiving this because you signed up at ourstore.com. Unsubscribe anytime.",
  },
  {
    id: "order-confirm",
    name: "Order Confirmation",
    badge: "Transactional",
    headerText: "Order Confirmed ✅",
    heroImageUrl: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=600&h=200&fit=crop",
    heading: "Your order is on its way!",
    bodyText: "Great news — your order has been confirmed and is being prepared for shipment. Here's a summary of what you ordered:\n\n📦 Order #12345\n• Product Name × 1 — $49.00\n• Shipping — Free\n• Total — $49.00\n\nExpected delivery: 3–5 business days\n\nYou'll receive a shipping confirmation email with your tracking number once your order ships. Thank you for shopping with us!",
    ctaText: "Track Your Order →",
    ctaColor: "#059669",
    footerText: "Questions? Reply to this email or contact support@ourstore.com",
  },
  {
    id: "abandoned-cart",
    name: "Abandoned Cart",
    badge: "Recovery",
    headerText: "You left something behind 🛒",
    heroImageUrl: "https://images.unsplash.com/photo-1573612664822-d7d347da7b80?w=600&h=200&fit=crop",
    heading: "Your cart misses you!",
    bodyText: "Hey there! We noticed you left some great items in your cart. Don't let them slip away — your cart is saved and ready whenever you are.\n\nHere's what you left behind:\n• [Product Name] — $XX.00\n\nGood news: these items are still in stock right now, but we can't guarantee how long that will last. Complete your purchase today and get free shipping on your order!\n\n🔥 Use code COMEBACK10 for an extra 10% off — limited time only.",
    ctaText: "Complete My Order →",
    ctaColor: "#dc2626",
    footerText: "This offer expires in 24 hours. Unsubscribe from cart reminders.",
  },
  {
    id: "newsletter",
    name: "Newsletter",
    badge: "Content",
    headerText: "This Month at Our Store 📰",
    heroImageUrl: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&h=200&fit=crop",
    heading: "What's new this month",
    bodyText: "Hello lovely,\n\nAnother month, another round of amazing things to share with you! Here's what's been happening at our store:\n\n🆕 NEW ARRIVALS\nWe've just launched our spring collection. Fresh designs, vibrant colors, and the same premium quality you love.\n\n🔥 THIS MONTH'S BESTSELLERS\nCheck out what everyone's been obsessing over — our top picks are flying off the shelves!\n\n💡 STYLE TIP OF THE MONTH\n\"Less is more\" — this season is all about clean, minimal aesthetics paired with one bold statement piece.\n\nThank you for being part of our community. We appreciate every single one of you! 💜",
    ctaText: "View New Arrivals →",
    ctaColor: "#7c3aed",
    footerText: "Monthly newsletter · Unsubscribe · Update preferences",
  },
  {
    id: "promotion",
    name: "Promotion",
    badge: "Sales",
    headerText: "🔥 BIG SALE — Up to 50% Off!",
    heroImageUrl: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=600&h=200&fit=crop",
    heading: "Our biggest sale of the year is HERE.",
    bodyText: "This is not a drill. Our biggest sale of the year has officially started and you've got exclusive early access!\n\n⏰ SALE ENDS SUNDAY AT MIDNIGHT\n\nWhat's on sale?\n✅ Up to 50% off our most popular items\n✅ Extra 10% off with code EARLYBIRD\n✅ Free shipping on all orders, no minimum\n✅ Free gift with purchases over $100\n\nDon't wait — our sales always sell out fast and we don't do rain checks. Get your favorites before they're gone!\n\n💜 Use code: EARLYBIRD at checkout",
    ctaText: "Shop the Sale →",
    ctaColor: "#e11d48",
    footerText: "Sale ends Sunday at midnight. Discount applies to select items only. Unsubscribe.",
  },
];

function buildHTML(tpl: Omit<EmailTemplate, "id" | "name" | "savedAt"> & { name?: string }): string {
  const body = tpl.bodyText.split("\n").map(line => line.trim() ? `<p style="margin:0 0 12px 0;line-height:1.6;color:#374151;">${line}</p>` : "<br/>").join("");
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${tpl.heading}</title></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#db2777);padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${tpl.headerText}</h1>
        </td></tr>
        <!-- Hero Image -->
        ${tpl.heroImageUrl ? `<tr><td><img src="${tpl.heroImageUrl}" alt="Hero" style="width:100%;height:200px;object-fit:cover;display:block;"></td></tr>` : ""}
        <!-- Body -->
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 20px 0;color:#111827;font-size:24px;font-weight:700;line-height:1.3;">${tpl.heading}</h2>
          ${body}
          <!-- CTA -->
          <div style="text-align:center;margin:28px 0;">
            <a href="#" style="display:inline-block;padding:14px 32px;background-color:${tpl.ctaColor};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">${tpl.ctaText}</a>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background-color:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">${tpl.footerText}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const DEFAULT: Omit<EmailTemplate, "id" | "name" | "savedAt"> = {
  headerText: "Your Brand Name",
  heroImageUrl: "",
  heading: "Your Email Heading Goes Here",
  bodyText: "Write your email body text here. You can tell a story, share a promotion, or connect with your audience.",
  ctaText: "Shop Now →",
  ctaColor: "#7c3aed",
  footerText: "You're receiving this email because you subscribed. Unsubscribe anytime.",
};

export default function EmailBuilderPage() {
  const [template, setTemplate] = useState(DEFAULT);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);
  const [savedTemplates, setSavedTemplates] = useLocalStorage<EmailTemplate[]>("email-templates", []);
  const [templateName, setTemplateName] = useState("My Template");

  const html = buildHTML(template);

  function loadPreset(preset: PresetTemplate) {
    setTemplate({
      headerText: preset.headerText,
      heroImageUrl: preset.heroImageUrl,
      heading: preset.heading,
      bodyText: preset.bodyText,
      ctaText: preset.ctaText,
      ctaColor: preset.ctaColor,
      footerText: preset.footerText,
    });
    setActivePreset(preset.id);
    setTemplateName(preset.name);
  }

  function handleCopy() {
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSave() {
    const item: EmailTemplate = {
      ...template,
      id: generateId(),
      name: templateName,
      savedAt: new Date().toLocaleDateString(),
    };
    setSavedTemplates(prev => [item, ...prev]);
  }

  function loadSaved(saved: EmailTemplate) {
    setTemplate({
      headerText: saved.headerText,
      heroImageUrl: saved.heroImageUrl,
      heading: saved.heading,
      bodyText: saved.bodyText,
      ctaText: saved.ctaText,
      ctaColor: saved.ctaColor,
      footerText: saved.footerText,
    });
    setTemplateName(saved.name);
    setActivePreset(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Template Builder"
        description="Design beautiful email templates with live preview and HTML export."
        icon={Mail}
        replaces="Mailchimp ($13/mo)"
      />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left sidebar */}
        <div className="xl:col-span-2 space-y-4">
          {/* Presets */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4 text-violet-500" />
                Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {PRESET_TEMPLATES.map(p => (
                <button
                  key={p.id}
                  onClick={() => loadPreset(p)}
                  className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-all text-left ${activePreset === p.id ? "border-violet-500 bg-violet-500/10" : "border-border hover:border-violet-300"}`}
                >
                  <span className="font-medium">{p.name}</span>
                  <Badge variant="secondary" className="text-[10px] h-4 shrink-0">{p.badge}</Badge>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Saved */}
          {savedTemplates.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Saved Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {savedTemplates.map(s => (
                  <div key={s.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => loadSaved(s)}
                      className="flex-1 text-left text-sm rounded-lg border border-border hover:border-violet-300 px-3 py-2 transition-all"
                    >
                      <p className="font-medium truncate">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.savedAt}</p>
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setSavedTemplates(prev => prev.filter(t => t.id !== s.id))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Editor */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Edit Sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Header Text</Label>
                <Input value={template.headerText} onChange={e => setTemplate(t => ({ ...t, headerText: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Hero Image URL</Label>
                <Input placeholder="https://..." value={template.heroImageUrl} onChange={e => setTemplate(t => ({ ...t, heroImageUrl: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Main Heading</Label>
                <Input value={template.heading} onChange={e => setTemplate(t => ({ ...t, heading: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Body Text</Label>
                <Textarea rows={6} value={template.bodyText} onChange={e => setTemplate(t => ({ ...t, bodyText: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>CTA Button Text</Label>
                  <Input value={template.ctaText} onChange={e => setTemplate(t => ({ ...t, ctaText: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>CTA Color</Label>
                  <div className="flex gap-2">
                    <input type="color" value={template.ctaColor} onChange={e => setTemplate(t => ({ ...t, ctaColor: e.target.value }))} className="h-9 w-12 rounded border cursor-pointer bg-transparent" />
                    <Input value={template.ctaColor} onChange={e => setTemplate(t => ({ ...t, ctaColor: e.target.value }))} className="font-mono text-xs" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Footer Text</Label>
                <Input value={template.footerText} onChange={e => setTemplate(t => ({ ...t, footerText: e.target.value }))} />
              </div>

              <Separator />

              <div className="space-y-1.5">
                <Label>Template Name</Label>
                <div className="flex gap-2">
                  <Input value={templateName} onChange={e => setTemplateName(e.target.value)} />
                  <Button size="sm" variant="outline" onClick={handleSave} className="shrink-0">
                    <Save className="h-3.5 w-3.5 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => setViewMode("preview")}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${viewMode === "preview" ? "bg-violet-600 text-white" : "hover:bg-muted"}`}
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </button>
              <button
                onClick={() => setViewMode("code")}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${viewMode === "code" ? "bg-violet-600 text-white" : "hover:bg-muted"}`}
              >
                <Code className="h-3.5 w-3.5" />
                HTML
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy} className="ml-auto gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy HTML"}
            </Button>
          </div>

          <Card className="overflow-hidden">
            {viewMode === "preview" ? (
              <div className="bg-[#f3f4f6] p-4 min-h-[600px]">
                {/* Email preview */}
                <div className="max-w-[600px] mx-auto bg-white rounded-xl overflow-hidden shadow-lg">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-violet-600 to-pink-600 p-6 text-center">
                    <h1 className="text-white font-bold text-xl m-0">{template.headerText}</h1>
                  </div>
                  {/* Hero image */}
                  {template.heroImageUrl && (
                    <img
                      src={template.heroImageUrl}
                      alt="Hero"
                      className="w-full h-48 object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  {/* Body */}
                  <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-5 leading-tight">{template.heading}</h2>
                    <div className="text-sm text-gray-600 leading-relaxed space-y-2 whitespace-pre-line">
                      {template.bodyText}
                    </div>
                    <div className="text-center my-7">
                      <a
                        href="#"
                        style={{ backgroundColor: template.ctaColor }}
                        className="inline-block px-8 py-3.5 text-white font-semibold rounded-lg text-sm no-underline"
                        onClick={e => e.preventDefault()}
                      >
                        {template.ctaText}
                      </a>
                    </div>
                  </div>
                  {/* Footer */}
                  <div className="bg-gray-50 px-8 py-5 border-t text-center">
                    <p className="text-xs text-gray-400 leading-relaxed">{template.footerText}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <pre className="p-4 text-xs font-mono overflow-auto max-h-[650px] bg-zinc-950 text-zinc-100 leading-relaxed">
                  {html}
                </pre>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
