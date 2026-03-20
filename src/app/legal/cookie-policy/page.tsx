"use client";

import { useState } from "react";
import {
  Cookie,
  Copy,
  Download,
  RefreshCw,
  Code,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";

interface CookieConfig {
  siteName: string;
  siteUrl: string;
  contactEmail: string;
  analyticsEnabled: boolean;
  marketingEnabled: boolean;
  functionalEnabled: boolean;
  analyticsTools: string;
  marketingTools: string;
}

const DEFAULT_CONFIG: CookieConfig = {
  siteName: "",
  siteUrl: "",
  contactEmail: "",
  analyticsEnabled: true,
  marketingEnabled: false,
  functionalEnabled: true,
  analyticsTools: "Google Analytics",
  marketingTools: "Facebook Pixel",
};

function generatePolicy(c: CookieConfig): string {
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  let doc = `COOKIE POLICY\n\nLast Updated: ${date}\n\n`;
  doc += `This Cookie Policy explains how ${c.siteName || "[Site Name]"} ("we", "us", or "our") uses cookies and similar technologies on ${c.siteUrl || "[website URL]"}.\n\n`;

  doc += `WHAT ARE COOKIES?\n\nCookies are small text files stored on your device when you visit a website. They help websites remember your preferences and improve your experience. Cookies can be "session" cookies (deleted when you close your browser) or "persistent" cookies (remain until they expire or you delete them).\n\n`;

  doc += `TYPES OF COOKIES WE USE\n\n`;
  doc += `1. ESSENTIAL COOKIES\nThese cookies are necessary for the website to function properly. They enable core features like security, accessibility, and basic navigation. You cannot opt out of essential cookies as the site cannot function without them.\n\n`;

  if (c.functionalEnabled) {
    doc += `2. FUNCTIONAL COOKIES\nFunctional cookies allow the website to remember choices you make (such as your language preference, region, or username) and provide enhanced, personalized features. They may be set by us or by third-party providers whose services we use on our pages.\n\n`;
  }

  if (c.analyticsEnabled) {
    doc += `${c.functionalEnabled ? "3" : "2"}. ANALYTICS COOKIES\nWe use analytics cookies to understand how visitors interact with our website. These cookies collect information about page visits, time spent on pages, and any error messages. We use this data to improve our website.${c.analyticsTools ? ` Tools used: ${c.analyticsTools}.` : ""}\n\n`;
  }

  if (c.marketingEnabled) {
    const num = 2 + (c.functionalEnabled ? 1 : 0) + (c.analyticsEnabled ? 1 : 0);
    doc += `${num}. MARKETING COOKIES\nMarketing cookies are used to track visitors across websites to display relevant advertisements. They are set by us and by third-party advertising partners.${c.marketingTools ? ` Tools used: ${c.marketingTools}.` : ""} These cookies require your explicit consent.\n\n`;
  }

  doc += `HOW TO MANAGE COOKIES\n\nYou can manage your cookie preferences at any time through our cookie consent banner or your browser settings. Most browsers allow you to:\n- View what cookies are stored and delete them individually\n- Block third-party cookies\n- Block cookies from specific sites\n- Block all cookies\n- Delete all cookies when you close your browser\n\nNote: Blocking or deleting cookies may impact your experience on our website.\n\n`;

  doc += `BROWSER-SPECIFIC INSTRUCTIONS\n- Chrome: Settings > Privacy and Security > Cookies\n- Firefox: Settings > Privacy & Security > Cookies\n- Safari: Preferences > Privacy > Manage Website Data\n- Edge: Settings > Cookies and Site Permissions\n\n`;

  doc += `CHANGES TO THIS POLICY\n\nWe may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date.\n\n`;

  doc += `CONTACT US\n\nIf you have questions about our use of cookies, please contact us at ${c.contactEmail || "[email address]"}.\n`;

  return doc;
}

function generateHTML(c: CookieConfig): string {
  const policy = generatePolicy(c);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cookie Policy - ${c.siteName || "Website"}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; color: #333; }
    h1 { color: #111; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
    h2 { color: #222; margin-top: 2rem; }
    p { margin: 0.5rem 0; }
  </style>
</head>
<body>
${policy.split("\n").map((line) => {
  if (line.match(/^[A-Z ]+$/)) return `<h2>${line}</h2>`;
  if (line.match(/^\d+\./)) return `<h3>${line}</h3>`;
  if (line.startsWith("- ")) return `<li>${line.slice(2)}</li>`;
  if (line.trim()) return `<p>${line}</p>`;
  return "";
}).join("\n")}
</body>
</html>`;
}

export default function CookiePolicyPage() {
  const [config, setConfig, hydrated] = useLocalStorage<CookieConfig>("legal-cookie-policy", DEFAULT_CONFIG);
  const [generated, setGenerated] = useState("");
  const [showHTML, setShowHTML] = useState(false);
  const [copied, setCopied] = useState(false);

  function updateConfig<K extends keyof CookieConfig>(key: K, value: CookieConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function handleGenerate() {
    setGenerated(generatePolicy(config));
  }

  function handleCopy() {
    const text = showHTML ? generateHTML(config) : generated;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleExport() {
    const isHTML = showHTML;
    const content = isHTML ? generateHTML(config) : generated;
    const blob = new Blob([content], { type: isHTML ? "text/html" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = isHTML ? "cookie-policy.html" : "cookie-policy.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cookie Policy Generator"
        description="Generate a complete cookie policy with analytics, marketing, and functional cookie toggles. Export as text or HTML."
        icon={Cookie}
        badge="Legal"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Site Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Site Name *</Label>
              <Input placeholder="My Website" value={config.siteName} onChange={(e) => updateConfig("siteName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Site URL</Label>
              <Input placeholder="https://example.com" value={config.siteUrl} onChange={(e) => updateConfig("siteUrl", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Email</Label>
              <Input placeholder="privacy@example.com" value={config.contactEmail} onChange={(e) => updateConfig("contactEmail", e.target.value)} />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-medium">Cookie Types</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: "functionalEnabled" as const, label: "Functional Cookies", desc: "Preferences, language, etc." },
                { key: "analyticsEnabled" as const, label: "Analytics Cookies", desc: "Usage tracking, page views" },
                { key: "marketingEnabled" as const, label: "Marketing Cookies", desc: "Advertising, retargeting" },
              ].map((item) => (
                <Button
                  key={item.key}
                  variant="outline"
                  className={`h-auto py-3 flex-col items-start text-left ${config[item.key] ? "border-violet-500 bg-violet-500/5" : "opacity-60"}`}
                  onClick={() => updateConfig(item.key, !config[item.key])}
                >
                  <span className="text-xs font-medium">{config[item.key] ? "✓ " : ""}{item.label}</span>
                  <span className="text-[10px] text-muted-foreground">{item.desc}</span>
                </Button>
              ))}
            </div>
          </div>

          {config.analyticsEnabled && (
            <div className="space-y-1.5">
              <Label className="text-xs">Analytics Tools</Label>
              <Input placeholder="Google Analytics, Hotjar" value={config.analyticsTools} onChange={(e) => updateConfig("analyticsTools", e.target.value)} />
            </div>
          )}
          {config.marketingEnabled && (
            <div className="space-y-1.5">
              <Label className="text-xs">Marketing Tools</Label>
              <Input placeholder="Facebook Pixel, Google Ads" value={config.marketingTools} onChange={(e) => updateConfig("marketingTools", e.target.value)} />
            </div>
          )}

          <Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleGenerate}>
            <RefreshCw className="h-4 w-4" />
            Generate Cookie Policy
          </Button>
        </CardContent>
      </Card>

      {generated && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Generated Policy</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowHTML(!showHTML)}>
                  <Code className="h-3 w-3" />
                  {showHTML ? "Text" : "HTML"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-3 w-3" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-3 w-3" />
                  Export {showHTML ? "HTML" : "TXT"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-[400px] font-mono text-xs"
              value={showHTML ? generateHTML(config) : generated}
              readOnly
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
