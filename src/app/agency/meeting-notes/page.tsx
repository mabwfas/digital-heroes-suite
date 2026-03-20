"use client";

import { useState, useMemo } from "react";
import { FileText, Plus, Search, Edit2, Trash2, CheckCircle2, Circle, Calendar } from "lucide-react";
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
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface ActionItem {
  id: string;
  text: string;
  assignee: string;
  done: boolean;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  attendees: string;
  client: string;
  agenda: string;
  notes: string;
  actionItems: ActionItem[];
  createdAt: string;
}

const EMPTY: Omit<Meeting, "id" | "createdAt"> = {
  title: "", date: new Date().toISOString().split("T")[0], attendees: "", client: "", agenda: "", notes: "", actionItems: [],
};

export default function MeetingNotesPage() {
  const [meetings, setMeetings] = useLocalStorage<Meeting[]>("agency-meetings", []);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [newActionText, setNewActionText] = useState("");
  const [newActionAssignee, setNewActionAssignee] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const clients = useMemo(() => {
    const c = new Set(meetings.map((m) => m.client).filter(Boolean));
    return Array.from(c);
  }, [meetings]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return meetings.filter((m) => {
      const matchSearch = m.title.toLowerCase().includes(q) || m.notes.toLowerCase().includes(q) || m.attendees.toLowerCase().includes(q);
      const matchClient = !filterClient || m.client === filterClient;
      return matchSearch && matchClient;
    });
  }, [meetings, search, filterClient]);

  const stats = useMemo(() => {
    const allActions = meetings.flatMap((m) => m.actionItems);
    return {
      total: meetings.length,
      totalActions: allActions.length,
      doneActions: allActions.filter((a) => a.done).length,
      pendingActions: allActions.filter((a) => !a.done).length,
    };
  }, [meetings]);

  function openAdd() {
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(m: Meeting) {
    setForm({ title: m.title, date: m.date, attendees: m.attendees, client: m.client, agenda: m.agenda, notes: m.notes, actionItems: [...m.actionItems] });
    setEditingId(m.id);
    setShowForm(true);
  }

  function addActionItem() {
    if (!newActionText.trim()) return;
    setForm((f) => ({
      ...f,
      actionItems: [...f.actionItems, { id: generateId(), text: newActionText.trim(), assignee: newActionAssignee.trim(), done: false }],
    }));
    setNewActionText("");
    setNewActionAssignee("");
  }

  function removeActionItem(id: string) {
    setForm((f) => ({ ...f, actionItems: f.actionItems.filter((a) => a.id !== id) }));
  }

  function handleSave() {
    if (!form.title.trim()) return;
    if (editingId) {
      setMeetings((prev) => prev.map((m) => (m.id === editingId ? { ...m, ...form } : m)));
    } else {
      setMeetings((prev) => [{ ...form, id: generateId(), createdAt: new Date().toISOString() }, ...prev]);
    }
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  }

  function toggleActionDone(meetingId: string, actionId: string) {
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === meetingId
          ? { ...m, actionItems: m.actionItems.map((a) => (a.id === actionId ? { ...a, done: !a.done } : a)) }
          : m
      )
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meeting Notes Manager"
        description="Record meetings with agendas, notes, and action items. Filter by client, track action item completion."
        icon={FileText}
        badge="Agency"
        replaces="Google Docs / Notion"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Meetings</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{stats.totalActions}</p><p className="text-xs text-muted-foreground">Action Items</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold text-emerald-600">{stats.doneActions}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold text-amber-600">{stats.pendingActions}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search meetings..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        {clients.length > 0 && (
          <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className="flex h-9 rounded-lg border border-input bg-transparent px-3 text-sm">
            <option value="">All Clients</option>
            {clients.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
          <Plus className="h-4 w-4 mr-2" />New Meeting
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><FileText className="h-10 w-10 text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">No meetings found</p></CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((m) => {
            const pendingActions = m.actionItems.filter((a) => !a.done).length;
            return (
              <Card key={m.id} className="border-border/50 group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="cursor-pointer flex-1" onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{m.title}</span>
                        {m.client && <Badge variant="outline" className="text-xs">{m.client}</Badge>}
                        {pendingActions > 0 && <Badge className="bg-amber-500/10 text-amber-600 border-0 text-xs">{pendingActions} pending</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{m.date} &middot; {m.attendees || "No attendees listed"}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)}><Edit2 className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  {expandedId === m.id && (
                    <div className="mt-3 space-y-2 pt-3 border-t">
                      {m.agenda && <div><p className="text-xs font-medium text-muted-foreground">Agenda</p><p className="text-sm whitespace-pre-wrap">{m.agenda}</p></div>}
                      {m.notes && <div><p className="text-xs font-medium text-muted-foreground">Notes</p><p className="text-sm whitespace-pre-wrap">{m.notes}</p></div>}
                      {m.actionItems.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Action Items</p>
                          {m.actionItems.map((a) => (
                            <button key={a.id} onClick={() => toggleActionDone(m.id, a.id)} className="flex items-center gap-2 w-full text-left p-1 rounded hover:bg-muted/50">
                              {a.done ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                              <span className={`text-sm ${a.done ? "line-through text-muted-foreground" : ""}`}>{a.text}</span>
                              {a.assignee && <Badge variant="outline" className="text-[10px] ml-auto">{a.assignee}</Badge>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Meeting" : "New Meeting"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Client</Label><Input value={form.client} onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Attendees</Label><Input value={form.attendees} onChange={(e) => setForm((f) => ({ ...f, attendees: e.target.value }))} placeholder="comma separated" /></div>
            </div>
            <div className="space-y-1.5"><Label>Agenda</Label><Textarea value={form.agenda} onChange={(e) => setForm((f) => ({ ...f, agenda: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} /></div>
            <div className="border rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium">Action Items ({form.actionItems.length})</p>
              {form.actionItems.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-sm">
                  <span className="flex-1">{a.text}</span>
                  {a.assignee && <Badge variant="outline" className="text-[10px]">{a.assignee}</Badge>}
                  <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => removeActionItem(a.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input value={newActionText} onChange={(e) => setNewActionText(e.target.value)} placeholder="Action item..." className="flex-1 h-8" onKeyDown={(e) => e.key === "Enter" && addActionItem()} />
                <Input value={newActionAssignee} onChange={(e) => setNewActionAssignee(e.target.value)} placeholder="Assignee" className="w-24 h-8" />
                <Button size="sm" onClick={addActionItem}><Plus className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={handleSave} disabled={!form.title.trim()}>Save</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
