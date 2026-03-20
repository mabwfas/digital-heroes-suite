"use client";

import { useState, useCallback } from "react";
import { CalendarDays, Plus, Trash2, X, Download, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface ScheduledPost {
  id: string;
  day: string;
  time: string;
  content: string;
  platform: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_SLOTS = ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];

const BEST_TIMES: Record<string, Record<string, string[]>> = {
  Instagram: { Monday: ["11:00", "14:00"], Tuesday: ["10:00", "14:00"], Wednesday: ["11:00"], Thursday: ["12:00", "14:00"], Friday: ["10:00", "14:00"], Saturday: ["09:00"], Sunday: ["10:00"] },
  "Twitter/X": { Monday: ["08:00", "16:00"], Tuesday: ["08:00", "10:00"], Wednesday: ["09:00", "12:00"], Thursday: ["08:00", "14:00"], Friday: ["09:00"], Saturday: ["10:00"], Sunday: ["12:00"] },
  LinkedIn: { Monday: ["10:00"], Tuesday: ["10:00", "12:00"], Wednesday: ["10:00", "12:00"], Thursday: ["10:00", "14:00"], Friday: ["10:00"], Saturday: [], Sunday: [] },
  TikTok: { Monday: ["12:00", "16:00"], Tuesday: ["09:00", "18:00"], Wednesday: ["12:00", "19:00"], Thursday: ["15:00", "18:00"], Friday: ["17:00"], Saturday: ["11:00"], Sunday: ["14:00"] },
};

export default function PostSchedulerPage() {
  const [posts, setPosts, hydrated] = useLocalStorage<ScheduledPost[]>("post-schedule", []);
  const [editingSlot, setEditingSlot] = useState<{ day: string; time: string } | null>(null);
  const [newContent, setNewContent] = useState("");
  const [newPlatform, setNewPlatform] = useState("Instagram");
  const [selectedPlatform, setSelectedPlatform] = useState("Instagram");

  const handleAdd = useCallback(() => {
    if (!editingSlot || !newContent.trim()) return;
    const post: ScheduledPost = {
      id: generateId(),
      day: editingSlot.day,
      time: editingSlot.time,
      content: newContent.trim(),
      platform: newPlatform,
    };
    setPosts(prev => [...prev, post]);
    setEditingSlot(null);
    setNewContent("");
  }, [editingSlot, newContent, newPlatform, setPosts]);

  const handleRemove = useCallback((id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  }, [setPosts]);

  const handleExport = useCallback(() => {
    const lines = ["Day,Time,Platform,Content"];
    posts.forEach(p => lines.push(`${p.day},${p.time},${p.platform},"${p.content.replace(/"/g, '""')}"`));
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "post-schedule.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [posts]);

  const bestTimes = BEST_TIMES[selectedPlatform] || {};

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Post Schedule Planner"
        description="Plan your weekly posting schedule with best time suggestions per platform."
        icon={CalendarDays}
        badge="Free"
        actions={
          <Button variant="outline" size="sm" onClick={handleExport} disabled={posts.length === 0}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-2">
        {Object.keys(BEST_TIMES).map(p => (
          <button key={p} onClick={() => setSelectedPlatform(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedPlatform === p ? "border-violet-500 bg-violet-500/10 text-violet-600" : "border-border hover:border-violet-300"}`}
          >{p}</button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs min-w-[800px]">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left font-medium text-muted-foreground w-16">Time</th>
                {DAYS.map(d => (
                  <th key={d} className="p-2 text-center font-medium text-muted-foreground">{d.slice(0, 3)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map(time => (
                <tr key={time} className="border-b last:border-0">
                  <td className="p-2 font-mono text-muted-foreground">{time}</td>
                  {DAYS.map(day => {
                    const slotPosts = posts.filter(p => p.day === day && p.time === time);
                    const isBest = (bestTimes[day] || []).includes(time);
                    return (
                      <td key={day} className={`p-1 text-center relative ${isBest ? "bg-emerald-500/5" : ""}`}>
                        {isBest && slotPosts.length === 0 && (
                          <div className="absolute top-0.5 right-0.5">
                            <Clock className="h-2.5 w-2.5 text-emerald-500" />
                          </div>
                        )}
                        {slotPosts.map(p => (
                          <div key={p.id} className="bg-violet-500/10 rounded p-1 mb-1 group relative">
                            <p className="text-[10px] truncate">{p.content}</p>
                            <Badge variant="secondary" className="text-[8px] h-3 mt-0.5">{p.platform}</Badge>
                            <button onClick={() => handleRemove(p.id)} className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => { setEditingSlot({ day, time }); setNewPlatform(selectedPlatform); }}
                          className="w-full py-1 rounded hover:bg-muted transition-colors text-muted-foreground/40 hover:text-muted-foreground"
                        >
                          <Plus className="h-3 w-3 mx-auto" />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {editingSlot && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Add Post — {editingSlot.day} at {editingSlot.time}</CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => setEditingSlot(null)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Content</Label>
              <Input placeholder="What will you post?" value={newContent} onChange={e => setNewContent(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} />
            </div>
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <div className="flex gap-2">
                {Object.keys(BEST_TIMES).map(p => (
                  <button key={p} onClick={() => setNewPlatform(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${newPlatform === p ? "border-violet-500 bg-violet-500/10 text-violet-600" : "border-border hover:border-violet-300"}`}
                  >{p}</button>
                ))}
              </div>
            </div>
            <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleAdd} disabled={!newContent.trim()}>
              <Plus className="h-4 w-4" /> Add Post
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Best Times Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-3 w-3 rounded bg-emerald-500/20" />
            <span>Green cells = recommended posting times for {selectedPlatform}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
