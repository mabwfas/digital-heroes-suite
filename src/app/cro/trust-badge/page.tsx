"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Copy,
  Download,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface TrustBadge {
  id: string;
  type: string;
  icon: string;
  text: string;
  enabled: boolean;
}

const BADGE_PRESETS: Omit<TrustBadge, "id" | "enabled">[] = [
  { type: "ssl", icon: "🔒", text: "SSL Secured" },
  { type: "money-back", icon: "💰", text: "30-Day Money-Back Guarantee" },
  { type: "shipping", icon: "🚀", text: "Fast Free Shipping" },
  { type: "support", icon: "🎧", text: "24/7 Support" },
  { type: "satisfaction", icon: "⭐", text: "100% Satisfaction Guarantee" },
  { type: "verified", icon: "✅", text: "Verified Business" },
  { type: "secure-payment", icon: "💳", text: "Secure Payment" },
  { type: "privacy", icon: "🛡️", text: "Privacy Protected" },
];

function generateCSS(badges: TrustBadge[], layout: string): string {
  return `.trust-badges {
  display: flex;
  ${layout === "horizontal" ? "flex-direction: row;" : "flex-direction: column;"}
  gap: 12px;
  padding: 16px;
  ${layout === "horizontal" ? "justify-content: center;" : "align-items: flex-start;"}
  flex-wrap: wrap;
}
.trust-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #333;
  transition: transform 0.2s, box-shadow 0.2s;
}
.trust-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.trust-badge-icon {
  font-size: 18px;
}`;
}

function generateHTML(badges: TrustBadge[], layout: string): string {
  const enabledBadges = badges.filter((b) => b.enabled);
  const badgeHTML = enabledBadges
    .map((b) => `  <div class="trust-badge">\n    <span class="trust-badge-icon">${b.icon}</span>\n    <span>${b.text}</span>\n  </div>`)
    .join("\n");

  return `<div class="trust-badges">\n${badgeHTML}\n</div>\n\n<style>\n${generateCSS(badges, layout)}\n</style>`;
}

export default function TrustBadgePage() {
  const [badges, setBadges, hydrated] = useLocalStorage<TrustBadge[]>(
    "cro-trust-badge",
    BADGE_PRESETS.map((b) => ({ ...b, id: b.type, enabled: true }))
  );
  const [layout, setLayout] = useLocalStorage<string>("cro-trust-badge-layout", "horizontal");
  const [customIcon, setCustomIcon] = useState("");
  const [customText, setCustomText] = useState("");
  const [copied, setCopied] = useState(false);

  function toggleBadge(id: string) {
    setBadges((prev) => prev.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b)));
  }

  function updateText(id: string, text: string) {
    setBadges((prev) => prev.map((b) => (b.id === id ? { ...b, text } : b)));
  }

  function addCustom() {
    if (!customText.trim()) return;
    setBadges((prev) => [...prev, { id: generateId(), type: "custom", icon: customIcon || "✓", text: customText.trim(), enabled: true }]);
    setCustomIcon("");
    setCustomText("");
  }

  function handleCopy() {
    navigator.clipboard.writeText(generateHTML(badges, layout));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleExport() {
    const html = `<!DOCTYPE html>\n<html><head><meta charset="UTF-8"><title>Trust Badges</title></head><body>\n${generateHTML(badges, layout)}\n</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trust-badges.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!hydrated) return null;

  const enabledBadges = badges.filter((b) => b.enabled);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trust Badge Generator"
        description="Select and customize trust badges for your website. Preview layout and export HTML/CSS."
        icon={ShieldCheck}
        badge="CRO"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Select Badges</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {badges.map((b) => (
              <div key={b.id} className={`p-3 rounded-lg border cursor-pointer transition-all ${b.enabled ? "border-violet-500 bg-violet-500/5" : "border-muted opacity-50"}`} onClick={() => toggleBadge(b.id)}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{b.icon}</span>
                  <Badge variant="secondary" className="text-[10px]">{b.enabled ? "ON" : "OFF"}</Badge>
                </div>
                <Input
                  className="text-xs h-7"
                  value={b.text}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateText(b.id, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="flex items-end gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Custom Icon</Label>
              <Input className="w-16 text-center" placeholder="✓" value={customIcon} onChange={(e) => setCustomIcon(e.target.value)} />
            </div>
            <div className="space-y-1.5 flex-1">
              <Label className="text-xs">Custom Badge Text</Label>
              <Input placeholder="Custom badge text" value={customText} onChange={(e) => setCustomText(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" onClick={addCustom} disabled={!customText.trim()}>Add</Button>
          </div>

          <div className="flex gap-2">
            <Label className="text-xs self-center">Layout:</Label>
            <Button
              variant="outline"
              size="sm"
              className={`text-xs ${layout === "horizontal" ? "border-violet-500 bg-violet-500/5" : ""}`}
              onClick={() => setLayout("horizontal")}
            >
              Horizontal
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`text-xs ${layout === "vertical" ? "border-violet-500 bg-violet-500/5" : ""}`}
              onClick={() => setLayout("vertical")}
            >
              Vertical
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4 text-violet-500" />
              Live Preview
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-3 w-3" />
                {copied ? "Copied!" : "Copy HTML"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-3 w-3" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-white dark:bg-muted/20 rounded-lg border">
            <div className={`flex gap-3 ${layout === "horizontal" ? "flex-row flex-wrap justify-center" : "flex-col items-start"}`}>
              {enabledBadges.map((b) => (
                <div key={b.id} className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-muted/50 border rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <span className="text-lg">{b.icon}</span>
                  <span>{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
