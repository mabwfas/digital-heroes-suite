"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays, Plus, Trash2, ChevronLeft, ChevronRight,
  LayoutGrid, List, Filter, X, Edit2, Check,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type Platform = "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok" | "email" | "blog";
type ContentType = "post" | "story" | "reel" | "blog" | "email" | "video";
type Status = "planned" | "created" | "published";

interface CalendarItem {
  id: string;
  title: string;
  platform: Platform;
  type: ContentType;
  status: Status;
  date: string; // YYYY-MM-DD
  notes: string;
}

const PLATFORMS: { value: Platform; label: string; color: string; dot: string; icon: string }[] = [
  { value: "instagram", label: "Instagram", color: "bg-pink-500/10 text-pink-600 border-pink-200 dark:border-pink-900", dot: "bg-pink-500", icon: "📸" },
  { value: "facebook", label: "Facebook", color: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900", dot: "bg-blue-500", icon: "👍" },
  { value: "twitter", label: "Twitter / X", color: "bg-sky-500/10 text-sky-600 border-sky-200 dark:border-sky-900", dot: "bg-sky-500", icon: "𝕏" },
  { value: "linkedin", label: "LinkedIn", color: "bg-[#0077b5]/10 text-[#0077b5] border-blue-200 dark:border-blue-900", dot: "bg-[#0077b5]", icon: "💼" },
  { value: "tiktok", label: "TikTok", color: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800", dot: "bg-zinc-700 dark:bg-zinc-400", icon: "🎵" },
  { value: "email", label: "Email", color: "bg-violet-500/10 text-violet-600 border-violet-200 dark:border-violet-900", dot: "bg-violet-500", icon: "✉️" },
  { value: "blog", label: "Blog", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900", dot: "bg-emerald-500", icon: "📝" },
];

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "post", label: "Post" },
  { value: "story", label: "Story" },
  { value: "reel", label: "Reel / Video" },
  { value: "blog", label: "Blog Article" },
  { value: "email", label: "Email" },
  { value: "video", label: "Long Video" },
];

const STATUSES: { value: Status; label: string; color: string }[] = [
  { value: "planned", label: "Planned", color: "bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900" },
  { value: "created", label: "Created", color: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900" },
  { value: "published", label: "Published", color: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900" },
];

function getPlatform(val: Platform) { return PLATFORMS.find(p => p.value === val)!; }
function getStatus(val: Status) { return STATUSES.find(s => s.value === val)!; }

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const EMPTY_FORM: Omit<CalendarItem, "id"> = {
  title: "",
  platform: "instagram",
  type: "post",
  status: "planned",
  date: new Date().toISOString().split("T")[0],
  notes: "",
};

export default function ContentCalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [view, setView] = useState<"month" | "week" | "list">("month");
  const [items, setItems] = useLocalStorage<CalendarItem[]>("content-calendar", []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<CalendarItem | null>(null);
  const [form, setForm] = useState<Omit<CalendarItem, "id">>(EMPTY_FORM);
  const [filterPlatform, setFilterPlatform] = useState<Platform | "all">("all");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");

  const filtered = useMemo(() =>
    items.filter(i =>
      (filterPlatform === "all" || i.platform === filterPlatform) &&
      (filterStatus === "all" || i.status === filterStatus)
    ), [items, filterPlatform, filterStatus]
  );

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const itemsByDate = useMemo(() => {
    const map: Record<string, CalendarItem[]> = {};
    for (const item of filtered) {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    }
    return map;
  }, [filtered]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function openNew(date?: string) {
    setEditItem(null);
    setForm({ ...EMPTY_FORM, date: date || EMPTY_FORM.date });
    setDialogOpen(true);
  }

  function openEdit(item: CalendarItem) {
    setEditItem(item);
    setForm({ title: item.title, platform: item.platform, type: item.type, status: item.status, date: item.date, notes: item.notes });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.title.trim()) return;
    if (editItem) {
      setItems(prev => prev.map(i => i.id === editItem.id ? { ...form, id: editItem.id } : i));
    } else {
      setItems(prev => [...prev, { ...form, id: generateId() }]);
    }
    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
    setDialogOpen(false);
  }

  const stats = useMemo(() => ({
    total: filtered.length,
    planned: filtered.filter(i => i.status === "planned").length,
    created: filtered.filter(i => i.status === "created").length,
    published: filtered.filter(i => i.status === "published").length,
  }), [filtered]);

  // Week view: get the current week's dates
  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, []);

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Calendar"
        description="Plan, schedule, and track all your content in one place."
        icon={CalendarDays}
        replaces="CoSchedule ($29/mo)"
      />

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Items", value: stats.total, color: "text-violet-600" },
          { label: "Planned", value: stats.planned, color: "text-amber-600" },
          { label: "Created", value: stats.created, color: "text-blue-600" },
          { label: "Published", value: stats.published, color: "text-emerald-600" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border overflow-hidden">
          {(["month", "week", "list"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-2 text-sm capitalize transition-colors ${view === v ? "bg-violet-600 text-white" : "hover:bg-muted"}`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterPlatform} onValueChange={v => setFilterPlatform(v as Platform | "all")}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder="All platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.icon} {p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={v => setFilterStatus(v as Status | "all")}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {(filterPlatform !== "all" || filterStatus !== "all") && (
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => { setFilterPlatform("all"); setFilterStatus("all"); }}>
              <X className="h-3.5 w-3.5 mr-1" />Clear
            </Button>
          )}
        </div>

        <Button
          className="ml-auto bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
          size="sm"
          onClick={() => openNew()}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Content
        </Button>
      </div>

      {/* Calendar Views */}
      {view === "month" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <h2 className="font-semibold">{MONTH_NAMES[month]} {year}</h2>
              <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b">
              {DAY_NAMES.map(d => (
                <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
              ))}
            </div>
            {/* Days grid */}
            <div className="grid grid-cols-7">
              {/* Empty cells for offset */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[90px] border-r border-b bg-muted/20" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = toDateStr(year, month, day);
                const dayItems = itemsByDate[dateStr] || [];
                const isToday = dateStr === today.toISOString().split("T")[0];
                return (
                  <div
                    key={day}
                    className={`min-h-[90px] border-r border-b p-1.5 cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors ${(i + firstDay + 1) % 7 === 0 ? "border-r-0" : ""}`}
                    onClick={() => openNew(dateStr)}
                  >
                    <div className={`h-6 w-6 flex items-center justify-center rounded-full text-xs font-medium mb-1 ${isToday ? "bg-violet-600 text-white" : "text-foreground"}`}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayItems.slice(0, 3).map(item => {
                        const p = getPlatform(item.platform);
                        return (
                          <div
                            key={item.id}
                            className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] font-medium border truncate ${p.color}`}
                            onClick={e => { e.stopPropagation(); openEdit(item); }}
                          >
                            <span>{p.icon}</span>
                            <span className="truncate">{item.title}</span>
                          </div>
                        );
                      })}
                      {dayItems.length > 3 && (
                        <p className="text-[10px] text-muted-foreground pl-1">+{dayItems.length - 3} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {view === "week" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">This Week</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b">
              {weekDates.map((d, i) => {
                const dateStr = d.toISOString().split("T")[0];
                const isToday = dateStr === today.toISOString().split("T")[0];
                return (
                  <div key={i} className={`text-center py-2 border-r last:border-r-0 ${isToday ? "bg-violet-50 dark:bg-violet-950/20" : ""}`}>
                    <p className="text-xs text-muted-foreground">{DAY_NAMES[d.getDay()]}</p>
                    <p className={`text-sm font-semibold ${isToday ? "text-violet-600" : ""}`}>{d.getDate()}</p>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-7 min-h-[300px]">
              {weekDates.map((d, i) => {
                const dateStr = d.toISOString().split("T")[0];
                const dayItems = itemsByDate[dateStr] || [];
                const isToday = dateStr === today.toISOString().split("T")[0];
                return (
                  <div
                    key={i}
                    className={`border-r last:border-r-0 p-2 cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors ${isToday ? "bg-violet-50/50 dark:bg-violet-950/10" : ""}`}
                    onClick={() => openNew(dateStr)}
                  >
                    <div className="space-y-1">
                      {dayItems.map(item => {
                        const p = getPlatform(item.platform);
                        return (
                          <div
                            key={item.id}
                            className={`rounded px-1.5 py-1 text-[11px] border ${p.color} cursor-pointer`}
                            onClick={e => { e.stopPropagation(); openEdit(item); }}
                          >
                            <span>{p.icon}</span> {item.title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {view === "list" && (
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center">
                  <CalendarDays className="h-7 w-7 text-violet-400" />
                </div>
                <div className="text-center">
                  <p className="font-medium">No content scheduled</p>
                  <p className="text-xs text-muted-foreground mt-1">Click "Add Content" to plan your first post.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y">
                {[...filtered].sort((a, b) => a.date.localeCompare(b.date)).map(item => {
                  const p = getPlatform(item.platform);
                  const s = getStatus(item.status);
                  return (
                    <div key={item.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors group">
                      <div className="w-20 shrink-0">
                        <p className="text-xs font-medium">{new Date(item.date + "T12:00:00").toLocaleDateString("en", { month: "short", day: "numeric" })}</p>
                      </div>
                      <div className={`h-2 w-2 rounded-full shrink-0 ${p.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.title}</p>
                        <div className="flex gap-1.5 mt-0.5">
                          <Badge variant="secondary" className={`text-[10px] h-4 border ${p.color}`}>{p.icon} {p.label}</Badge>
                          <Badge variant="secondary" className="text-[10px] h-4 capitalize">{item.type}</Badge>
                        </div>
                      </div>
                      <Badge variant="secondary" className={`text-[10px] border ${s.color} shrink-0`}>{s.label}</Badge>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Content Item" : "Add Content Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input placeholder="Post title or topic" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v as Platform }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.icon} {p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as ContentType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as Status }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={3} placeholder="Additional notes, caption ideas, links…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
                onClick={handleSave}
                disabled={!form.title.trim()}
              >
                <Check className="h-4 w-4 mr-1.5" />
                {editItem ? "Update" : "Add to Calendar"}
              </Button>
              {editItem && (
                <Button variant="outline" className="text-red-500 hover:text-red-600 hover:border-red-300" onClick={() => handleDelete(editItem.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
