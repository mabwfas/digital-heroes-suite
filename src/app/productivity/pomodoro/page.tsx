"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Timer, Play, Square, SkipForward, RotateCcw, Coffee, Flame } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface PomodoroSession {
  id: string;
  task: string;
  duration: number;
  date: string;
  completed: boolean;
}

type Phase = "work" | "break" | "longbreak" | "idle";

export default function PomodoroPage() {
  const [sessions, setSessions] = useLocalStorage<PomodoroSession[]>("productivity-pomodoro-sessions", []);
  const [workDuration] = useState(25 * 60);
  const [breakDuration] = useState(5 * 60);
  const [longBreakDuration] = useState(15 * 60);
  const [sessionsBeforeLong] = useState(4);

  const [phase, setPhase] = useState<Phase>("idle");
  const [timeLeft, setTimeLeft] = useState(workDuration);
  const [currentTask, setCurrentTask] = useState("");
  const [completedCount, setCompletedCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const todaySessions = useMemo(() => sessions.filter((s) => s.date === today), [sessions, today]);

  const streak = useMemo(() => {
    const dates = [...new Set(sessions.filter((s) => s.completed).map((s) => s.date))].sort().reverse();
    let count = 0;
    const d = new Date();
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(d);
      expected.setDate(expected.getDate() - i);
      if (dates[i] === expected.toISOString().split("T")[0]) count++;
      else break;
    }
    return count;
  }, [sessions]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (phase === "idle") {
      clearTimer();
      return;
    }
    clearTimer();
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          if (phase === "work") {
            const session: PomodoroSession = {
              id: generateId(),
              task: currentTask || "Untitled",
              duration: workDuration,
              date: today,
              completed: true,
            };
            setSessions((s) => [session, ...s]);
            const newCount = completedCount + 1;
            setCompletedCount(newCount);
            if (newCount % sessionsBeforeLong === 0) {
              setPhase("longbreak");
              return longBreakDuration;
            } else {
              setPhase("break");
              return breakDuration;
            }
          } else {
            setPhase("idle");
            return workDuration;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [phase, clearTimer, workDuration, breakDuration, longBreakDuration, completedCount, sessionsBeforeLong, currentTask, today, setSessions]);

  function startWork() {
    setPhase("work");
    setTimeLeft(workDuration);
  }

  function stop() {
    clearTimer();
    setPhase("idle");
    setTimeLeft(workDuration);
  }

  function skip() {
    clearTimer();
    if (phase === "work") {
      setPhase("break");
      setTimeLeft(breakDuration);
    } else {
      setPhase("idle");
      setTimeLeft(workDuration);
    }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  const progress = phase === "work"
    ? ((workDuration - timeLeft) / workDuration) * 100
    : phase === "break"
    ? ((breakDuration - timeLeft) / breakDuration) * 100
    : phase === "longbreak"
    ? ((longBreakDuration - timeLeft) / longBreakDuration) * 100
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pomodoro Timer"
        description="25min work / 5min break cycles with long breaks, daily session log, and streak tracking."
        icon={Timer}
        badge="Productivity"
        replaces="Pomofocus / Forest"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{todaySessions.length}</p><p className="text-xs text-muted-foreground">Sessions Today</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{Math.round(todaySessions.reduce((s, se) => s + se.duration, 0) / 60)}m</p><p className="text-xs text-muted-foreground">Focus Time Today</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{sessions.length}</p><p className="text-xs text-muted-foreground">Total Sessions</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold flex items-center gap-1"><Flame className="h-5 w-5 text-orange-500" />{streak}</p><p className="text-xs text-muted-foreground">Day Streak</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center">
            <div className="relative w-64 h-64 mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/30" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${progress * 2.83} ${283 - progress * 2.83}`}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-5xl font-bold tracking-wider tabular-nums">{formatTime(timeLeft)}</span>
                <Badge className={`mt-2 border-0 ${phase === "work" ? "bg-violet-500/10 text-violet-600" : phase === "break" || phase === "longbreak" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                  {phase === "work" ? "Focus" : phase === "break" ? "Short Break" : phase === "longbreak" ? "Long Break" : "Ready"}
                </Badge>
              </div>
            </div>

            {phase === "idle" && (
              <div className="flex flex-col items-center gap-3 w-full max-w-sm">
                <Input
                  value={currentTask}
                  onChange={(e) => setCurrentTask(e.target.value)}
                  placeholder="What are you working on?"
                  className="text-center"
                  onKeyDown={(e) => e.key === "Enter" && startWork()}
                />
                <Button onClick={startWork} size="lg" className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0 w-full">
                  <Play className="h-5 w-5 mr-2" />Start Focus Session
                </Button>
              </div>
            )}

            {phase !== "idle" && (
              <div className="flex gap-3">
                <Button variant="outline" onClick={stop}><Square className="h-4 w-4 mr-2" />Stop</Button>
                <Button variant="outline" onClick={skip}><SkipForward className="h-4 w-4 mr-2" />Skip</Button>
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              {Array.from({ length: sessionsBeforeLong }, (_, i) => (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-full ${i < completedCount % sessionsBeforeLong ? "bg-violet-500" : "bg-muted"}`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                {sessionsBeforeLong - (completedCount % sessionsBeforeLong)} until long break
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {todaySessions.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Today&apos;s Sessions</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {todaySessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 text-sm">
                  <Timer className="h-3.5 w-3.5 text-violet-500" />
                  <span className="font-medium flex-1">{s.task}</span>
                  <span className="text-muted-foreground">{Math.round(s.duration / 60)}m</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
