"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  Calendar,
  Mail,
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
import { generateId } from "@/lib/store";

type Frequency = "weekly" | "biweekly" | "monthly" | "quarterly";
type ReportStatus = "pending" | "sent" | "overdue";

interface TemplateSection {
  id: string;
  title: string;
  included: boolean;
}

interface ScheduledReport {
  id: string;
  client: string;
  reportType: string;
  frequency: Frequency;
  recipients: string;
  nextDue: string;
  status: ReportStatus;
  lastSent: string;
  templateSections: TemplateSection[];
  createdAt: string;
}

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
];

const REPORT_TYPES = [
  "Performance Report",
  "SEO Report",
  "Social Media Report",
  "PPC Report",
  "Content Report",
  "Revenue Report",
  "Custom Report",
];

const DEFAULT_SECTIONS: Omit<TemplateSection, "id">[] = [
  { title: "Executive Summary", included: true },
  { title: "Key Metrics", included: true },
  { title: "Traffic Overview", included: true },
  { title: "Conversion Analysis", included: true },
  { title: "Campaign Performance", included: false },
  { title: "Recommendations", included: true },
  { title: "Next Steps", included: true },
  { title: "Appendix / Raw Data", included: false },
];

const STATUS_CONFIG: Record<ReportStatus, { label: string; className: string; icon: typeof CheckCircle }> = {
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-600 border-0", icon: Clock },
  sent: { label: "Sent", className: "bg-emerald-500/10 text-emerald-600 border-0", icon: CheckCircle },
  overdue: { label: "Overdue", className: "bg-red-500/10 text-red-600 border-0", icon: AlertCircle },
};

export default function ReportSchedulerPage() {
  const [reports, setReports, hydrated] = useLocalStorage<ScheduledReport[]>("analytics-report-scheduler", []);
  const [client, setClient] = useState("");
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [recipients, setRecipients] = useState("");
  const [nextDue, setNextDue] = useState("");
  const [sections, setSections] = useState<Omit<TemplateSection, "id">[]>(DEFAULT_SECTIONS);

  const summary = useMemo(() => {
    const total = reports.length;
    const pending = reports.filter((r) => r.status === "pending").length;
    const sent = reports.filter((r) => r.status === "sent").length;
    const overdue = reports.filter((r) => r.status === "overdue").length;
    return { total, pending, sent, overdue };
  }, [reports]);

  function handleAdd() {
    if (!client.trim()) return;
    const report: ScheduledReport = {
      id: generateId(),
      client: client.trim(),
      reportType,
      frequency,
      recipients: recipients.trim(),
      nextDue: nextDue || new Date().toISOString().split("T")[0],
      status: "pending",
      lastSent: "",
      templateSections: sections.map((s) => ({ ...s, id: generateId() })),
      createdAt: new Date().toISOString(),
    };
    setReports((prev) => [...prev, report]);
    setClient("");
    setRecipients("");
    setNextDue("");
    setSections(DEFAULT_SECTIONS);
  }

  function markSent(id: string) {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "sent" as ReportStatus, lastSent: new Date().toISOString().split("T")[0] } : r
      )
    );
  }

  function toggleSection(idx: number) {
    setSections((prev) => prev.map((s, i) => (i === idx ? { ...s, included: !s.included } : s)));
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report Scheduler"
        description="Schedule recurring reports for clients, track delivery status, and build report templates."
        icon={FileText}
        badge="Analytics"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Reports", value: summary.total, color: "text-violet-600" },
          { label: "Pending", value: summary.pending, color: "text-amber-600" },
          { label: "Sent", value: summary.sent, color: "text-emerald-600" },
          { label: "Overdue", value: summary.overdue, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-violet-500" />
            Schedule New Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Input placeholder="Acme Corp" value={client} onChange={(e) => setClient(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(v) => { if (v) setReportType(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={(v) => { if (v) setFrequency(v as Frequency); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Recipients (emails)</Label>
              <Input placeholder="a@co.com, b@co.com" value={recipients} onChange={(e) => setRecipients(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Next Due</Label>
              <Input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground">Template Sections</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {sections.map((s, i) => (
                <Badge
                  key={i}
                  className={`cursor-pointer transition-all ${s.included ? "bg-violet-500/10 text-violet-600 border-0" : "bg-muted text-muted-foreground border-0 opacity-50"}`}
                  onClick={() => toggleSection(i)}
                >
                  {s.included ? "✓ " : ""}{s.title}
                </Badge>
              ))}
            </div>
          </div>

          <Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleAdd} disabled={!client.trim()}>
            <Plus className="h-4 w-4" />
            Schedule Report
          </Button>
        </CardContent>
      </Card>

      {reports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Schedule your first recurring report.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Scheduled Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {["Client", "Type", "Frequency", "Recipients", "Next Due", "Last Sent", "Status", ""].map((h) => (
                      <th key={h} className="text-left p-2 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => {
                    const sc = STATUS_CONFIG[r.status];
                    return (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="p-2 font-medium">{r.client}</td>
                        <td className="p-2 text-xs">{r.reportType}</td>
                        <td className="p-2"><Badge variant="secondary" className="text-[10px]">{r.frequency}</Badge></td>
                        <td className="p-2 text-xs text-muted-foreground max-w-[150px] truncate">{r.recipients || "—"}</td>
                        <td className="p-2 text-xs">{r.nextDue}</td>
                        <td className="p-2 text-xs text-muted-foreground">{r.lastSent || "Never"}</td>
                        <td className="p-2"><Badge className={sc.className}>{sc.label}</Badge></td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            {r.status !== "sent" && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markSent(r.id)} title="Mark as Sent">
                                <Send className="h-3 w-3 text-emerald-500" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setReports((prev) => prev.filter((x) => x.id !== r.id))}>
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
