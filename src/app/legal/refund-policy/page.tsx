"use client";

import { useState } from "react";
import {
  RotateCcw,
  Copy,
  Download,
  RefreshCw,
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

interface RefundConfig {
  businessName: string;
  businessType: string;
  refundWindow: string;
  conditions: string[];
  processSteps: string[];
  contactEmail: string;
  contactMethod: string;
}

const BUSINESS_TYPES = ["Digital Services", "SaaS / Subscription", "E-Commerce (Physical)", "E-Commerce (Digital)", "Consulting", "Freelance", "Agency Services"];
const REFUND_WINDOWS = ["7 days", "14 days", "30 days", "60 days", "90 days"];

const DEFAULT_CONDITIONS = [
  "Service has not been substantially delivered or used",
  "Request is made within the refund window period",
  "No violation of terms of service has occurred",
  "Refund request includes order/invoice number",
];

const DEFAULT_STEPS = [
  "Submit refund request via email with your order details",
  "Our team will review your request within 3 business days",
  "If approved, refund will be processed to original payment method",
  "Allow 5-10 business days for the refund to appear on your statement",
];

const DEFAULT_CONFIG: RefundConfig = {
  businessName: "",
  businessType: BUSINESS_TYPES[0],
  refundWindow: "30 days",
  conditions: DEFAULT_CONDITIONS,
  processSteps: DEFAULT_STEPS,
  contactEmail: "",
  contactMethod: "Email",
};

function generateRefundPolicy(c: RefundConfig): string {
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  let doc = `REFUND POLICY\n\nLast Updated: ${date}\n\n`;
  doc += `Thank you for choosing ${c.businessName || "[Business Name]"}. We want you to be completely satisfied with our ${c.businessType.toLowerCase()} services. This Refund Policy outlines the conditions under which refunds may be granted.\n\n`;

  doc += `REFUND ELIGIBILITY\n\n`;
  doc += `You may request a refund within ${c.refundWindow} of your purchase or service commencement date, provided the following conditions are met:\n\n`;
  c.conditions.forEach((cond, i) => {
    doc += `${i + 1}. ${cond}\n`;
  });
  doc += `\n`;

  doc += `NON-REFUNDABLE ITEMS\n\n`;
  doc += `The following are not eligible for refunds:\n`;
  doc += `- Custom work that has been completed and delivered\n`;
  doc += `- Services that have been substantially performed\n`;
  doc += `- Rush or expedited service fees\n`;
  doc += `- Third-party costs incurred on your behalf (advertising, hosting, etc.)\n`;
  doc += `- Subscription fees for the current billing period after 50% of the period has elapsed\n\n`;

  doc += `REFUND PROCESS\n\n`;
  doc += `To request a refund, please follow these steps:\n\n`;
  c.processSteps.forEach((step, i) => {
    doc += `Step ${i + 1}: ${step}\n`;
  });
  doc += `\n`;

  doc += `PARTIAL REFUNDS\n\n`;
  doc += `In cases where work has been partially completed, we may offer a partial refund proportional to the work not yet delivered. The amount will be calculated based on the percentage of the project scope remaining.\n\n`;

  doc += `CANCELLATION POLICY\n\n`;
  doc += `For ongoing services or subscriptions:\n`;
  doc += `- You may cancel at any time by contacting us\n`;
  doc += `- Cancellation takes effect at the end of the current billing period\n`;
  doc += `- No refund will be issued for the remaining days of the current period\n`;
  doc += `- Any outstanding invoices remain due upon cancellation\n\n`;

  doc += `DISPUTE RESOLUTION\n\n`;
  doc += `If you are not satisfied with the refund decision, you may:\n`;
  doc += `1. Request a review by contacting us at ${c.contactEmail || "[email]"}\n`;
  doc += `2. We will respond to your dispute within 5 business days\n`;
  doc += `3. If unresolved, you may pursue remedies available under applicable consumer protection laws\n\n`;

  doc += `CONTACT US\n\n`;
  doc += `To request a refund or ask questions about this policy:\n`;
  doc += `${c.contactMethod}: ${c.contactEmail || "[contact information]"}\n`;
  doc += `Business: ${c.businessName || "[Business Name]"}\n\n`;

  doc += `CHANGES TO THIS POLICY\n\n`;
  doc += `We reserve the right to update this Refund Policy. Changes will be posted on our website and apply to purchases made after the effective date.\n`;

  return doc;
}

export default function RefundPolicyPage() {
  const [config, setConfig, hydrated] = useLocalStorage<RefundConfig>("legal-refund-policy", DEFAULT_CONFIG);
  const [generated, setGenerated] = useState("");
  const [copied, setCopied] = useState(false);
  const [newCondition, setNewCondition] = useState("");
  const [newStep, setNewStep] = useState("");

  function updateConfig<K extends keyof RefundConfig>(key: K, value: RefundConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function addCondition() {
    if (!newCondition.trim()) return;
    setConfig((prev) => ({ ...prev, conditions: [...prev.conditions, newCondition.trim()] }));
    setNewCondition("");
  }

  function addStep() {
    if (!newStep.trim()) return;
    setConfig((prev) => ({ ...prev, processSteps: [...prev.processSteps, newStep.trim()] }));
    setNewStep("");
  }

  function handleGenerate() {
    setGenerated(generateRefundPolicy(config));
  }

  function handleCopy() {
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleExport() {
    const blob = new Blob([generated], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "refund-policy.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refund Policy Generator"
        description="Generate a professional refund policy with customizable conditions, process steps, and refund windows."
        icon={RotateCcw}
        badge="Legal"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Business Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="space-y-1.5">
              <Label>Business Name *</Label>
              <Input placeholder="Acme LLC" value={config.businessName} onChange={(e) => updateConfig("businessName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Business Type</Label>
              <Select value={config.businessType} onValueChange={(v) => { if (v) updateConfig("businessType", v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Refund Window</Label>
              <Select value={config.refundWindow} onValueChange={(v) => { if (v) updateConfig("refundWindow", v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REFUND_WINDOWS.map((w) => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Contact Email</Label>
              <Input placeholder="support@acme.com" value={config.contactEmail} onChange={(e) => updateConfig("contactEmail", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Method</Label>
              <Input placeholder="Email" value={config.contactMethod} onChange={(e) => updateConfig("contactMethod", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Refund Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {config.conditions.map((cond, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="text-[10px] shrink-0">{i + 1}</Badge>
                <span className="flex-1">{cond}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setConfig((prev) => ({ ...prev, conditions: prev.conditions.filter((_, j) => j !== i) }))}>
                  <span className="text-red-500 text-xs">x</span>
                </Button>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <Input placeholder="Add condition..." className="text-xs h-8" value={newCondition} onChange={(e) => setNewCondition(e.target.value)} />
              <Button variant="outline" size="sm" className="h-8" onClick={addCondition} disabled={!newCondition.trim()}>Add</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Process Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {config.processSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="text-[10px] shrink-0">Step {i + 1}</Badge>
                <span className="flex-1">{step}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setConfig((prev) => ({ ...prev, processSteps: prev.processSteps.filter((_, j) => j !== i) }))}>
                  <span className="text-red-500 text-xs">x</span>
                </Button>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <Input placeholder="Add step..." className="text-xs h-8" value={newStep} onChange={(e) => setNewStep(e.target.value)} />
              <Button variant="outline" size="sm" className="h-8" onClick={addStep} disabled={!newStep.trim()}>Add</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleGenerate}>
        <RefreshCw className="h-4 w-4" />
        Generate Refund Policy
      </Button>

      {generated && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Generated Refund Policy</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-3 w-3" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-3 w-3" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-[400px] font-mono text-xs"
              value={generated}
              onChange={(e) => setGenerated(e.target.value)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
