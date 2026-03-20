"use client";

import { useState, useMemo } from "react";
import {
  Megaphone,
  Plus,
  Trash2,
  Pin,
  Search,
  Eye,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type Priority = "normal" | "important" | "urgent";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: Priority;
  author: string;
  tags: string[];
  pinned: boolean;
  readBy: string[];
  createdAt: string;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; dot: string }> = {
  normal: { label: "Normal", color: "bg-slate-500/10 text-slate-600 dark:text-slate-400", dot: "bg-slate-400" },
  important: { label: "Important", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  urgent: { label: "Urgent", color: "bg-red-500/10 text-red-600 dark:text-red-400", dot: "bg-red-500" },
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useLocalStorage<Announcement[]>("team-announcements", []);
  const [currentUser] = useLocalStorage<string>("team-announcements-user", "Me");
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", priority: "normal" as Priority, author: "", tags: "" });

  const filtered = useMemo(() => {
    const sorted = [...announcements].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
    return sorted.filter((a) => {
      const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase());
      const matchPriority = filterPriority === "all" || a.priority === filterPriority;
      return matchSearch && matchPriority;
    });
  }, [announcements, search, filterPriority]);

  function openCreate() {
    setForm({ title: "", content: "", priority: "normal", author: "", tags: "" });
    setDialogOpen(true);
  }

  function save() {
    if (!form.title.trim() || !form.content.trim()) return;
    setAnnouncements((prev) => [
      {
        id: generateId(),
        title: form.title.trim(),
        content: form.content.trim(),
        priority: form.priority,
        author: form.author.trim() || "Anonymous",
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        pinned: false,
        readBy: [],
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setDialogOpen(false);
  }

  function deleteAnnouncement(id: string) {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  }

  function togglePin(id: string) {
    setAnnouncements((prev) => prev.map((a) => a.id === id ? { ...a, pinned: !a.pinned } : a));
  }

  function acknowledgeAnnouncement(id: string) {
    setAnnouncements((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        if (a.readBy.includes(currentUser)) return a;
        return { ...a, readBy: [...a.readBy, currentUser] };
      })
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internal Announcement Board"
        description="Post and manage team-wide announcements with priority levels"
        icon={Megaphone}
        badge="Team"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Announcements", value: announcements.length, color: "text-violet-600 dark:text-violet-400" },
          { label: "Pinned", value: announcements.filter((a) => a.pinned).length, color: "text-pink-600 dark:text-pink-400" },
          { label: "Urgent", value: announcements.filter((a) => a.priority === "urgent").length, color: "text-red-600 dark:text-red-400" },
          { label: "This Week", value: announcements.filter((a) => new Date(a.createdAt) > new Date(Date.now() - 7 * 86400000)).length, color: "text-emerald-600 dark:text-emerald-400" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground mt-0.5">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search announcements..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v ?? "all")}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Priorities" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="important">Important</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={openCreate} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">
          <Plus className="h-3.5 w-3.5 mr-1.5" />New Announcement
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-16 text-center"><Megaphone className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" /><p className="text-sm text-muted-foreground">No announcements yet.</p><Button variant="outline" className="mt-4" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Post Announcement</Button></CardContent></Card>
        ) : (
          filtered.map((ann) => {
            const isExpanded = expandedId === ann.id;
            const priorityCfg = PRIORITY_CONFIG[ann.priority];
            const isRead = ann.readBy.includes(currentUser);
            return (
              <Card key={ann.id} className={`overflow-hidden transition-colors ${ann.pinned ? "border-violet-500/30" : ann.priority === "urgent" ? "border-red-500/30" : "hover:border-violet-500/30"}`}>
                <button className="w-full text-left" onClick={() => setExpandedId(isExpanded ? null : ann.id)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        {ann.pinned && <Pin className="h-4 w-4 text-violet-500 shrink-0" />}
                        <div className={`h-2 w-2 rounded-full shrink-0 ${priorityCfg.dot}`} />
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{ann.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge className={`text-[10px] border-0 ${priorityCfg.color}`}>{priorityCfg.label}</Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />{ann.author}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(ann.createdAt).toLocaleDateString()}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" />{ann.readBy.length}</span>
                            {ann.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className={`h-7 w-7 ${ann.pinned ? "text-violet-500" : ""}`} onClick={(e) => { e.stopPropagation(); togglePin(ann.id); }}><Pin className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={(e) => { e.stopPropagation(); deleteAnnouncement(ann.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {isExpanded && (
                  <CardContent className="pt-0 pb-5 px-5">
                    <Separator className="mb-4" />
                    <div className="whitespace-pre-wrap text-sm text-foreground/80 mb-4">{ann.content}</div>
                    {!isRead && (
                      <Button size="sm" variant="outline" onClick={() => acknowledgeAnnouncement(ann.id)}>
                        <Eye className="h-3.5 w-3.5 mr-1.5" />Mark as Read
                      </Button>
                    )}
                    {isRead && <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-0">Read</Badge>}
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Announcement title" className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Priority }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Author</Label><Input value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} placeholder="Your name" className="mt-1" /></div>
            </div>
            <div><Label>Content *</Label><Textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={6} className="mt-1" /></div>
            <div><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="e.g. policy, update, event" className="mt-1" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.title.trim() || !form.content.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">Post Announcement</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
