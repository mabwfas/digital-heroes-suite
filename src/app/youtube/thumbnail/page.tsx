"use client";

import { useState, useMemo } from "react";
import {
  Image,
  Plus,
  Trash2,
  Edit2,
  Search,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  X,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type LayoutStyle = "face-text" | "before-after" | "numbered" | "question";
type ThumbnailStatus = "planned" | "designed" | "tested";

interface ThumbnailPlan {
  id: string;
  videoTitle: string;
  titleText: string;
  emotion: string;
  bgColor: string;
  layout: LayoutStyle;
  status: ThumbnailStatus;
  clickScore: number;
  notes: string;
  createdAt: string;
}

interface ABTest {
  id: string;
  videoTitle: string;
  variantA: string;
  variantB: string;
  ctrA: number;
  ctrB: number;
  winner: "A" | "B" | "none";
  createdAt: string;
}

const LAYOUT_LABELS: Record<LayoutStyle, string> = {
  "face-text": "Face + Text",
  "before-after": "Before / After",
  "numbered": "Numbered List",
  "question": "Question",
};

const STATUS_CONFIG: Record<ThumbnailStatus, { label: string; className: string }> = {
  planned: { label: "Planned", className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-0" },
  designed: { label: "Designed", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0" },
  tested: { label: "Tested", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0" },
};

function scoreThumbnail(plan: { titleText: string; emotion: string; bgColor: string; layout: LayoutStyle }): number {
  let score = 50;
  const words = plan.titleText.trim().split(/\s+/).length;
  if (words >= 2 && words <= 5) score += 20;
  else if (words === 1) score += 10;
  else score -= 10;

  if (plan.titleText === plan.titleText.toUpperCase() && plan.titleText.length > 0) score += 5;

  if (plan.emotion.trim()) score += 15;
  const strongEmotions = ["shock", "surprise", "excited", "angry", "scared", "happy", "confused", "amazed"];
  if (strongEmotions.some((e) => plan.emotion.toLowerCase().includes(e))) score += 10;

  if (plan.bgColor.trim()) score += 5;
  const boldColors = ["red", "yellow", "orange", "#ff", "#f00", "#ff0"];
  if (boldColors.some((c) => plan.bgColor.toLowerCase().includes(c))) score += 5;

  if (plan.layout === "face-text" || plan.layout === "question") score += 5;

  return Math.min(100, Math.max(0, score));
}

const EMPTY_PLAN: Omit<ThumbnailPlan, "id" | "clickScore" | "createdAt"> = {
  videoTitle: "", titleText: "", emotion: "", bgColor: "#FF0000", layout: "face-text", status: "planned", notes: "",
};

export default function ThumbnailPlannerPage() {
  const [plans, setPlans, hydrated] = useLocalStorage<ThumbnailPlan[]>("yt-thumbnail-plans", []);
  const [abTests, setAbTests] = useLocalStorage<ABTest[]>("yt-ab-tests", []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_PLAN);
  const [abDialogOpen, setAbDialogOpen] = useState(false);
  const [abForm, setAbForm] = useState({ videoTitle: "", variantA: "", variantB: "", ctrA: 0, ctrB: 0 });

  const liveScore = useMemo(() => scoreThumbnail(form), [form]);

  function openAdd() { setForm(EMPTY_PLAN); setEditingId(null); setDialogOpen(true); }
  function openEdit(plan: ThumbnailPlan) {
    setForm({ videoTitle: plan.videoTitle, titleText: plan.titleText, emotion: plan.emotion, bgColor: plan.bgColor, layout: plan.layout, status: plan.status, notes: plan.notes });
    setEditingId(plan.id);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.videoTitle.trim()) return;
    const clickScore = scoreThumbnail(form);
    if (editingId) {
      setPlans((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...form, clickScore } : p)));
    } else {
      setPlans((prev) => [{ ...form, id: generateId(), clickScore, createdAt: new Date().toISOString() }, ...prev]);
    }
    setDialogOpen(false);
  }

  function handleDelete(id: string) { setPlans((prev) => prev.filter((p) => p.id !== id)); }

  function handleAddABTest() {
    if (!abForm.videoTitle.trim()) return;
    const winner = abForm.ctrA > abForm.ctrB ? "A" as const : abForm.ctrB > abForm.ctrA ? "B" as const : "none" as const;
    setAbTests((prev) => [{ ...abForm, id: generateId(), winner, createdAt: new Date().toISOString() }, ...prev]);
    setAbDialogOpen(false);
    setAbForm({ videoTitle: "", variantA: "", variantB: "", ctrA: 0, ctrB: 0 });
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thumbnail Planner"
        description="Plan, score, and A/B test your YouTube thumbnails for maximum clickability"
        icon={Image}
        badge="YouTube"
        replaces="Canva / Photoshop Planning"
      />

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Thumbnail Plans ({plans.length})</TabsTrigger>
          <TabsTrigger value="ab">A/B Tests ({abTests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              <Plus className="h-4 w-4 mr-2" />Add Thumbnail Plan
            </Button>
          </div>

          {plans.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center">
              <Image className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No thumbnail plans yet. Create one to get started!</p>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card key={plan.id} className="border-border/50 hover:border-violet-500/30 transition-colors group">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{plan.videoTitle}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge className={STATUS_CONFIG[plan.status].className}>{STATUS_CONFIG[plan.status].label}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{LAYOUT_LABELS[plan.layout]}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(plan)}><Edit2 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(plan.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded border" style={{ backgroundColor: plan.bgColor }} />
                      <span className="text-sm font-medium">&quot;{plan.titleText}&quot;</span>
                    </div>
                    {plan.emotion && <p className="text-xs text-muted-foreground">Emotion: {plan.emotion}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Click Score</span>
                      <span className={`text-sm font-bold ${plan.clickScore >= 80 ? "text-emerald-600" : plan.clickScore >= 60 ? "text-amber-600" : "text-red-600"}`}>
                        {plan.clickScore}/100
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${plan.clickScore >= 80 ? "bg-emerald-500" : plan.clickScore >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${plan.clickScore}%` }} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ab" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setAbDialogOpen(true)} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              <Plus className="h-4 w-4 mr-2" />Log A/B Test
            </Button>
          </div>

          {abTests.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No A/B tests logged yet.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {abTests.map((test) => (
                <Card key={test.id} className="border-border/50">
                  <CardContent className="p-4">
                    <p className="font-semibold text-sm mb-3">{test.videoTitle}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`rounded-lg border p-3 ${test.winner === "A" ? "border-emerald-500 bg-emerald-500/5" : ""}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">Variant A</Badge>
                          {test.winner === "A" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{test.variantA}</p>
                        <p className="text-lg font-bold mt-1">{test.ctrA}% CTR</p>
                      </div>
                      <div className={`rounded-lg border p-3 ${test.winner === "B" ? "border-emerald-500 bg-emerald-500/5" : ""}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">Variant B</Badge>
                          {test.winner === "B" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{test.variantB}</p>
                        <p className="text-lg font-bold mt-1">{test.ctrB}% CTR</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Thumbnail Plan Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Plan" : "New Thumbnail Plan"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label>Video Title *</Label><Input value={form.videoTitle} onChange={(e) => setForm((f) => ({ ...f, videoTitle: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Thumbnail Text (3-5 words)</Label><Input value={form.titleText} onChange={(e) => setForm((f) => ({ ...f, titleText: e.target.value }))} placeholder="e.g., STOP DOING THIS" /></div>
              <div className="space-y-1.5"><Label>Emotion / Expression</Label><Input value={form.emotion} onChange={(e) => setForm((f) => ({ ...f, emotion: e.target.value }))} placeholder="e.g., Shocked, Excited" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Background Color</Label>
                <div className="flex gap-2">
                  <input type="color" value={form.bgColor} onChange={(e) => setForm((f) => ({ ...f, bgColor: e.target.value }))} className="h-8 w-10 rounded cursor-pointer" />
                  <Input value={form.bgColor} onChange={(e) => setForm((f) => ({ ...f, bgColor: e.target.value }))} className="flex-1" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Layout Style</Label>
                <Select value={form.layout} onValueChange={(v) => setForm((f) => ({ ...f, layout: v as LayoutStyle }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LAYOUT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ThumbnailStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="designed">Designed</SelectItem>
                  <SelectItem value="tested">Tested</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border p-3 bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Clickability Score</span>
                <span className={`text-lg font-bold ${liveScore >= 80 ? "text-emerald-600" : liveScore >= 60 ? "text-amber-600" : "text-red-600"}`}>{liveScore}/100</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                <div className={`h-full rounded-full transition-all ${liveScore >= 80 ? "bg-emerald-500" : liveScore >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${liveScore}%` }} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.videoTitle.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">{editingId ? "Save Changes" : "Create Plan"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* A/B Test Dialog */}
      <Dialog open={abDialogOpen} onOpenChange={setAbDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log A/B Test</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label>Video Title *</Label><Input value={abForm.videoTitle} onChange={(e) => setAbForm((f) => ({ ...f, videoTitle: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Variant A Description</Label><Input value={abForm.variantA} onChange={(e) => setAbForm((f) => ({ ...f, variantA: e.target.value }))} placeholder="e.g., Red bg + face" /></div>
              <div className="space-y-1.5"><Label>Variant B Description</Label><Input value={abForm.variantB} onChange={(e) => setAbForm((f) => ({ ...f, variantB: e.target.value }))} placeholder="e.g., Blue bg + text only" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>CTR A (%)</Label><Input type="number" step="0.1" value={abForm.ctrA || ""} onChange={(e) => setAbForm((f) => ({ ...f, ctrA: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="space-y-1.5"><Label>CTR B (%)</Label><Input type="number" step="0.1" value={abForm.ctrB || ""} onChange={(e) => setAbForm((f) => ({ ...f, ctrB: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setAbDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddABTest} disabled={!abForm.videoTitle.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">Log Test</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
