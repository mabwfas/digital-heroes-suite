"use client";

import { useState, useMemo } from "react";
import {
  ThumbsUp,
  Plus,
  Trash2,
  Search,
  TrendingUp,
  Smile,
  Meh,
  Frown,
  Calendar,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface NPSResponse {
  id: string;
  clientName: string;
  score: number;
  followUp: string;
  date: string;
}

interface NPSSurvey {
  id: string;
  title: string;
  question: string;
  followUpQuestion: string;
  responses: NPSResponse[];
  createdAt: string;
}

function getCategory(score: number): "promoter" | "passive" | "detractor" {
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
}

function getCategoryConfig(cat: "promoter" | "passive" | "detractor") {
  switch (cat) {
    case "promoter":
      return { label: "Promoter", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", icon: Smile };
    case "passive":
      return { label: "Passive", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", icon: Meh };
    case "detractor":
      return { label: "Detractor", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", icon: Frown };
  }
}

function calculateNPS(responses: NPSResponse[]): number | null {
  if (responses.length === 0) return null;
  const promoters = responses.filter((r) => r.score >= 9).length;
  const detractors = responses.filter((r) => r.score <= 6).length;
  return Math.round(((promoters - detractors) / responses.length) * 100);
}

export default function NPSPage() {
  const [surveys, setSurveys] = useLocalStorage<NPSSurvey[]>("client-nps-surveys", []);
  const [showSurveyForm, setShowSurveyForm] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Survey form state
  const [surveyTitle, setSurveyTitle] = useState("");
  const [surveyQuestion, setSurveyQuestion] = useState("How likely are you to recommend our services to a colleague?");
  const [surveyFollowUp, setSurveyFollowUp] = useState("What is the primary reason for your score?");

  // Response form state
  const [respClientName, setRespClientName] = useState("");
  const [respScore, setRespScore] = useState(8);
  const [respFollowUp, setRespFollowUp] = useState("");

  const allResponses = useMemo(() => surveys.flatMap((s) => s.responses), [surveys]);
  const overallNPS = useMemo(() => calculateNPS(allResponses), [allResponses]);

  const stats = useMemo(() => {
    const total = allResponses.length;
    const promoters = allResponses.filter((r) => r.score >= 9).length;
    const passives = allResponses.filter((r) => r.score >= 7 && r.score <= 8).length;
    const detractors = allResponses.filter((r) => r.score <= 6).length;
    return {
      total,
      promoters,
      passives,
      detractors,
      promoterPct: total > 0 ? Math.round((promoters / total) * 100) : 0,
      passivePct: total > 0 ? Math.round((passives / total) * 100) : 0,
      detractorPct: total > 0 ? Math.round((detractors / total) * 100) : 0,
    };
  }, [allResponses]);

  function createSurvey() {
    if (!surveyTitle.trim()) return;
    const survey: NPSSurvey = {
      id: generateId(),
      title: surveyTitle,
      question: surveyQuestion,
      followUpQuestion: surveyFollowUp,
      responses: [],
      createdAt: new Date().toISOString(),
    };
    setSurveys((prev) => [survey, ...prev]);
    setShowSurveyForm(false);
    setSurveyTitle("");
  }

  function addResponse() {
    if (!activeSurveyId || !respClientName.trim()) return;
    const response: NPSResponse = {
      id: generateId(),
      clientName: respClientName,
      score: respScore,
      followUp: respFollowUp,
      date: new Date().toISOString(),
    };
    setSurveys((prev) =>
      prev.map((s) =>
        s.id === activeSurveyId ? { ...s, responses: [response, ...s.responses] } : s
      )
    );
    setShowResponseForm(false);
    setRespClientName("");
    setRespScore(8);
    setRespFollowUp("");
  }

  function deleteResponse(surveyId: string, responseId: string) {
    setSurveys((prev) =>
      prev.map((s) =>
        s.id === surveyId ? { ...s, responses: s.responses.filter((r) => r.id !== responseId) } : s
      )
    );
  }

  function deleteSurvey(id: string) {
    setSurveys((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="NPS & Feedback Collector"
        description="Track Net Promoter Scores and collect client feedback"
        icon={ThumbsUp}
        badge="NPS"
        replaces="SurveyMonkey / Typeform"
        actions={
          <Button onClick={() => setShowSurveyForm(true)} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> New Survey
          </Button>
        }
      />

      {/* Overall NPS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-border/50 col-span-2 lg:col-span-1">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Overall NPS</p>
            <p className={`text-4xl font-bold ${overallNPS !== null && overallNPS >= 50 ? "text-emerald-600" : overallNPS !== null && overallNPS >= 0 ? "text-amber-600" : "text-red-600"}`}>
              {overallNPS !== null ? overallNPS : "--"}
            </p>
          </CardContent>
        </Card>
        {[
          { label: "Responses", value: stats.total, color: "text-violet-600 dark:text-violet-400" },
          { label: "Promoters", value: `${stats.promoters} (${stats.promoterPct}%)`, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Passives", value: `${stats.passives} (${stats.passivePct}%)`, color: "text-amber-600 dark:text-amber-400" },
          { label: "Detractors", value: `${stats.detractors} (${stats.detractorPct}%)`, color: "text-red-600 dark:text-red-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* NPS Score Bar */}
      {stats.total > 0 && (
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Score Distribution</p>
            <div className="flex h-6 rounded-full overflow-hidden">
              {stats.promoterPct > 0 && (
                <div className="bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold" style={{ width: `${stats.promoterPct}%` }}>
                  {stats.promoterPct}%
                </div>
              )}
              {stats.passivePct > 0 && (
                <div className="bg-amber-400 flex items-center justify-center text-white text-[10px] font-bold" style={{ width: `${stats.passivePct}%` }}>
                  {stats.passivePct}%
                </div>
              )}
              {stats.detractorPct > 0 && (
                <div className="bg-red-500 flex items-center justify-center text-white text-[10px] font-bold" style={{ width: `${stats.detractorPct}%` }}>
                  {stats.detractorPct}%
                </div>
              )}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-emerald-500" /> Promoters (9-10)</div>
              <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-amber-400" /> Passives (7-8)</div>
              <div className="flex items-center gap-1"><div className="h-2 w-2 rounded-full bg-red-500" /> Detractors (0-6)</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Surveys */}
      {surveys.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center mb-4">
              <ThumbsUp className="h-7 w-7 text-violet-400" />
            </div>
            <p className="font-medium text-muted-foreground mb-1">No surveys yet</p>
            <p className="text-sm text-muted-foreground/70">Create your first NPS survey to start collecting feedback</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {surveys.map((survey) => {
            const nps = calculateNPS(survey.responses);
            return (
              <Card key={survey.id} className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{survey.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{survey.question}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-violet-500/10 text-violet-600 border-0">
                        {survey.responses.length} responses
                      </Badge>
                      {nps !== null && (
                        <Badge className={nps >= 50 ? "bg-emerald-500/10 text-emerald-600 border-0" : nps >= 0 ? "bg-amber-500/10 text-amber-600 border-0" : "bg-red-500/10 text-red-600 border-0"}>
                          NPS: {nps}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setActiveSurveyId(survey.id); setShowResponseForm(true); }}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Response
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => deleteSurvey(survey.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {survey.responses.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No responses yet</p>
                  ) : (
                    <div className="space-y-2">
                      {survey.responses.map((resp) => {
                        const cat = getCategory(resp.score);
                        const cfg = getCategoryConfig(cat);
                        const CatIcon = cfg.icon;
                        return (
                          <div key={resp.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg group">
                            <div className={`h-8 w-8 rounded-full ${cfg.bg} flex items-center justify-center shrink-0`}>
                              <CatIcon className={`h-4 w-4 ${cfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{resp.clientName}</span>
                                <Badge className={`${cfg.bg} ${cfg.color} border-0 text-[10px]`}>{resp.score}/10 - {cfg.label}</Badge>
                                <span className="text-xs text-muted-foreground">{new Date(resp.date).toLocaleDateString()}</span>
                              </div>
                              {resp.followUp && <p className="text-xs text-muted-foreground mt-0.5 truncate">{resp.followUp}</p>}
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => deleteResponse(survey.id, resp.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Survey Dialog */}
      <Dialog open={showSurveyForm} onOpenChange={setShowSurveyForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create NPS Survey</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Survey Title *</Label>
              <Input value={surveyTitle} onChange={(e) => setSurveyTitle(e.target.value)} placeholder="Q1 2026 Client Satisfaction" />
            </div>
            <div className="space-y-1.5">
              <Label>NPS Question</Label>
              <Textarea rows={2} value={surveyQuestion} onChange={(e) => setSurveyQuestion(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Follow-up Question</Label>
              <Input value={surveyFollowUp} onChange={(e) => setSurveyFollowUp(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowSurveyForm(false)}>Cancel</Button>
            <Button onClick={createSurvey} disabled={!surveyTitle.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              Create Survey
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Response Dialog */}
      <Dialog open={showResponseForm} onOpenChange={setShowResponseForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Response</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Client Name *</Label>
              <Input value={respClientName} onChange={(e) => setRespClientName(e.target.value)} placeholder="Client name" />
            </div>
            <div className="space-y-2">
              <Label>NPS Score (0-10)</Label>
              <div className="flex gap-1">
                {Array.from({ length: 11 }, (_, i) => i).map((score) => {
                  const cat = getCategory(score);
                  const cfg = getCategoryConfig(cat);
                  return (
                    <button
                      key={score}
                      onClick={() => setRespScore(score)}
                      className={`flex-1 h-10 rounded text-sm font-bold transition-all ${
                        respScore === score
                          ? `${cfg.bg} ${cfg.color} ring-2 ring-offset-1 ${cat === "promoter" ? "ring-emerald-500" : cat === "passive" ? "ring-amber-400" : "ring-red-500"}`
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {score}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                <span>Not likely at all</span>
                <span>Extremely likely</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Follow-up Answer</Label>
              <Textarea rows={2} value={respFollowUp} onChange={(e) => setRespFollowUp(e.target.value)} placeholder="Why did you choose this score?" />
            </div>
            <div className="text-center">
              <Badge className={`${getCategoryConfig(getCategory(respScore)).bg} ${getCategoryConfig(getCategory(respScore)).color} border-0`}>
                {getCategoryConfig(getCategory(respScore)).label} ({respScore}/10)
              </Badge>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowResponseForm(false)}>Cancel</Button>
            <Button onClick={addResponse} disabled={!respClientName.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              Save Response
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
