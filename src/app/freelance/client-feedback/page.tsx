"use client";

import { useState, useMemo } from "react";
import { MessageCircle, Plus, Trash2, Star, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface Feedback {
  id: string;
  client: string;
  project: string;
  rating: number;
  whatWentWell: string;
  whatToImprove: string;
  date: string;
}

interface ActionItem {
  id: string;
  text: string;
  fromFeedbackId: string;
  completed: boolean;
}

export default function ClientFeedbackPage() {
  const [feedbacks, setFeedbacks] = useLocalStorage<Feedback[]>("client-feedback-data", []);
  const [actions, setActions] = useLocalStorage<ActionItem[]>("client-feedback-actions", []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ client: "", project: "", rating: 5, whatWentWell: "", whatToImprove: "", date: new Date().toISOString().split("T")[0] });
  const [newAction, setNewAction] = useState("");

  const stats = useMemo(() => {
    const avg = feedbacks.length > 0 ? feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length : 0;
    const improvementWords = new Map<string, number>();
    feedbacks.forEach((f) => {
      f.whatToImprove.toLowerCase().split(/[\s,;.]+/).filter((w) => w.length > 3).forEach((w) => {
        improvementWords.set(w, (improvementWords.get(w) || 0) + 1);
      });
    });
    const patterns = Array.from(improvementWords.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { total: feedbacks.length, avg, patterns, pendingActions: actions.filter((a) => !a.completed).length };
  }, [feedbacks, actions]);

  function handleSave() {
    if (!form.client.trim()) return;
    setFeedbacks((prev) => [{ id: generateId(), ...form }, ...prev]);
    setForm({ client: "", project: "", rating: 5, whatWentWell: "", whatToImprove: "", date: new Date().toISOString().split("T")[0] });
    setShowForm(false);
  }

  function addAction(feedbackId: string) {
    if (!newAction.trim()) return;
    setActions((prev) => [...prev, { id: generateId(), text: newAction, fromFeedbackId: feedbackId, completed: false }]);
    setNewAction("");
  }

  function toggleAction(id: string) {
    setActions((prev) => prev.map((a) => a.id === id ? { ...a, completed: !a.completed } : a));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Feedback Logger"
        description="Log client feedback, identify patterns, and track improvement actions"
        icon={MessageCircle}
        badge="Freelance"
        replaces="Google Sheets / Notion"
        actions={
          <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Log Feedback
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50"><CardContent className="p-4"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Feedback</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4"><p className="text-2xl font-bold text-amber-500">{stats.avg.toFixed(1)}<Star className="h-4 w-4 inline ml-1 fill-amber-400 text-amber-400" /></p><p className="text-xs text-muted-foreground">Average Rating</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4"><p className="text-2xl font-bold text-violet-600">{stats.pendingActions}</p><p className="text-xs text-muted-foreground">Pending Actions</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4"><p className="text-2xl font-bold text-emerald-600">{actions.filter((a) => a.completed).length}</p><p className="text-xs text-muted-foreground">Completed Actions</p></CardContent></Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {feedbacks.length === 0 ? (
            <Card className="border-dashed border-border/60">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <MessageCircle className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="font-medium text-muted-foreground">No feedback logged yet</p>
              </CardContent>
            </Card>
          ) : (
            feedbacks.map((fb) => {
              const fbActions = actions.filter((a) => a.fromFeedbackId === fb.id);
              return (
                <Card key={fb.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{fb.client}</span>
                          {fb.project && <Badge variant="secondary" className="text-[10px]">{fb.project}</Badge>}
                          <span className="text-xs text-muted-foreground">{fb.date}</span>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} className={`h-3.5 w-3.5 ${n <= fb.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
                          ))}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => setFeedbacks((p) => p.filter((f) => f.id !== fb.id))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {fb.whatWentWell && (
                      <div className="mb-2"><p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> What went well</p><p className="text-sm text-muted-foreground ml-4">{fb.whatWentWell}</p></div>
                    )}
                    {fb.whatToImprove && (
                      <div className="mb-2"><p className="text-xs text-amber-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> To improve</p><p className="text-sm text-muted-foreground ml-4">{fb.whatToImprove}</p></div>
                    )}
                    {fbActions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {fbActions.map((a) => (
                          <button key={a.id} onClick={() => toggleAction(a.id)} className="flex items-center gap-2 text-xs w-full text-left">
                            <div className={`h-3.5 w-3.5 rounded border shrink-0 flex items-center justify-center ${a.completed ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/30"}`}>
                              {a.completed && <CheckCircle2 className="h-2 w-2 text-white" />}
                            </div>
                            <span className={a.completed ? "line-through text-muted-foreground" : ""}>{a.text}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Input placeholder="Add action item..." value={newAction} onChange={(e) => setNewAction(e.target.value)} className="h-7 text-xs" onKeyDown={(e) => e.key === "Enter" && addAction(fb.id)} />
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addAction(fb.id)} disabled={!newAction.trim()}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Improvement Patterns</CardTitle></CardHeader>
            <CardContent>
              {stats.patterns.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Add feedback to see patterns</p>
              ) : (
                <div className="space-y-2">
                  {stats.patterns.map(([word, count]) => (
                    <div key={word} className="flex items-center gap-2">
                      <span className="text-sm flex-1 capitalize">{word}</span>
                      <Badge variant="secondary" className="text-[10px]">{count}x</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Pending Actions</CardTitle></CardHeader>
            <CardContent>
              {actions.filter((a) => !a.completed).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">All clear!</p>
              ) : (
                <div className="space-y-1.5">
                  {actions.filter((a) => !a.completed).map((a) => (
                    <button key={a.id} onClick={() => toggleAction(a.id)} className="flex items-center gap-2 text-xs w-full text-left p-1.5 rounded-md hover:bg-muted/50">
                      <div className="h-3.5 w-3.5 rounded border border-muted-foreground/30 shrink-0" />
                      <span>{a.text}</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Log Client Feedback</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Client *</Label><Input value={form.client} onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Project</Label><Input value={form.project} onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setForm((f) => ({ ...f, rating: n }))} className="p-0.5">
                    <Star className={`h-6 w-6 ${n <= form.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5"><Label>What went well</Label><Textarea value={form.whatWentWell} onChange={(e) => setForm((f) => ({ ...f, whatWentWell: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label>What to improve</Label><Textarea value={form.whatToImprove} onChange={(e) => setForm((f) => ({ ...f, whatToImprove: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.client.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">Log Feedback</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
