"use client";

import { useState, useMemo } from "react";
import {
  FileSignature,
  Plus,
  Trash2,
  Edit2,
  Eye,
  ChevronLeft,
  Clock,
  CheckCircle,
  FileText,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type ContractStatus = "draft" | "sent" | "signed" | "expired";

interface ContractVariables {
  clientName: string;
  clientEmail: string;
  freelancerName: string;
  freelancerEmail: string;
  projectScope: string;
  paymentAmount: string;
  paymentTerms: string;
  timeline: string;
  deliverables: string;
  startDate: string;
  endDate: string;
  governingLaw: string;
}

interface Contract {
  id: string;
  title: string;
  templateId: string;
  variables: ContractVariables;
  status: ContractStatus;
  createdAt: string;
}

const EMPTY_VARS = (): ContractVariables => ({
  clientName: "",
  clientEmail: "",
  freelancerName: "",
  freelancerEmail: "",
  projectScope: "",
  paymentAmount: "",
  paymentTerms: "50% upfront, 50% on completion",
  timeline: "",
  deliverables: "",
  startDate: "",
  endDate: "",
  governingLaw: "England and Wales",
});

const STATUS_CONFIG: Record<ContractStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-0" },
  sent: { label: "Sent", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0" },
  signed: { label: "Signed", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0" },
  expired: { label: "Expired", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-0" },
};

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  body: string;
}

const TEMPLATES: Template[] = [
  {
    id: "freelance-service",
    name: "Freelance Service Agreement",
    description: "General freelance contract covering services, payment and IP",
    icon: FileText,
    body: `FREELANCE SERVICE AGREEMENT

This Freelance Service Agreement ("Agreement") is entered into as of {{startDate}} by and between:

FREELANCER: {{freelancerName}} ({{freelancerEmail}}) ("Freelancer")
CLIENT: {{clientName}} ({{clientEmail}}) ("Client")

1. SCOPE OF SERVICES
The Freelancer agrees to provide the following services:
{{projectScope}}

2. DELIVERABLES
The following deliverables will be provided:
{{deliverables}}

3. TIMELINE
Project Start Date: {{startDate}}
Project End Date / Deadline: {{endDate}}
Estimated Duration: {{timeline}}

4. PAYMENT
Total Project Fee: {{paymentAmount}}
Payment Terms: {{paymentTerms}}

All payments must be made within 14 days of invoice. Late payments will incur a 2% monthly interest charge.

5. INTELLECTUAL PROPERTY
Upon receipt of full payment, the Freelancer assigns all intellectual property rights in the deliverables to the Client. The Freelancer retains the right to display the work in their portfolio.

6. REVISIONS
The project fee includes up to 2 rounds of revisions. Additional revisions will be charged at the Freelancer's standard hourly rate.

7. CONFIDENTIALITY
Both parties agree to keep confidential any proprietary information disclosed during the project.

8. TERMINATION
Either party may terminate this Agreement with 7 days written notice. The Client shall pay for all work completed up to the termination date.

9. LIMITATION OF LIABILITY
The Freelancer's total liability shall not exceed the total fees paid under this Agreement.

10. GOVERNING LAW
This Agreement shall be governed by the laws of {{governingLaw}}.

Agreed and accepted by:

Freelancer: {{freelancerName}}                    Date: _______________

Client: {{clientName}}                            Date: _______________`,
  },
  {
    id: "nda",
    name: "Non-Disclosure Agreement",
    description: "Mutual NDA to protect confidential information",
    icon: FileSignature,
    body: `MUTUAL NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of {{startDate}} between:

PARTY A: {{freelancerName}} ({{freelancerEmail}})
PARTY B: {{clientName}} ({{clientEmail}})

1. PURPOSE
The parties wish to explore a potential business relationship regarding:
{{projectScope}}

2. CONFIDENTIAL INFORMATION
"Confidential Information" means any information disclosed by either party that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information.

3. OBLIGATIONS
Each party agrees to:
(a) Keep all Confidential Information strictly confidential
(b) Not disclose Confidential Information to third parties without prior written consent
(c) Use Confidential Information only for the purpose of evaluating the potential business relationship
(d) Notify the other party immediately upon discovery of any unauthorized disclosure

4. EXCLUSIONS
This Agreement does not apply to information that:
(a) Is or becomes publicly known through no breach of this Agreement
(b) Was known to the receiving party prior to disclosure
(c) Is independently developed by the receiving party
(d) Is required to be disclosed by law or court order

5. TERM
This Agreement shall remain in effect for 2 years from the date of signing, or until {{endDate}}, whichever comes first.

6. RETURN OF INFORMATION
Upon request, each party shall promptly return or destroy all Confidential Information of the other party.

7. REMEDIES
Both parties acknowledge that breach of this Agreement may cause irreparable harm and that monetary damages may be inadequate. Either party may seek injunctive relief in addition to other remedies.

8. GOVERNING LAW
This Agreement shall be governed by the laws of {{governingLaw}}.

Agreed and accepted:

Party A: {{freelancerName}}                       Date: _______________

Party B: {{clientName}}                           Date: _______________`,
  },
  {
    id: "website-design",
    name: "Website Design Contract",
    description: "Detailed contract for web design and development projects",
    icon: FileText,
    body: `WEBSITE DESIGN & DEVELOPMENT CONTRACT

This Website Design & Development Contract ("Contract") is made on {{startDate}} between:

DESIGNER: {{freelancerName}} ({{freelancerEmail}}) ("Designer")
CLIENT: {{clientName}} ({{clientEmail}}) ("Client")

1. PROJECT OVERVIEW
The Designer agrees to design and develop a website for the Client as follows:
{{projectScope}}

2. DELIVERABLES
The following will be delivered:
{{deliverables}}

3. PROJECT TIMELINE
Start Date: {{startDate}}
Estimated Completion: {{endDate}}
Estimated Duration: {{timeline}}

The timeline assumes timely feedback from the Client within 3 business days of review requests.

4. INVESTMENT & PAYMENT SCHEDULE
Total Project Investment: {{paymentAmount}}
Payment Structure: {{paymentTerms}}

5. DESIGN PROCESS
5.1 Discovery — Understanding business goals, target audience, and requirements
5.2 Wireframing — Layout and structure planning
5.3 Visual Design — High-fidelity mockups for Client approval
5.4 Development — Converting approved designs into functional website
5.5 Testing — Cross-browser and mobile compatibility testing
5.6 Launch — Final deployment and handover

6. REVISIONS
This project includes 2 rounds of design revisions and 1 round of development revisions after each phase. Additional revisions are billed separately.

7. CLIENT RESPONSIBILITIES
The Client shall provide all content (text, images, logos) within 5 business days of project kick-off. Delays in content delivery may extend the project timeline accordingly.

8. BROWSER COMPATIBILITY
The website will be tested on the latest 2 versions of Chrome, Firefox, Safari and Edge, on both desktop and mobile.

9. INTELLECTUAL PROPERTY
Upon receipt of final payment:
— Client owns all final website files and content
— Designer retains right to display project in portfolio
— Third-party assets (fonts, stock photos, plugins) are subject to their respective licenses

10. HOSTING & MAINTENANCE
This contract does not include ongoing hosting or maintenance unless separately agreed. The Designer recommends [hosting provider] and can provide maintenance packages upon request.

11. CONFIDENTIALITY
Both parties agree to keep project details confidential and not disclose to third parties.

12. GOVERNING LAW
This Contract is governed by the laws of {{governingLaw}}.

Agreed and accepted:

Designer: {{freelancerName}}                      Date: _______________

Client: {{clientName}}                            Date: _______________`,
  },
];

function applyVariables(template: string, vars: ContractVariables): string {
  let result = template;
  const keys = Object.keys(vars) as (keyof ContractVariables)[];
  keys.forEach((key) => {
    const placeholder = `{{${key}}}`;
    result = result.split(placeholder).join(vars[key] || `[${key}]`);
  });
  return result;
}

const VAR_LABELS: Record<keyof ContractVariables, string> = {
  clientName: "Client Name",
  clientEmail: "Client Email",
  freelancerName: "Your Name",
  freelancerEmail: "Your Email",
  projectScope: "Project Scope",
  paymentAmount: "Payment Amount",
  paymentTerms: "Payment Terms",
  timeline: "Timeline",
  deliverables: "Deliverables",
  startDate: "Start Date",
  endDate: "End Date / Deadline",
  governingLaw: "Governing Law",
};

const MULTILINE_KEYS: (keyof ContractVariables)[] = ["projectScope", "deliverables"];
const DATE_KEYS: (keyof ContractVariables)[] = ["startDate", "endDate"];

export default function ContractsPage() {
  const [contracts, setContracts] = useLocalStorage<Contract[]>("contracts", []);
  const [view, setView] = useState<"list" | "template-pick" | "form">("list");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [variables, setVariables] = useState<ContractVariables>(EMPTY_VARS());
  const [contractStatus, setContractStatus] = useState<ContractStatus>("draft");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const renderedPreview = useMemo(() => {
    if (!selectedTemplate) return "";
    return applyVariables(selectedTemplate.body, variables);
  }, [selectedTemplate, variables]);

  function pickTemplate(template: Template) {
    setSelectedTemplate(template);
    setVariables(EMPTY_VARS());
    setContractStatus("draft");
    setEditingId(null);
    setView("form");
  }

  function startEdit(contract: Contract) {
    const tmpl = TEMPLATES.find((t) => t.id === contract.templateId);
    if (!tmpl) return;
    setSelectedTemplate(tmpl);
    setVariables(contract.variables);
    setContractStatus(contract.status);
    setEditingId(contract.id);
    setView("form");
  }

  function handleSave() {
    if (!selectedTemplate || !variables.clientName.trim()) return;
    if (editingId) {
      setContracts((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, variables, status: contractStatus, title: `${selectedTemplate.name} – ${variables.clientName}` }
            : c
        )
      );
    } else {
      setContracts((prev) => [
        {
          id: generateId(),
          title: `${selectedTemplate.name} – ${variables.clientName}`,
          templateId: selectedTemplate.id,
          variables,
          status: contractStatus,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    setView("list");
    setEditingId(null);
    setSelectedTemplate(null);
  }

  function handleDelete(id: string) {
    setContracts((prev) => prev.filter((c) => c.id !== id));
    if (previewId === id) setPreviewId(null);
  }

  function updateStatus(id: string, status: ContractStatus) {
    setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  // Template Pick View
  if (view === "template-pick") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView("list")}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h2 className="text-xl font-bold">Choose a Template</h2>
            <p className="text-sm text-muted-foreground">Select a contract template to get started</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEMPLATES.map((template) => (
            <Card
              key={template.id}
              className="border-border/50 hover:border-violet-500/50 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => pickTemplate(template)}
            >
              <CardContent className="p-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center mb-4 group-hover:from-violet-500/20 group-hover:to-pink-500/20 transition-colors">
                  <template.icon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="font-semibold mb-2">{template.name}</h3>
                <p className="text-sm text-muted-foreground">{template.description}</p>
                <Button
                  className="w-full mt-4 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0"
                  size="sm"
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Form View
  if (view === "form" && selectedTemplate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setView("list")}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <h2 className="text-xl font-bold">{selectedTemplate.name}</h2>
              <p className="text-sm text-muted-foreground">Fill in the details to generate your contract</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview((p) => !p)}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              {showPreview ? "Hide" : "Preview"}
            </Button>
          </div>
        </div>

        <div className={`grid gap-6 ${showPreview ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1 max-w-2xl"}`}>
          {/* Variables Form */}
          <div className="space-y-5">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Parties</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {(["freelancerName", "freelancerEmail", "clientName", "clientEmail"] as (keyof ContractVariables)[]).map((key) => (
                  <div key={key} className="space-y-1.5">
                    <Label>{VAR_LABELS[key]}</Label>
                    <Input
                      type={key.includes("Email") ? "email" : "text"}
                      value={variables[key]}
                      onChange={(e) => setVariables((v) => ({ ...v, [key]: e.target.value }))}
                      placeholder={VAR_LABELS[key]}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(["projectScope", "deliverables"] as (keyof ContractVariables)[]).map((key) => (
                  <div key={key} className="space-y-1.5">
                    <Label>{VAR_LABELS[key]}</Label>
                    <Textarea
                      rows={3}
                      value={variables[key]}
                      onChange={(e) => setVariables((v) => ({ ...v, [key]: e.target.value }))}
                      placeholder={`Describe ${VAR_LABELS[key].toLowerCase()}...`}
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <Label>{VAR_LABELS.timeline}</Label>
                  <Input
                    value={variables.timeline}
                    onChange={(e) => setVariables((v) => ({ ...v, timeline: e.target.value }))}
                    placeholder="e.g. 4-6 weeks"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Payment & Dates</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{VAR_LABELS.paymentAmount}</Label>
                  <Input
                    value={variables.paymentAmount}
                    onChange={(e) => setVariables((v) => ({ ...v, paymentAmount: e.target.value }))}
                    placeholder="e.g. $1,500 USD"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{VAR_LABELS.governingLaw}</Label>
                  <Input
                    value={variables.governingLaw}
                    onChange={(e) => setVariables((v) => ({ ...v, governingLaw: e.target.value }))}
                    placeholder="e.g. California, USA"
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>{VAR_LABELS.paymentTerms}</Label>
                  <Input
                    value={variables.paymentTerms}
                    onChange={(e) => setVariables((v) => ({ ...v, paymentTerms: e.target.value }))}
                    placeholder="e.g. 50% upfront, 50% on completion"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{VAR_LABELS.startDate}</Label>
                  <Input
                    type="date"
                    value={variables.startDate}
                    onChange={(e) => setVariables((v) => ({ ...v, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{VAR_LABELS.endDate}</Label>
                  <Input
                    type="date"
                    value={variables.endDate}
                    onChange={(e) => setVariables((v) => ({ ...v, endDate: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-4">
                <div className="space-y-1.5">
                  <Label>Contract Status</Label>
                  <Select value={contractStatus} onValueChange={(v) => setContractStatus(v as ContractStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="signed">Signed</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setView("list")}>Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={!variables.clientName.trim()}
                className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0"
              >
                {editingId ? "Save Changes" : "Save Contract"}
              </Button>
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Live Preview</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(renderedPreview)}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Copy Text
                </Button>
              </div>
              <div className="sticky top-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
                <div className="bg-white dark:bg-slate-950 rounded-xl border border-border/50 p-8">
                  <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 mb-6" />
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                    {renderedPreview}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Contract Generator"
          description="Create and manage professional freelance contracts from proven templates"
          icon={FileSignature}
          badge="Generator"
          replaces="DocuSign / HelloSign"
        />
        <Button
          onClick={() => setView("template-pick")}
          className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0"
        >
          <Plus className="h-4 w-4 mr-2" /> New Contract
        </Button>
      </div>

      {/* Status stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(["draft", "sent", "signed", "expired"] as ContractStatus[]).map((status) => {
          const count = contracts.filter((c) => c.status === status).length;
          const cfg = STATUS_CONFIG[status];
          const icons: Record<ContractStatus, React.ElementType> = {
            draft: Clock,
            sent: FileText,
            signed: CheckCircle,
            expired: FileSignature,
          };
          const Ico = icons[status];
          return (
            <Card key={status} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Ico className="h-4 w-4 text-muted-foreground" />
                  <Badge className={cfg.className}>{cfg.label}</Badge>
                </div>
                <p className="text-2xl font-bold">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Template Cards */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Available Templates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TEMPLATES.map((template) => (
            <Card
              key={template.id}
              className="border-border/40 hover:border-violet-500/40 transition-colors cursor-pointer group"
              onClick={() => pickTemplate(template)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center shrink-0 group-hover:from-violet-500/20 group-hover:to-pink-500/20 transition-colors">
                  <template.icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{template.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Saved Contracts */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Saved Contracts</h3>
        {contracts.length === 0 ? (
          <Card className="border-dashed border-border/60">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center mb-4">
                <FileSignature className="h-7 w-7 text-violet-400" />
              </div>
              <p className="font-medium text-muted-foreground mb-1">No contracts saved yet</p>
              <p className="text-sm text-muted-foreground/70">Choose a template above to create your first contract</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract) => {
              const cfg = STATUS_CONFIG[contract.status];
              const tmpl = TEMPLATES.find((t) => t.id === contract.templateId);
              const rendered = tmpl ? applyVariables(tmpl.body, contract.variables) : "";

              return (
                <Card key={contract.id} className="border-border/50 hover:border-violet-500/30 transition-colors group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold truncate">{contract.title}</span>
                          <Badge className={cfg.className}>{cfg.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {tmpl?.name} · Created {new Date(contract.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                          {contract.variables.paymentAmount && (
                            <span>Amount: <span className="font-medium text-foreground">{contract.variables.paymentAmount}</span></span>
                          )}
                          {contract.variables.startDate && (
                            <span>Start: {new Date(contract.variables.startDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Select value={contract.status} onValueChange={(v) => updateStatus(contract.id, v as ContractStatus)}>
                          <SelectTrigger className="h-8 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="signed">Signed</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPreviewId(previewId === contract.id ? null : contract.id)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => copyToClipboard(rendered)}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(contract)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(contract.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {previewId === contract.id && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="bg-muted/30 rounded-lg p-6 max-h-80 overflow-y-auto">
                          <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-foreground">
                            {rendered}
                          </pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
