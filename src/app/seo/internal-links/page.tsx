"use client";

import { useState, useMemo } from "react";
import {
  Link2,
  Plus,
  Trash2,
  Search,
  Check,
  X,
  Copy,
  ArrowRight,
  Grid3X3,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface SitePage {
  id: string;
  url: string;
  title: string;
  mainKeyword: string;
  category: string;
}

interface LinkSuggestion {
  fromPage: SitePage;
  toPage: SitePage;
  reason: string;
  implemented: boolean;
}

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 2);
}

function findSuggestions(pages: SitePage[]): LinkSuggestion[] {
  const suggestions: LinkSuggestion[] = [];
  for (let i = 0; i < pages.length; i++) {
    for (let j = 0; j < pages.length; j++) {
      if (i === j) continue;
      const a = pages[i];
      const b = pages[j];
      const tokensA = new Set(tokenize(a.mainKeyword + " " + a.title));
      const tokensB = tokenize(b.mainKeyword + " " + b.title);
      const overlap = tokensB.filter((t) => tokensA.has(t));
      const sameCategory = a.category && b.category && a.category === b.category;
      if (overlap.length >= 1 || sameCategory) {
        const reasons: string[] = [];
        if (overlap.length > 0) reasons.push(`shared keywords: ${overlap.join(", ")}`);
        if (sameCategory) reasons.push(`same category: ${a.category}`);
        suggestions.push({
          fromPage: a,
          toPage: b,
          reason: reasons.join(" | "),
          implemented: false,
        });
      }
    }
  }
  return suggestions;
}

export default function InternalLinksPage() {
  const [pages, setPages, hydrated] = useLocalStorage<SitePage[]>("seo-internal-pages", []);
  const [implementedLinks, setImplementedLinks, _h2] = useLocalStorage<string[]>("seo-internal-implemented", []);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [mainKeyword, setMainKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [showMatrix, setShowMatrix] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [copied, setCopied] = useState(false);

  const categories = useMemo(() => [...new Set(pages.map((p) => p.category).filter(Boolean))], [pages]);
  const suggestions = useMemo(() => findSuggestions(pages), [pages]);

  const filteredSuggestions = useMemo(() => {
    return suggestions.filter((s) => {
      if (filterCategory !== "all" && s.fromPage.category !== filterCategory && s.toPage.category !== filterCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return s.fromPage.title.toLowerCase().includes(q) || s.toPage.title.toLowerCase().includes(q) || s.fromPage.url.toLowerCase().includes(q) || s.toPage.url.toLowerCase().includes(q);
      }
      return true;
    });
  }, [suggestions, filterCategory, search]);

  const linkKey = (from: string, to: string) => `${from}__${to}`;

  function handleAdd() {
    if (!url.trim() || !title.trim() || !mainKeyword.trim()) return;
    setPages((prev) => [...prev, { id: generateId(), url: url.trim(), title: title.trim(), mainKeyword: mainKeyword.trim(), category: category.trim() }]);
    setUrl("");
    setTitle("");
    setMainKeyword("");
    setCategory("");
  }

  function toggleImplemented(fromId: string, toId: string) {
    const key = linkKey(fromId, toId);
    setImplementedLinks((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }

  function handleExport() {
    let text = "INTERNAL LINKING REPORT\n" + "=".repeat(40) + "\n\n";
    text += `Pages: ${pages.length}\nSuggestions: ${suggestions.length}\n`;
    text += `Implemented: ${implementedLinks.length}\n\n`;
    filteredSuggestions.forEach((s, i) => {
      const impl = implementedLinks.includes(linkKey(s.fromPage.id, s.toPage.id));
      text += `${i + 1}. [${impl ? "DONE" : "TODO"}] ${s.fromPage.title} -> ${s.toPage.title}\n`;
      text += `   Reason: ${s.reason}\n\n`;
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internal Linking Tool"
        description="Map your site pages and discover internal linking opportunities."
        icon={Link2}
        badge="SEO"
        actions={
          pages.length > 1 ? (
            <Button variant="outline" size="sm" onClick={() => setShowMatrix(!showMatrix)}>
              <Grid3X3 className="h-4 w-4" />{showMatrix ? "List View" : "Matrix View"}
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4 text-violet-500" />Add Page</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="space-y-1.5"><Label>URL *</Label><Input placeholder="https://example.com/page" value={url} onChange={(e) => setUrl(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Title *</Label><Input placeholder="Page title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Main Keyword *</Label><Input placeholder="keyword" value={mainKeyword} onChange={(e) => setMainKeyword(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Category</Label><Input placeholder="Blog, Product..." value={category} onChange={(e) => setCategory(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} /></div>
            <div className="space-y-1.5"><Label className="invisible">Add</Label><Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleAdd} disabled={!url.trim() || !title.trim() || !mainKeyword.trim()}><Plus className="h-4 w-4" />Add</Button></div>
          </div>
        </CardContent>
      </Card>

      {pages.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Pages ({pages.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pages.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border p-2.5 group hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{p.url}</span>
                      <Badge variant="secondary" className="text-[10px] shrink-0">{p.mainKeyword}</Badge>
                      {p.category && <Badge variant="secondary" className="text-[10px] shrink-0">{p.category}</Badge>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setPages((prev) => prev.filter((x) => x.id !== p.id))}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showMatrix && pages.length > 1 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Link Matrix</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr>
                    <th className="p-1 text-left font-medium text-muted-foreground">From \ To</th>
                    {pages.map((p) => <th key={p.id} className="p-1 font-medium text-muted-foreground truncate max-w-[80px]" title={p.title}>{p.title.slice(0, 12)}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {pages.map((from) => (
                    <tr key={from.id}>
                      <td className="p-1 font-medium truncate max-w-[100px]" title={from.title}>{from.title.slice(0, 15)}</td>
                      {pages.map((to) => {
                        if (from.id === to.id) return <td key={to.id} className="p-1 text-center bg-muted/30">—</td>;
                        const hasSuggestion = suggestions.some((s) => s.fromPage.id === from.id && s.toPage.id === to.id);
                        const isImpl = implementedLinks.includes(linkKey(from.id, to.id));
                        return (
                          <td key={to.id} className="p-1 text-center">
                            {hasSuggestion ? (
                              <button onClick={() => toggleImplemented(from.id, to.id)} className={`h-5 w-5 rounded mx-auto flex items-center justify-center ${isImpl ? "bg-emerald-500 text-white" : "bg-amber-500/20 text-amber-600 hover:bg-amber-500/30"}`}>
                                {isImpl ? <Check className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
                              </button>
                            ) : <span className="text-muted-foreground/30">-</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {suggestions.length > 0 && !showMatrix && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">Link Suggestions ({suggestions.length})</CardTitle>
              <div className="flex gap-2">
                {categories.length > 0 && (
                  <Select value={filterCategory} onValueChange={(v) => { if (v) setFilterCategory(v); }}>
                    <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                <Button variant="outline" size="sm" onClick={handleExport}><Copy className="h-3.5 w-3.5" />{copied ? "Copied!" : "Export"}</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredSuggestions.map((s, i) => {
              const key = linkKey(s.fromPage.id, s.toPage.id);
              const isImpl = implementedLinks.includes(key);
              return (
                <div key={i} className={`rounded-lg border p-3 transition-colors ${isImpl ? "bg-emerald-500/5 border-emerald-500/20" : ""}`}>
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleImplemented(s.fromPage.id, s.toPage.id)} className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isImpl ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/30 hover:border-violet-500"}`}>
                      {isImpl && <Check className="h-3.5 w-3.5 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm flex-wrap">
                        <span className="font-medium truncate">{s.fromPage.title}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                        <span className="font-medium truncate">{s.toPage.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.reason}</p>
                    </div>
                    {isImpl && <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px] shrink-0">Done</Badge>}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {pages.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><p className="text-2xl font-bold text-violet-600">{pages.length}</p><p className="text-xs text-muted-foreground">Total Pages</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-2xl font-bold text-amber-600">{suggestions.length}</p><p className="text-xs text-muted-foreground">Link Suggestions</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-2xl font-bold text-emerald-600">{implementedLinks.length}</p><p className="text-xs text-muted-foreground">Implemented</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-2xl font-bold text-pink-600">{suggestions.length - implementedLinks.length}</p><p className="text-xs text-muted-foreground">Remaining</p></CardContent></Card>
        </div>
      )}
    </div>
  );
}
