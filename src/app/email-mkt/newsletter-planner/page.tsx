"use client";

import { useState, useCallback } from "react";
import { Newspaper, Plus, Trash2, Edit2, Check, X, Calendar } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface NewsletterIssue {
  id: string;
  title: string;
  sendDate: string;
  status: "Draft" | "Planned" | "Sent";
  intro: string;
  mainStory: string;
  tips: string;
  cta: string;
  resources: string;
  createdAt: string;
}

const statusColor = (s: string) => s === "Sent" ? "bg-emerald-500/10 text-emerald-600" : s === "Planned" ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600";
const STATUSES = ["Draft", "Planned", "Sent"] as const;

export default function NewsletterPlannerPage() {
  const [issues, setIssues, hydrated] = useLocalStorage<NewsletterIssue[]>("newsletter-issues", []);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [sendDate, setSendDate] = useState("");
  const [status, setStatus] = useState<NewsletterIssue["status"]>("Draft");
  const [intro, setIntro] = useState("");
  const [mainStory, setMainStory] = useState("");
  const [tips, setTips] = useState("");
  const [cta, setCta] = useState("");
  const [resources, setResources] = useState("");
  const [filter, setFilter] = useState("All");

  const resetForm = () => { setTitle(""); setSendDate(""); setStatus("Draft"); setIntro(""); setMainStory(""); setTips(""); setCta(""); setResources(""); setEditId(null); setShowForm(false); };

  const handleSave = useCallback(() => {
    if (!title.trim()) return;
    if (editId) {
      setIssues(prev => prev.map(i => i.id === editId ? { ...i, title: title.trim(), sendDate, status, intro: intro.trim(), mainStory: mainStory.trim(), tips: tips.trim(), cta: cta.trim(), resources: resources.trim() } : i));
    } else {
      const issue: NewsletterIssue = { id: generateId(), title: title.trim(), sendDate, status, intro: intro.trim(), mainStory: mainStory.trim(), tips: tips.trim(), cta: cta.trim(), resources: resources.trim(), createdAt: new Date().toISOString() };
      setIssues(prev => [issue, ...prev]);
    }
    resetForm();
  }, [title, sendDate, status, intro, mainStory, tips, cta, resources, editId, setIssues]);

  const handleEdit = (i: NewsletterIssue) => {
    setEditId(i.id); setTitle(i.title); setSendDate(i.sendDate); setStatus(i.status);
    setIntro(i.intro); setMainStory(i.mainStory); setTips(i.tips); setCta(i.cta); setResources(i.resources); setShowForm(true);
  };

  const filtered = filter === "All" ? issues : issues.filter(i => i.status === filter);
  const counts = { All: issues.length, Draft: issues.filter(i => i.status === "Draft").length, Planned: issues.filter(i => i.status === "Planned").length, Sent: issues.filter(i => i.status === "Sent").length };

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Newsletter Content Planner"
        description="Plan newsletter issues with sections, schedule, and track status."
        icon={Newspaper}
        badge="Free"
        actions={
          <Button variant="outline" size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }}>
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "New Issue"}
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["All", ...STATUSES] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-lg border p-3 text-center transition-all ${filter === s ? "border-violet-500 bg-violet-500/10" : "hover:border-violet-300"}`}
          >
            <p className="text-lg font-bold">{counts[s as keyof typeof counts]}</p>
            <p className="text-xs text-muted-foreground">{s}</p>
          </button>
        ))}
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{editId ? "Edit" : "Plan"} Newsletter Issue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Issue Title</Label>
                <Input placeholder="March 2024 Newsletter" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Send Date</Label>
                <Input type="date" value={sendDate} onChange={e => setSendDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <div className="flex gap-2">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => setStatus(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${status === s ? "border-violet-500 bg-violet-500/10 text-violet-600" : "border-border hover:border-violet-300"}`}
                    >{s}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Intro</Label>
              <Textarea rows={2} placeholder="Opening paragraph..." value={intro} onChange={e => setIntro(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Main Story</Label>
              <Textarea rows={3} placeholder="The main feature/story..." value={mainStory} onChange={e => setMainStory(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Tips / Quick Wins</Label>
                <Textarea rows={2} placeholder="Useful tips..." value={tips} onChange={e => setTips(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>CTA</Label>
                <Textarea rows={2} placeholder="Call to action..." value={cta} onChange={e => setCta(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Resources / Links</Label>
                <Textarea rows={2} placeholder="Useful resources..." value={resources} onChange={e => setResources(e.target.value)} />
              </div>
            </div>
            <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleSave} disabled={!title.trim()}>
              {editId ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {editId ? "Update" : "Create"} Issue
            </Button>
          </CardContent>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Newspaper className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No newsletter issues yet.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(issue => (
            <Card key={issue.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm">{issue.title}</CardTitle>
                    <Badge variant="secondary" className={`text-[10px] ${statusColor(issue.status)}`}>{issue.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {issue.sendDate && <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{issue.sendDate}</span>}
                    <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(issue)}><Edit2 className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setIssues(prev => prev.filter(i => i.id !== issue.id))}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                  {[{ label: "Intro", val: issue.intro }, { label: "Main Story", val: issue.mainStory }, { label: "Tips", val: issue.tips }, { label: "CTA", val: issue.cta }, { label: "Resources", val: issue.resources }].map(s => (
                    <div key={s.label}>
                      <p className="font-medium text-muted-foreground mb-0.5">{s.label}</p>
                      <p className="text-foreground line-clamp-2">{s.val || "—"}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
