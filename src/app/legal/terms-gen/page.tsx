"use client";

import { useState } from "react";
import {
  ScrollText,
  Copy,
  Download,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface TosConfig {
  businessName: string;
  website: string;
  email: string;
  serviceType: string;
  jurisdiction: string;
  sections: Record<string, boolean>;
}

const SECTIONS: { key: string; title: string }[] = [
  { key: "liability", title: "Limitation of Liability" },
  { key: "payment", title: "Payment Terms" },
  { key: "ip", title: "Intellectual Property" },
  { key: "confidentiality", title: "Confidentiality" },
  { key: "termination", title: "Termination" },
  { key: "disputes", title: "Dispute Resolution" },
  { key: "warranties", title: "Warranties & Disclaimers" },
  { key: "amendments", title: "Amendments" },
];

const SERVICE_TYPES = ["SaaS Platform", "Consulting Services", "E-Commerce", "Digital Agency", "Freelance Services", "Marketplace"];

const DEFAULT_CONFIG: TosConfig = {
  businessName: "",
  website: "",
  email: "",
  serviceType: SERVICE_TYPES[0],
  jurisdiction: "State of Delaware, United States",
  sections: Object.fromEntries(SECTIONS.map((s) => [s.key, true])),
};

function generateToS(c: TosConfig): string {
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  let doc = `TERMS OF SERVICE\n\nLast Updated: ${date}\n\n`;
  doc += `These Terms of Service ("Terms") govern your use of the services provided by ${c.businessName || "[Business Name]"} ("Company", "we", "us", or "our") accessible at ${c.website || "[website]"}.\n\nBy using our services, you agree to be bound by these Terms. If you do not agree, please do not use our services.\n\n`;
  doc += `1. SERVICES\n\nWe provide ${c.serviceType.toLowerCase()} services as described on our website. We reserve the right to modify, suspend, or discontinue any part of our services at any time.\n\n`;

  let sectionNum = 2;
  if (c.sections.liability) {
    doc += `${sectionNum}. LIMITATION OF LIABILITY\n\nTo the maximum extent permitted by law, ${c.businessName || "[Business Name]"} shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from (a) your use or inability to use the services; (b) any unauthorized access to or use of our servers; (c) any interruption or cessation of transmission to or from our services.\n\n`;
    sectionNum++;
  }
  if (c.sections.payment) {
    doc += `${sectionNum}. PAYMENT TERMS\n\nAll fees are due as specified in your service agreement or invoice. Payments are non-refundable unless otherwise stated. We reserve the right to suspend services for overdue payments exceeding 30 days. Late payments may incur interest at a rate of 1.5% per month or the maximum rate permitted by law.\n\n`;
    sectionNum++;
  }
  if (c.sections.ip) {
    doc += `${sectionNum}. INTELLECTUAL PROPERTY\n\nAll content, features, and functionality of our services are owned by ${c.businessName || "[Business Name]"} and are protected by international copyright, trademark, and other intellectual property laws. Upon full payment, clients receive a license to use deliverables as specified in the project scope. We retain the right to showcase work in our portfolio unless otherwise agreed.\n\n`;
    sectionNum++;
  }
  if (c.sections.confidentiality) {
    doc += `${sectionNum}. CONFIDENTIALITY\n\nBoth parties agree to maintain the confidentiality of any proprietary information received during the course of the engagement. This obligation survives the termination of these Terms for a period of two (2) years.\n\n`;
    sectionNum++;
  }
  if (c.sections.termination) {
    doc += `${sectionNum}. TERMINATION\n\nEither party may terminate the service agreement with 30 days written notice to ${c.email || "[email]"}. We may terminate immediately if you breach these Terms. Upon termination, all outstanding fees become immediately due and payable.\n\n`;
    sectionNum++;
  }
  if (c.sections.disputes) {
    doc += `${sectionNum}. DISPUTE RESOLUTION\n\nAny disputes arising from these Terms shall first be attempted to be resolved through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration in accordance with the rules of the ${c.jurisdiction || "[Jurisdiction]"}. Each party shall bear its own costs of arbitration.\n\n`;
    sectionNum++;
  }
  if (c.sections.warranties) {
    doc += `${sectionNum}. WARRANTIES & DISCLAIMERS\n\nOur services are provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the services will be uninterrupted, timely, secure, or error-free. We make commercially reasonable efforts to deliver quality work as described in project scopes.\n\n`;
    sectionNum++;
  }
  if (c.sections.amendments) {
    doc += `${sectionNum}. AMENDMENTS\n\nWe reserve the right to update these Terms at any time. Changes will be posted on our website and become effective upon posting. Continued use of our services after changes constitutes acceptance of the revised Terms. We will notify users of material changes via email at least 14 days before they take effect.\n\n`;
    sectionNum++;
  }

  doc += `${sectionNum}. GOVERNING LAW\n\nThese Terms shall be governed by the laws of the ${c.jurisdiction || "[Jurisdiction]"}.\n\n`;
  doc += `${sectionNum + 1}. CONTACT\n\nFor questions about these Terms, contact us at ${c.email || "[email]"}.\n`;

  return doc;
}

export default function TermsGenPage() {
  const [config, setConfig, hydrated] = useLocalStorage<TosConfig>("legal-terms-gen", DEFAULT_CONFIG);
  const [generated, setGenerated] = useState("");
  const [copied, setCopied] = useState(false);

  function updateConfig<K extends keyof TosConfig>(key: K, value: TosConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function toggleSection(key: string) {
    setConfig((prev) => ({
      ...prev,
      sections: { ...prev.sections, [key]: !prev.sections[key] },
    }));
  }

  function handleGenerate() {
    setGenerated(generateToS(config));
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
    a.download = "terms-of-service.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Terms of Service Generator"
        description="Generate a complete Terms of Service document with configurable sections for your business."
        icon={ScrollText}
        badge="Legal"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="space-y-1.5">
              <Label>Business Name *</Label>
              <Input placeholder="Acme LLC" value={config.businessName} onChange={(e) => updateConfig("businessName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input placeholder="https://acme.com" value={config.website} onChange={(e) => updateConfig("website", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Email</Label>
              <Input placeholder="legal@acme.com" value={config.email} onChange={(e) => updateConfig("email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Service Type</Label>
              <Select value={config.serviceType} onValueChange={(v) => { if (v) updateConfig("serviceType", v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Jurisdiction</Label>
              <Input placeholder="State of Delaware" value={config.jurisdiction} onChange={(e) => updateConfig("jurisdiction", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configure Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SECTIONS.map((s) => (
              <Button
                key={s.key}
                variant="outline"
                className={`justify-start text-xs h-auto py-2 ${config.sections[s.key] ? "border-violet-500 bg-violet-500/5 text-violet-600" : "opacity-60"}`}
                onClick={() => toggleSection(s.key)}
              >
                {config.sections[s.key] ? "✓ " : ""}{s.title}
              </Button>
            ))}
          </div>
          <Button className="mt-4 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleGenerate}>
            <RefreshCw className="h-4 w-4" />
            Generate Terms of Service
          </Button>
        </CardContent>
      </Card>

      {generated && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Generated Terms of Service</CardTitle>
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
