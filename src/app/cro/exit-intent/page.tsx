"use client";

import { useState } from "react";
import {
  LogOut,
  Copy,
  Download,
  Eye,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/lib/hooks";

interface PopupConfig {
  headline: string;
  offerText: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl: string;
  colorTheme: string;
  triggerDelay: number;
  triggerScroll: number;
  showOverlay: boolean;
  dismissText: string;
}

const COLOR_THEMES: { value: string; label: string; bg: string; accent: string; text: string }[] = [
  { value: "violet", label: "Violet", bg: "bg-white", accent: "from-violet-600 to-pink-600", text: "text-violet-600" },
  { value: "blue", label: "Blue", bg: "bg-white", accent: "from-blue-600 to-cyan-500", text: "text-blue-600" },
  { value: "green", label: "Green", bg: "bg-white", accent: "from-emerald-600 to-teal-500", text: "text-emerald-600" },
  { value: "orange", label: "Orange", bg: "bg-white", accent: "from-orange-500 to-amber-500", text: "text-orange-600" },
  { value: "dark", label: "Dark", bg: "bg-gray-900", accent: "from-violet-500 to-pink-500", text: "text-white" },
];

const DEFAULT_CONFIG: PopupConfig = {
  headline: "Wait! Don't Leave Yet",
  offerText: "Get 15% off your first order when you sign up for our newsletter.",
  ctaText: "Claim My Discount",
  ctaUrl: "#",
  imageUrl: "",
  colorTheme: "violet",
  triggerDelay: 5,
  triggerScroll: 50,
  showOverlay: true,
  dismissText: "No thanks, I'll pay full price",
};

function generatePopupHTML(c: PopupConfig): string {
  const theme = COLOR_THEMES.find((t) => t.value === c.colorTheme) || COLOR_THEMES[0];
  const isDark = c.colorTheme === "dark";

  return `<!-- Exit Intent Popup -->
<div id="exit-popup-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9998;${c.showOverlay ? "" : "background:transparent;pointer-events:none;"}">
  <div id="exit-popup" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);${isDark ? "background:#111827;color:white;" : "background:white;color:#333;"}max-width:480px;width:90%;border-radius:16px;padding:32px;box-shadow:0 20px 60px rgba(0,0,0,0.3);z-index:9999;pointer-events:auto;text-align:center;">
    <button onclick="document.getElementById('exit-popup-overlay').style.display='none'" style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:24px;cursor:pointer;color:${isDark ? "#aaa" : "#999"};line-height:1;">&times;</button>
    ${c.imageUrl ? `<img src="${c.imageUrl}" alt="" style="max-width:100%;border-radius:8px;margin-bottom:16px;">` : ""}
    <h2 style="font-size:24px;font-weight:bold;margin:0 0 12px;">${c.headline}</h2>
    <p style="font-size:15px;${isDark ? "color:#d1d5db;" : "color:#666;"}margin:0 0 24px;line-height:1.5;">${c.offerText}</p>
    <a href="${c.ctaUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:white;font-weight:600;font-size:16px;border:none;border-radius:8px;cursor:pointer;text-decoration:none;transition:transform 0.2s;">${c.ctaText}</a>
    <p style="margin-top:16px;font-size:12px;${isDark ? "color:#6b7280;" : "color:#999;"}cursor:pointer;" onclick="document.getElementById('exit-popup-overlay').style.display='none'">${c.dismissText}</p>
  </div>
</div>

<script>
(function() {
  var shown = false;
  // Exit intent (mouse leaves viewport)
  document.addEventListener('mouseout', function(e) {
    if (!shown && e.clientY < 10) {
      shown = true;
      document.getElementById('exit-popup-overlay').style.display = 'block';
    }
  });
  ${c.triggerDelay > 0 ? `// Delay trigger\n  setTimeout(function() {\n    if (!shown) { shown = true; document.getElementById('exit-popup-overlay').style.display = 'block'; }\n  }, ${c.triggerDelay * 1000});` : ""}
  ${c.triggerScroll > 0 ? `// Scroll trigger\n  window.addEventListener('scroll', function() {\n    var pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;\n    if (!shown && pct >= ${c.triggerScroll}) { shown = true; document.getElementById('exit-popup-overlay').style.display = 'block'; }\n  });` : ""}
})();
</script>`;
}

export default function ExitIntentPage() {
  const [config, setConfig, hydrated] = useLocalStorage<PopupConfig>("cro-exit-intent", DEFAULT_CONFIG);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  function updateConfig<K extends keyof PopupConfig>(key: K, value: PopupConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatePopupHTML(config));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleExport() {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Exit Intent Popup</title></head><body style="min-height:200vh;padding:40px;font-family:sans-serif;"><h1>Scroll down or move mouse to top to trigger popup</h1><p>This page demonstrates the exit intent popup.</p>${generatePopupHTML(config)}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exit-intent-popup.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!hydrated) return null;

  const theme = COLOR_THEMES.find((t) => t.value === config.colorTheme) || COLOR_THEMES[0];
  const isDark = config.colorTheme === "dark";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exit Intent Popup Builder"
        description="Design exit intent popups with customizable headlines, offers, CTAs, and trigger settings. Export as HTML."
        icon={LogOut}
        badge="CRO"
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Popup Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Headline</Label>
              <Input value={config.headline} onChange={(e) => updateConfig("headline", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Offer Text</Label>
              <Textarea className="min-h-[60px] text-sm" value={config.offerText} onChange={(e) => updateConfig("offerText", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CTA Button Text</Label>
                <Input value={config.ctaText} onChange={(e) => updateConfig("ctaText", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>CTA URL</Label>
                <Input value={config.ctaUrl} onChange={(e) => updateConfig("ctaUrl", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Image URL (optional)</Label>
              <Input placeholder="https://..." value={config.imageUrl} onChange={(e) => updateConfig("imageUrl", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Dismiss Text</Label>
              <Input value={config.dismissText} onChange={(e) => updateConfig("dismissText", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Color Theme</Label>
              <div className="flex gap-2">
                {COLOR_THEMES.map((t) => (
                  <Button
                    key={t.value}
                    variant="outline"
                    size="sm"
                    className={`text-xs ${config.colorTheme === t.value ? "border-violet-500 bg-violet-500/5 font-semibold" : ""}`}
                    onClick={() => updateConfig("colorTheme", t.value)}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Trigger Delay (sec)</Label>
                <Input type="number" min="0" value={config.triggerDelay} onChange={(e) => updateConfig("triggerDelay", parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-1.5">
                <Label>Scroll Trigger (%)</Label>
                <Input type="number" min="0" max="100" value={config.triggerScroll} onChange={(e) => updateConfig("triggerScroll", parseInt(e.target.value) || 0)} />
              </div>
            </div>
            <Button
              variant="outline"
              className={`w-full ${config.showOverlay ? "border-violet-500 bg-violet-500/5" : ""}`}
              onClick={() => updateConfig("showOverlay", !config.showOverlay)}
            >
              {config.showOverlay ? "✓ " : ""}Background Overlay
            </Button>

            <Separator />
            <div className="flex gap-2">
              <Button className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={() => setShowPreview(true)}>
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleCopy}>
                <Copy className="h-3 w-3" />
                {copied ? "Copied!" : "Copy HTML"}
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: config.showOverlay ? "rgba(0,0,0,0.5)" : "transparent" }} onClick={() => setShowPreview(false)}>
          <div
            className={`relative max-w-md w-[90%] rounded-2xl p-8 shadow-2xl text-center ${isDark ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={`absolute top-3 right-3 text-2xl leading-none ${isDark ? "text-gray-500" : "text-gray-400"}`} onClick={() => setShowPreview(false)}>
              <X className="h-5 w-5" />
            </button>
            {config.imageUrl && (
              <img src={config.imageUrl} alt="" className="max-w-full rounded-lg mb-4" />
            )}
            <h2 className="text-2xl font-bold mb-3">{config.headline}</h2>
            <p className={`text-sm mb-6 ${isDark ? "text-gray-300" : "text-gray-600"}`}>{config.offerText}</p>
            <button className={`inline-block px-8 py-3 rounded-lg font-semibold text-white bg-gradient-to-r ${theme.accent} transition-transform hover:-translate-y-0.5`}>
              {config.ctaText}
            </button>
            <p className={`mt-4 text-xs cursor-pointer ${isDark ? "text-gray-500" : "text-gray-400"}`} onClick={() => setShowPreview(false)}>
              {config.dismissText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
