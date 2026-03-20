"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Copy,
  Save,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  FileText,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface DataPoint {
  id: string;
  metricName: string;
  value: string;
  changePercent: number;
  period: string;
}

interface ReportSection {
  id: string;
  type: "overview" | "metrics" | "accomplishments" | "next-steps";
  content: string;
}

interface Report {
  id: string;
  clientName: string;
  reportTitle: string;
  period: string;
  sections: ReportSection[];
  dataPoints: DataPoint[];
  isTemplate: boolean;
  createdAt: string;
}

const SECTION_LABELS: Record<string, string> = {
  overview: "Overview",
  metrics: "Key Metrics",
  accomplishments: "Accomplishments",
  "next-steps": "Next Steps",
};

const DEFAULT_SECTIONS: ReportSection[] = [
  { id: "s1", type: "overview", content: "" },
  { id: "s2", type: "metrics", content: "" },
  { id: "s3", type: "accomplishments", content: "" },
  { id: "s4", type: "next-steps", content: "" },
];

export default function ReportingPage() {
  const [reports, setReports] = useLocalStorage<Report[]>("client-reports", []);
  const [view, setView] = useState<"list" | "edit" | "preview">("list");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formClient, setFormClient] = useState("");
  const [formPeriod, setFormPeriod] = useState("");
  const [formSections, setFormSections] = useState<ReportSection[]>(DEFAULT_SECTIONS.map((s) => ({ ...s, id: generateId() })));
  const [formDataPoints, setFormDataPoints] = useState<DataPoint[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const templates = useMemo(() => reports.filter((r) => r.isTemplate), [reports]);

  function openNew(fromTemplate?: Report) {
    setFormTitle(fromTemplate?.reportTitle ?? "");
    setFormClient(fromTemplate?.clientName ?? "");
    setFormPeriod(fromTemplate?.period ?? "");
    setFormSections(fromTemplate?.sections.map((s) => ({ ...s, id: generateId() })) ?? DEFAULT_SECTIONS.map((s) => ({ ...s, id: generateId() })));
    setFormDataPoints(fromTemplate?.dataPoints.map((d) => ({ ...d, id: generateId() })) ?? []);
    setEditingId(null);
    setView("edit");
  }

  function openEdit(report: Report) {
    setFormTitle(report.reportTitle);
    setFormClient(report.clientName);
    setFormPeriod(report.period);
    setFormSections([...report.sections]);
    setFormDataPoints([...report.dataPoints]);
    setEditingId(report.id);
    setView("edit");
  }

  function handleSave(asTemplate: boolean = false) {
    if (!formTitle.trim() || !formClient.trim()) return;
    const report: Report = {
      id: editingId || generateId(),
      clientName: formClient,
      reportTitle: formTitle,
      period: formPeriod,
      sections: formSections,
      dataPoints: formDataPoints,
      isTemplate: asTemplate,
      createdAt: new Date().toISOString(),
    };
    if (editingId) {
      setReports((prev) => prev.map((r) => (r.id === editingId ? report : r)));
    } else {
      setReports((prev) => [report, ...prev]);
    }
    setView("list");
  }

  function handleDelete(id: string) {
    setReports((prev) => prev.filter((r) => r.id !== id));
  }

  function updateSection(id: string, content: string) {
    setFormSections((prev) => prev.map((s) => (s.id === id ? { ...s, content } : s)));
  }

  function addDataPoint() {
    setFormDataPoints((prev) => [...prev, { id: generateId(), metricName: "", value: "", changePercent: 0, period: "" }]);
  }

  function updateDataPoint(id: string, updates: Partial<DataPoint>) {
    setFormDataPoints((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  }

  function removeDataPoint(id: string) {
    setFormDataPoints((prev) => prev.filter((d) => d.id !== id));
  }

  function generateReportText(): string {
    let text = `${formTitle.toUpperCase()}\n`;
    text += `Client: ${formClient}\n`;
    text += `Period: ${formPeriod}\n`;
    text += `${"=".repeat(50)}\n\n`;

    for (const section of formSections) {
      text += `${SECTION_LABELS[section.type].toUpperCase()}\n`;
      text += `${"-".repeat(30)}\n`;
      if (section.type === "metrics" && formDataPoints.length > 0) {
        for (const dp of formDataPoints) {
          const arrow = dp.changePercent >= 0 ? "+" : "";
          text += `  ${dp.metricName}: ${dp.value} (${arrow}${dp.changePercent}% ${dp.period})\n`;
        }
        text += "\n";
      }
      if (section.content) {
        text += `${section.content}\n\n`;
      } else {
        text += "\n";
      }
    }

    text += `\nGenerated: ${new Date().toLocaleDateString()}`;
    return text;
  }

  function copyReport() {
    navigator.clipboard.writeText(generateReportText());
  }

  // Preview view
  if (view === "preview" && activeId) {
    const report = reports.find((r) => r.id === activeId);
    if (!report) { setView("list"); return null; }
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setView("list")}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <h2 className="text-xl font-bold">{report.reportTitle}</h2>
              <p className="text-sm text-muted-foreground">{report.clientName} - {report.period}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setFormTitle(report.reportTitle); setFormClient(report.clientName); setFormPeriod(report.period); setFormSections([...report.sections]); setFormDataPoints([...report.dataPoints]); copyReport(); }}>
            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
          </Button>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-8">
            <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 mb-6" />
            <h1 className="text-2xl font-bold mb-1">{report.reportTitle}</h1>
            <p className="text-muted-foreground mb-6">{report.clientName} | {report.period}</p>
            {report.sections.map((section) => (
              <div key={section.id} className="mb-6">
                <h2 className="text-lg font-semibold mb-2 text-violet-600 dark:text-violet-400">{SECTION_LABELS[section.type]}</h2>
                {section.type === "metrics" && report.dataPoints.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {report.dataPoints.map((dp) => (
                      <div key={dp.id} className="bg-muted/30 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">{dp.metricName}</p>
                        <p className="text-lg font-bold">{dp.value}</p>
                        <div className={`flex items-center gap-1 text-xs ${dp.changePercent >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {dp.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {dp.changePercent >= 0 ? "+" : ""}{dp.changePercent}% {dp.period}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {section.content && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{section.content}</p>}
                <Separator className="mt-4" />
              </div>
            ))}
            <p className="text-xs text-muted-foreground mt-6">Generated {new Date(report.createdAt).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Edit view
  if (view === "edit") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setView("list")}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h2 className="text-xl font-bold">{editingId ? "Edit Report" : "New Report"}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Form */}
          <div className="space-y-4">
            <Card className="border-border/50">
              <CardHeader className="pb-3"><CardTitle className="text-base">Report Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Report Title *</Label>
                    <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Monthly Performance Report" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Client Name *</Label>
                    <Input value={formClient} onChange={(e) => setFormClient(e.target.value)} placeholder="Acme Corp" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Period</Label>
                  <Input value={formPeriod} onChange={(e) => setFormPeriod(e.target.value)} placeholder="e.g. March 2026" />
                </div>
              </CardContent>
            </Card>

            {/* Sections */}
            {formSections.map((section) => (
              <Card key={section.id} className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{SECTION_LABELS[section.type]}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    rows={3}
                    value={section.content}
                    onChange={(e) => updateSection(section.id, e.target.value)}
                    placeholder={`Enter ${SECTION_LABELS[section.type].toLowerCase()} content...`}
                  />
                </CardContent>
              </Card>
            ))}

            {/* Data Points */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Data Points</CardTitle>
                  <Button variant="outline" size="sm" onClick={addDataPoint}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Metric
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {formDataPoints.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No data points added yet</p>
                )}
                {formDataPoints.map((dp) => (
                  <div key={dp.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4 space-y-1">
                      <Label className="text-xs">Metric</Label>
                      <Input value={dp.metricName} onChange={(e) => updateDataPoint(dp.id, { metricName: e.target.value })} placeholder="Visitors" className="h-8 text-sm" />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-xs">Value</Label>
                      <Input value={dp.value} onChange={(e) => updateDataPoint(dp.id, { value: e.target.value })} placeholder="12,500" className="h-8 text-sm" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Change %</Label>
                      <Input type="number" value={dp.changePercent || ""} onChange={(e) => updateDataPoint(dp.id, { changePercent: parseFloat(e.target.value) || 0 })} placeholder="15" className="h-8 text-sm" />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Period</Label>
                      <Input value={dp.period} onChange={(e) => updateDataPoint(dp.id, { period: e.target.value })} placeholder="MoM" className="h-8 text-sm" />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 col-span-1" onClick={() => removeDataPoint(dp.id)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setView("list")}>Cancel</Button>
              <Button variant="outline" onClick={() => handleSave(true)}>
                <Save className="h-4 w-4 mr-1" /> Save as Template
              </Button>
              <Button onClick={() => handleSave(false)} disabled={!formTitle.trim() || !formClient.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
                {editingId ? "Save Changes" : "Save Report"}
              </Button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Live Preview</h3>
              <Button variant="outline" size="sm" onClick={copyReport}>
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Text
              </Button>
            </div>
            <div className="sticky top-6">
              <Card className="border-border/50">
                <CardContent className="p-6">
                  <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 mb-4" />
                  <h1 className="text-xl font-bold mb-1">{formTitle || "Report Title"}</h1>
                  <p className="text-sm text-muted-foreground mb-4">{formClient || "Client"} | {formPeriod || "Period"}</p>
                  {formSections.map((section) => (
                    <div key={section.id} className="mb-4">
                      <h2 className="text-sm font-semibold mb-1 text-violet-600 dark:text-violet-400">{SECTION_LABELS[section.type]}</h2>
                      {section.type === "metrics" && formDataPoints.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {formDataPoints.map((dp) => (
                            <div key={dp.id} className="bg-muted/30 rounded p-2">
                              <p className="text-[10px] text-muted-foreground">{dp.metricName || "Metric"}</p>
                              <p className="text-sm font-bold">{dp.value || "0"}</p>
                              <div className={`flex items-center gap-0.5 text-[10px] ${dp.changePercent >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                {dp.changePercent >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                                {dp.changePercent >= 0 ? "+" : ""}{dp.changePercent}%
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{section.content || "..."}</p>
                      <Separator className="mt-3" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Reporting Builder"
        description="Build branded client reports with metrics and professional formatting"
        icon={BarChart3}
        badge="Reports"
        replaces="Google Docs / Canva"
        actions={
          <Button onClick={() => openNew()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> New Report
          </Button>
        }
      />

      {/* Templates */}
      {templates.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Saved Templates</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {templates.map((t) => (
              <Card key={t.id} className="border-border/40 hover:border-violet-500/40 transition-colors cursor-pointer" onClick={() => openNew(t)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{t.reportTitle}</p>
                    <p className="text-xs text-muted-foreground">{t.dataPoints.length} metrics</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Separator className="mt-4" />
        </div>
      )}

      {/* Reports */}
      {reports.filter((r) => !r.isTemplate).length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center mb-4">
              <BarChart3 className="h-7 w-7 text-violet-400" />
            </div>
            <p className="font-medium text-muted-foreground mb-1">No reports yet</p>
            <p className="text-sm text-muted-foreground/70">Create your first client report</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {reports
            .filter((r) => !r.isTemplate)
            .map((report) => (
              <Card key={report.id} className="border-border/50 hover:border-violet-500/30 transition-colors group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold truncate">{report.reportTitle}</span>
                        <Badge className="bg-violet-500/10 text-violet-600 border-0">{report.clientName}</Badge>
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>{report.period}</span>
                        <span>{report.dataPoints.length} metrics</span>
                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setActiveId(report.id); setView("preview"); }}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(report)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(report.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}
