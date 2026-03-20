"use client";

import { useState, useMemo } from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronLeft,
  Save,
  FileText,
  Check,
  Building2,
  Palette,
  Target,
  Calendar,
  Copy,
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

interface OnboardingDraft {
  id: string;
  clientName: string;
  businessName: string;
  industry: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  fonts: string;
  brandNotes: string;
  projectType: string;
  projectDescription: string;
  goals: string;
  targetAudience: string;
  budget: string;
  preferredStart: string;
  deadline: string;
  milestones: string;
  communicationPreference: string;
  currentStep: number;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

const STEPS = [
  { label: "Business Info", icon: Building2 },
  { label: "Brand Assets", icon: Palette },
  { label: "Project Scope", icon: Target },
  { label: "Timeline", icon: Calendar },
];

const EMPTY_DRAFT = (): Omit<OnboardingDraft, "id" | "createdAt" | "updatedAt"> => ({
  clientName: "",
  businessName: "",
  industry: "",
  website: "",
  contactEmail: "",
  contactPhone: "",
  logoUrl: "",
  primaryColor: "#6d28d9",
  secondaryColor: "#ec4899",
  fonts: "",
  brandNotes: "",
  projectType: "",
  projectDescription: "",
  goals: "",
  targetAudience: "",
  budget: "",
  preferredStart: "",
  deadline: "",
  milestones: "",
  communicationPreference: "email",
  currentStep: 0,
  completed: false,
});

function getCompletion(draft: OnboardingDraft): number {
  const fields: (keyof OnboardingDraft)[] = [
    "clientName", "businessName", "industry", "contactEmail",
    "logoUrl", "primaryColor", "fonts",
    "projectType", "projectDescription", "goals",
    "preferredStart", "deadline",
  ];
  const filled = fields.filter((f) => {
    const v = draft[f];
    return typeof v === "string" && v.trim().length > 0;
  }).length;
  return Math.round((filled / fields.length) * 100);
}

export default function OnboardingPortalPage() {
  const [drafts, setDrafts] = useLocalStorage<OnboardingDraft[]>("client-onboarding-drafts", []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const activeDraft = useMemo(() => drafts.find((d) => d.id === activeId) ?? null, [drafts, activeId]);

  function createNew() {
    const now = new Date().toISOString();
    const newDraft: OnboardingDraft = {
      ...EMPTY_DRAFT(),
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    setDrafts((prev) => [newDraft, ...prev]);
    setActiveId(newDraft.id);
    setShowSummary(false);
  }

  function updateDraft(updates: Partial<OnboardingDraft>) {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === activeId ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
      )
    );
  }

  function deleteDraft(id: string) {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    if (activeId === id) setActiveId(null);
  }

  function nextStep() {
    if (!activeDraft || activeDraft.currentStep >= 3) return;
    updateDraft({ currentStep: activeDraft.currentStep + 1 });
  }

  function prevStep() {
    if (!activeDraft || activeDraft.currentStep <= 0) return;
    updateDraft({ currentStep: activeDraft.currentStep - 1 });
  }

  function markComplete() {
    updateDraft({ completed: true });
    setShowSummary(true);
  }

  function generateSummaryText(d: OnboardingDraft): string {
    return `CLIENT ONBOARDING SUMMARY
========================
Client: ${d.clientName}
Business: ${d.businessName}
Industry: ${d.industry}
Website: ${d.website}
Contact: ${d.contactEmail} | ${d.contactPhone}

BRAND ASSETS
Logo: ${d.logoUrl || "Not provided"}
Primary Color: ${d.primaryColor}
Secondary Color: ${d.secondaryColor}
Fonts: ${d.fonts || "Not specified"}
Brand Notes: ${d.brandNotes || "None"}

PROJECT SCOPE
Type: ${d.projectType}
Description: ${d.projectDescription}
Goals: ${d.goals}
Target Audience: ${d.targetAudience}
Budget: ${d.budget}

TIMELINE
Preferred Start: ${d.preferredStart}
Deadline: ${d.deadline}
Milestones: ${d.milestones || "Not defined"}
Communication: ${d.communicationPreference}

Generated: ${new Date().toLocaleDateString()}`;
  }

  function copySummary() {
    if (!activeDraft) return;
    navigator.clipboard.writeText(generateSummaryText(activeDraft));
  }

  // Form view
  if (activeId && activeDraft) {
    const completion = getCompletion(activeDraft);
    const step = activeDraft.currentStep;

    if (showSummary) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setActiveId(null); setShowSummary(false); }}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <h2 className="text-xl font-bold">Onboarding Summary</h2>
              <p className="text-sm text-muted-foreground">{activeDraft.clientName} - {activeDraft.businessName}</p>
            </div>
          </div>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex justify-end mb-4">
                <Button variant="outline" size="sm" onClick={copySummary}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Summary
                </Button>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground bg-muted/30 rounded-lg p-6">
                {generateSummaryText(activeDraft)}
              </pre>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setActiveId(null)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <h2 className="text-xl font-bold">{activeDraft.clientName || "New Client Onboarding"}</h2>
              <p className="text-sm text-muted-foreground">Step {step + 1} of 4 - {STEPS[step].label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeDraft.completed && (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-0">Completed</Badge>
            )}
            <Badge variant="outline">{completion}% complete</Badge>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const StepIcon = s.icon;
            const isActive = i === step;
            const isDone = i < step || activeDraft.completed;
            return (
              <div key={s.label} className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => updateDraft({ currentStep: i })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full ${
                    isActive
                      ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                      : isDone
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {isDone && !isActive ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <Card className="border-border/50">
          <CardContent className="p-6 space-y-4">
            {step === 0 && (
              <>
                <CardTitle className="text-base mb-4">Business Information</CardTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Client Name *</Label>
                    <Input value={activeDraft.clientName} onChange={(e) => updateDraft({ clientName: e.target.value })} placeholder="Full name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Business Name *</Label>
                    <Input value={activeDraft.businessName} onChange={(e) => updateDraft({ businessName: e.target.value })} placeholder="Business name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Industry *</Label>
                    <Input value={activeDraft.industry} onChange={(e) => updateDraft({ industry: e.target.value })} placeholder="e.g. E-commerce, SaaS" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Website</Label>
                    <Input value={activeDraft.website} onChange={(e) => updateDraft({ website: e.target.value })} placeholder="https://" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email *</Label>
                    <Input type="email" value={activeDraft.contactEmail} onChange={(e) => updateDraft({ contactEmail: e.target.value })} placeholder="email@company.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={activeDraft.contactPhone} onChange={(e) => updateDraft({ contactPhone: e.target.value })} placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <CardTitle className="text-base mb-4">Brand Assets</CardTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <Label>Logo URL</Label>
                    <Input value={activeDraft.logoUrl} onChange={(e) => updateDraft({ logoUrl: e.target.value })} placeholder="https://example.com/logo.png" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={activeDraft.primaryColor} onChange={(e) => updateDraft({ primaryColor: e.target.value })} className="h-9 w-12 rounded cursor-pointer" />
                      <Input value={activeDraft.primaryColor} onChange={(e) => updateDraft({ primaryColor: e.target.value })} className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Secondary Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={activeDraft.secondaryColor} onChange={(e) => updateDraft({ secondaryColor: e.target.value })} className="h-9 w-12 rounded cursor-pointer" />
                      <Input value={activeDraft.secondaryColor} onChange={(e) => updateDraft({ secondaryColor: e.target.value })} className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Fonts</Label>
                    <Input value={activeDraft.fonts} onChange={(e) => updateDraft({ fonts: e.target.value })} placeholder="e.g. Inter for headings, Open Sans for body" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Brand Notes</Label>
                    <Textarea rows={3} value={activeDraft.brandNotes} onChange={(e) => updateDraft({ brandNotes: e.target.value })} placeholder="Any brand guidelines, dos and don'ts..." />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <CardTitle className="text-base mb-4">Project Scope</CardTitle>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Project Type *</Label>
                      <Input value={activeDraft.projectType} onChange={(e) => updateDraft({ projectType: e.target.value })} placeholder="e.g. Website Redesign, App Development" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Budget</Label>
                      <Input value={activeDraft.budget} onChange={(e) => updateDraft({ budget: e.target.value })} placeholder="e.g. $5,000 - $10,000" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Project Description *</Label>
                    <Textarea rows={3} value={activeDraft.projectDescription} onChange={(e) => updateDraft({ projectDescription: e.target.value })} placeholder="Detailed description of what needs to be built..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Goals *</Label>
                    <Textarea rows={2} value={activeDraft.goals} onChange={(e) => updateDraft({ goals: e.target.value })} placeholder="What does success look like for this project?" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Target Audience</Label>
                    <Input value={activeDraft.targetAudience} onChange={(e) => updateDraft({ targetAudience: e.target.value })} placeholder="Who is the end user?" />
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <CardTitle className="text-base mb-4">Timeline Preferences</CardTitle>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Preferred Start Date *</Label>
                    <Input type="date" value={activeDraft.preferredStart} onChange={(e) => updateDraft({ preferredStart: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Deadline *</Label>
                    <Input type="date" value={activeDraft.deadline} onChange={(e) => updateDraft({ deadline: e.target.value })} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Key Milestones</Label>
                    <Textarea rows={3} value={activeDraft.milestones} onChange={(e) => updateDraft({ milestones: e.target.value })} placeholder="List any important milestones or checkpoints..." />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Communication Preference</Label>
                    <div className="flex gap-2">
                      {["email", "slack", "phone", "zoom"].map((pref) => (
                        <Button
                          key={pref}
                          variant={activeDraft.communicationPreference === pref ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateDraft({ communicationPreference: pref })}
                          className={activeDraft.communicationPreference === pref ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0" : ""}
                        >
                          {pref.charAt(0).toUpperCase() + pref.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={step === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setActiveId(null)}>
              <Save className="h-4 w-4 mr-1" /> Save Draft
            </Button>
            {step < 3 ? (
              <Button onClick={nextStep} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={markComplete} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0">
                <Check className="h-4 w-4 mr-1" /> Complete & Generate Summary
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Onboarding Portal"
        description="Guide new clients through a structured onboarding process"
        icon={ClipboardList}
        badge="Onboarding"
        replaces="Typeform / Google Forms"
        actions={
          <Button onClick={createNew} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> New Onboarding
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Drafts", value: drafts.length, color: "text-violet-600 dark:text-violet-400" },
          { label: "In Progress", value: drafts.filter((d) => !d.completed).length, color: "text-amber-600 dark:text-amber-400" },
          { label: "Completed", value: drafts.filter((d) => d.completed).length, color: "text-emerald-600 dark:text-emerald-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {drafts.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center mb-4">
              <ClipboardList className="h-7 w-7 text-violet-400" />
            </div>
            <p className="font-medium text-muted-foreground mb-1">No onboarding drafts yet</p>
            <p className="text-sm text-muted-foreground/70">Start a new client onboarding to collect their info</p>
            <Button onClick={createNew} className="mt-4" variant="outline">
              <Plus className="h-4 w-4 mr-2" /> Start Onboarding
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {drafts.map((draft) => {
            const completion = getCompletion(draft);
            return (
              <Card key={draft.id} className="border-border/50 hover:border-violet-500/30 transition-colors group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold truncate">{draft.clientName || "Untitled Client"}</span>
                        {draft.businessName && <span className="text-sm text-muted-foreground">- {draft.businessName}</span>}
                        <Badge className={draft.completed ? "bg-emerald-500/10 text-emerald-600 border-0" : "bg-amber-500/10 text-amber-600 border-0"}>
                          {draft.completed ? "Completed" : `Step ${draft.currentStep + 1}/4`}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-xs">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all"
                            style={{ width: `${completion}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{completion}%</span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setActiveId(draft.id); setShowSummary(draft.completed); }}>
                        {draft.completed ? <FileText className="h-3.5 w-3.5" /> : <Edit2 className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => deleteDraft(draft.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
