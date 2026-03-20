"use client";

import { useState, useMemo } from "react";
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  CheckCircle2,
  Play,
  HelpCircle,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type Difficulty = "beginner" | "intermediate" | "advanced";
type LessonType = "reading" | "video-link" | "quiz";

interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  type: LessonType;
  quiz?: QuizQuestion[];
}

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: Difficulty;
  lessons: Lesson[];
  createdAt: string;
}

interface TraineeProgress {
  id: string;
  traineeName: string;
  moduleId: string;
  completedLessons: string[];
  quizScores: Record<string, number>;
  startedAt: string;
}

const DIFF_COLORS: Record<Difficulty, string> = {
  beginner: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0",
  intermediate: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0",
  advanced: "bg-red-500/10 text-red-600 dark:text-red-400 border-0",
};

export default function TrainingPage() {
  const [modules, setModules, hydrated] = useLocalStorage<TrainingModule[]>("training-modules", []);
  const [progress, setProgress] = useLocalStorage<TraineeProgress[]>("training-progress", []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [progressModuleId, setProgressModuleId] = useState<string | null>(null);
  const [progressForm, setProgressForm] = useState({ traineeName: "" });

  const [moduleForm, setModuleForm] = useState({ title: "", description: "", category: "", difficulty: "beginner" as Difficulty });
  const [lessonForm, setLessonForm] = useState<{ title: string; content: string; type: LessonType; quiz: QuizQuestion[] }>({ title: "", content: "", type: "reading", quiz: [] });
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  function openAddModule() {
    setModuleForm({ title: "", description: "", category: "", difficulty: "beginner" });
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEditModule(mod: TrainingModule) {
    setModuleForm({ title: mod.title, description: mod.description, category: mod.category, difficulty: mod.difficulty });
    setEditingId(mod.id);
    setDialogOpen(true);
  }

  function handleSaveModule() {
    if (!moduleForm.title.trim()) return;
    if (editingId) {
      setModules((prev) => prev.map((m) => (m.id === editingId ? { ...m, ...moduleForm } : m)));
    } else {
      setModules((prev) => [{ ...moduleForm, id: generateId(), lessons: [], createdAt: new Date().toISOString() }, ...prev]);
    }
    setDialogOpen(false);
  }

  function openAddLesson(moduleId: string) {
    setActiveModuleId(moduleId);
    setLessonForm({ title: "", content: "", type: "reading", quiz: [] });
    setEditingLessonId(null);
    setLessonDialogOpen(true);
  }

  function openEditLesson(moduleId: string, lesson: Lesson) {
    setActiveModuleId(moduleId);
    setLessonForm({ title: lesson.title, content: lesson.content, type: lesson.type, quiz: lesson.quiz || [] });
    setEditingLessonId(lesson.id);
    setLessonDialogOpen(true);
  }

  function handleSaveLesson() {
    if (!lessonForm.title.trim() || !activeModuleId) return;
    setModules((prev) => prev.map((m) => {
      if (m.id !== activeModuleId) return m;
      if (editingLessonId) {
        return { ...m, lessons: m.lessons.map((l) => (l.id === editingLessonId ? { ...l, ...lessonForm } : l)) };
      }
      return { ...m, lessons: [...m.lessons, { id: generateId(), ...lessonForm }] };
    }));
    setLessonDialogOpen(false);
  }

  function deleteLesson(moduleId: string, lessonId: string) {
    setModules((prev) => prev.map((m) => (m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m)));
  }

  function deleteModule(id: string) {
    setModules((prev) => prev.filter((m) => m.id !== id));
    setProgress((prev) => prev.filter((p) => p.moduleId !== id));
  }

  function addQuizQuestion() {
    setLessonForm((f) => ({ ...f, quiz: [...f.quiz, { question: "", options: ["", "", "", ""], correctIndex: 0 }] }));
  }

  function updateQuizQuestion(idx: number, field: string, value: string | number) {
    setLessonForm((f) => {
      const quiz = [...f.quiz];
      if (field === "question") quiz[idx] = { ...quiz[idx], question: value as string };
      else if (field === "correctIndex") quiz[idx] = { ...quiz[idx], correctIndex: value as number };
      else {
        const optIdx = parseInt(field.replace("option", ""));
        const options = [...quiz[idx].options] as [string, string, string, string];
        options[optIdx] = value as string;
        quiz[idx] = { ...quiz[idx], options };
      }
      return { ...f, quiz };
    });
  }

  function removeQuizQuestion(idx: number) {
    setLessonForm((f) => ({ ...f, quiz: f.quiz.filter((_, i) => i !== idx) }));
  }

  function openProgress(moduleId: string) { setProgressModuleId(moduleId); setProgressForm({ traineeName: "" }); setProgressDialogOpen(true); }

  function addTrainee() {
    if (!progressForm.traineeName.trim() || !progressModuleId) return;
    setProgress((prev) => [...prev, { id: generateId(), traineeName: progressForm.traineeName, moduleId: progressModuleId, completedLessons: [], quizScores: {}, startedAt: new Date().toISOString() }]);
    setProgressForm({ traineeName: "" });
  }

  function toggleLessonComplete(progressId: string, lessonId: string) {
    setProgress((prev) => prev.map((p) => {
      if (p.id !== progressId) return p;
      const completed = p.completedLessons.includes(lessonId)
        ? p.completedLessons.filter((l) => l !== lessonId)
        : [...p.completedLessons, lessonId];
      return { ...p, completedLessons: completed };
    }));
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Training Module Builder" description="Create training modules with lessons, quizzes, and progress tracking" icon={GraduationCap} badge="Knowledge" replaces="Trainual / LMS" />

      <div className="flex justify-end">
        <Button onClick={openAddModule} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
          <Plus className="h-4 w-4 mr-2" />New Module
        </Button>
      </div>

      {modules.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center">
          <GraduationCap className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No training modules yet. Create your first one!</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {modules.map((mod) => {
            const isExpanded = expandedModule === mod.id;
            const moduleProgress = progress.filter((p) => p.moduleId === mod.id);
            return (
              <Card key={mod.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 cursor-pointer" onClick={() => setExpandedModule(isExpanded ? null : mod.id)}>
                      {isExpanded ? <ChevronDown className="h-5 w-5 mt-0.5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 mt-0.5 text-muted-foreground" />}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{mod.title}</span>
                          <Badge className={DIFF_COLORS[mod.difficulty]}>{mod.difficulty}</Badge>
                          {mod.category && <Badge variant="secondary" className="text-[10px]">{mod.category}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{mod.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{mod.lessons.length} lessons &middot; {moduleProgress.length} trainees</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => openProgress(mod.id)}>Progress</Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => openEditModule(mod)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => deleteModule(mod.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 ml-8 space-y-2">
                      <Separator />
                      {mod.lessons.map((lesson, idx) => (
                        <div key={lesson.id} className="flex items-center justify-between rounded-lg border p-3 group">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground font-mono w-5">{idx + 1}</span>
                            {lesson.type === "reading" && <BookOpen className="h-4 w-4 text-blue-500" />}
                            {lesson.type === "video-link" && <Play className="h-4 w-4 text-red-500" />}
                            {lesson.type === "quiz" && <HelpCircle className="h-4 w-4 text-amber-500" />}
                            <div>
                              <p className="text-sm font-medium">{lesson.title}</p>
                              <Badge variant="secondary" className="text-[10px]">{lesson.type}</Badge>
                              {lesson.quiz && lesson.quiz.length > 0 && <span className="text-xs text-muted-foreground ml-2">{lesson.quiz.length} questions</span>}
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon-sm" onClick={() => openEditLesson(mod.id, lesson)}><Edit2 className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => deleteLesson(mod.id, lesson.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => openAddLesson(mod.id)} className="w-full mt-2">
                        <Plus className="h-3.5 w-3.5 mr-1" />Add Lesson
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Module Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Module" : "New Training Module"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={moduleForm.title} onChange={(e) => setModuleForm((f) => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={moduleForm.description} onChange={(e) => setModuleForm((f) => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Category</Label><Input value={moduleForm.category} onChange={(e) => setModuleForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g., Onboarding" /></div>
              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Select value={moduleForm.difficulty} onValueChange={(v) => setModuleForm((f) => ({ ...f, difficulty: v as Difficulty }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveModule} disabled={!moduleForm.title.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">{editingId ? "Save" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingLessonId ? "Edit Lesson" : "Add Lesson"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label>Title *</Label><Input value={lessonForm.title} onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={lessonForm.type} onValueChange={(v) => setLessonForm((f) => ({ ...f, type: v as LessonType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reading">Reading</SelectItem>
                  <SelectItem value="video-link">Video Link</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{lessonForm.type === "video-link" ? "Video URL" : "Content"}</Label>
              <Textarea value={lessonForm.content} onChange={(e) => setLessonForm((f) => ({ ...f, content: e.target.value }))} rows={4} />
            </div>

            {lessonForm.type === "quiz" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Quiz Questions</Label>
                  <Button variant="outline" size="sm" onClick={addQuizQuestion}><Plus className="h-3.5 w-3.5 mr-1" />Add Question</Button>
                </div>
                {lessonForm.quiz.map((q, qi) => (
                  <div key={qi} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Question {qi + 1}</Label>
                      <Button variant="ghost" size="icon-sm" onClick={() => removeQuizQuestion(qi)}><X className="h-3.5 w-3.5 text-red-500" /></Button>
                    </div>
                    <Input value={q.question} onChange={(e) => updateQuizQuestion(qi, "question", e.target.value)} placeholder="Question text" />
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`q${qi}`} checked={q.correctIndex === oi} onChange={() => updateQuizQuestion(qi, "correctIndex", oi)} className="accent-violet-600" />
                        <Input value={opt} onChange={(e) => updateQuizQuestion(qi, `option${oi}`, e.target.value)} placeholder={`Option ${oi + 1}`} className="flex-1" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveLesson} disabled={!lessonForm.title.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">{editingLessonId ? "Save" : "Add"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Trainee Progress</DialogTitle></DialogHeader>
          {progressModuleId && (() => {
            const mod = modules.find((m) => m.id === progressModuleId);
            if (!mod) return null;
            const trainees = progress.filter((p) => p.moduleId === progressModuleId);
            return (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input value={progressForm.traineeName} onChange={(e) => setProgressForm({ traineeName: e.target.value })} placeholder="Trainee name" className="flex-1" />
                  <Button onClick={addTrainee} disabled={!progressForm.traineeName.trim()} variant="outline"><Plus className="h-4 w-4" /></Button>
                </div>
                {trainees.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No trainees assigned yet.</p> : (
                  <div className="space-y-3">
                    {trainees.map((t) => {
                      const pct = mod.lessons.length > 0 ? Math.round((t.completedLessons.length / mod.lessons.length) * 100) : 0;
                      return (
                        <div key={t.id} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{t.traineeName}</span>
                            <span className="text-sm font-bold text-violet-600">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="space-y-1">
                            {mod.lessons.map((l) => (
                              <div key={l.id} className="flex items-center gap-2 text-xs cursor-pointer" onClick={() => toggleLessonComplete(t.id, l.id)}>
                                <CheckCircle2 className={`h-3.5 w-3.5 ${t.completedLessons.includes(l.id) ? "text-emerald-500" : "text-muted-foreground/40"}`} />
                                <span className={t.completedLessons.includes(l.id) ? "line-through text-muted-foreground" : ""}>{l.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
