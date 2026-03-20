"use client";

import { useState } from "react";
import { ShoppingCart, Copy, Check, Settings2, Code, Eye } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocalStorage } from "@/lib/hooks";

interface ComponentConfig {
  enabled: boolean;
  [key: string]: string | boolean | number;
}

interface CheckoutConfig {
  progressBar: ComponentConfig & { steps: string; color: string };
  trustBadges: ComponentConfig & { badges: string; position: string };
  upsellWidget: ComponentConfig & { title: string; productIds: string; discount: string };
  giftMessage: ComponentConfig & { placeholder: string; maxLength: number };
  deliveryDate: ComponentConfig & { minDays: number; maxDays: number; excludeWeekends: boolean };
}

const DEFAULT_CONFIG: CheckoutConfig = {
  progressBar: { enabled: true, steps: "Cart,Shipping,Payment,Confirm", color: "#7c3aed" },
  trustBadges: { enabled: true, badges: "SSL Secure,30-Day Returns,Free Shipping,24/7 Support", position: "below-cta" },
  upsellWidget: { enabled: false, title: "You might also like", productIds: "", discount: "10" },
  giftMessage: { enabled: false, placeholder: "Add a personal message...", maxLength: 200 },
  deliveryDate: { enabled: true, minDays: 3, maxDays: 7, excludeWeekends: true },
};

function generateSnippet(config: CheckoutConfig): string {
  const parts: string[] = ['<!-- Checkout Customization Kit -->'];

  if (config.progressBar.enabled) {
    const steps = config.progressBar.steps.split(",").map((s) => s.trim());
    parts.push(`\n<!-- Progress Bar -->\n<div class="checkout-progress" style="--progress-color: ${config.progressBar.color}">\n${steps.map((s, i) => `  <div class="step${i === 0 ? " active" : ""}">${s}</div>`).join("\n")}\n</div>`);
  }

  if (config.trustBadges.enabled) {
    const badges = config.trustBadges.badges.split(",").map((b) => b.trim());
    parts.push(`\n<!-- Trust Badges -->\n<div class="trust-badges" data-position="${config.trustBadges.position}">\n${badges.map((b) => `  <span class="badge">${b}</span>`).join("\n")}\n</div>`);
  }

  if (config.upsellWidget.enabled) {
    parts.push(`\n<!-- Upsell Widget -->\n<div class="checkout-upsell">\n  <h4>${config.upsellWidget.title}</h4>\n  <div class="upsell-products" data-ids="${config.upsellWidget.productIds}" data-discount="${config.upsellWidget.discount}%"></div>\n</div>`);
  }

  if (config.giftMessage.enabled) {
    parts.push(`\n<!-- Gift Message -->\n<div class="gift-message">\n  <label>Gift Message</label>\n  <textarea placeholder="${config.giftMessage.placeholder}" maxlength="${config.giftMessage.maxLength}"></textarea>\n</div>`);
  }

  if (config.deliveryDate.enabled) {
    parts.push(`\n<!-- Delivery Date Picker -->\n<div class="delivery-date"\n  data-min-days="${config.deliveryDate.minDays}"\n  data-max-days="${config.deliveryDate.maxDays}"\n  data-exclude-weekends="${config.deliveryDate.excludeWeekends}">\n  <label>Estimated Delivery</label>\n  <select id="delivery-date-select"></select>\n</div>`);
  }

  return parts.join("\n");
}

export default function CheckoutKitPage() {
  const [config, setConfig] = useLocalStorage<CheckoutConfig>("checkout-kit-config", DEFAULT_CONFIG);
  const [copied, setCopied] = useState(false);
  const [activeComponent, setActiveComponent] = useState("progressBar");

  function updateConfig<K extends keyof CheckoutConfig>(key: K, updates: Partial<CheckoutConfig[K]>) {
    setConfig((prev) => ({ ...prev, [key]: { ...prev[key], ...updates } }));
  }

  function copySnippet() {
    navigator.clipboard.writeText(generateSnippet(config));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const components = [
    { key: "progressBar" as const, label: "Progress Bar", desc: "Multi-step checkout progress indicator" },
    { key: "trustBadges" as const, label: "Trust Badges", desc: "SSL, returns, shipping badges" },
    { key: "upsellWidget" as const, label: "Upsell Widget", desc: "Product recommendations at checkout" },
    { key: "giftMessage" as const, label: "Gift Message", desc: "Personal message field for gifts" },
    { key: "deliveryDate" as const, label: "Delivery Date", desc: "Estimated delivery date picker" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Checkout Customization Kit"
        description="Configure checkout UI components and generate code snippets for Shopify"
        icon={ShoppingCart}
        badge="Shopify Ext"
        replaces="Custom development"
        actions={
          <Button onClick={copySnippet} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
            {copied ? <><Check className="h-4 w-4 mr-2" /> Copied!</> : <><Code className="h-4 w-4 mr-2" /> Copy All Code</>}
          </Button>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          {components.map((comp) => (
            <Card key={comp.key} className={`cursor-pointer transition-colors ${activeComponent === comp.key ? "border-violet-500/50 bg-violet-500/5" : "hover:border-violet-500/30"}`} onClick={() => setActiveComponent(comp.key)}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{comp.label}</p>
                      <Badge className={`text-[10px] ${config[comp.key].enabled ? "bg-emerald-500/10 text-emerald-600 border-0" : "bg-slate-500/10 text-slate-500 border-0"}`}>
                        {config[comp.key].enabled ? "ON" : "OFF"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{comp.desc}</p>
                  </div>
                  <Switch
                    checked={config[comp.key].enabled}
                    onCheckedChange={(checked) => updateConfig(comp.key, { enabled: checked } as Partial<CheckoutConfig[typeof comp.key]>)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Settings2 className="h-4 w-4" /> Component Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {activeComponent === "progressBar" && (
                <>
                  <div className="space-y-1.5"><Label>Steps (comma-separated)</Label><Input value={config.progressBar.steps} onChange={(e) => updateConfig("progressBar", { steps: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Color</Label><div className="flex gap-2"><Input type="color" value={config.progressBar.color} onChange={(e) => updateConfig("progressBar", { color: e.target.value })} className="w-12 h-9 p-1" /><Input value={config.progressBar.color} onChange={(e) => updateConfig("progressBar", { color: e.target.value })} /></div></div>
                </>
              )}
              {activeComponent === "trustBadges" && (
                <>
                  <div className="space-y-1.5"><Label>Badges (comma-separated)</Label><Input value={config.trustBadges.badges} onChange={(e) => updateConfig("trustBadges", { badges: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Position</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={config.trustBadges.position} onChange={(e) => updateConfig("trustBadges", { position: e.target.value })}>
                      <option value="below-cta">Below CTA</option><option value="above-cta">Above CTA</option><option value="footer">Footer</option>
                    </select>
                  </div>
                </>
              )}
              {activeComponent === "upsellWidget" && (
                <>
                  <div className="space-y-1.5"><Label>Widget Title</Label><Input value={config.upsellWidget.title} onChange={(e) => updateConfig("upsellWidget", { title: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Product IDs (comma-separated)</Label><Input value={config.upsellWidget.productIds} onChange={(e) => updateConfig("upsellWidget", { productIds: e.target.value })} placeholder="123,456,789" /></div>
                  <div className="space-y-1.5"><Label>Discount %</Label><Input value={config.upsellWidget.discount} onChange={(e) => updateConfig("upsellWidget", { discount: e.target.value })} /></div>
                </>
              )}
              {activeComponent === "giftMessage" && (
                <>
                  <div className="space-y-1.5"><Label>Placeholder Text</Label><Input value={config.giftMessage.placeholder} onChange={(e) => updateConfig("giftMessage", { placeholder: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Max Length</Label><Input type="number" value={config.giftMessage.maxLength} onChange={(e) => updateConfig("giftMessage", { maxLength: parseInt(e.target.value) || 200 })} /></div>
                </>
              )}
              {activeComponent === "deliveryDate" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label>Min Days</Label><Input type="number" value={config.deliveryDate.minDays} onChange={(e) => updateConfig("deliveryDate", { minDays: parseInt(e.target.value) || 1 })} /></div>
                    <div className="space-y-1.5"><Label>Max Days</Label><Input type="number" value={config.deliveryDate.maxDays} onChange={(e) => updateConfig("deliveryDate", { maxDays: parseInt(e.target.value) || 7 })} /></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={config.deliveryDate.excludeWeekends} onCheckedChange={(checked) => updateConfig("deliveryDate", { excludeWeekends: checked })} />
                    <Label className="text-sm">Exclude weekends</Label>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Code className="h-4 w-4" /> Generated Code</CardTitle>
                <Button variant="outline" size="sm" onClick={copySnippet}>
                  {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />} Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted/50 rounded-md p-4 text-xs overflow-x-auto font-mono whitespace-pre-wrap">{generateSnippet(config)}</pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
