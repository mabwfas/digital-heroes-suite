"use client";

import { useState } from "react";
import {
  Lock,
  Copy,
  Download,
  RefreshCw,
  Plus,
  Trash2,
  Save,
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

interface NdaConfig {
  disclosingParty: string;
  disclosingAddress: string;
  receivingParty: string;
  receivingAddress: string;
  mutual: boolean;
  duration: string;
  scope: string;
  exclusions: string;
  jurisdiction: string;
}

interface NdaTemplate {
  id: string;
  name: string;
  config: NdaConfig;
}

const DURATIONS = ["1 year", "2 years", "3 years", "5 years", "Indefinite"];

const DEFAULT_CONFIG: NdaConfig = {
  disclosingParty: "",
  disclosingAddress: "",
  receivingParty: "",
  receivingAddress: "",
  mutual: true,
  duration: "2 years",
  scope: "Business strategies, client lists, proprietary technology, financial information, and trade secrets",
  exclusions: "Information that is publicly available, independently developed, or lawfully obtained from a third party",
  jurisdiction: "State of Delaware, United States",
};

function generateNDA(c: NdaConfig): string {
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const type = c.mutual ? "MUTUAL" : "ONE-WAY";
  const dp = c.disclosingParty || "[Disclosing Party]";
  const rp = c.receivingParty || "[Receiving Party]";

  let doc = `${type} NON-DISCLOSURE AGREEMENT\n\nEffective Date: ${date}\n\n`;
  doc += `This Non-Disclosure Agreement ("Agreement") is entered into by and between:\n\n`;
  doc += `PARTY A (${c.mutual ? "First Party" : "Disclosing Party"}):\n${dp}\n${c.disclosingAddress || "[Address]"}\n\n`;
  doc += `PARTY B (${c.mutual ? "Second Party" : "Receiving Party"}):\n${rp}\n${c.receivingAddress || "[Address]"}\n\n`;

  doc += `RECITALS\n\nThe parties wish to explore a potential business relationship and, in connection therewith, may disclose to each other certain confidential and proprietary information. The parties agree to the following terms to protect such information.\n\n`;

  doc += `1. DEFINITION OF CONFIDENTIAL INFORMATION\n\n`;
  doc += `"Confidential Information" means any and all information or data disclosed by ${c.mutual ? "either party" : dp} to ${c.mutual ? "the other party" : rp}, whether orally, in writing, electronically, or by inspection, including but not limited to: ${c.scope || "[scope of confidential information]"}.\n\n`;

  doc += `2. OBLIGATIONS\n\n`;
  doc += `${c.mutual ? "Each party" : rp} agrees to:\n`;
  doc += `(a) Hold Confidential Information in strict confidence;\n`;
  doc += `(b) Not disclose Confidential Information to any third party without prior written consent;\n`;
  doc += `(c) Use Confidential Information solely for the purpose of evaluating the potential business relationship;\n`;
  doc += `(d) Protect Confidential Information using the same degree of care used to protect its own confidential information, but no less than reasonable care;\n`;
  doc += `(e) Limit access to Confidential Information to employees and agents who need to know and who are bound by similar confidentiality obligations.\n\n`;

  doc += `3. EXCLUSIONS\n\n`;
  doc += `Confidential Information does not include information that:\n`;
  doc += `(a) ${c.exclusions || "Is or becomes publicly available through no fault of the receiving party"};\n`;
  doc += `(b) Was known to the receiving party prior to disclosure;\n`;
  doc += `(c) Is independently developed by the receiving party without use of the Confidential Information;\n`;
  doc += `(d) Is required to be disclosed by law, regulation, or court order (provided the receiving party gives prompt notice).\n\n`;

  doc += `4. TERM\n\n`;
  doc += `This Agreement shall remain in effect for ${c.duration || "2 years"} from the Effective Date. The obligations of confidentiality shall survive termination of this Agreement for an additional period of two (2) years.\n\n`;

  doc += `5. RETURN OF MATERIALS\n\n`;
  doc += `Upon termination or upon request, ${c.mutual ? "each party" : rp} shall promptly return or destroy all Confidential Information and any copies thereof, and shall certify such return or destruction in writing.\n\n`;

  doc += `6. NO LICENSE\n\n`;
  doc += `Nothing in this Agreement grants any license or right under any patent, copyright, trademark, or other intellectual property right.\n\n`;

  doc += `7. REMEDIES\n\n`;
  doc += `The parties acknowledge that any breach of this Agreement may cause irreparable harm, and the non-breaching party shall be entitled to seek injunctive relief in addition to any other remedies available at law or in equity.\n\n`;

  doc += `8. GOVERNING LAW\n\n`;
  doc += `This Agreement shall be governed by the laws of the ${c.jurisdiction || "[Jurisdiction]"}.\n\n`;

  doc += `9. ENTIRE AGREEMENT\n\n`;
  doc += `This Agreement constitutes the entire agreement between the parties regarding the subject matter hereof and supersedes all prior negotiations, representations, or agreements.\n\n`;

  doc += `IN WITNESS WHEREOF, the parties have executed this Agreement as of the Effective Date.\n\n`;
  doc += `${dp}\nSignature: _____________________\nName: _____________________\nTitle: _____________________\nDate: _____________________\n\n`;
  doc += `${rp}\nSignature: _____________________\nName: _____________________\nTitle: _____________________\nDate: _____________________\n`;

  return doc;
}

export default function NdaGenPage() {
  const [config, setConfig, hydrated] = useLocalStorage<NdaConfig>("legal-nda-gen-config", DEFAULT_CONFIG);
  const [templates, setTemplates, hydrated2] = useLocalStorage<NdaTemplate[]>("legal-nda-gen-templates", []);
  const [generated, setGenerated] = useState("");
  const [copied, setCopied] = useState(false);
  const [templateName, setTemplateName] = useState("");

  function updateConfig<K extends keyof NdaConfig>(key: K, value: NdaConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function handleGenerate() {
    setGenerated(generateNDA(config));
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
    a.download = "nda.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function saveTemplate() {
    if (!templateName.trim()) return;
    setTemplates((prev) => [...prev, { id: generateId(), name: templateName.trim(), config: { ...config } }]);
    setTemplateName("");
  }

  function loadTemplate(t: NdaTemplate) {
    setConfig(t.config);
  }

  if (!hydrated || !hydrated2) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="NDA Generator"
        description="Generate mutual or one-way NDAs with customizable scope, duration, and exclusions. Save templates for reuse."
        icon={Lock}
        badge="Legal"
      />

      {templates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Saved Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <div key={t.id} className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => loadTemplate(t)}>
                    {t.name}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setTemplates((prev) => prev.filter((x) => x.id !== t.id))}>
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">NDA Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className={`text-xs ${config.mutual ? "border-violet-500 bg-violet-500/5 text-violet-600 font-semibold" : ""}`}
              onClick={() => updateConfig("mutual", true)}
            >
              Mutual NDA
            </Button>
            <Button
              variant="outline"
              className={`text-xs ${!config.mutual ? "border-violet-500 bg-violet-500/5 text-violet-600 font-semibold" : ""}`}
              onClick={() => updateConfig("mutual", false)}
            >
              One-Way NDA
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium">{config.mutual ? "Party A" : "Disclosing Party"}</h4>
              <div className="space-y-1.5">
                <Label className="text-xs">Name / Company</Label>
                <Input placeholder="Acme LLC" value={config.disclosingParty} onChange={(e) => updateConfig("disclosingParty", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Address</Label>
                <Input placeholder="123 Main St, City" value={config.disclosingAddress} onChange={(e) => updateConfig("disclosingAddress", e.target.value)} />
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-medium">{config.mutual ? "Party B" : "Receiving Party"}</h4>
              <div className="space-y-1.5">
                <Label className="text-xs">Name / Company</Label>
                <Input placeholder="Beta Inc" value={config.receivingParty} onChange={(e) => updateConfig("receivingParty", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Address</Label>
                <Input placeholder="456 Oak Ave, City" value={config.receivingAddress} onChange={(e) => updateConfig("receivingAddress", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Select value={config.duration} onValueChange={(v) => { if (v) updateConfig("duration", v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Jurisdiction</Label>
              <Input value={config.jurisdiction} onChange={(e) => updateConfig("jurisdiction", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Scope of Confidential Information</Label>
            <Textarea value={config.scope} onChange={(e) => updateConfig("scope", e.target.value)} className="min-h-[60px] text-sm" />
          </div>

          <div className="space-y-1.5">
            <Label>Exclusions</Label>
            <Textarea value={config.exclusions} onChange={(e) => updateConfig("exclusions", e.target.value)} className="min-h-[60px] text-sm" />
          </div>

          <div className="flex gap-2">
            <Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleGenerate}>
              <RefreshCw className="h-4 w-4" />
              Generate NDA
            </Button>
            <div className="flex gap-1 ml-auto">
              <Input placeholder="Template name" className="w-40 h-9 text-xs" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
              <Button variant="outline" size="sm" onClick={saveTemplate} disabled={!templateName.trim()}>
                <Save className="h-3 w-3" />
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {generated && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Generated NDA</CardTitle>
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
              className="min-h-[500px] font-mono text-xs"
              value={generated}
              onChange={(e) => setGenerated(e.target.value)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
