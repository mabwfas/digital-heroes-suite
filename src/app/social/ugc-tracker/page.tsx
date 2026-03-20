"use client";

import { useState, useCallback } from "react";
import { Camera, Plus, Trash2, Edit2, Check, X, Filter } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface UGCEntry {
  id: string;
  creator: string;
  platform: string;
  contentUrl: string;
  usageRights: "Full" | "Limited" | "Pending" | "None";
  status: "Received" | "Approved" | "Published" | "Rejected";
  usedIn: string;
  notes: string;
  addedAt: string;
}

const PLATFORMS = ["Instagram", "TikTok", "Twitter/X", "YouTube", "Facebook", "Other"];
const RIGHTS = ["Full", "Limited", "Pending", "None"] as const;
const STATUSES = ["Received", "Approved", "Published", "Rejected"] as const;

const statusColor = (s: string) => s === "Published" ? "bg-emerald-500/10 text-emerald-600" : s === "Approved" ? "bg-blue-500/10 text-blue-600" : s === "Rejected" ? "bg-red-500/10 text-red-600" : "bg-amber-500/10 text-amber-600";
const rightsColor = (r: string) => r === "Full" ? "bg-emerald-500/10 text-emerald-600" : r === "Limited" ? "bg-amber-500/10 text-amber-600" : r === "None" ? "bg-red-500/10 text-red-600" : "bg-gray-500/10 text-gray-600";

export default function UGCTrackerPage() {
  const [entries, setEntries, hydrated] = useLocalStorage<UGCEntry[]>("ugc-tracker", []);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const [creator, setCreator] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [contentUrl, setContentUrl] = useState("");
  const [usageRights, setUsageRights] = useState<UGCEntry["usageRights"]>("Pending");
  const [status, setStatus] = useState<UGCEntry["status"]>("Received");
  const [usedIn, setUsedIn] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => { setCreator(""); setPlatform("Instagram"); setContentUrl(""); setUsageRights("Pending"); setStatus("Received"); setUsedIn(""); setNotes(""); setEditId(null); setShowForm(false); };

  const handleSave = useCallback(() => {
    if (!creator.trim()) return;
    if (editId) {
      setEntries(prev => prev.map(e => e.id === editId ? { ...e, creator: creator.trim(), platform, contentUrl: contentUrl.trim(), usageRights, status, usedIn: usedIn.trim(), notes: notes.trim() } : e));
    } else {
      const entry: UGCEntry = { id: generateId(), creator: creator.trim(), platform, contentUrl: contentUrl.trim(), usageRights, status, usedIn: usedIn.trim(), notes: notes.trim(), addedAt: new Date().toISOString() };
      setEntries(prev => [entry, ...prev]);
    }
    resetForm();
  }, [creator, platform, contentUrl, usageRights, status, usedIn, notes, editId, setEntries]);

  const handleEdit = (e: UGCEntry) => {
    setEditId(e.id); setCreator(e.creator); setPlatform(e.platform); setContentUrl(e.contentUrl);
    setUsageRights(e.usageRights); setStatus(e.status); setUsedIn(e.usedIn); setNotes(e.notes); setShowForm(true);
  };

  const filtered = filterStatus === "All" ? entries : entries.filter(e => e.status === filterStatus);

  const counts = { All: entries.length, Received: entries.filter(e => e.status === "Received").length, Approved: entries.filter(e => e.status === "Approved").length, Published: entries.filter(e => e.status === "Published").length, Rejected: entries.filter(e => e.status === "Rejected").length };

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="UGC Content Tracker"
        description="Log and track user-generated content: creators, rights, status, and usage."
        icon={Camera}
        badge="Free"
        actions={
          <Button variant="outline" size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "Add UGC"}
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["All", ...STATUSES] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`rounded-lg border p-3 text-center transition-all ${filterStatus === s ? "border-violet-500 bg-violet-500/10" : "hover:border-violet-300"}`}
          >
            <p className="text-lg font-bold">{counts[s as keyof typeof counts]}</p>
            <p className="text-xs text-muted-foreground">{s}</p>
          </button>
        ))}
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{editId ? "Edit" : "Add"} UGC Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Creator Name / Handle</Label>
                <Input placeholder="@creator" value={creator} onChange={e => setCreator(e.target.value)} />
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
            <div className="space-y-1.5">
              <Label>Content URL</Label>
              <Input placeholder="https://..." value={contentUrl} onChange={e => setContentUrl(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Usage Rights</Label>
                <div className="flex flex-wrap gap-2">
                  {RIGHTS.map(r => (
                    <button key={r} onClick={() => setUsageRights(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${usageRights === r ? "border-violet-500 bg-violet-500/10 text-violet-600" : "border-border hover:border-violet-300"}`}
                    >{r}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => setStatus(s)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${status === s ? "border-violet-500 bg-violet-500/10 text-violet-600" : "border-border hover:border-violet-300"}`}
                    >{s}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Used In</Label>
                <Input placeholder="Ad campaign, website, social post..." value={usedIn} onChange={e => setUsedIn(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input placeholder="Additional notes..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
            <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleSave} disabled={!creator.trim()}>
              {editId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {editId ? "Update" : "Add"} Entry
            </Button>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Camera className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No UGC entries found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Creator</th>
                  <th className="p-3 text-left font-medium">Platform</th>
                  <th className="p-3 text-left font-medium">Rights</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-left font-medium">Used In</th>
                  <th className="p-3 text-left font-medium">Date</th>
                  <th className="p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{e.creator}</td>
                    <td className="p-3"><Badge variant="secondary" className="text-[10px]">{e.platform}</Badge></td>
                    <td className="p-3"><Badge variant="secondary" className={`text-[10px] ${rightsColor(e.usageRights)}`}>{e.usageRights}</Badge></td>
                    <td className="p-3"><Badge variant="secondary" className={`text-[10px] ${statusColor(e.status)}`}>{e.status}</Badge></td>
                    <td className="p-3 text-muted-foreground text-xs">{e.usedIn || "—"}</td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(e.addedAt).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(e)}><Edit2 className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setEntries(prev => prev.filter(x => x.id !== e.id))}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
