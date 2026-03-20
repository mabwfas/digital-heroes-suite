"use client";

import { useState, useCallback } from "react";
import {
  FileEdit,
  Copy,
  Save,
  RefreshCw,
  Trash2,
  BookOpen,
  X,
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

type Tone = "professional" | "friendly" | "confident";

interface Proposal {
  id: string;
  jobTitle: string;
  tone: Tone;
  introHook: string;
  relevantExperience: string;
  approach: string;
  timeline: string;
  pricing: string;
  cta: string;
  createdAt: string;
}

const HOOKS: Record<Tone, string[]> = {
  professional: [
    "Thank you for sharing the details of your project. After carefully reviewing your requirements, I am confident that my expertise aligns perfectly with your needs.",
    "I appreciate the opportunity to discuss your project. Having reviewed the scope in detail, I would like to present a tailored approach for your consideration.",
    "Your project requirements are well-defined, and I have extensive experience delivering similar results. Allow me to outline how I can add value.",
  ],
  friendly: [
    "Hey! I just read through your project details and I am really excited about this — it is right in my wheelhouse!",
    "Hi there! Your project caught my eye because it is exactly the kind of work I love doing. Let me tell you why I would be a great fit!",
    "I love what you are building! After going through your brief, I have some great ideas on how to make this even better than you imagined.",
  ],
  confident: [
    "I have delivered exactly this type of project multiple times with outstanding results. Here is why I am the right person for the job.",
    "Looking at your project, I can already see several ways to exceed your expectations. My track record speaks for itself.",
    "This project needs someone who can deliver fast without compromising quality. That is precisely what I do best.",
  ],
};

const EXPERIENCE_TEMPLATES: Record<Tone, string[]> = {
  professional: [
    "Over the past several years, I have successfully completed numerous projects of similar scope. My portfolio includes work with established brands, and I consistently deliver results that exceed client expectations.",
    "My background includes extensive experience in this specific area. I have worked with clients ranging from startups to enterprise organizations, all with measurable success.",
  ],
  friendly: [
    "I have been doing this kind of work for years and absolutely love it! Some of my favorite projects have been very similar to yours, and the results were awesome.",
    "I have helped tons of happy clients with projects just like this. Check out my portfolio — you will see some really cool examples!",
  ],
  confident: [
    "My portfolio demonstrates consistent excellence in this exact area. I have delivered exceptional results for demanding clients and I will do the same for you.",
    "I bring proven expertise backed by measurable outcomes. Every project I take on receives my full commitment to excellence.",
  ],
};

const APPROACH_TEMPLATES: Record<Tone, string[]> = {
  professional: [
    "My approach follows a structured methodology: discovery, planning, execution, and refinement. I will begin with a thorough analysis of your requirements, develop a strategic plan, and keep you informed at every milestone.",
    "I employ an iterative process that ensures alignment with your vision at every stage. Regular check-ins and deliverable reviews will keep the project on track.",
  ],
  friendly: [
    "Here is how I would tackle this: First, we will have a quick chat to make sure I fully get your vision. Then I will dive in and start creating, sending you updates along the way so we stay on the same page!",
    "My process is simple and stress-free: we chat, I create, you review, we refine. I am big on communication, so you will always know where things stand!",
  ],
  confident: [
    "My proven process eliminates guesswork: strategic analysis, rapid execution, iterative refinement. You will see tangible progress within the first 48 hours.",
    "I work fast and smart. Expect a detailed plan within 24 hours, first deliverables within the week, and a polished final product ahead of schedule.",
  ],
};

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function generateProposal(jobPost: string, tone: Tone): Omit<Proposal, "id" | "createdAt"> {
  const words = jobPost.split(/\s+/).slice(0, 5).join(" ");
  const jobTitle = words || "Your Project";
  return {
    jobTitle,
    tone,
    introHook: pick(HOOKS[tone]),
    relevantExperience: pick(EXPERIENCE_TEMPLATES[tone]),
    approach: pick(APPROACH_TEMPLATES[tone]),
    timeline: tone === "confident" ? "I can have the first deliverables ready within 3-5 business days, with the full project completed within 2 weeks." : tone === "friendly" ? "I am thinking we could wrap this up in about 2-3 weeks — but I will give you a more exact timeline once we chat!" : "Based on the project scope, I estimate a timeline of 2-3 weeks for complete delivery, with key milestones at regular intervals.",
    pricing: tone === "confident" ? "My rate reflects the quality and speed I deliver. I am happy to discuss a package that works for your budget while ensuring premium results." : tone === "friendly" ? "I would love to work within your budget! Let us chat about what makes sense for both of us." : "I will provide a detailed quote based on our initial discussion. My pricing is competitive and transparent, with no hidden costs.",
    cta: tone === "confident" ? "Let us get started. Send me a message and I will have a detailed plan ready for you within 24 hours." : tone === "friendly" ? "I would love to chat more about this! Drop me a message and we can figure out the best way forward together." : "I welcome the opportunity to discuss this project further. Please feel free to reach out at your convenience to schedule a brief consultation.",
  };
}

export default function ProposalEnginePage() {
  const [jobPost, setJobPost] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [currentProposal, setCurrentProposal] = useState<Proposal | null>(null);
  const [savedProposals, setSavedProposals, hydrated] = useLocalStorage<Proposal[]>("sales-proposals", []);
  const [copied, setCopied] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  const handleGenerate = useCallback(() => {
    if (!jobPost.trim()) return;
    const raw = generateProposal(jobPost.trim(), tone);
    setCurrentProposal({ ...raw, id: generateId(), createdAt: new Date().toISOString() });
    setCopied(false);
  }, [jobPost, tone]);

  const proposalToText = useCallback((p: Proposal) => {
    return `${p.introHook}\n\n${p.relevantExperience}\n\n${p.approach}\n\nTimeline: ${p.timeline}\n\nPricing: ${p.pricing}\n\n${p.cta}`;
  }, []);

  const handleCopy = useCallback(() => {
    if (!currentProposal) return;
    navigator.clipboard.writeText(proposalToText(currentProposal));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentProposal, proposalToText]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Proposal Engine" description="Generate tailored proposals from job posts with adjustable tone." icon={FileEdit} badge="Sales" actions={
        <Button variant="outline" size="sm" onClick={() => setShowLibrary(!showLibrary)}><BookOpen className="h-4 w-4" />Saved ({savedProposals.length})</Button>
      } />

      {showLibrary ? (
        <Card>
          <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base">Saved Proposals</CardTitle><Button variant="ghost" size="icon" onClick={() => setShowLibrary(false)}><X className="h-4 w-4" /></Button></div></CardHeader>
          <CardContent>{savedProposals.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No saved proposals.</p> : <div className="space-y-2">{savedProposals.map((p) => (<div key={p.id} className="rounded-lg border p-3 hover:bg-muted/50 transition-colors"><div className="flex items-start justify-between gap-2"><div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{p.jobTitle}</p><div className="flex gap-2 mt-1"><Badge variant="secondary" className="text-[10px]">{p.tone}</Badge><span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span></div></div><div className="flex gap-1 shrink-0"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setCurrentProposal(p); setShowLibrary(false); }}><FileEdit className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { navigator.clipboard.writeText(proposalToText(p)); }}><Copy className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSavedProposals((prev) => prev.filter((x) => x.id !== p.id))}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button></div></div></div>))}</div>}</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Input</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5"><Label>Job Post / Project Description <span className="text-red-500">*</span></Label><Textarea value={jobPost} onChange={(e) => setJobPost(e.target.value)} placeholder="Paste the job post or describe the project..." rows={6} /></div>
                <div className="space-y-1.5">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={(v) => { if (v) setTone(v as Tone); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="professional">Professional</SelectItem><SelectItem value="friendly">Friendly</SelectItem><SelectItem value="confident">Confident</SelectItem></SelectContent></Select>
                </div>
                <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleGenerate} disabled={!jobPost.trim()}><RefreshCw className="h-4 w-4" />Generate Proposal</Button>
              </CardContent>
            </Card>
            {currentProposal && (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" size="sm" onClick={handleCopy}><Copy className="h-3.5 w-3.5" />{copied ? "Copied!" : "Copy"}</Button>
                <Button className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" size="sm" onClick={() => { if (currentProposal) setSavedProposals((prev) => [currentProposal, ...prev]); }}><Save className="h-3.5 w-3.5" />Save</Button>
              </div>
            )}
          </div>
          <div className="lg:col-span-2">
            {currentProposal ? (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Generated Proposal</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Introduction Hook", text: currentProposal.introHook },
                    { label: "Relevant Experience", text: currentProposal.relevantExperience },
                    { label: "Approach", text: currentProposal.approach },
                    { label: "Timeline", text: currentProposal.timeline },
                    { label: "Pricing", text: currentProposal.pricing },
                    { label: "Call to Action", text: currentProposal.cta },
                  ].map((section) => (
                    <div key={section.label}>
                      <h3 className="text-sm font-semibold mb-1.5">{section.label}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3">{section.text}</p>
                    </div>
                  ))}
                  <div className="flex gap-2"><Badge variant="secondary" className="text-xs">{currentProposal.tone}</Badge></div>
                </CardContent>
              </Card>
            ) : (
              <Card><CardContent className="py-16 text-center"><FileEdit className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" /><p className="text-sm text-muted-foreground">Paste a job post and select your tone to generate a tailored proposal.</p></CardContent></Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
