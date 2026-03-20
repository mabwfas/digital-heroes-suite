"use client";

import { useState, useMemo } from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  Pencil,
  Check,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  Smile,
  Meh,
  Frown,
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
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
}

interface MeetingNote {
  id: string;
  date: string;
  agenda: string;
  discussionPoints: string;
  actionItems: ActionItem[];
  mood: number; // 1-3
}

interface OneOnOne {
  id: string;
  manager: string;
  teamMember: string;
  frequency: string;
  nextDate: string;
  notes: MeetingNote[];
}

const FREQUENCIES = ["Weekly", "Bi-weekly", "Monthly"];
const MOODS = [
  { value: 1, icon: Frown, label: "Low", color: "text-red-500" },
  { value: 2, icon: Meh, label: "Neutral", color: "text-amber-500" },
  { value: 3, icon: Smile, label: "Good", color: "text-emerald-500" },
];

export default function OneOnOnePage() {
  const [pairs, setPairs] = useLocalStorage<OneOnOne[]>("hr-ext-one-on-one", []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pairDialogOpen, setPairDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editingPairId, setEditingPairId] = useState<string | null>(null);
  const [selectedPairId, setSelectedPairId] = useState<string | null>(null);
  const [pairForm, setPairForm] = useState({ manager: "", teamMember: "", frequency: "Weekly", nextDate: "" });
  const [noteForm, setNoteForm] = useState({ date: new Date().toISOString().split("T")[0], agenda: "", discussionPoints: "", mood: 2 });
  const [noteActionItems, setNoteActionItems] = useState<ActionItem[]>([]);
  const [newAction, setNewAction] = useState("");

  function openCreatePair() {
    setEditingPairId(null);
    setPairForm({ manager: "", teamMember: "", frequency: "Weekly", nextDate: new Date().toISOString().split("T")[0] });
    setPairDialogOpen(true);
  }

  function openEditPair(p: OneOnOne) {
    setEditingPairId(p.id);
    setPairForm({ manager: p.manager, teamMember: p.teamMember, frequency: p.frequency, nextDate: p.nextDate });
    setPairDialogOpen(true);
  }

  function savePair() {
    if (!pairForm.manager.trim() || !pairForm.teamMember.trim()) return;
    if (editingPairId) {
      setPairs((prev) => prev.map((p) => p.id === editingPairId ? { ...p, ...pairForm } : p));
    } else {
      setPairs((prev) => [...prev, { id: generateId(), ...pairForm, notes: [] }]);
    }
    setPairDialogOpen(false);
  }

  function deletePair(id: string) {
    setPairs((prev) => prev.filter((p) => p.id !== id));
  }

  function openAddNote(pairId: string) {
    setSelectedPairId(pairId);
    setNoteForm({ date: new Date().toISOString().split("T")[0], agenda: "", discussionPoints: "", mood: 2 });
    setNoteActionItems([]);
    setNewAction("");
    setNoteDialogOpen(true);
  }

  function addActionItem() {
    if (!newAction.trim()) return;
    setNoteActionItems((prev) => [...prev, { id: generateId(), text: newAction.trim(), completed: false }]);
    setNewAction("");
  }

  function saveNote() {
    if (!selectedPairId) return;
    const note: MeetingNote = {
      id: generateId(),
      date: noteForm.date,
      agenda: noteForm.agenda,
      discussionPoints: noteForm.discussionPoints,
      actionItems: noteActionItems,
      mood: noteForm.mood,
    };
    setPairs((prev) => prev.map((p) => p.id === selectedPairId ? { ...p, notes: [note, ...p.notes] } : p));
    setNoteDialogOpen(false);
  }

  function toggleAction(pairId: string, noteId: string, actionId: string) {
    setPairs((prev) =>
      prev.map((p) =>
        p.id === pairId
          ? { ...p, notes: p.notes.map((n) => n.id === noteId ? { ...n, actionItems: n.actionItems.map((a) => a.id === actionId ? { ...a, completed: !a.completed } : a) } : n) }
          : p
      )
    );
  }

  const upcomingCount = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 86400000);
    return pairs.filter((p) => {
      if (!p.nextDate) return false;
      const d = new Date(p.nextDate + "T12:00:00");
      return d >= now && d <= weekFromNow;
    }).length;
  }, [pairs]);

  const totalActions = useMemo(() => {
    let open = 0, done = 0;
    pairs.forEach((p) => p.notes.forEach((n) => n.actionItems.forEach((a) => { if (a.completed) done++; else open++; })));
    return { open, done };
  }, [pairs]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="1:1 Meeting Tracker"
        description="Schedule and track one-on-one meetings with notes and action items"
        icon={MessageSquare}
        badge="HR Extended"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active Pairs", value: pairs.length, color: "text-violet-600 dark:text-violet-400" },
          { label: "Upcoming (7d)", value: upcomingCount, color: "text-pink-600 dark:text-pink-400" },
          { label: "Open Actions", value: totalActions.open, color: "text-amber-600 dark:text-amber-400" },
          { label: "Completed Actions", value: totalActions.done, color: "text-emerald-600 dark:text-emerald-400" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground mt-0.5">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={openCreatePair} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">
          <Plus className="h-3.5 w-3.5 mr-1.5" />New 1:1 Pair
        </Button>
      </div>

      <div className="space-y-3">
        {pairs.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-16 text-center"><MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" /><p className="text-sm text-muted-foreground">No 1:1 pairs yet. Create one to start tracking.</p><Button variant="outline" className="mt-4" onClick={openCreatePair}><Plus className="h-4 w-4 mr-2" />New 1:1 Pair</Button></CardContent></Card>
        ) : (
          pairs.map((pair) => {
            const isExpanded = expandedId === pair.id;
            const isUpcoming = pair.nextDate && new Date(pair.nextDate + "T12:00:00") >= new Date() && new Date(pair.nextDate + "T12:00:00") <= new Date(Date.now() + 7 * 86400000);
            return (
              <Card key={pair.id} className={`overflow-hidden transition-colors ${isUpcoming ? "border-amber-500/30" : "hover:border-violet-500/30"}`}>
                <button className="w-full text-left" onClick={() => setExpandedId(isExpanded ? null : pair.id)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center shrink-0"><MessageSquare className="h-4 w-4 text-violet-500" /></div>
                        <div>
                          <CardTitle className="text-base">{pair.manager} + {pair.teamMember}</CardTitle>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-[10px]">{pair.frequency}</Badge>
                            {pair.nextDate && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />Next: {new Date(pair.nextDate + "T12:00:00").toLocaleDateString()}
                              </span>
                            )}
                            {isUpcoming && <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-0">Upcoming</Badge>}
                            <span className="text-xs text-muted-foreground">{pair.notes.length} meeting{pair.notes.length !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openAddNote(pair.id); }}><Plus className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEditPair(pair); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={(e) => { e.stopPropagation(); deletePair(pair.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {isExpanded && (
                  <CardContent className="pt-0 pb-5 px-5">
                    <Separator className="mb-4" />
                    {pair.notes.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No meetings recorded yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {pair.notes.map((note) => {
                          const MoodIcon = MOODS.find((m) => m.value === note.mood)?.icon || Meh;
                          const moodColor = MOODS.find((m) => m.value === note.mood)?.color || "text-muted-foreground";
                          return (
                            <div key={note.id} className="rounded-lg bg-muted/30 p-4 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">{new Date(note.date + "T12:00:00").toLocaleDateString()}</span>
                                <MoodIcon className={`h-4 w-4 ${moodColor}`} />
                              </div>
                              {note.agenda && <div><p className="text-[10px] font-semibold text-muted-foreground uppercase">Agenda</p><p className="text-sm">{note.agenda}</p></div>}
                              {note.discussionPoints && <div><p className="text-[10px] font-semibold text-muted-foreground uppercase">Discussion</p><p className="text-sm whitespace-pre-wrap">{note.discussionPoints}</p></div>}
                              {note.actionItems.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Action Items</p>
                                  <div className="space-y-1">
                                    {note.actionItems.map((a) => (
                                      <div key={a.id} className="flex items-center gap-2">
                                        <button onClick={() => toggleAction(pair.id, note.id, a.id)} className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${a.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground/30"}`}>
                                          {a.completed && <Check className="h-3 w-3" />}
                                        </button>
                                        <span className={`text-sm ${a.completed ? "line-through text-muted-foreground" : ""}`}>{a.text}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={pairDialogOpen} onOpenChange={setPairDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingPairId ? "Edit 1:1 Pair" : "New 1:1 Pair"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Manager *</Label><Input value={pairForm.manager} onChange={(e) => setPairForm((f) => ({ ...f, manager: e.target.value }))} placeholder="Manager name" className="mt-1" /></div>
            <div><Label>Team Member *</Label><Input value={pairForm.teamMember} onChange={(e) => setPairForm((f) => ({ ...f, teamMember: e.target.value }))} placeholder="Team member name" className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Frequency</Label>
                <Select value={pairForm.frequency} onValueChange={(v) => setPairForm((f) => ({ ...f, frequency: v ?? f.frequency }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{FREQUENCIES.map((fr) => <SelectItem key={fr} value={fr}>{fr}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Next Date</Label><Input type="date" value={pairForm.nextDate} onChange={(e) => setPairForm((f) => ({ ...f, nextDate: e.target.value }))} className="mt-1" /></div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPairDialogOpen(false)}>Cancel</Button>
            <Button onClick={savePair} disabled={!pairForm.manager.trim() || !pairForm.teamMember.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">{editingPairId ? "Save" : "Create Pair"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Meeting Notes</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label><Input type="date" value={noteForm.date} onChange={(e) => setNoteForm((f) => ({ ...f, date: e.target.value }))} className="mt-1" /></div>
              <div>
                <Label>Mood</Label>
                <div className="flex gap-2 mt-1">
                  {MOODS.map((m) => (
                    <button key={m.value} onClick={() => setNoteForm((f) => ({ ...f, mood: m.value }))} className={`p-2 rounded-lg border ${noteForm.mood === m.value ? "border-violet-500 bg-violet-500/10" : "border-border"}`}>
                      <m.icon className={`h-5 w-5 ${m.color}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div><Label>Agenda</Label><Textarea value={noteForm.agenda} onChange={(e) => setNoteForm((f) => ({ ...f, agenda: e.target.value }))} rows={2} className="mt-1" /></div>
            <div><Label>Discussion Points</Label><Textarea value={noteForm.discussionPoints} onChange={(e) => setNoteForm((f) => ({ ...f, discussionPoints: e.target.value }))} rows={4} className="mt-1" /></div>
            <div>
              <Label>Action Items</Label>
              <div className="space-y-2 mt-1">
                {noteActionItems.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
                    <span className="text-sm flex-1">{a.text}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => setNoteActionItems((p) => p.filter((i) => i.id !== a.id))}><X className="h-3 w-3" /></Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input value={newAction} onChange={(e) => setNewAction(e.target.value)} placeholder="Add action item..." onKeyDown={(e) => e.key === "Enter" && addActionItem()} className="flex-1" />
                  <Button variant="outline" size="icon" onClick={addActionItem} disabled={!newAction.trim()}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveNote} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">Save Notes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
