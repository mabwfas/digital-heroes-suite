"use client";

import { useState, useMemo } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Pencil,
  Search,
  Copy,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  History,
  X,
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

const CATEGORIES = ["Development", "Design", "Sales", "Operations", "HR", "Marketing"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<Category, string> = {
  Development: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Design: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  Sales: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Operations: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  HR: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  Marketing: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
};

interface SOPVersion {
  id: string;
  content: string;
  version: string;
  updatedAt: string;
  author: string;
}

interface SOP {
  id: string;
  title: string;
  category: Category;
  content: string;
  version: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  versions: SOPVersion[];
}

export default function SOPBasePage() {
  const [sops, setSops] = useLocalStorage<SOP[]>("hr-ext-sop-base", []);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    category: "Development" as Category,
    content: "",
    author: "",
  });

  const filtered = useMemo(() => {
    return sops.filter((s) => {
      const matchSearch =
        !search ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.content.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === "all" || s.category === filterCategory;
      return matchSearch && matchCat;
    });
  }, [sops, search, filterCategory]);

  function openCreate() {
    setEditingId(null);
    setForm({ title: "", category: "Development", content: "", author: "" });
    setDialogOpen(true);
  }

  function openEdit(sop: SOP) {
    setEditingId(sop.id);
    setForm({
      title: sop.title,
      category: sop.category,
      content: sop.content,
      author: sop.author,
    });
    setDialogOpen(true);
  }

  function save() {
    if (!form.title.trim() || !form.content.trim()) return;
    const now = new Date().toISOString();
    if (editingId) {
      setSops((prev) =>
        prev.map((s) => {
          if (s.id !== editingId) return s;
          const currentVersion = parseInt(s.version.replace("v", ""));
          const newVersion = `v${currentVersion + 1}`;
          const versionSnapshot: SOPVersion = {
            id: generateId(),
            content: s.content,
            version: s.version,
            updatedAt: s.updatedAt,
            author: s.author,
          };
          return {
            ...s,
            title: form.title.trim(),
            category: form.category,
            content: form.content.trim(),
            author: form.author.trim(),
            version: newVersion,
            updatedAt: now,
            versions: [versionSnapshot, ...s.versions],
          };
        })
      );
    } else {
      setSops((prev) => [
        {
          id: generateId(),
          title: form.title.trim(),
          category: form.category,
          content: form.content.trim(),
          author: form.author.trim(),
          version: "v1",
          createdAt: now,
          updatedAt: now,
          versions: [],
        },
        ...prev,
      ]);
    }
    setDialogOpen(false);
  }

  function deleteSop(id: string) {
    setSops((prev) => prev.filter((s) => s.id !== id));
  }

  function copyContent(content: string) {
    navigator.clipboard.writeText(content);
  }

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    sops.forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return counts;
  }, [sops]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="SOP Knowledge Base"
        description="Create, manage, and version control your Standard Operating Procedures"
        icon={BookOpen}
        badge="HR Extended"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total SOPs", value: sops.length, color: "text-violet-600 dark:text-violet-400" },
          { label: "Categories Used", value: Object.keys(categoryCounts).length, color: "text-pink-600 dark:text-pink-400" },
          { label: "Latest Version", value: sops.length > 0 ? sops.reduce((max, s) => { const v = parseInt(s.version.replace("v", "")); return v > max ? v : max; }, 0) : 0, color: "text-blue-600 dark:text-blue-400" },
          { label: "Total Revisions", value: sops.reduce((sum, s) => sum + s.versions.length, 0), color: "text-emerald-600 dark:text-emerald-400" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search SOPs by title or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? "all")}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          onClick={openCreate}
          className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          New SOP
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">No SOPs found. Create your first SOP.</p>
              <Button variant="outline" className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                New SOP
              </Button>
            </CardContent>
          </Card>
        ) : (
          filtered.map((sop) => {
            const isExpanded = expandedId === sop.id;
            return (
              <Card key={sop.id} className="overflow-hidden hover:border-violet-500/30 transition-colors">
                <button
                  className="w-full text-left"
                  onClick={() => setExpandedId(isExpanded ? null : sop.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center shrink-0">
                          <BookOpen className="h-4 w-4 text-violet-500" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{sop.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <Badge className={`text-[10px] border-0 ${CATEGORY_COLORS[sop.category]}`}>
                              {sop.category}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px]">{sop.version}</Badge>
                            {sop.author && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />{sop.author}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(sop.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); copyContent(sop.content); }}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        {sop.versions.length > 0 && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setHistoryId(historyId === sop.id ? null : sop.id); }}>
                            <History className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(sop); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={(e) => { e.stopPropagation(); deleteSop(sop.id); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>
                {isExpanded && (
                  <CardContent className="pt-0 pb-5 px-5">
                    <Separator className="mb-4" />
                    <div className="whitespace-pre-wrap text-sm text-foreground/80 bg-muted/30 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                      {sop.content}
                    </div>
                  </CardContent>
                )}
                {historyId === sop.id && sop.versions.length > 0 && (
                  <CardContent className="pt-0 pb-5 px-5">
                    <Separator className="mb-4" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Version History</p>
                    <div className="space-y-2">
                      {sop.versions.map((v) => (
                        <div key={v.id} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2">
                          <Badge variant="secondary" className="text-[10px]">{v.version}</Badge>
                          <span className="text-xs text-muted-foreground flex-1">
                            by {v.author || "Unknown"} on {new Date(v.updatedAt).toLocaleDateString()}
                          </span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyContent(v.content)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit SOP" : "New SOP"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="SOP title" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as Category }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Author</Label>
                <Input value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} placeholder="Author name" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Content *</Label>
              <Textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} placeholder="Write SOP content..." rows={12} className="mt-1 font-mono text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.title.trim() || !form.content.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">
              {editingId ? "Save Changes" : "Create SOP"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
