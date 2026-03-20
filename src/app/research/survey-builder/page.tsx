"use client";

import { useState, useMemo } from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Eye,
  BarChart3,
  Copy,
  X,
  Star,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type QuestionType = "text" | "rating" | "multiple-choice" | "yes-no";

interface Choice {
  id: string;
  text: string;
}

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  choices: Choice[];
}

interface Response {
  id: string;
  answers: Record<string, string | number>;
  submittedAt: string;
}

interface Survey {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  responses: Response[];
  createdAt: string;
}

export default function SurveyBuilderPage() {
  const [surveys, setSurveys] = useLocalStorage<Survey[]>("survey-builder-data", []);
  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showRespond, setShowRespond] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [currentAnswers, setCurrentAnswers] = useState<Record<string, string | number>>({});

  const activeSurvey = surveys.find((s) => s.id === activeSurveyId) ?? null;

  function createSurvey() {
    if (!newTitle.trim()) return;
    const survey: Survey = {
      id: generateId(),
      title: newTitle,
      description: newDesc,
      questions: [],
      responses: [],
      createdAt: new Date().toISOString(),
    };
    setSurveys((prev) => [survey, ...prev]);
    setActiveSurveyId(survey.id);
    setNewTitle("");
    setNewDesc("");
  }

  function updateSurvey(fn: (s: Survey) => Survey) {
    if (!activeSurveyId) return;
    setSurveys((prev) => prev.map((s) => (s.id === activeSurveyId ? fn(s) : s)));
  }

  function addQuestion(type: QuestionType) {
    const q: Question = {
      id: generateId(),
      type,
      text: "",
      required: false,
      choices: type === "multiple-choice" ? [{ id: generateId(), text: "" }, { id: generateId(), text: "" }] : [],
    };
    updateSurvey((s) => ({ ...s, questions: [...s.questions, q] }));
  }

  function updateQuestion(qId: string, updates: Partial<Question>) {
    updateSurvey((s) => ({
      ...s,
      questions: s.questions.map((q) => (q.id === qId ? { ...q, ...updates } : q)),
    }));
  }

  function removeQuestion(qId: string) {
    updateSurvey((s) => ({ ...s, questions: s.questions.filter((q) => q.id !== qId) }));
  }

  function moveQuestion(qId: string, dir: -1 | 1) {
    updateSurvey((s) => {
      const idx = s.questions.findIndex((q) => q.id === qId);
      if (idx < 0) return s;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= s.questions.length) return s;
      const qs = [...s.questions];
      [qs[idx], qs[newIdx]] = [qs[newIdx], qs[idx]];
      return { ...s, questions: qs };
    });
  }

  function addChoice(qId: string) {
    updateSurvey((s) => ({
      ...s,
      questions: s.questions.map((q) =>
        q.id === qId ? { ...q, choices: [...q.choices, { id: generateId(), text: "" }] } : q
      ),
    }));
  }

  function updateChoice(qId: string, cId: string, text: string) {
    updateSurvey((s) => ({
      ...s,
      questions: s.questions.map((q) =>
        q.id === qId
          ? { ...q, choices: q.choices.map((c) => (c.id === cId ? { ...c, text } : c)) }
          : q
      ),
    }));
  }

  function removeChoice(qId: string, cId: string) {
    updateSurvey((s) => ({
      ...s,
      questions: s.questions.map((q) =>
        q.id === qId ? { ...q, choices: q.choices.filter((c) => c.id !== cId) } : q
      ),
    }));
  }

  function submitResponse() {
    if (!activeSurvey) return;
    const resp: Response = {
      id: generateId(),
      answers: { ...currentAnswers },
      submittedAt: new Date().toISOString(),
    };
    updateSurvey((s) => ({ ...s, responses: [...s.responses, resp] }));
    setCurrentAnswers({});
    setShowRespond(false);
  }

  function deleteSurvey(id: string) {
    setSurveys((prev) => prev.filter((s) => s.id !== id));
    if (activeSurveyId === id) setActiveSurveyId(null);
  }

  const TYPE_LABELS: Record<QuestionType, string> = {
    text: "Text",
    rating: "Rating (1-5)",
    "multiple-choice": "Multiple Choice",
    "yes-no": "Yes / No",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Survey Builder"
        description="Create surveys, collect responses, and analyze results"
        icon={ClipboardList}
        badge="Research"
        replaces="Google Forms / Typeform"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">New Survey</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Survey title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <Input
                placeholder="Description (optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
              <Button
                onClick={createSurvey}
                disabled={!newTitle.trim()}
                className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0"
              >
                <Plus className="h-4 w-4 mr-2" /> Create Survey
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {surveys.map((s) => (
              <Card
                key={s.id}
                className={`cursor-pointer transition-colors ${activeSurveyId === s.id ? "border-violet-500/50 bg-violet-500/5" : "hover:border-violet-500/30"}`}
                onClick={() => setActiveSurveyId(s.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {s.questions.length} questions &middot; {s.responses.length} responses
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteSurvey(s.id); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {activeSurvey ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{activeSurvey.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                      <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setCurrentAnswers({}); setShowRespond(true); }}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Response
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowResults(true)} disabled={activeSurvey.responses.length === 0}>
                      <BarChart3 className="h-3.5 w-3.5 mr-1" /> Results
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(["text", "rating", "multiple-choice", "yes-no"] as QuestionType[]).map((t) => (
                    <Button key={t} variant="outline" size="sm" onClick={() => addQuestion(t)}>
                      <Plus className="h-3 w-3 mr-1" /> {TYPE_LABELS[t]}
                    </Button>
                  ))}
                </div>

                {activeSurvey.questions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Add questions using the buttons above
                  </p>
                ) : (
                  <div className="space-y-3">
                    {activeSurvey.questions.map((q, idx) => (
                      <Card key={q.id} className="border-border/50">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start gap-2">
                            <span className="text-xs text-muted-foreground mt-2 shrink-0">Q{idx + 1}</span>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Enter your question..."
                                  value={q.text}
                                  onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                                  className="flex-1"
                                />
                                <Badge variant="secondary" className="text-[10px] shrink-0">{TYPE_LABELS[q.type]}</Badge>
                              </div>
                              {q.type === "multiple-choice" && (
                                <div className="space-y-1.5 pl-2">
                                  {q.choices.map((c) => (
                                    <div key={c.id} className="flex items-center gap-2">
                                      <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                                      <Input
                                        placeholder="Choice..."
                                        value={c.text}
                                        onChange={(e) => updateChoice(q.id, c.id, e.target.value)}
                                        className="h-8 text-sm"
                                      />
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeChoice(q.id, c.id)}>
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => addChoice(q.id)}>
                                    <Plus className="h-3 w-3 mr-1" /> Add Choice
                                  </Button>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveQuestion(q.id, -1)} disabled={idx === 0}>
                                <ArrowUp className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveQuestion(q.id, 1)} disabled={idx === activeSurvey.questions.length - 1}>
                                <ArrowDown className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => removeQuestion(q.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-border/60">
              <CardContent className="flex items-center justify-center py-16">
                <p className="text-sm text-muted-foreground">Select or create a survey to get started</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Survey Preview</DialogTitle>
          </DialogHeader>
          {activeSurvey && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg">{activeSurvey.title}</h3>
              {activeSurvey.description && <p className="text-sm text-muted-foreground">{activeSurvey.description}</p>}
              {activeSurvey.questions.map((q, idx) => (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm font-medium">{idx + 1}. {q.text || "(No question text)"}</p>
                  {q.type === "text" && <Input disabled placeholder="Text answer..." />}
                  {q.type === "rating" && (
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className="h-5 w-5 text-muted-foreground/30" />
                      ))}
                    </div>
                  )}
                  {q.type === "multiple-choice" && (
                    <div className="space-y-1.5">
                      {q.choices.map((c) => (
                        <div key={c.id} className="flex items-center gap-2 text-sm">
                          <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30" />
                          {c.text || "(empty)"}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.type === "yes-no" && (
                    <div className="flex gap-3">
                      <Badge variant="secondary">Yes</Badge>
                      <Badge variant="secondary">No</Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Response Entry Dialog */}
      <Dialog open={showRespond} onOpenChange={setShowRespond}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enter Response</DialogTitle>
          </DialogHeader>
          {activeSurvey && (
            <div className="space-y-4">
              {activeSurvey.questions.map((q, idx) => (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm font-medium">{idx + 1}. {q.text || "(No question text)"}</p>
                  {q.type === "text" && (
                    <Input
                      placeholder="Answer..."
                      value={(currentAnswers[q.id] as string) ?? ""}
                      onChange={(e) => setCurrentAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    />
                  )}
                  {q.type === "rating" && (
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setCurrentAnswers((a) => ({ ...a, [q.id]: n }))}
                          className="p-0.5"
                        >
                          <Star
                            className={`h-6 w-6 ${(currentAnswers[q.id] as number) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                  {q.type === "multiple-choice" && (
                    <div className="space-y-1.5">
                      {q.choices.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setCurrentAnswers((a) => ({ ...a, [q.id]: c.text }))}
                          className={`flex items-center gap-2 w-full text-left text-sm p-2 rounded-md border transition-colors ${currentAnswers[q.id] === c.text ? "border-violet-500 bg-violet-500/5" : "border-border/50 hover:border-violet-500/30"}`}
                        >
                          <div className={`h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center ${currentAnswers[q.id] === c.text ? "border-violet-500 bg-violet-500" : "border-muted-foreground/30"}`}>
                            {currentAnswers[q.id] === c.text && <Check className="h-2 w-2 text-white" />}
                          </div>
                          {c.text || "(empty)"}
                        </button>
                      ))}
                    </div>
                  )}
                  {q.type === "yes-no" && (
                    <div className="flex gap-2">
                      {["Yes", "No"].map((opt) => (
                        <Button
                          key={opt}
                          variant={currentAnswers[q.id] === opt ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentAnswers((a) => ({ ...a, [q.id]: opt }))}
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <Button
                onClick={submitResponse}
                className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0"
              >
                Submit Response
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Survey Results ({activeSurvey?.responses.length ?? 0} responses)</DialogTitle>
          </DialogHeader>
          {activeSurvey && (
            <div className="space-y-6">
              {activeSurvey.questions.map((q, idx) => {
                const answers = activeSurvey.responses.map((r) => r.answers[q.id]).filter(Boolean);
                return (
                  <div key={q.id} className="space-y-2">
                    <p className="text-sm font-medium">{idx + 1}. {q.text}</p>
                    {q.type === "rating" && answers.length > 0 && (
                      <div>
                        <p className="text-2xl font-bold">
                          {(answers.reduce((s: number, a: string | number) => s + Number(a), 0 as number) / answers.length).toFixed(1)}
                        </p>
                        <p className="text-xs text-muted-foreground">average rating</p>
                        <div className="flex gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map((n) => {
                            const count = answers.filter((a) => Number(a) === n).length;
                            const pct = answers.length > 0 ? (count / answers.length) * 100 : 0;
                            return (
                              <div key={n} className="flex-1">
                                <div className="h-16 bg-muted rounded-sm relative overflow-hidden">
                                  <div
                                    className="absolute bottom-0 w-full bg-violet-500/60 rounded-sm transition-all"
                                    style={{ height: `${pct}%` }}
                                  />
                                </div>
                                <p className="text-xs text-center mt-1">{n}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {(q.type === "multiple-choice" || q.type === "yes-no") && (
                      <div className="space-y-1">
                        {(q.type === "yes-no" ? ["Yes", "No"] : q.choices.map((c) => c.text)).map((opt) => {
                          const count = answers.filter((a) => a === opt).length;
                          const pct = answers.length > 0 ? (count / answers.length) * 100 : 0;
                          return (
                            <div key={opt} className="flex items-center gap-3">
                              <span className="text-xs w-20 truncate">{opt}</span>
                              <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
                                <div
                                  className="h-full bg-violet-500/60 rounded-sm transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-12 text-right">{pct.toFixed(0)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {q.type === "text" && (
                      <div className="space-y-1">
                        {answers.map((a, i) => (
                          <p key={i} className="text-xs bg-muted/50 rounded-md px-3 py-1.5">{String(a)}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
