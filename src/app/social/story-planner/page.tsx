"use client";

import { useState, useCallback, useMemo } from "react";
import { Film, Plus, Trash2, Save, GripVertical, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface Scene {
  id: string;
  title: string;
  textOverlay: string;
  musicSuggestion: string;
  cta: string;
  duration: number;
}

interface StoryPlan {
  id: string;
  name: string;
  scenes: Scene[];
  savedAt: string;
}

function emptyScene(): Scene {
  return { id: generateId(), title: "", textOverlay: "", musicSuggestion: "", cta: "", duration: 5 };
}

export default function StoryPlannerPage() {
  const [planName, setPlanName] = useState("My Story");
  const [scenes, setScenes] = useState<Scene[]>([emptyScene()]);
  const [savedPlans, setSavedPlans, hydrated] = useLocalStorage<StoryPlan[]>("story-plans", []);
  const [showSaved, setShowSaved] = useState(false);

  const totalDuration = useMemo(() => scenes.reduce((s, sc) => s + sc.duration, 0), [scenes]);

  const updateScene = useCallback((id: string, field: keyof Scene, value: string | number) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }, []);

  const addScene = useCallback(() => setScenes(prev => [...prev, emptyScene()]), []);

  const removeScene = useCallback((id: string) => setScenes(prev => prev.length > 1 ? prev.filter(s => s.id !== id) : prev), []);

  const moveScene = useCallback((idx: number, dir: -1 | 1) => {
    setScenes(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    const plan: StoryPlan = { id: generateId(), name: planName.trim() || "Untitled", scenes, savedAt: new Date().toISOString() };
    setSavedPlans(prev => [plan, ...prev.slice(0, 19)]);
  }, [planName, scenes, setSavedPlans]);

  const loadPlan = useCallback((plan: StoryPlan) => {
    setPlanName(plan.name);
    setScenes(plan.scenes);
    setShowSaved(false);
  }, []);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Story / Reel Planner"
        description="Plan scene-by-scene with text overlays, music, CTAs, and duration tracking."
        icon={Film}
        badge="Free"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSaved(!showSaved)}>
              Saved ({savedPlans.length})
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        }
      />

      {showSaved ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Saved Plans</CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowSaved(false)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {savedPlans.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No saved plans yet.</p>
            ) : (
              <div className="space-y-2">
                {savedPlans.map(p => (
                  <div key={p.id} className="rounded-lg border p-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer" onClick={() => loadPlan(p)}>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.scenes.length} scenes | {new Date(p.savedAt).toLocaleDateString()}</p>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={e => { e.stopPropagation(); setSavedPlans(prev => prev.filter(x => x.id !== p.id)); }}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Input value={planName} onChange={e => setPlanName(e.target.value)} className="max-w-xs font-medium" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {totalDuration}s total
                  </Badge>
                  <Badge variant="secondary">{scenes.length} scenes</Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="space-y-3">
            {scenes.map((scene, i) => (
              <Card key={scene.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <button onClick={() => moveScene(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><GripVertical className="h-3 w-3" /></button>
                      </div>
                      <CardTitle className="text-sm">Scene {i + 1}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{scene.duration}s</Badge>
                      <Button variant="ghost" size="icon-sm" onClick={() => removeScene(scene.id)} disabled={scenes.length <= 1}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Scene Title</Label>
                      <Input placeholder="Hook / Intro / CTA..." value={scene.title} onChange={e => updateScene(scene.id, "title", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Duration (seconds)</Label>
                      <Input type="number" min={1} max={60} value={scene.duration} onChange={e => updateScene(scene.id, "duration", Number(e.target.value) || 1)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Text Overlay</Label>
                    <Textarea rows={2} placeholder="Text shown on screen..." value={scene.textOverlay} onChange={e => updateScene(scene.id, "textOverlay", e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Music Suggestion</Label>
                      <Input placeholder="Trending audio / song name" value={scene.musicSuggestion} onChange={e => updateScene(scene.id, "musicSuggestion", e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">CTA</Label>
                      <Input placeholder="Follow for more, Link in bio..." value={scene.cta} onChange={e => updateScene(scene.id, "cta", e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button variant="outline" className="w-full" onClick={addScene}>
            <Plus className="h-4 w-4" /> Add Scene
          </Button>
        </>
      )}
    </div>
  );
}
