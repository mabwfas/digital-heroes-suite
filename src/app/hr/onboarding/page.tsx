"use client";

import { useState, useMemo } from "react";
import {
  ClipboardCheck,
  Plus,
  Trash2,
  Check,
  Pencil,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Copy,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface ChecklistItem {
  id: string;
  task: string;
  dueDate: string;
  completed: boolean;
  category: string;
}

interface OnboardingTrack {
  id: string;
  name: string; // e.g. "Engineering", "Sales"
  items: ChecklistItem[];
}

interface OnboardingAssignment {
  id: string;
  employeeName: string;
  startDate: string;
  trackId: string;
  trackName: string;
  items: ChecklistItem[]; // cloned from track at time of assignment
}

const DEFAULT_TRACKS: OnboardingTrack[] = [
  {
    id: "track-engineering",
    name: "Engineering",
    items: [
      { id: generateId(), task: "Set up laptop and development environment", dueDate: "", completed: false, category: "Setup" },
      { id: generateId(), task: "Access company GitHub organization", dueDate: "", completed: false, category: "Setup" },
      { id: generateId(), task: "Review codebase architecture docs", dueDate: "", completed: false, category: "Training" },
      { id: generateId(), task: "Complete security training", dueDate: "", completed: false, category: "Compliance" },
      { id: generateId(), task: "Meet with team lead for 1:1", dueDate: "", completed: false, category: "HR" },
      { id: generateId(), task: "Merge first pull request", dueDate: "", completed: false, category: "Training" },
      { id: generateId(), task: "Set up local database and run tests", dueDate: "", completed: false, category: "Setup" },
    ],
  },
  {
    id: "track-general",
    name: "General",
    items: [
      { id: generateId(), task: "Complete HR paperwork and I-9 verification", dueDate: "", completed: false, category: "HR" },
      { id: generateId(), task: "Office/remote workspace tour", dueDate: "", completed: false, category: "Setup" },
      { id: generateId(), task: "Set up email and Slack account", dueDate: "", completed: false, category: "Setup" },
      { id: generateId(), task: "Review employee handbook", dueDate: "", completed: false, category: "Compliance" },
      { id: generateId(), task: "Meet with direct manager", dueDate: "", completed: false, category: "HR" },
      { id: generateId(), task: "Attend company all-hands", dueDate: "", completed: false, category: "HR" },
      { id: generateId(), task: "Set up benefits portal", dueDate: "", completed: false, category: "HR" },
      { id: generateId(), task: "Complete diversity & inclusion training", dueDate: "", completed: false, category: "Compliance" },
    ],
  },
  {
    id: "track-sales",
    name: "Sales",
    items: [
      { id: generateId(), task: "CRM system access and training", dueDate: "", completed: false, category: "Setup" },
      { id: generateId(), task: "Product demo certification", dueDate: "", completed: false, category: "Training" },
      { id: generateId(), task: "Shadow 3 customer calls", dueDate: "", completed: false, category: "Training" },
      { id: generateId(), task: "Review sales playbook", dueDate: "", completed: false, category: "Training" },
      { id: generateId(), task: "Meet with assigned account executive", dueDate: "", completed: false, category: "HR" },
      { id: generateId(), task: "Set sales targets with manager", dueDate: "", completed: false, category: "HR" },
    ],
  },
];

const CATEGORIES = ["Setup", "Training", "HR", "Compliance", "Other"];

const CATEGORY_COLORS: Record<string, string> = {
  Setup: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Training: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  HR: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  Compliance: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Other: "bg-muted text-muted-foreground",
};

export default function OnboardingPage() {
  const [tracks, setTracks] = useLocalStorage<OnboardingTrack[]>(
    "hr-onboarding-tracks",
    DEFAULT_TRACKS
  );
  const [assignments, setAssignments] = useLocalStorage<OnboardingAssignment[]>(
    "hr-onboarding-assignments",
    []
  );
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);

  // Dialogs
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [trackDialogOpen, setTrackDialogOpen] = useState(false);
  const [editTrackId, setEditTrackId] = useState<string | null>(null);

  // Assign form
  const [assignForm, setAssignForm] = useState({
    employeeName: "",
    startDate: new Date().toISOString().split("T")[0],
    trackId: "",
  });

  // Track edit form
  const [trackForm, setTrackForm] = useState<{
    name: string;
    items: ChecklistItem[];
  }>({ name: "", items: [] });

  const [newItemText, setNewItemText] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Setup");

  function openAssign() {
    setAssignForm({
      employeeName: "",
      startDate: new Date().toISOString().split("T")[0],
      trackId: tracks[0]?.id || "",
    });
    setAssignDialogOpen(true);
  }

  function submitAssign() {
    if (!assignForm.employeeName.trim() || !assignForm.trackId) return;
    const track = tracks.find((t) => t.id === assignForm.trackId);
    if (!track) return;
    const clonedItems = track.items.map((item) => ({
      ...item,
      id: generateId(),
      completed: false,
    }));
    setAssignments((prev) => [
      {
        id: generateId(),
        employeeName: assignForm.employeeName.trim(),
        startDate: assignForm.startDate,
        trackId: track.id,
        trackName: track.name,
        items: clonedItems,
      },
      ...prev,
    ]);
    setAssignDialogOpen(false);
  }

  function toggleItem(assignId: string, itemId: string) {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignId
          ? {
              ...a,
              items: a.items.map((item) =>
                item.id === itemId
                  ? { ...item, completed: !item.completed }
                  : item
              ),
            }
          : a
      )
    );
  }

  function deleteAssignment(id: string) {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }

  // Track management
  function openNewTrack() {
    setEditTrackId(null);
    setTrackForm({ name: "", items: [] });
    setNewItemText("");
    setTrackDialogOpen(true);
  }

  function openEditTrack(track: OnboardingTrack) {
    setEditTrackId(track.id);
    setTrackForm({
      name: track.name,
      items: track.items.map((i) => ({ ...i })),
    });
    setNewItemText("");
    setTrackDialogOpen(true);
  }

  function addItemToForm() {
    if (!newItemText.trim()) return;
    setTrackForm((f) => ({
      ...f,
      items: [
        ...f.items,
        {
          id: generateId(),
          task: newItemText.trim(),
          dueDate: "",
          completed: false,
          category: newItemCategory,
        },
      ],
    }));
    setNewItemText("");
  }

  function removeItemFromForm(id: string) {
    setTrackForm((f) => ({
      ...f,
      items: f.items.filter((i) => i.id !== id),
    }));
  }

  function saveTrack() {
    if (!trackForm.name.trim()) return;
    if (editTrackId) {
      setTracks((prev) =>
        prev.map((t) =>
          t.id === editTrackId
            ? { ...t, name: trackForm.name, items: trackForm.items }
            : t
        )
      );
    } else {
      setTracks((prev) => [
        ...prev,
        { id: generateId(), name: trackForm.name, items: trackForm.items },
      ]);
    }
    setTrackDialogOpen(false);
  }

  function deleteTrack(id: string) {
    setTracks((prev) => prev.filter((t) => t.id !== id));
  }

  const completedCount = assignments.filter(
    (a) => a.items.length > 0 && a.items.every((i) => i.completed)
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding Checklists"
        description="Assign onboarding tracks to new hires and track completion progress"
        icon={ClipboardCheck}
        badge="HR"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Onboardings", value: assignments.length - completedCount, color: "text-violet-600 dark:text-violet-400" },
          { label: "Completed", value: completedCount, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Tracks Available", value: tracks.length, color: "text-pink-600 dark:text-pink-400" },
          {
            label: "Avg Completion",
            value:
              assignments.length > 0
                ? `${Math.round(
                    (assignments.reduce((sum, a) => {
                      const pct =
                        a.items.length > 0
                          ? (a.items.filter((i) => i.completed).length /
                              a.items.length) *
                            100
                          : 0;
                      return sum + pct;
                    }, 0) /
                      assignments.length)
                  )}%`
                : "—",
            color: "text-amber-600 dark:text-amber-400",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="assignments">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="assignments">Active Onboardings</TabsTrigger>
            <TabsTrigger value="tracks">Track Templates</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openNewTrack}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Track
            </Button>
            <Button
              size="sm"
              onClick={openAssign}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Assign Track
            </Button>
          </div>
        </div>

        {/* Assignments tab */}
        <TabsContent value="assignments" className="space-y-4">
          {assignments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <User className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">
                  No onboarding assignments yet. Assign a track to a new hire.
                </p>
                <Button variant="outline" className="mt-4" onClick={openAssign}>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Track
                </Button>
              </CardContent>
            </Card>
          ) : (
            assignments.map((assignment) => {
              const done = assignment.items.filter((i) => i.completed).length;
              const total = assignment.items.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const isExpanded = expandedAssignment === assignment.id;
              const allDone = done === total && total > 0;

              return (
                <Card
                  key={assignment.id}
                  className={`overflow-hidden transition-colors ${allDone ? "border-emerald-500/30" : "hover:border-violet-500/30"}`}
                >
                  <button
                    className="w-full text-left"
                    onClick={() =>
                      setExpandedAssignment(isExpanded ? null : assignment.id)
                    }
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center shrink-0">
                            <User className="h-5 w-5 text-violet-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base">
                                {assignment.employeeName}
                              </CardTitle>
                              {allDone && (
                                <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
                                  <Check className="h-3 w-3 mr-1" />
                                  Complete
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="secondary" className="text-[10px]">
                                {assignment.trackName}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(
                                  assignment.startDate + "T12:00:00"
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-auto">
                          <div className="text-right">
                            <p className="text-sm font-semibold">{pct}%</p>
                            <p className="text-[10px] text-muted-foreground">
                              {done}/{total} tasks
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-400 hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAssignment(assignment.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <Progress value={pct} className="h-1.5 mt-2" />
                    </CardHeader>
                  </button>

                  {isExpanded && (
                    <CardContent className="pt-0 pb-5 px-5">
                      <Separator className="mb-4" />
                      <div className="space-y-2">
                        {assignment.items.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${item.completed ? "bg-emerald-500/5" : "bg-muted/30 hover:bg-muted/50"}`}
                          >
                            <button
                              onClick={() =>
                                toggleItem(assignment.id, item.id)
                              }
                              className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${item.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/30 hover:border-violet-500"}`}
                            >
                              {item.completed && (
                                <Check className="h-3 w-3" />
                              )}
                            </button>
                            <span
                              className={`text-sm flex-1 ${item.completed ? "line-through text-muted-foreground" : ""}`}
                            >
                              {item.task}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge
                                className={`text-[10px] border-0 ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other}`}
                              >
                                {item.category}
                              </Badge>
                              {item.dueDate && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(
                                    item.dueDate + "T12:00:00"
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Tracks tab */}
        <TabsContent value="tracks" className="space-y-4">
          {tracks.map((track) => {
            const isExpanded = expandedTrack === track.id;
            return (
              <Card key={track.id} className="overflow-hidden hover:border-violet-500/30 transition-colors">
                <button
                  className="w-full text-left"
                  onClick={() =>
                    setExpandedTrack(isExpanded ? null : track.id)
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center">
                          <ClipboardCheck className="h-4 w-4 text-violet-500" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{track.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {track.items.length} tasks
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditTrack(track);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTrack(track.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {isExpanded && (
                  <CardContent className="pt-0 pb-4 px-5">
                    <Separator className="mb-3" />
                    <div className="space-y-2">
                      {track.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                          <span className="text-sm flex-1">{item.task}</span>
                          <Badge
                            className={`text-[10px] border-0 shrink-0 ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other}`}
                          >
                            {item.category}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Onboarding Track</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>New Hire Name *</Label>
              <Input
                value={assignForm.employeeName}
                onChange={(e) =>
                  setAssignForm((f) => ({
                    ...f,
                    employeeName: e.target.value,
                  }))
                }
                placeholder="Jane Smith"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={assignForm.startDate}
                onChange={(e) =>
                  setAssignForm((f) => ({ ...f, startDate: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Onboarding Track *</Label>
              <Select
                value={assignForm.trackId}
                onValueChange={(v) =>
                  setAssignForm((f) => ({ ...f, trackId: v ?? f.trackId }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a track" />
                </SelectTrigger>
                <SelectContent>
                  {tracks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.items.length} tasks)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={submitAssign}
              disabled={!assignForm.employeeName.trim() || !assignForm.trackId}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
            >
              Assign Track
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Track Edit Dialog */}
      <Dialog open={trackDialogOpen} onOpenChange={setTrackDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTrackId ? "Edit Track" : "New Onboarding Track"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Track Name *</Label>
              <Input
                value={trackForm.name}
                onChange={(e) =>
                  setTrackForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g. Engineering, Sales, Marketing"
                className="mt-1"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Checklist Items ({trackForm.items.length})
              </p>
              <div className="space-y-2 mb-3">
                {trackForm.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                    <span className="text-sm flex-1">{item.task}</span>
                    <Badge
                      className={`text-[10px] border-0 shrink-0 ${CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other}`}
                    >
                      {item.category}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-400 shrink-0"
                      onClick={() => removeItemFromForm(item.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Add a task…"
                  onKeyDown={(e) => e.key === "Enter" && addItemToForm()}
                  className="flex-1"
                />
                <Select
                  value={newItemCategory}
                  onValueChange={(v) => setNewItemCategory(v ?? "Setup")}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={addItemToForm}
                  disabled={!newItemText.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setTrackDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={saveTrack}
              disabled={!trackForm.name.trim()}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
            >
              {editTrackId ? "Save Track" : "Create Track"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
