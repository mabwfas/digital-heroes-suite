"use client";

import { useState, useMemo } from "react";
import {
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Circle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";

interface CheckItem {
  id: string;
  category: string;
  question: string;
  actionItem: string;
}

type CheckStatus = "yes" | "no" | "partial" | "na";

const CHECKLIST: CheckItem[] = [
  { id: "c1", category: "Consent", question: "Do you obtain explicit consent before collecting personal data?", actionItem: "Implement opt-in consent forms with clear language" },
  { id: "c2", category: "Consent", question: "Can users easily withdraw consent at any time?", actionItem: "Add consent management preference center" },
  { id: "c3", category: "Consent", question: "Is consent recorded and timestamped?", actionItem: "Implement consent logging system with audit trail" },
  { id: "c4", category: "Data Processing", question: "Do you have a lawful basis for each data processing activity?", actionItem: "Document lawful basis for all processing in a register" },
  { id: "c5", category: "Data Processing", question: "Is data processing limited to stated purposes?", actionItem: "Review and limit data collection to necessary minimum" },
  { id: "c6", category: "Data Processing", question: "Are data processing agreements in place with third parties?", actionItem: "Execute DPAs with all data processors and sub-processors" },
  { id: "c7", category: "Privacy Policy", question: "Do you have a comprehensive privacy policy?", actionItem: "Draft/update privacy policy covering all GDPR requirements" },
  { id: "c8", category: "Privacy Policy", question: "Is the privacy policy written in clear, plain language?", actionItem: "Simplify legal jargon and add layered policy format" },
  { id: "c9", category: "Privacy Policy", question: "Does it list all data processors and third parties?", actionItem: "Maintain and publish a list of sub-processors" },
  { id: "c10", category: "Cookie Notice", question: "Do you display a cookie consent banner?", actionItem: "Implement GDPR-compliant cookie consent banner" },
  { id: "c11", category: "Cookie Notice", question: "Are non-essential cookies blocked until consent?", actionItem: "Configure tag manager to respect consent choices" },
  { id: "c12", category: "Data Retention", question: "Do you have defined data retention periods?", actionItem: "Create data retention schedule for each data type" },
  { id: "c13", category: "Data Retention", question: "Is data automatically deleted after retention period?", actionItem: "Implement automated data deletion workflows" },
  { id: "c14", category: "Right to Erasure", question: "Can users request deletion of their data?", actionItem: "Create a data deletion request process and form" },
  { id: "c15", category: "Right to Erasure", question: "Can you delete data across all systems within 30 days?", actionItem: "Map all data stores and implement deletion cascade" },
  { id: "c16", category: "Right to Erasure", question: "Do you provide data portability in machine-readable format?", actionItem: "Build data export functionality (JSON/CSV)" },
  { id: "c17", category: "DPO", question: "Have you appointed a Data Protection Officer (if required)?", actionItem: "Assess DPO requirement and appoint if needed" },
  { id: "c18", category: "DPO", question: "Is the DPO contact information publicly available?", actionItem: "Publish DPO contact on website and privacy policy" },
  { id: "c19", category: "Breach Notification", question: "Do you have a data breach response plan?", actionItem: "Create incident response plan with communication templates" },
  { id: "c20", category: "Breach Notification", question: "Can you notify the supervisory authority within 72 hours?", actionItem: "Document notification procedures and contact details" },
  { id: "c21", category: "Breach Notification", question: "Can you notify affected individuals promptly?", actionItem: "Prepare breach notification email templates" },
  { id: "c22", category: "Security", question: "Is personal data encrypted in transit and at rest?", actionItem: "Implement TLS 1.3 and database-level encryption" },
  { id: "c23", category: "Security", question: "Do you conduct regular security assessments?", actionItem: "Schedule quarterly security audits and pen tests" },
  { id: "c24", category: "Security", question: "Are access controls in place (principle of least privilege)?", actionItem: "Review and restrict data access based on roles" },
  { id: "c25", category: "Training", question: "Are employees trained on GDPR and data protection?", actionItem: "Conduct annual GDPR awareness training for all staff" },
];

const STATUS_CONFIG: Record<CheckStatus, { label: string; cls: string; icon: typeof CheckCircle }> = {
  yes: { label: "Compliant", cls: "bg-emerald-500/10 text-emerald-600 border-0", icon: CheckCircle },
  no: { label: "Non-Compliant", cls: "bg-red-500/10 text-red-600 border-0", icon: AlertCircle },
  partial: { label: "Partial", cls: "bg-amber-500/10 text-amber-600 border-0", icon: AlertCircle },
  na: { label: "N/A", cls: "bg-muted text-muted-foreground border-0", icon: Circle },
};

export default function GdprCheckerPage() {
  const [statuses, setStatuses, hydrated] = useLocalStorage<Record<string, CheckStatus>>("legal-gdpr-checker", {});

  const score = useMemo(() => {
    const applicable = CHECKLIST.filter((c) => statuses[c.id] !== "na");
    const yes = applicable.filter((c) => statuses[c.id] === "yes").length;
    const partial = applicable.filter((c) => statuses[c.id] === "partial").length;
    const total = applicable.length;
    const pct = total > 0 ? Math.round(((yes + partial * 0.5) / total) * 100) : 0;
    return { yes, partial, total, pct, noItems: applicable.filter((c) => statuses[c.id] === "no" || !statuses[c.id]) };
  }, [statuses]);

  const categories = useMemo(() => {
    const cats = [...new Set(CHECKLIST.map((c) => c.category))];
    return cats.map((cat) => ({
      name: cat,
      items: CHECKLIST.filter((c) => c.category === cat),
    }));
  }, []);

  function setStatus(id: string, status: CheckStatus) {
    setStatuses((prev) => ({ ...prev, [id]: status }));
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="GDPR Compliance Checker"
        description="25-item checklist covering consent, data processing, privacy, cookies, retention, erasure, DPO, and breach notification."
        icon={ShieldCheck}
        badge="Legal"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Compliance Score", value: `${score.pct}%`, color: score.pct >= 80 ? "text-emerald-600" : score.pct >= 50 ? "text-amber-600" : "text-red-600" },
          { label: "Compliant", value: score.yes, color: "text-emerald-600" },
          { label: "Partial", value: score.partial, color: "text-amber-600" },
          { label: "Action Items", value: score.noItems.length, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="w-full bg-muted rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all ${score.pct >= 80 ? "bg-emerald-500" : score.pct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
          style={{ width: `${score.pct}%` }}
        />
      </div>

      {categories.map((cat) => (
        <Card key={cat.name}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{cat.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cat.items.map((item) => {
              const status = statuses[item.id] || "no";
              const sc = STATUS_CONFIG[status];
              return (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.question}</p>
                      {(status === "no" || !statuses[item.id]) && (
                        <p className="text-xs text-red-500 mt-0.5">Action: {item.actionItem}</p>
                      )}
                      {status === "partial" && (
                        <p className="text-xs text-amber-500 mt-0.5">Needs improvement: {item.actionItem}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {(["yes", "partial", "no", "na"] as CheckStatus[]).map((s) => {
                        const cfg = STATUS_CONFIG[s];
                        return (
                          <Button
                            key={s}
                            variant="outline"
                            size="sm"
                            className={`h-7 text-[10px] px-2 ${status === s ? cfg.cls + " font-semibold" : "opacity-50"}`}
                            onClick={() => setStatus(item.id, s)}
                          >
                            {cfg.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  <Separator />
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {score.noItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Action Items ({score.noItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {score.noItems.map((item) => (
                <div key={item.id} className="flex items-start gap-2 text-sm">
                  <span className="text-red-500 mt-0.5">•</span>
                  <div>
                    <p className="font-medium">{item.question}</p>
                    <p className="text-xs text-muted-foreground">{item.actionItem}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
