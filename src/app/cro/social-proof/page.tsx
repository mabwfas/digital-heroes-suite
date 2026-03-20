"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  Trash2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface ProofItem {
  id: string;
  number: string;
  label: string;
  icon: string;
}

type AnimationStyle = "counter" | "ticker" | "static";

interface WidgetConfig {
  items: ProofItem[];
  animation: AnimationStyle;
  layout: "horizontal" | "vertical" | "grid";
  colorScheme: string;
}

const DEFAULT_ITEMS: ProofItem[] = [
  { id: "p1", number: "10,000+", label: "Customers Served", icon: "👥" },
  { id: "p2", number: "4.9", label: "Average Rating", icon: "⭐" },
  { id: "p3", number: "50+", label: "Countries", icon: "🌍" },
];

const COLOR_SCHEMES: { value: string; label: string; bg: string; text: string; accent: string }[] = [
  { value: "light", label: "Light", bg: "#ffffff", text: "#333333", accent: "#7c3aed" },
  { value: "dark", label: "Dark", bg: "#1f2937", text: "#f9fafb", accent: "#a78bfa" },
  { value: "violet", label: "Violet", bg: "#f5f3ff", text: "#4c1d95", accent: "#7c3aed" },
  { value: "blue", label: "Blue", bg: "#eff6ff", text: "#1e3a5f", accent: "#3b82f6" },
];

const DEFAULT_CONFIG: WidgetConfig = {
  items: DEFAULT_ITEMS,
  animation: "counter",
  layout: "horizontal",
  colorScheme: "light",
};

function generateHTML(config: WidgetConfig): string {
  const scheme = COLOR_SCHEMES.find((s) => s.value === config.colorScheme) || COLOR_SCHEMES[0];
  const isHorizontal = config.layout === "horizontal";
  const isGrid = config.layout === "grid";

  const itemsHTML = config.items
    .map((item) => `    <div class="sp-item">
      <span class="sp-icon">${item.icon}</span>
      <span class="sp-number" ${config.animation === "counter" ? `data-target="${item.number}"` : ""}>${item.number}</span>
      <span class="sp-label">${item.label}</span>
    </div>`)
    .join("\n");

  const counterScript = config.animation === "counter" ? `
<script>
(function() {
  function animateCounters() {
    document.querySelectorAll('.sp-number[data-target]').forEach(function(el) {
      var target = el.getAttribute('data-target');
      var num = parseInt(target.replace(/[^0-9]/g, ''));
      var suffix = target.replace(/[0-9,]/g, '');
      if (isNaN(num)) { el.textContent = target; return; }
      var duration = 2000;
      var start = 0;
      var startTime = null;
      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var current = Math.floor(progress * num);
        el.textContent = current.toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target;
      }
      requestAnimationFrame(step);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', animateCounters);
  else animateCounters();
})();
</script>` : "";

  const tickerStyle = config.animation === "ticker" ? `
  @keyframes ticker-fade {
    0%, 100% { opacity: 1; transform: translateY(0); }
    50% { opacity: 0.7; transform: translateY(-2px); }
  }
  .sp-number { animation: ticker-fade 3s ease-in-out infinite; }` : "";

  return `<!-- Social Proof Widget -->
<div class="social-proof">
${itemsHTML}
</div>

<style>
.social-proof {
  display: ${isGrid ? "grid" : "flex"};
  ${isGrid ? `grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));` : ""}
  ${isHorizontal ? "flex-direction: row; justify-content: center;" : "flex-direction: column; align-items: center;"}
  gap: 24px;
  padding: 24px;
  background: ${scheme.bg};
  border-radius: 12px;
  ${isHorizontal ? "flex-wrap: wrap;" : ""}
}
.sp-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}
.sp-icon { font-size: 28px; }
.sp-number {
  font-size: 28px;
  font-weight: 800;
  color: ${scheme.accent};
  font-variant-numeric: tabular-nums;
}
.sp-label {
  font-size: 13px;
  color: ${scheme.text};
  opacity: 0.7;
  font-weight: 500;
}${tickerStyle}
</style>${counterScript}`;
}

export default function SocialProofPage() {
  const [config, setConfig, hydrated] = useLocalStorage<WidgetConfig>("cro-social-proof", DEFAULT_CONFIG);
  const [newNumber, setNewNumber] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [copied, setCopied] = useState(false);

  function addItem() {
    if (!newNumber.trim() || !newLabel.trim()) return;
    setConfig((prev) => ({
      ...prev,
      items: [...prev.items, { id: generateId(), number: newNumber.trim(), label: newLabel.trim(), icon: newIcon || "📊" }],
    }));
    setNewNumber("");
    setNewLabel("");
    setNewIcon("");
  }

  function removeItem(id: string) {
    setConfig((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id) }));
  }

  function updateItem(id: string, field: keyof ProofItem, value: string) {
    setConfig((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    }));
  }

  function handleCopy() {
    navigator.clipboard.writeText(generateHTML(config));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleExport() {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Social Proof Widget</title></head><body style="display:flex;justify-content:center;align-items:center;min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f3f4f6;">\n${generateHTML(config)}\n</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "social-proof-widget.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!hydrated) return null;

  const scheme = COLOR_SCHEMES.find((s) => s.value === config.colorScheme) || COLOR_SCHEMES[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social Proof Widget Builder"
        description="Build social proof widgets with animated counters, tickers, or static displays. Export as HTML."
        icon={Users}
        badge="CRO"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Proof Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {config.items.map((item) => (
            <div key={item.id} className="grid grid-cols-4 gap-2 items-end">
              <div className="space-y-1">
                <Label className="text-[10px]">Icon</Label>
                <Input className="text-center h-8 text-sm" value={item.icon} onChange={(e) => updateItem(item.id, "icon", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Number</Label>
                <Input className="h-8 text-sm" value={item.number} onChange={(e) => updateItem(item.id, "number", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Label</Label>
                <Input className="h-8 text-sm" value={item.label} onChange={(e) => updateItem(item.id, "label", e.target.value)} />
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(item.id)}>
                <Trash2 className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          ))}
          <Separator />
          <div className="grid grid-cols-4 gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-[10px]">Icon</Label>
              <Input className="text-center h-8 text-sm" placeholder="📊" value={newIcon} onChange={(e) => setNewIcon(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Number</Label>
              <Input className="h-8 text-sm" placeholder="500+" value={newNumber} onChange={(e) => setNewNumber(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Label</Label>
              <Input className="h-8 text-sm" placeholder="Happy Clients" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
            </div>
            <Button variant="outline" className="h-8" onClick={addItem} disabled={!newNumber.trim() || !newLabel.trim()}>
              <Plus className="h-3 w-3" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Widget Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Animation Style</Label>
            <div className="flex gap-2">
              {(["counter", "ticker", "static"] as AnimationStyle[]).map((a) => (
                <Button
                  key={a}
                  variant="outline"
                  size="sm"
                  className={`text-xs capitalize ${config.animation === a ? "border-violet-500 bg-violet-500/5 font-semibold" : ""}`}
                  onClick={() => setConfig((prev) => ({ ...prev, animation: a }))}
                >
                  {a}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Layout</Label>
            <div className="flex gap-2">
              {(["horizontal", "vertical", "grid"] as const).map((l) => (
                <Button
                  key={l}
                  variant="outline"
                  size="sm"
                  className={`text-xs capitalize ${config.layout === l ? "border-violet-500 bg-violet-500/5 font-semibold" : ""}`}
                  onClick={() => setConfig((prev) => ({ ...prev, layout: l }))}
                >
                  {l}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Color Scheme</Label>
            <div className="flex gap-2">
              {COLOR_SCHEMES.map((s) => (
                <Button
                  key={s.value}
                  variant="outline"
                  size="sm"
                  className={`text-xs ${config.colorScheme === s.value ? "border-violet-500 bg-violet-500/5 font-semibold" : ""}`}
                  onClick={() => setConfig((prev) => ({ ...prev, colorScheme: s.value }))}
                >
                  <div className="w-3 h-3 rounded-full mr-1" style={{ background: s.accent }} />
                  {s.label}
                </Button>
              ))}
            </div>
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
          <div className="p-6 rounded-xl" style={{ background: scheme.bg }}>
            <div className={`flex gap-6 ${config.layout === "horizontal" ? "flex-row flex-wrap justify-center" : config.layout === "grid" ? "flex-row flex-wrap justify-center" : "flex-col items-center"}`}>
              {config.items.map((item) => (
                <div key={item.id} className="flex flex-col items-center gap-1 text-center">
                  <span className="text-3xl">{item.icon}</span>
                  <span className="text-3xl font-extrabold" style={{ color: scheme.accent }}>{item.number}</span>
                  <span className="text-sm font-medium" style={{ color: scheme.text, opacity: 0.7 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
