"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Shield,
  Copy,
  Code,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/lib/hooks";

interface FormState {
  businessName: string;
  websiteUrl: string;
  contactEmail: string;
  country: string;
  dataCollected: string[];
  thirdPartyServices: string[];
  gdpr: boolean;
  ccpa: boolean;
}

const DATA_OPTIONS = [
  { id: "name", label: "Name" },
  { id: "email", label: "Email Address" },
  { id: "phone", label: "Phone Number" },
  { id: "address", label: "Physical Address" },
  { id: "payment", label: "Payment Information" },
  { id: "cookies", label: "Cookies" },
  { id: "analytics", label: "Analytics Data" },
  { id: "location", label: "Location Data" },
  { id: "ip", label: "IP Address" },
  { id: "device", label: "Device Information" },
  { id: "usage", label: "Usage Data" },
  { id: "social", label: "Social Media Profiles" },
];

const THIRD_PARTY_OPTIONS = [
  { id: "google-analytics", label: "Google Analytics" },
  { id: "stripe", label: "Stripe" },
  { id: "paypal", label: "PayPal" },
  { id: "mailchimp", label: "Mailchimp" },
  { id: "facebook-pixel", label: "Facebook Pixel" },
  { id: "shopify", label: "Shopify" },
  { id: "google-ads", label: "Google Ads" },
  { id: "hotjar", label: "Hotjar" },
  { id: "intercom", label: "Intercom" },
  { id: "hubspot", label: "HubSpot" },
  { id: "aws", label: "Amazon Web Services" },
  { id: "cloudflare", label: "Cloudflare" },
  { id: "sendgrid", label: "SendGrid" },
  { id: "twilio", label: "Twilio" },
];

const DEFAULT_FORM: FormState = {
  businessName: "",
  websiteUrl: "",
  contactEmail: "",
  country: "",
  dataCollected: [],
  thirdPartyServices: [],
  gdpr: false,
  ccpa: false,
};

function generatePolicy(form: FormState): string {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const biz = form.businessName || "[Business Name]";
  const url = form.websiteUrl || "[Website URL]";
  const email = form.contactEmail || "[Contact Email]";
  const country = form.country || "[Country]";

  const dataLabels = form.dataCollected
    .map((id) => DATA_OPTIONS.find((d) => d.id === id)?.label || id)
    .join(", ");
  const serviceLabels = form.thirdPartyServices
    .map((id) => THIRD_PARTY_OPTIONS.find((s) => s.id === id)?.label || id)
    .join(", ");

  let policy = `PRIVACY POLICY

Last Updated: ${date}

1. INTRODUCTION

${biz} ("we", "our", or "us") operates ${url}. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.

We reserve the right to make changes to this Privacy Policy at any time and for any reason. We will alert you about any changes by updating the "Last Updated" date of this Privacy Policy.

2. INFORMATION WE COLLECT

We may collect the following types of information:`;

  if (form.dataCollected.length > 0) {
    policy += `\n\nPersonal Data: ${dataLabels}.`;
  } else {
    policy += `\n\nWe collect information that you voluntarily provide to us when you use our services.`;
  }

  if (form.dataCollected.includes("cookies")) {
    policy += `\n\nCookies and Tracking: We use cookies and similar tracking technologies to track activity on our website and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.`;
  }

  if (form.dataCollected.includes("analytics") || form.dataCollected.includes("usage")) {
    policy += `\n\nUsage Data: We may also collect information that your browser sends whenever you visit our website, including your IP address, browser type, browser version, the pages you visit, the time and date of your visit, the time spent on those pages, and other diagnostic data.`;
  }

  policy += `\n\n3. HOW WE USE YOUR INFORMATION

We use the information we collect in the following ways:

- To provide, operate, and maintain our website
- To improve, personalize, and expand our website
- To understand and analyze how you use our website
- To develop new products, services, features, and functionality
- To communicate with you, including for customer service and support
- To send you updates and other information relating to the website
- To process transactions
- To find and prevent fraud
- For compliance with legal obligations`;

  policy += `\n\n4. SHARING YOUR INFORMATION

We may share your information in the following situations:

- With Service Providers: We may share your information with third-party service providers to monitor and analyze the use of our website, to contact you, or for other business purposes.`;

  if (form.thirdPartyServices.length > 0) {
    policy += `\n\nWe use the following third-party service providers: ${serviceLabels}. Each of these providers has their own privacy policy addressing how they use such information.`;
  }

  policy += `\n- With Business Transfers: We may share or transfer your information in connection with a merger, acquisition, or sale of assets.
- With Law Enforcement: We may disclose your information if required to do so by law or in response to valid requests by public authorities.
- With Your Consent: We may disclose your personal information for any other purpose with your consent.`;

  policy += `\n\n5. DATA RETENTION

We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies.`;

  policy += `\n\n6. SECURITY OF YOUR INFORMATION

We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against interception or misuse.`;

  if (form.gdpr) {
    policy += `\n\n7. GDPR COMPLIANCE (EUROPEAN ECONOMIC AREA)

If you are a resident of the European Economic Area (EEA), you have certain data protection rights under the General Data Protection Regulation (GDPR). ${biz} aims to take reasonable steps to allow you to correct, amend, delete, or limit the use of your personal data.

Your rights under the GDPR include:
- The right to access: You have the right to request copies of your personal data.
- The right to rectification: You have the right to request that we correct any information you believe is inaccurate.
- The right to erasure: You have the right to request that we erase your personal data, under certain conditions.
- The right to restrict processing: You have the right to request that we restrict the processing of your personal data, under certain conditions.
- The right to object to processing: You have the right to object to our processing of your personal data, under certain conditions.
- The right to data portability: You have the right to request that we transfer the data we have collected to another organization, or directly to you, under certain conditions.

If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us at ${email}.

Legal Basis for Processing: We process your personal data under the following legal bases:
- Your consent
- The performance of a contract
- Compliance with a legal obligation
- Our legitimate interests`;
  }

  if (form.ccpa) {
    const sectionNum = form.gdpr ? "8" : "7";
    policy += `\n\n${sectionNum}. CCPA COMPLIANCE (CALIFORNIA RESIDENTS)

Under the California Consumer Privacy Act (CCPA), California residents have specific rights regarding their personal information.

Your rights under the CCPA include:
- Right to Know: You have the right to request that we disclose what personal information we collect, use, disclose, and sell.
- Right to Delete: You have the right to request the deletion of your personal information, subject to certain exceptions.
- Right to Opt-Out: You have the right to opt-out of the sale of your personal information. We do not sell personal information.
- Right to Non-Discrimination: We will not discriminate against you for exercising any of your CCPA rights.

To exercise your rights under the CCPA, please contact us at ${email}. We will respond to verified requests within 45 days.

Categories of personal information we have collected in the past 12 months include: ${dataLabels || "identifiers, internet activity, and commercial information"}.`;
  }

  const contactSection = form.gdpr && form.ccpa ? "9" : form.gdpr || form.ccpa ? "8" : "7";
  const childrenSection = String(Number(contactSection) + 1);

  policy += `\n\n${contactSection}. CHILDREN'S PRIVACY

Our website is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we discover that we have collected personal information from a child under age 13 without verification of parental consent, we will take steps to remove that information from our servers.`;

  policy += `\n\n${childrenSection}. CONTACT US

If you have any questions or concerns about this Privacy Policy, please contact us:

${biz}
Email: ${email}
Website: ${url}
Country: ${country}`;

  return policy;
}

function policyToHtml(text: string, biz: string): string {
  const lines = text.split("\n");
  let html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Privacy Policy - ${biz}</title>\n<style>\nbody { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.7; color: #333; }\nh1 { font-size: 1.75rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }\nh2 { font-size: 1.25rem; margin-top: 2rem; color: #1f2937; }\nul { padding-left: 1.5rem; }\nli { margin-bottom: 0.35rem; }\n</style>\n</head>\n<body>\n`;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      html += "\n";
      continue;
    }
    if (trimmed === "PRIVACY POLICY") {
      html += `<h1>Privacy Policy</h1>\n`;
    } else if (/^\d+\.\s/.test(trimmed)) {
      html += `<h2>${trimmed}</h2>\n`;
    } else if (trimmed.startsWith("- ")) {
      html += `<ul><li>${trimmed.slice(2)}</li></ul>\n`;
    } else if (trimmed.startsWith("Last Updated:")) {
      html += `<p><em>${trimmed}</em></p>\n`;
    } else {
      html += `<p>${trimmed}</p>\n`;
    }
  }

  html += `</body>\n</html>`;
  return html;
}

export default function PrivacyPolicyPage() {
  const [form, setForm, hydrated] = useLocalStorage<FormState>(
    "privacy-policy-form",
    DEFAULT_FORM
  );
  const [copied, setCopied] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  const policy = useMemo(() => (generated ? generatePolicy(form) : ""), [form, generated]);
  const policyHtml = useMemo(
    () => (generated ? policyToHtml(policy, form.businessName) : ""),
    [policy, generated, form.businessName]
  );

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [setForm]
  );

  const toggleArrayItem = useCallback(
    (key: "dataCollected" | "thirdPartyServices", item: string) => {
      setForm((prev) => {
        const arr = prev[key];
        return {
          ...prev,
          [key]: arr.includes(item)
            ? arr.filter((i) => i !== item)
            : [...arr, item],
        };
      });
    },
    [setForm]
  );

  const handleCopy = useCallback(
    (text: string, label: string) => {
      navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    },
    []
  );

  const handleReset = useCallback(() => {
    setForm(DEFAULT_FORM);
    setGenerated(false);
  }, [setForm]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Privacy Policy Generator"
        description="Generate a professional, compliant privacy policy for your website or app."
        icon={Shield}
        badge="Free"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-violet-500" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="biz-name">Business Name <span className="text-red-500">*</span></Label>
                <Input
                  id="biz-name"
                  placeholder="Acme Inc."
                  value={form.businessName}
                  onChange={(e) => updateField("businessName", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="biz-url">Website URL</Label>
                <Input
                  id="biz-url"
                  placeholder="https://example.com"
                  value={form.websiteUrl}
                  onChange={(e) => updateField("websiteUrl", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="biz-email">Contact Email</Label>
                <Input
                  id="biz-email"
                  type="email"
                  placeholder="privacy@example.com"
                  value={form.contactEmail}
                  onChange={(e) => updateField("contactEmail", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="biz-country">Country</Label>
                <Input
                  id="biz-country"
                  placeholder="United States"
                  value={form.country}
                  onChange={(e) => updateField("country", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Data Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {DATA_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-2 rounded-lg border p-2 cursor-pointer text-sm transition-colors ${
                      form.dataCollected.includes(opt.id)
                        ? "bg-violet-500/10 border-violet-500/30"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.dataCollected.includes(opt.id)}
                      onChange={() => toggleArrayItem("dataCollected", opt.id)}
                      className="accent-violet-600 rounded"
                    />
                    <span className="text-xs">{opt.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {THIRD_PARTY_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-2 rounded-lg border p-2 cursor-pointer text-sm transition-colors ${
                      form.thirdPartyServices.includes(opt.id)
                        ? "bg-violet-500/10 border-violet-500/30"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.thirdPartyServices.includes(opt.id)}
                      onChange={() => toggleArrayItem("thirdPartyServices", opt.id)}
                      className="accent-violet-600 rounded"
                    />
                    <span className="text-xs">{opt.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">GDPR Compliance</Label>
                  <p className="text-xs text-muted-foreground">
                    Include EU General Data Protection Regulation sections
                  </p>
                </div>
                <Switch
                  checked={form.gdpr}
                  onCheckedChange={(val) => updateField("gdpr", val as boolean)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">CCPA Compliance</Label>
                  <p className="text-xs text-muted-foreground">
                    Include California Consumer Privacy Act sections
                  </p>
                </div>
                <Switch
                  checked={form.ccpa}
                  onCheckedChange={(val) => updateField("ccpa", val as boolean)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
              onClick={() => setGenerated(true)}
              disabled={!form.businessName.trim()}
            >
              <Shield className="h-4 w-4" />
              Generate Privacy Policy
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Preview Panel */}
        <div>
          {generated && policy ? (
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Generated Policy</CardTitle>
                  <div className="flex gap-1.5">
                    {form.gdpr && (
                      <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-600">
                        GDPR
                      </Badge>
                    )}
                    {form.ccpa && (
                      <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">
                        CCPA
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="preview">
                  <TabsList>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="html">HTML</TabsTrigger>
                  </TabsList>
                  <TabsContent value="preview">
                    <div className="rounded-lg border bg-muted/30 p-4 max-h-[600px] overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed text-foreground/80">
                        {policy}
                      </pre>
                    </div>
                  </TabsContent>
                  <TabsContent value="html">
                    <div className="rounded-lg border bg-muted/30 p-4 max-h-[600px] overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed text-foreground/80">
                        {policyHtml}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    size="sm"
                    onClick={() => handleCopy(policy, "text")}
                  >
                    {copied === "text" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied === "text" ? "Copied!" : "Copy Text"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    size="sm"
                    onClick={() => handleCopy(policyHtml, "html")}
                  >
                    {copied === "html" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Code className="h-3.5 w-3.5" />
                    )}
                    {copied === "html" ? "Copied!" : "Copy HTML"}
                  </Button>
                </div>

                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-[11px] text-muted-foreground">
                    This policy was auto-generated on{" "}
                    {new Date().toLocaleDateString()}. It is provided as a
                    starting point and should be reviewed by a legal professional
                    before use.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-16">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center">
                    <Shield className="h-7 w-7 text-violet-400" />
                  </div>
                  <h3 className="text-sm font-medium">No Policy Generated Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Fill in your business details, select what data you collect
                    and which services you use, then click Generate to create your
                    privacy policy.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
