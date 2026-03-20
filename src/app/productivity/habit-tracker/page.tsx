"use client";

import { useState, useMemo } from "react";
import { CheckSquare, Plus, Trash2, Flame, Calendar } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface Habit {
  id: string;
  name: string;
  icon: string;
  completedDates: string[];
}

const HABIT_ICONS = ["🏋️", "📚", "💻", "🧘", "💧", "🏃", "✍️", "🎵", "🥗", "😴"];

function getDaysInRange(days: number): string[] {
  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().split("T")[0]);
  }
  return result;
}

function getStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort().reverse();
  let count = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const check = new Date(d);
    check.setDate(check.getDate() - i);
    const dateStr = check.toISOString().split("T")[0];
    if (sorted.includes(dateStr)) count++;
    else if (i > 0) break;
  }
  return count;
}

export default function HabitTrackerPage() {
  const [habits, setHabits] = useLocalStorage<Habit[]>("productivity-habits", []);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState(HABIT_ICONS[0]);
  const [viewDays, setViewDays] = useState(30);

  const today = new Date().toISOString().split("T")[0];
  const days = useMemo(() => getDaysInRange(viewDays), [viewDays]);

  function addHabit() {
    if (!newName.trim()) return;
    setHabits((prev) => [...prev, { id: generateId(), name: newName.trim(), icon: newIcon, completedDates: [] }]);
    setNewName("");
  }

  function removeHabit(id: string) {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }

  function toggleDay(habitId: string, date: string) {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const has = h.completedDates.includes(date);
        return {
          ...h,
          completedDates: has
            ? h.completedDates.filter((d) => d !== date)
            : [...h.completedDates, date],
        };
      })
    );
  }

  const stats = useMemo(() => {
    const todayComplete = habits.filter((h) => h.completedDates.includes(today)).length;
    const weekDays = getDaysInRange(7);
    const weekTotal = habits.reduce((s, h) => s + h.completedDates.filter((d) => weekDays.includes(d)).length, 0);
    const weekPossible = habits.length * 7;
    const monthDays = getDaysInRange(30);
    const monthTotal = habits.reduce((s, h) => s + h.completedDates.filter((d) => monthDays.includes(d)).length, 0);
    const monthPossible = habits.length * 30;
    return {
      todayComplete,
      todayTotal: habits.length,
      weekPct: weekPossible > 0 ? Math.round((weekTotal / weekPossible) * 100) : 0,
      monthPct: monthPossible > 0 ? Math.round((monthTotal / monthPossible) * 100) : 0,
    };
  }, [habits, today]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Habit Tracker"
        description="Define daily habits, track completion on a calendar grid, count streaks, and view weekly/monthly stats."
        icon={CheckSquare}
        badge="Productivity"
        replaces="Habitica / Streaks"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{stats.todayComplete}/{stats.todayTotal}</p><p className="text-xs text-muted-foreground">Today</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{stats.weekPct}%</p><p className="text-xs text-muted-foreground">This Week</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{stats.monthPct}%</p><p className="text-xs text-muted-foreground">This Month</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{habits.length}</p><p className="text-xs text-muted-foreground">Habits</p></CardContent></Card>
      </div>

      <div className="flex gap-3 items-end">
        <div className="flex gap-1">
          {HABIT_ICONS.map((icon) => (
            <button
              key={icon}
              onClick={() => setNewIcon(icon)}
              className={`h-8 w-8 rounded-lg border flex items-center justify-center text-sm ${newIcon === icon ? "border-violet-500 bg-violet-500/10" : "border-border/50"}`}
            >
              {icon}
            </button>
          ))}
        </div>
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New habit name..." className="flex-1" onKeyDown={(e) => e.key === "Enter" && addHabit()} />
        <Button onClick={addHabit} disabled={!newName.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
          <Plus className="h-4 w-4 mr-2" />Add Habit
        </Button>
      </div>

      <div className="flex gap-2">
        {[7, 14, 30].map((d) => (
          <Button key={d} variant={viewDays === d ? "default" : "outline"} size="sm" onClick={() => setViewDays(d)}>
            {d} days
          </Button>
        ))}
      </div>

      {habits.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><CheckSquare className="h-10 w-10 text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">Add your first habit to start tracking</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2 sticky left-0 bg-background min-w-[160px]">Habit</th>
                  {days.map((d) => {
                    const date = new Date(d + "T12:00:00");
                    const isToday = d === today;
                    return (
                      <th key={d} className={`p-1 text-center min-w-[32px] ${isToday ? "bg-violet-500/10 rounded" : ""}`}>
                        <div className="text-[9px] text-muted-foreground">{date.toLocaleDateString("en-US", { weekday: "narrow" })}</div>
                        <div className="text-[10px] text-muted-foreground">{date.getDate()}</div>
                      </th>
                    );
                  })}
                  <th className="p-2 text-center min-w-[60px]">Streak</th>
                </tr>
              </thead>
              <tbody>
                {habits.map((h) => {
                  const streak = getStreak(h.completedDates);
                  return (
                    <tr key={h.id} className="border-t border-border/50 group">
                      <td className="p-2 sticky left-0 bg-background">
                        <div className="flex items-center gap-2">
                          <span>{h.icon}</span>
                          <span className="text-sm font-medium truncate">{h.name}</span>
                          <Button variant="ghost" size="icon" className="h-5 w-5 hover:text-destructive opacity-0 group-hover:opacity-100 ml-auto shrink-0" onClick={() => removeHabit(h.id)}>
                            <Trash2 className="h-2.5 w-2.5" />
                          </Button>
                        </div>
                      </td>
                      {days.map((d) => {
                        const done = h.completedDates.includes(d);
                        const isToday = d === today;
                        return (
                          <td key={d} className={`p-1 text-center ${isToday ? "bg-violet-500/5" : ""}`}>
                            <button
                              onClick={() => toggleDay(h.id, d)}
                              className={`h-6 w-6 rounded mx-auto flex items-center justify-center transition-colors ${
                                done
                                  ? "bg-emerald-500 text-white"
                                  : "bg-muted/30 hover:bg-muted"
                              }`}
                            >
                              {done && <span className="text-[10px]">&#10003;</span>}
                            </button>
                          </td>
                        );
                      })}
                      <td className="p-2 text-center">
                        <Badge variant={streak > 0 ? "default" : "secondary"} className="text-xs">
                          <Flame className="h-3 w-3 mr-0.5" />{streak}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
