"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Download,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface AttendanceEntry {
  id: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // ISO string
  clockOut?: string; // ISO string
  status: "on-time" | "late" | "absent";
}

const WORK_START = 9; // 9:00 AM
const LATE_THRESHOLD_MINUTES = 15;

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function hoursMinutes(ms: number) {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

function entryDuration(entry: AttendanceEntry): number {
  if (!entry.clockOut) return 0;
  return new Date(entry.clockOut).getTime() - new Date(entry.clockIn).getTime();
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function AttendancePage() {
  const [entries, setEntries] = useLocalStorage<AttendanceEntry[]>(
    "hr-attendance",
    []
  );
  const [now, setNow] = useState(new Date());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());

  // Tick clock every second
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const today = todayStr();
  const todayEntry = entries.find((e) => e.date === today);
  const isClockedIn = todayEntry && !todayEntry.clockOut;

  function clockIn() {
    if (todayEntry) return;
    const nowISO = new Date().toISOString();
    const hour = new Date().getHours();
    const minute = new Date().getMinutes();
    const lateMinutes = (hour - WORK_START) * 60 + minute;
    const status =
      lateMinutes > LATE_THRESHOLD_MINUTES ? "late" : "on-time";
    setEntries((prev) => [
      ...prev,
      { id: generateId(), date: today, clockIn: nowISO, status },
    ]);
  }

  function clockOut() {
    if (!isClockedIn) return;
    setEntries((prev) =>
      prev.map((e) =>
        e.id === todayEntry!.id
          ? { ...e, clockOut: new Date().toISOString() }
          : e
      )
    );
  }

  // Today hours
  const todayMs = todayEntry
    ? todayEntry.clockOut
      ? entryDuration(todayEntry)
      : now.getTime() - new Date(todayEntry.clockIn).getTime()
    : 0;

  // This week
  const weekMs = useMemo(() => {
    const curr = new Date(now);
    const day = curr.getDay();
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - ((day + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    return entries
      .filter((e) => new Date(e.clockIn) >= monday)
      .reduce((sum, e) => sum + entryDuration(e), 0);
  }, [entries, now]);

  // Monthly stats
  const monthStats = useMemo(() => {
    const prefix = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
    const monthEntries = entries.filter((e) => e.date.startsWith(prefix));
    return {
      present: monthEntries.filter((e) => e.status !== "absent").length,
      late: monthEntries.filter((e) => e.status === "late").length,
      absent: monthEntries.filter((e) => e.status === "absent").length,
    };
  }, [entries, calMonth, calYear]);

  // Calendar days data
  const calDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(calYear, calMonth);
    const firstDay = getFirstDayOfMonth(calYear, calMonth);
    const cells: (AttendanceEntry | null | undefined)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(undefined); // padding
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const entry = entries.find((e) => e.date === dateStr) || null;
      cells.push(entry);
    }
    return cells;
  }, [entries, calMonth, calYear]);

  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  }

  function deleteEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function exportCSV() {
    const rows = [
      ["Date", "Clock In", "Clock Out", "Duration", "Status"],
      ...entries.map((e) => [
        e.date,
        formatTime(e.clockIn),
        e.clockOut ? formatTime(e.clockOut) : "—",
        e.clockOut ? hoursMinutes(entryDuration(e)) : "—",
        e.status,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "attendance.csv";
    a.click();
  }

  const monthName = new Date(calYear, calMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance Tracker"
        description="Clock in/out, view daily logs, and monitor monthly attendance"
        icon={Clock}
        badge="HR"
      />

      {/* Clock widget */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="sm:col-span-2 bg-gradient-to-br from-violet-500/10 to-pink-500/10 border-violet-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-4xl font-bold tabular-nums tracking-tight">
                  {now.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {now.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                {todayEntry && (
                  <div className="flex items-center gap-2 mt-3">
                    <Badge className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border-0 text-xs">
                      Clocked in at {formatTime(todayEntry.clockIn)}
                    </Badge>
                    {todayEntry.status === "late" && (
                      <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 text-xs">
                        Late
                      </Badge>
                    )}
                    {todayEntry.status === "on-time" && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-xs">
                        On Time
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {!todayEntry ? (
                  <Button
                    size="lg"
                    onClick={clockIn}
                    className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white gap-2"
                  >
                    <LogIn className="h-5 w-5" />
                    Clock In
                  </Button>
                ) : isClockedIn ? (
                  <Button
                    size="lg"
                    onClick={clockOut}
                    variant="outline"
                    className="border-violet-500/30 gap-2"
                  >
                    <LogOut className="h-5 w-5" />
                    Clock Out
                  </Button>
                ) : (
                  <Badge className="text-sm px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Day Complete
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-rows-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Today</p>
              <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                {hoursMinutes(todayMs)}
              </p>
              <p className="text-xs text-muted-foreground">hours worked</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">This Week</p>
              <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {hoursMinutes(weekMs)}
              </p>
              <p className="text-xs text-muted-foreground">hours worked</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Daily log */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold">Attendance Log</CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="py-10 text-center">
              <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">No attendance records yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {[...entries]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 30)
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 px-5 py-3 text-sm"
                  >
                    <div className="w-28 font-medium text-xs">
                      {new Date(entry.date + "T12:00:00").toLocaleDateString(
                        "en-US",
                        { weekday: "short", month: "short", day: "numeric" }
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <LogIn className="h-3 w-3" />
                      {formatTime(entry.clockIn)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <LogOut className="h-3 w-3" />
                      {entry.clockOut ? formatTime(entry.clockOut) : "—"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.clockOut
                        ? hoursMinutes(entryDuration(entry))
                        : "In progress"}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {entry.status === "on-time" && (
                        <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          On Time
                        </Badge>
                      )}
                      {entry.status === "late" && (
                        <Badge className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Late
                        </Badge>
                      )}
                      {entry.status === "absent" && (
                        <Badge className="text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 border-0">
                          <XCircle className="h-3 w-3 mr-1" />
                          Absent
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-500 shrink-0"
                        onClick={() => deleteEntry(entry.id)}
                        title="Delete record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly calendar view */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-violet-500" />
              <CardTitle className="text-sm font-semibold">{monthName}</CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500/60" />
                  On Time ({monthStats.present - monthStats.late})
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500/60" />
                  Late ({monthStats.late})
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-400/40" />
                  Absent ({monthStats.absent})
                </span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={prevMonth} className="h-7 w-7 p-0">
                  ‹
                </Button>
                <Button variant="ghost" size="sm" onClick={nextMonth} className="h-7 w-7 p-0">
                  ›
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="text-[10px] text-muted-foreground font-medium py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((entry, idx) => {
              const dayNum =
                idx -
                getFirstDayOfMonth(calYear, calMonth) +
                1;
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isToday = dateStr === today;
              const isPast = dateStr < today;

              if (entry === undefined) {
                return <div key={idx} />;
              }

              let bg = "bg-muted/20";
              if (entry === null && isPast && dayNum >= 1) {
                const dow = new Date(dateStr + "T12:00:00").getDay();
                if (dow !== 0 && dow !== 6) bg = "bg-red-400/20";
              } else if (entry?.status === "on-time") bg = "bg-emerald-500/20";
              else if (entry?.status === "late") bg = "bg-amber-500/20";

              return (
                <div
                  key={idx}
                  className={`relative aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-colors ${bg} ${isToday ? "ring-2 ring-violet-500" : ""}`}
                >
                  {dayNum > 0 ? dayNum : ""}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-violet-500" />
            <span>
              {monthStats.present} days present in {monthName}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
