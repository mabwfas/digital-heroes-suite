"use client";

import { useState, useMemo } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Search,
  Eye,
  Clock,
  Tag,
  FolderOpen,
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

type WikiCategory = "Process" | "Technical" | "HR" | "Sales" | "Design" | "General";

interface WikiArticle {
  id: string;
  title: string;
  category: WikiCategory;
  content: string;
  tags: string[];
  author: string;
  views: number;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES: WikiCategory[] = ["Process", "Technical", "HR", "Sales", "Design", "General"];

const CATEGORY_COLORS: Record<WikiCategory, string> = {
  Process: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0",
  Technical: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-0",
  HR: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-0",
  Sales: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0",
  Design: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0",
  General: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-0",
};

const EMPTY_FORM = { title: "", category: "General" as WikiCategory, content: "", tags: "" as string, author: "" };

export default function WikiPage() {
  const [articles, setArticles, hydrated] = useLocalStorage<WikiArticle[]>("wiki-articles", []);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<"all" | WikiCategory>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [viewArticle, setViewArticle] = useState<WikiArticle | null>(null);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const q = search.toLowerCase();
      const matchSearch = a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q) || a.tags.some((t) => t.toLowerCase().includes(q));
      const matchCat = filterCategory === "all" || a.category === filterCategory;
      return matchSearch && matchCat;
    });
  }, [articles, search, filterCategory]);

  const categoryStats = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      category: cat,
      count: articles.filter((a) => a.category === cat).length,
    }));
  }, [articles]);

  const recentArticles = useMemo(() => [...articles].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5), [articles]);
  const popularArticles = useMemo(() => [...articles].sort((a, b) => b.views - a.views).slice(0, 5), [articles]);

  function openAdd() { setForm(EMPTY_FORM); setEditingId(null); setDialogOpen(true); }
  function openEdit(article: WikiArticle) {
    setForm({ title: article.title, category: article.category, content: article.content, tags: article.tags.join(", "), author: article.author });
    setEditingId(article.id);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.title.trim()) return;
    const tags = form.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const now = new Date().toISOString();
    if (editingId) {
      setArticles((prev) => prev.map((a) => (a.id === editingId ? { ...a, title: form.title, category: form.category, content: form.content, tags, author: form.author, updatedAt: now } : a)));
    } else {
      setArticles((prev) => [{ id: generateId(), title: form.title, category: form.category, content: form.content, tags, author: form.author, views: 0, createdAt: now, updatedAt: now }, ...prev]);
    }
    setDialogOpen(false);
  }

  function handleView(article: WikiArticle) {
    setArticles((prev) => prev.map((a) => (a.id === article.id ? { ...a, views: a.views + 1 } : a)));
    setViewArticle({ ...article, views: article.views + 1 });
  }

  function handleDelete(id: string) {
    setArticles((prev) => prev.filter((a) => a.id !== id));
    if (viewArticle?.id === id) setViewArticle(null);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Company Wiki" description="Create and manage internal knowledge base articles" icon={BookOpen} badge="Knowledge" replaces="Notion / Confluence" />

      {/* Category Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {categoryStats.map((cs) => (
          <Card key={cs.category} className="border-border/50 cursor-pointer hover:border-violet-500/30 transition-colors" onClick={() => setFilterCategory(cs.category)}>
            <CardContent className="p-3 text-center">
              <Badge className={`${CATEGORY_COLORS[cs.category]} mb-1`}>{cs.category}</Badge>
              <p className="text-xl font-bold">{cs.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-violet-500" />Recent</CardTitle></CardHeader>
            <CardContent>
              {recentArticles.length === 0 ? <p className="text-sm text-muted-foreground">No articles yet</p> : (
                <div className="space-y-2">
                  {recentArticles.map((a) => (
                    <div key={a.id} className="text-sm cursor-pointer hover:text-violet-600 transition-colors" onClick={() => handleView(a)}>
                      <p className="font-medium truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(a.updatedAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Eye className="h-4 w-4 text-violet-500" />Popular</CardTitle></CardHeader>
            <CardContent>
              {popularArticles.length === 0 ? <p className="text-sm text-muted-foreground">No articles yet</p> : (
                <div className="space-y-2">
                  {popularArticles.map((a) => (
                    <div key={a.id} className="text-sm cursor-pointer hover:text-violet-600 transition-colors" onClick={() => handleView(a)}>
                      <p className="font-medium truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.views} views</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search articles..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as typeof filterCategory)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
              <Plus className="h-4 w-4 mr-2" />New Article
            </Button>
          </div>

          {filtered.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">{articles.length === 0 ? "No articles yet. Create your first wiki article!" : "No articles match your search."}</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((article) => (
                <Card key={article.id} className="border-border/50 hover:border-violet-500/30 transition-colors group cursor-pointer" onClick={() => handleView(article)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{article.title}</span>
                          <Badge className={CATEGORY_COLORS[article.category]}>{article.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{article.content.slice(0, 150)}...</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {article.author && <span>By {article.author}</span>}
                          <span>{article.views} views</span>
                          <span>Updated {new Date(article.updatedAt).toLocaleDateString()}</span>
                        </div>
                        {article.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">{article.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}</div>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(article)}><Edit2 className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(article.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewArticle} onOpenChange={(o) => !o && setViewArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {viewArticle && (<>
            <DialogHeader>
              <div className="flex items-center gap-2"><DialogTitle>{viewArticle.title}</DialogTitle><Badge className={CATEGORY_COLORS[viewArticle.category]}>{viewArticle.category}</Badge></div>
              <div className="flex gap-3 text-xs text-muted-foreground">{viewArticle.author && <span>By {viewArticle.author}</span>}<span>{viewArticle.views} views</span><span>Updated {new Date(viewArticle.updatedAt).toLocaleDateString()}</span></div>
            </DialogHeader>
            <Separator />
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{viewArticle.content}</div>
            {viewArticle.tags.length > 0 && (<><Separator /><div className="flex gap-1">{viewArticle.tags.map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}</div></>)}
          </>)}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingId ? "Edit Article" : "New Wiki Article"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v as WikiCategory }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Author</Label><Input value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} placeholder="Author name" /></div>
            <div className="space-y-1.5"><Label>Content</Label><Textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={10} /></div>
            <div className="space-y-1.5"><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="onboarding, process, team" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">{editingId ? "Save Changes" : "Create Article"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
