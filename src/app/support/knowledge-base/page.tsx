"use client";

import { useState, useMemo, useCallback } from "react";
import { BookOpen, Plus, Search, Edit2, Trash2, Eye, ThumbsUp, ThumbsDown, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface KBArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string;
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: string;
}

const CATEGORIES = ["Getting Started", "Account & Billing", "Technical", "Troubleshooting", "Features", "Integrations", "FAQ"];

const EMPTY: Omit<KBArticle, "id" | "createdAt" | "views" | "helpful" | "notHelpful"> = {
  title: "", category: "Getting Started", content: "", tags: "",
};

export default function KnowledgeBasePage() {
  const [articles, setArticles, hydrated] = useLocalStorage<KBArticle[]>("kb-articles", []);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewArticle, setViewArticle] = useState<KBArticle | null>(null);
  const [form, setForm] = useState(EMPTY);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase()) || a.tags.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === "all" || a.category === filterCat;
      return matchSearch && matchCat;
    });
  }, [articles, search, filterCat]);

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    articles.forEach((a) => { counts[a.category] = (counts[a.category] || 0) + 1; });
    return counts;
  }, [articles]);

  const openAdd = useCallback(() => { setForm(EMPTY); setEditingId(null); setShowForm(true); }, []);
  const openEdit = useCallback((a: KBArticle) => {
    setForm({ title: a.title, category: a.category, content: a.content, tags: a.tags });
    setEditingId(a.id); setShowForm(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.title.trim()) return;
    if (editingId) {
      setArticles((prev) => prev.map((a) => a.id === editingId ? { ...a, ...form } : a));
    } else {
      setArticles((prev) => [{ ...form, id: generateId(), createdAt: new Date().toISOString(), views: 0, helpful: 0, notHelpful: 0 }, ...prev]);
    }
    setShowForm(false); setEditingId(null);
  }, [form, editingId, setArticles]);

  const viewAndCount = useCallback((a: KBArticle) => {
    setArticles((prev) => prev.map((x) => x.id === a.id ? { ...x, views: x.views + 1 } : x));
    setViewArticle({ ...a, views: a.views + 1 });
  }, [setArticles]);

  const vote = useCallback((id: string, helpful: boolean) => {
    setArticles((prev) => prev.map((a) => a.id === id ? { ...a, helpful: a.helpful + (helpful ? 1 : 0), notHelpful: a.notHelpful + (helpful ? 0 : 1) } : a));
    if (viewArticle?.id === id) {
      setViewArticle((v) => v ? { ...v, helpful: v.helpful + (helpful ? 1 : 0), notHelpful: v.notHelpful + (helpful ? 0 : 1) } : v);
    }
  }, [setArticles, viewArticle]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Base Builder"
        description="Create and manage help articles. Track views and helpfulness feedback."
        icon={BookOpen}
        badge="Support"
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search articles..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCat} onValueChange={(v) => setFilterCat(v as string)}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c} ({categories[c] || 0})</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">
          <Plus className="h-4 w-4 mr-2" />New Article
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">{articles.length === 0 ? "No articles yet." : "No matching articles."}</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((article) => (
            <Card key={article.id} className="border-border/50 hover:border-violet-500/30 transition-colors group">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm cursor-pointer hover:text-violet-600 transition-colors" onClick={() => viewAndCount(article)}>{article.title}</span>
                      <Badge variant="secondary" className="text-[10px]">{article.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{article.content}</p>
                    <div className="flex gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <span><Eye className="h-3 w-3 inline mr-0.5" />{article.views} views</span>
                      <span><ThumbsUp className="h-3 w-3 inline mr-0.5" />{article.helpful}</span>
                      <span><ThumbsDown className="h-3 w-3 inline mr-0.5" />{article.notHelpful}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => viewAndCount(article)}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(article)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => setArticles((p) => p.filter((a) => a.id !== article.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Article" : "New KB Article"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label>Title *</Label><Input placeholder="Article title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v ?? f.category }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Tags</Label><Input placeholder="e.g. setup, billing" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Content *</Label><Textarea placeholder="Article content..." value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={8} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">{editingId ? "Save" : "Publish Article"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewArticle} onOpenChange={(o) => !o && setViewArticle(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewArticle?.title}</DialogTitle></DialogHeader>
          {viewArticle && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{viewArticle.category}</Badge>
                <span className="text-xs text-muted-foreground"><Eye className="h-3 w-3 inline mr-0.5" />{viewArticle.views} views</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{viewArticle.content}</p>
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground mb-2">Was this article helpful?</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => vote(viewArticle.id, true)}><ThumbsUp className="h-3.5 w-3.5 mr-1" />Yes ({viewArticle.helpful})</Button>
                  <Button variant="outline" size="sm" onClick={() => vote(viewArticle.id, false)}><ThumbsDown className="h-3.5 w-3.5 mr-1" />No ({viewArticle.notHelpful})</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
