"use client";

import { useState, useCallback } from "react";
import {
  Award,
  Copy,
  Save,
  RefreshCw,
  Trash2,
  BookOpen,
  X,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface CaseStudy {
  id: string;
  clientName: string;
  industry: string;
  challenge: string;
  solution: string;
  results: string;
  testimonialQuote: string;
  generatedTitle: string;
  generatedOverview: string;
  generatedChallenge: string;
  generatedSolution: string;
  generatedResults: string;
  generatedTestimonial: string;
  createdAt: string;
}

function generateCaseStudy(
  clientName: string,
  industry: string,
  challenge: string,
  solution: string,
  results: string,
  testimonialQuote: string
): Omit<CaseStudy, "id" | "createdAt"> {
  const titleTemplates = [
    `How ${clientName} Overcame ${challenge.split(" ").slice(0, 4).join(" ")} in the ${industry} Industry`,
    `${clientName} Case Study: Achieving ${results.split(" ").slice(0, 4).join(" ")} with a Strategic Approach`,
    `From Challenge to Success: ${clientName}'s ${industry} Transformation`,
  ];
  const generatedTitle = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];

  const generatedOverview = `${clientName}, a company in the ${industry} industry, faced significant challenges that were impacting their growth and operational efficiency. Through a strategic partnership and the implementation of targeted solutions, they achieved remarkable results that exceeded their initial expectations. This case study explores their journey from problem identification to measurable success.`;

  const generatedChallenge = `${clientName} was experiencing a critical business challenge: ${challenge}. This issue was not only affecting their day-to-day operations but also hindering their ability to compete effectively in the ${industry} market. Without a clear path forward, the team needed an innovative approach that could deliver measurable improvements within a reasonable timeframe.`;

  const generatedSolution = `After a thorough analysis of ${clientName}'s situation, we implemented a comprehensive solution: ${solution}. This approach was specifically tailored to address the unique needs of their ${industry} business. The implementation was carried out in phases, ensuring minimal disruption to ongoing operations while maximizing the impact of each strategic initiative.`;

  const generatedResults = `The results speak for themselves: ${results}. These outcomes represent a significant improvement over ${clientName}'s previous performance metrics. The success of this engagement demonstrates the effectiveness of a strategic, data-driven approach to solving complex ${industry} challenges. The improvements have been sustained over time, providing ongoing value to the organization.`;

  const generatedTestimonial = testimonialQuote
    ? `"${testimonialQuote}" — ${clientName} Team`
    : `The ${clientName} team has expressed strong satisfaction with the outcomes achieved through this partnership, noting that the results have exceeded their initial projections.`;

  return {
    clientName,
    industry,
    challenge,
    solution,
    results,
    testimonialQuote,
    generatedTitle,
    generatedOverview,
    generatedChallenge,
    generatedSolution,
    generatedResults,
    generatedTestimonial,
  };
}

export default function CaseStudyPage() {
  const [clientName, setClientName] = useState("");
  const [industry, setIndustry] = useState("");
  const [challenge, setChallenge] = useState("");
  const [solution, setSolution] = useState("");
  const [results, setResults] = useState("");
  const [testimonialQuote, setTestimonialQuote] = useState("");
  const [currentStudy, setCurrentStudy] = useState<CaseStudy | null>(null);
  const [savedStudies, setSavedStudies, hydrated] = useLocalStorage<CaseStudy[]>("sales-case-studies", []);
  const [copied, setCopied] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  const handleGenerate = useCallback(() => {
    if (!clientName.trim() || !challenge.trim() || !solution.trim() || !results.trim()) return;
    const raw = generateCaseStudy(clientName.trim(), industry.trim(), challenge.trim(), solution.trim(), results.trim(), testimonialQuote.trim());
    setCurrentStudy({ ...raw, id: generateId(), createdAt: new Date().toISOString() });
    setCopied(false);
  }, [clientName, industry, challenge, solution, results, testimonialQuote]);

  const studyToText = useCallback((s: CaseStudy) => {
    let text = `# ${s.generatedTitle}\n\n`;
    text += `## Overview\n${s.generatedOverview}\n\n`;
    text += `## The Challenge\n${s.generatedChallenge}\n\n`;
    text += `## The Solution\n${s.generatedSolution}\n\n`;
    text += `## Results\n${s.generatedResults}\n\n`;
    text += `## Testimonial\n${s.generatedTestimonial}\n`;
    return text;
  }, []);

  const handleCopy = useCallback(() => {
    if (!currentStudy) return;
    navigator.clipboard.writeText(studyToText(currentStudy));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentStudy, studyToText]);

  const handleSave = useCallback(() => {
    if (!currentStudy) return;
    setSavedStudies((prev) => [currentStudy, ...prev]);
  }, [currentStudy, setSavedStudies]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Case Study Generator" description="Generate professional case studies from client project details." icon={Award} badge="Sales" actions={
        <Button variant="outline" size="sm" onClick={() => setShowLibrary(!showLibrary)}><BookOpen className="h-4 w-4" />Portfolio ({savedStudies.length})</Button>
      } />

      {showLibrary ? (
        <Card>
          <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base">Case Study Portfolio</CardTitle><Button variant="ghost" size="icon" onClick={() => setShowLibrary(false)}><X className="h-4 w-4" /></Button></div></CardHeader>
          <CardContent>{savedStudies.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No saved case studies.</p> : <div className="space-y-2">{savedStudies.map((s) => (<div key={s.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"><div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{s.generatedTitle}</p><div className="flex gap-2 mt-1"><Badge variant="secondary" className="text-[10px]">{s.clientName}</Badge><Badge variant="secondary" className="text-[10px]">{s.industry}</Badge><span className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</span></div></div><div className="flex gap-1 shrink-0"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setCurrentStudy(s); setShowLibrary(false); }}><Award className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { navigator.clipboard.writeText(studyToText(s)); }}><Copy className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSavedStudies((prev) => prev.filter((x) => x.id !== s.id))}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button></div></div>))}</div>}</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Project Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Client Name *</Label><Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Acme Corp" /></div>
                  <div className="space-y-1.5"><Label>Industry</Label><Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="SaaS, E-commerce..." /></div>
                </div>
                <div className="space-y-1.5"><Label>Challenge *</Label><Textarea value={challenge} onChange={(e) => setChallenge(e.target.value)} placeholder="Describe the problem the client faced..." rows={3} /></div>
                <div className="space-y-1.5"><Label>Solution *</Label><Textarea value={solution} onChange={(e) => setSolution(e.target.value)} placeholder="Describe what you implemented..." rows={3} /></div>
                <div className="space-y-1.5"><Label>Results (metrics) *</Label><Textarea value={results} onChange={(e) => setResults(e.target.value)} placeholder="e.g., 40% increase in conversions, $50K revenue growth..." rows={2} /></div>
                <div className="space-y-1.5"><Label>Testimonial Quote</Label><Textarea value={testimonialQuote} onChange={(e) => setTestimonialQuote(e.target.value)} placeholder="Optional client quote..." rows={2} /></div>
                <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleGenerate} disabled={!clientName.trim() || !challenge.trim() || !solution.trim() || !results.trim()}><RefreshCw className="h-4 w-4" />Generate Case Study</Button>
              </CardContent>
            </Card>
            {currentStudy && (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" size="sm" onClick={handleCopy}><Copy className="h-3.5 w-3.5" />{copied ? "Copied!" : "Copy"}</Button>
                <Button className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" size="sm" onClick={handleSave}><Save className="h-3.5 w-3.5" />Save to Portfolio</Button>
              </div>
            )}
          </div>
          <div className="lg:col-span-2">
            {currentStudy ? (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Generated Case Study</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <div><h2 className="text-lg font-bold">{currentStudy.generatedTitle}</h2><div className="flex gap-2 mt-2"><Badge variant="secondary" className="text-xs">{currentStudy.clientName}</Badge><Badge variant="secondary" className="text-xs">{currentStudy.industry}</Badge></div></div>
                  <Separator />
                  {[
                    { label: "Overview", text: currentStudy.generatedOverview },
                    { label: "The Challenge", text: currentStudy.generatedChallenge },
                    { label: "The Solution", text: currentStudy.generatedSolution },
                    { label: "Results", text: currentStudy.generatedResults },
                    { label: "Testimonial", text: currentStudy.generatedTestimonial },
                  ].map((section) => (
                    <div key={section.label}>
                      <h3 className="text-sm font-semibold mb-1.5">{section.label}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3">{section.text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card><CardContent className="py-16 text-center"><Award className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" /><p className="text-sm text-muted-foreground">Fill in the project details and click Generate to create a professional case study.</p></CardContent></Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
