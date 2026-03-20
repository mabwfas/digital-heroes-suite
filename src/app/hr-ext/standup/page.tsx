"use client";

import { useState, useMemo } from "react";
import {
  Coffee,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  User,
  Calendar,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface StandupEntry {
  id: string;
  date: string;
  memberName: string;
  yesterday: string;
  today: string;
  blockers: string;
}

export default function StandupPage() {
  const [entries, setEntries] = useLocalStorage<StandupEntry[]>("hr-ext-standup", []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [form, setForm] = useState({ memberName: "", yesterday: "", today: "", blockers: "" });

  const allDates = useMemo(() => {
    const dates = [...new Set(entries.map((e) => e.date))];
    dates.sort((a, b) => b.localeCompare(a));
    return dates;
  }, [entries]);

  const allMembers = useMemo(() => [...new Set(entries.map((e) => e.memberName))], [entries]);

  const dateEntries = useMemo(() => entries.filter((e) => e.date === selectedDate), [entries, selectedDate]);

  const recurringBlockers = useMemo(() => {
    const blockerMap: Record<string, number> = {};
    entries.forEach((e) => {
      if (e.blockers.trim()) {
        const key = e.blockers.trim().toLowerCase();
        blockerMap[key] = (blockerMap[key] || 0) + 1;
      }
    });
    return Object.entries(blockerMap).filter(([, count]) => count >= 2).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  function navigateDate(direction: "prev" | "next") {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + (direction === "next" ? 1 : -1));
    setSelectedDate(d.toISOString().split("T")[0]);
  }

  function openAdd() {
    setForm({ memberName: "", yesterday: "", today: "", blockers: "" });
    setDialogOpen(true);
  }

  function save() {
    if (!form.memberName.trim() || !form.today.trim()) return;
    setEntries((prev) => [
      {
        id: generateId(),
        date: selectedDate,
        memberName: form.memberName.trim(),
        yesterday: form.yesterday.trim(),
        today: form.today.trim(),
        blockers: form.blockers.trim(),
      },
      ...prev,
    ]);
    setDialogOpen(false);
  }

  function deleteEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  const todayBlockers = dateEntries.filter((e) => e.blockers).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Standup Tracker"
        description="Track daily standups with yesterday, today, and blockers for each team member"
        icon={Coffee}
        badge="HR Extended"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Entries", value: entries.length, color: "text-violet-600 dark:text-violet-400" },
          { label: "Team Members", value: allMembers.length, color: "text-pink-600 dark:text-pink-400" },
          { label: "Today's Updates", value: dateEntries.length, color: "text-blue-600 dark:text-blue-400" },
          { label: "Today's Blockers", value: todayBlockers, color: "text-red-600 dark:text-red-400" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground mt-0.5">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <Tabs defaultValue="daily">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="daily">Daily View</TabsTrigger>
            <TabsTrigger value="blockers">Recurring Blockers</TabsTrigger>
          </TabsList>
          <Button size="sm" onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">
            <Plus className="h-3.5 w-3.5 mr-1.5" />Add Update
          </Button>
        </div>

        <TabsContent value="daily" className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateDate("prev")}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigateDate("next")}><ChevronRight className="h-4 w-4" /></Button>
          </div>

          {dateEntries.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-16 text-center"><Coffee className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" /><p className="text-sm text-muted-foreground">No updates for {new Date(selectedDate + "T12:00:00").toLocaleDateString()}.</p><Button variant="outline" className="mt-4" onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Update</Button></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dateEntries.map((entry) => (
                <Card key={entry.id} className="overflow-hidden hover:border-violet-500/30 transition-colors">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center"><User className="h-4 w-4 text-violet-500" /></div>
                        <p className="font-medium text-sm">{entry.memberName}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => deleteEntry(entry.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                    {entry.yesterday && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-0.5">Yesterday</p>
                        <p className="text-sm whitespace-pre-wrap">{entry.yesterday}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-0.5">Today</p>
                      <p className="text-sm whitespace-pre-wrap">{entry.today}</p>
                    </div>
                    {entry.blockers && (
                      <div className="rounded-lg bg-red-500/5 border border-red-500/20 px-3 py-2">
                        <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 uppercase mb-0.5 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Blockers</p>
                        <p className="text-sm whitespace-pre-wrap">{entry.blockers}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="blockers" className="space-y-3">
          {recurringBlockers.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-16 text-center"><AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" /><p className="text-sm text-muted-foreground">No recurring blockers detected.</p></CardContent></Card>
          ) : (
            recurringBlockers.map(([blocker, count]) => (
              <Card key={blocker}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0"><AlertTriangle className="h-4 w-4 text-red-500" /></div>
                      <p className="text-sm">{blocker}</p>
                    </div>
                    <Badge className="text-[10px] bg-red-500/10 text-red-600 border-0">{count}x reported</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Standup Update</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Team Member *</Label>
              <Input
                value={form.memberName}
                onChange={(e) => setForm((f) => ({ ...f, memberName: e.target.value }))}
                placeholder="Your name"
                className="mt-1"
                list="member-suggestions"
              />
              {allMembers.length > 0 && (
                <datalist id="member-suggestions">
                  {allMembers.map((m) => <option key={m} value={m} />)}
                </datalist>
              )}
            </div>
            <div><Label>Yesterday</Label><Textarea value={form.yesterday} onChange={(e) => setForm((f) => ({ ...f, yesterday: e.target.value }))} placeholder="What did you do yesterday?" rows={3} className="mt-1" /></div>
            <div><Label>Today *</Label><Textarea value={form.today} onChange={(e) => setForm((f) => ({ ...f, today: e.target.value }))} placeholder="What will you do today?" rows={3} className="mt-1" /></div>
            <div><Label>Blockers</Label><Textarea value={form.blockers} onChange={(e) => setForm((f) => ({ ...f, blockers: e.target.value }))} placeholder="Any blockers?" rows={2} className="mt-1" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.memberName.trim() || !form.today.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">Submit Update</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
