"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Copy,
  Users,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const TIMEZONES = ["EST", "CST", "MST", "PST", "UTC", "GMT", "CET", "IST", "JST", "AEST"] as const;

interface AvailabilitySlot {
  id: string;
  day: typeof DAYS[number];
  startTime: string;
  endTime: string;
  timezone: string;
}

interface MeetingType {
  id: string;
  name: string;
  duration: number;
  color: string;
}

interface ScheduledMeeting {
  id: string;
  clientName: string;
  meetingTypeId: string;
  date: string;
  time: string;
  notes: string;
  createdAt: string;
}

const DEFAULT_MEETING_TYPES: MeetingType[] = [
  { id: "discovery", name: "Discovery Call", duration: 30, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0" },
  { id: "kickoff", name: "Project Kickoff", duration: 60, color: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-0" },
  { id: "checkin", name: "Check-in", duration: 15, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0" },
];

export default function SchedulerPage() {
  const [slots, setSlots, hydrated] = useLocalStorage<AvailabilitySlot[]>("scheduler-slots", []);
  const [meetingTypes, setMeetingTypes] = useLocalStorage<MeetingType[]>("scheduler-types", DEFAULT_MEETING_TYPES);
  const [meetings, setMeetings] = useLocalStorage<ScheduledMeeting[]>("scheduler-meetings", []);
  const [slotDialogOpen, setSlotDialogOpen] = useState(false);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [slotForm, setSlotForm] = useState({ day: "Monday" as typeof DAYS[number], startTime: "09:00", endTime: "17:00", timezone: "EST" });
  const [meetingForm, setMeetingForm] = useState({ clientName: "", meetingTypeId: "", date: "", time: "", notes: "" });
  const [typeForm, setTypeForm] = useState({ name: "", duration: 30 });
  const [copied, setCopied] = useState(false);

  const slotsByDay = useMemo(() => {
    const map: Record<string, AvailabilitySlot[]> = {};
    DAYS.forEach((d) => { map[d] = slots.filter((s) => s.day === d); });
    return map;
  }, [slots]);

  const upcomingMeetings = useMemo(() =>
    [...meetings].sort((a, b) => new Date(a.date + "T" + a.time).getTime() - new Date(b.date + "T" + b.time).getTime()),
  [meetings]);

  function addSlot() {
    setSlots((prev) => [...prev, { ...slotForm, id: generateId() }]);
    setSlotDialogOpen(false);
  }

  function removeSlot(id: string) { setSlots((prev) => prev.filter((s) => s.id !== id)); }

  function addMeeting() {
    if (!meetingForm.clientName.trim() || !meetingForm.meetingTypeId) return;
    setMeetings((prev) => [{ ...meetingForm, id: generateId(), createdAt: new Date().toISOString() }, ...prev]);
    setMeetingDialogOpen(false);
    setMeetingForm({ clientName: "", meetingTypeId: "", date: "", time: "", notes: "" });
  }

  function removeMeeting(id: string) { setMeetings((prev) => prev.filter((m) => m.id !== id)); }

  function addMeetingType() {
    if (!typeForm.name.trim()) return;
    setMeetingTypes((prev) => [...prev, { id: generateId(), name: typeForm.name, duration: typeForm.duration, color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-0" }]);
    setTypeDialogOpen(false);
    setTypeForm({ name: "", duration: 30 });
  }

  function generateAvailabilityText() {
    let text = "Availability\n============\n\n";
    DAYS.forEach((day) => {
      const daySlots = slotsByDay[day];
      if (daySlots.length > 0) {
        text += `${day}:\n`;
        daySlots.forEach((s) => { text += `  ${s.startTime} - ${s.endTime} (${s.timezone})\n`; });
        text += "\n";
      }
    });
    text += "\nMeeting Types:\n";
    meetingTypes.forEach((t) => { text += `- ${t.name} (${t.duration} min)\n`; });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Smart Scheduler" description="Manage availability, meeting types, and scheduled meetings" icon={Calendar} badge="Automation" replaces="Calendly / Cal.com" />

      <Tabs defaultValue="availability">
        <TabsList>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="meetings">Meetings ({meetings.length})</TabsTrigger>
          <TabsTrigger value="types">Meeting Types</TabsTrigger>
        </TabsList>

        <TabsContent value="availability" className="space-y-4">
          <div className="flex justify-between">
            <Button variant="outline" onClick={generateAvailabilityText}>
              <Copy className="h-4 w-4 mr-2" />{copied ? "Copied!" : "Copy Availability"}
            </Button>
            <Button onClick={() => setSlotDialogOpen(true)} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              <Plus className="h-4 w-4 mr-2" />Add Slot
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DAYS.map((day) => {
              const daySlots = slotsByDay[day];
              return (
                <Card key={day} className={`border-border/50 ${daySlots.length === 0 ? "opacity-50" : ""}`}>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">{day}</CardTitle></CardHeader>
                  <CardContent>
                    {daySlots.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Unavailable</p>
                    ) : (
                      <div className="space-y-1">
                        {daySlots.map((slot) => (
                          <div key={slot.id} className="flex items-center justify-between text-sm group">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-violet-500" />
                              <span>{slot.startTime} - {slot.endTime}</span>
                              <span className="text-xs text-muted-foreground">{slot.timezone}</span>
                            </div>
                            <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100" onClick={() => removeSlot(slot.id)}>
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setMeetingDialogOpen(true)} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              <Plus className="h-4 w-4 mr-2" />Schedule Meeting
            </Button>
          </div>

          {upcomingMeetings.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No scheduled meetings</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {upcomingMeetings.map((m) => {
                const type = meetingTypes.find((t) => t.id === m.meetingTypeId);
                return (
                  <Card key={m.id} className="border-border/50 group">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                            {m.clientName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{m.clientName}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {type && <Badge className={type.color}>{type.name} ({type.duration}min)</Badge>}
                              {m.date && <span>{m.date}</span>}
                              {m.time && <span>at {m.time}</span>}
                            </div>
                            {m.notes && <p className="text-xs text-muted-foreground mt-1">{m.notes}</p>}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100" onClick={() => removeMeeting(m.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setTypeDialogOpen(true)} variant="outline"><Plus className="h-4 w-4 mr-2" />Add Type</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {meetingTypes.map((t) => (
              <Card key={t.id} className="border-border/50">
                <CardContent className="p-4 text-center">
                  <Badge className={t.color + " mb-2"}>{t.name}</Badge>
                  <p className="text-2xl font-bold">{t.duration}</p>
                  <p className="text-xs text-muted-foreground">minutes</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Slot Dialog */}
      <Dialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Availability Slot</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label>Day</Label>
              <Select value={slotForm.day} onValueChange={(v) => setSlotForm((f) => ({ ...f, day: v as typeof DAYS[number] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Start</Label><Input type="time" value={slotForm.startTime} onChange={(e) => setSlotForm((f) => ({ ...f, startTime: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>End</Label><Input type="time" value={slotForm.endTime} onChange={(e) => setSlotForm((f) => ({ ...f, endTime: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Select value={slotForm.timezone} onValueChange={(v) => { if (v) setSlotForm((f) => ({ ...f, timezone: v })); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setSlotDialogOpen(false)}>Cancel</Button><Button onClick={addSlot} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">Add Slot</Button></div>
        </DialogContent>
      </Dialog>

      {/* Meeting Dialog */}
      <Dialog open={meetingDialogOpen} onOpenChange={setMeetingDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Schedule Meeting</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label>Client Name *</Label><Input value={meetingForm.clientName} onChange={(e) => setMeetingForm((f) => ({ ...f, clientName: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Meeting Type</Label>
              <Select value={meetingForm.meetingTypeId} onValueChange={(v) => { if (v) setMeetingForm((f) => ({ ...f, meetingTypeId: v })); }}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{meetingTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} ({t.duration}min)</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={meetingForm.date} onChange={(e) => setMeetingForm((f) => ({ ...f, date: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Time</Label><Input type="time" value={meetingForm.time} onChange={(e) => setMeetingForm((f) => ({ ...f, time: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Notes</Label><Input value={meetingForm.notes} onChange={(e) => setMeetingForm((f) => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setMeetingDialogOpen(false)}>Cancel</Button><Button onClick={addMeeting} disabled={!meetingForm.clientName.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">Schedule</Button></div>
        </DialogContent>
      </Dialog>

      {/* Type Dialog */}
      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Meeting Type</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={typeForm.name} onChange={(e) => setTypeForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Duration (minutes)</Label><Input type="number" value={typeForm.duration} onChange={(e) => setTypeForm((f) => ({ ...f, duration: parseInt(e.target.value) || 15 }))} /></div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setTypeDialogOpen(false)}>Cancel</Button><Button onClick={addMeetingType} disabled={!typeForm.name.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">Add</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
