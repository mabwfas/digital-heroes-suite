"use client";

import { useState, useCallback } from "react";
import { Users, Plus, Trash2, TrendingUp, TrendingDown, Edit2, Check, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface Competitor {
  id: string;
  name: string;
  platform: string;
  followers: number;
  engagementRate: number;
  postsPerWeek: number;
  notes: string;
  history: { date: string; followers: number; engagementRate: number }[];
  addedAt: string;
}

export default function CompetitorTrackerPage() {
  const [competitors, setCompetitors, hydrated] = useLocalStorage<Competitor[]>("competitor-tracker", []);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [followers, setFollowers] = useState("");
  const [engagement, setEngagement] = useState("");
  const [postsPerWeek, setPostsPerWeek] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => { setName(""); setPlatform("Instagram"); setFollowers(""); setEngagement(""); setPostsPerWeek(""); setNotes(""); setEditId(null); setShowForm(false); };

  const handleAdd = useCallback(() => {
    if (!name.trim()) return;
    if (editId) {
      setCompetitors(prev => prev.map(c => {
        if (c.id !== editId) return c;
        const newHistory = [...c.history, { date: new Date().toISOString(), followers: Number(followers) || 0, engagementRate: Number(engagement) || 0 }];
        return { ...c, name: name.trim(), platform, followers: Number(followers) || 0, engagementRate: Number(engagement) || 0, postsPerWeek: Number(postsPerWeek) || 0, notes: notes.trim(), history: newHistory };
      }));
    } else {
      const comp: Competitor = {
        id: generateId(), name: name.trim(), platform, followers: Number(followers) || 0,
        engagementRate: Number(engagement) || 0, postsPerWeek: Number(postsPerWeek) || 0, notes: notes.trim(),
        history: [{ date: new Date().toISOString(), followers: Number(followers) || 0, engagementRate: Number(engagement) || 0 }],
        addedAt: new Date().toISOString(),
      };
      setCompetitors(prev => [...prev, comp]);
    }
    resetForm();
  }, [name, platform, followers, engagement, postsPerWeek, notes, editId, setCompetitors]);

  const handleEdit = (c: Competitor) => {
    setEditId(c.id); setName(c.name); setPlatform(c.platform); setFollowers(String(c.followers));
    setEngagement(String(c.engagementRate)); setPostsPerWeek(String(c.postsPerWeek)); setNotes(c.notes); setShowForm(true);
  };

  const sorted = [...competitors].sort((a, b) => b.followers - a.followers);
  const PLATFORMS = ["Instagram", "Twitter/X", "LinkedIn", "TikTok", "YouTube"];

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social Competitor Tracker"
        description="Track competitor profiles, compare metrics, and monitor growth."
        icon={Users}
        badge="Free"
        actions={
          <Button variant="outline" size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "Add Competitor"}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{editId ? "Update" : "Add"} Competitor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name / Handle</Label>
                <Input placeholder="@competitor" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p} onClick={() => setPlatform(p)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${platform === p ? "border-violet-500 bg-violet-500/10 text-violet-600" : "border-border hover:border-violet-300"}`}
                    >{p}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Followers</Label>
                <Input type="number" placeholder="50000" value={followers} onChange={e => setFollowers(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Engagement Rate %</Label>
                <Input type="number" step="0.1" placeholder="2.5" value={engagement} onChange={e => setEngagement(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Posts/Week</Label>
                <Input type="number" placeholder="5" value={postsPerWeek} onChange={e => setPostsPerWeek(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input placeholder="Strategy observations..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleAdd} disabled={!name.trim()}>
              {editId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editId ? "Update" : "Add"} Competitor
            </Button>
          </CardContent>
        </Card>
      )}

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No competitors tracked yet. Add one to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Name</th>
                  <th className="p-3 text-left font-medium">Platform</th>
                  <th className="p-3 text-right font-medium">Followers</th>
                  <th className="p-3 text-right font-medium">Engagement</th>
                  <th className="p-3 text-right font-medium">Posts/Wk</th>
                  <th className="p-3 text-right font-medium">Growth</th>
                  <th className="p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(c => {
                  const growth = c.history.length >= 2 ? c.history[c.history.length - 1].followers - c.history[c.history.length - 2].followers : 0;
                  return (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3"><Badge variant="secondary" className="text-[10px]">{c.platform}</Badge></td>
                      <td className="p-3 text-right font-mono">{c.followers.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono">{c.engagementRate.toFixed(1)}%</td>
                      <td className="p-3 text-right">{c.postsPerWeek}</td>
                      <td className="p-3 text-right">
                        {growth !== 0 && (
                          <span className={`flex items-center justify-end gap-1 text-xs ${growth > 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {growth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {growth > 0 ? "+" : ""}{growth.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(c)}><Edit2 className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => setCompetitors(prev => prev.filter(x => x.id !== c.id))}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                        </div>
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
