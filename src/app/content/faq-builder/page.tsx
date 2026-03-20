"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import {
  HelpCircle,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Search,
  Tag,
  X,
  Code,
  FileJson,
  FileText,
  Upload,
  CheckCircle2,
  FolderOpen,
  Edit2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

const DEFAULT_COLORS = [
  "#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b",
  "#ef4444", "#6366f1", "#14b8a6", "#f97316", "#84cc16",
];

function faqToMarkdown(items: FAQItem[], categories: Category[]): string {
  let md = "# Frequently Asked Questions\n\n";
  const grouped = new Map<string, FAQItem[]>();
  for (const item of items) {
    const cat = item.category || "General";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }
  for (const [cat, catItems] of grouped) {
    md += `## ${cat}\n\n`;
    for (const item of catItems) {
      md += `### ${item.question}\n\n${item.answer}\n\n`;
    }
  }
  return md;
}

function faqToJsonSchema(items: FAQItem[]): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
  return JSON.stringify(schema, null, 2);
}

function faqToHtml(items: FAQItem[], categories: Category[]): string {
  const grouped = new Map<string, FAQItem[]>();
  for (const item of items) {
    const cat = item.category || "General";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FAQ</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #333; }
  h1 { font-size: 1.75rem; margin-bottom: 1.5rem; }
  h2 { font-size: 1.25rem; margin: 1.5rem 0 0.75rem; color: #6b7280; }
  .faq-item { border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; overflow: hidden; }
  .faq-question { padding: 14px 16px; cursor: pointer; font-weight: 600; font-size: 14px; display: flex; justify-content: space-between; align-items: center; background: #f9fafb; }
  .faq-question:hover { background: #f3f4f6; }
  .faq-answer { padding: 0 16px; max-height: 0; overflow: hidden; transition: max-height 0.3s ease, padding 0.3s ease; font-size: 14px; line-height: 1.7; color: #4b5563; }
  .faq-item.open .faq-answer { max-height: 500px; padding: 12px 16px 16px; }
  .faq-arrow { transition: transform 0.3s; font-size: 12px; }
  .faq-item.open .faq-arrow { transform: rotate(180deg); }
</style>
</head>
<body>
<h1>Frequently Asked Questions</h1>
`;

  for (const [cat, catItems] of grouped) {
    html += `<h2>${cat}</h2>\n`;
    for (const item of catItems) {
      html += `<div class="faq-item" onclick="this.classList.toggle('open')">
  <div class="faq-question">${item.question}<span class="faq-arrow">&#9660;</span></div>
  <div class="faq-answer">${item.answer}</div>
</div>\n`;
    }
  }

  html += `</body>\n</html>`;
  return html;
}

export default function FAQBuilderPage() {
  const [items, setItems, hydrated] = useLocalStorage<FAQItem[]>("faq-items", []);
  const [categories, setCategories, catHydrated] = useLocalStorage<Category[]>(
    "faq-categories",
    [{ id: "general", name: "General", color: "#8b5cf6" }]
  );
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("General");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [copied, setCopied] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setQuestion("");
    setAnswer("");
    setCategory(categories[0]?.name || "General");
    setEditId(null);
  }, [categories]);

  const handleSave = useCallback(() => {
    if (!question.trim() || !answer.trim()) return;
    if (editId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editId
            ? { ...item, question: question.trim(), answer: answer.trim(), category }
            : item
        )
      );
    } else {
      const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.order)) + 1 : 0;
      setItems((prev) => [
        ...prev,
        {
          id: generateId(),
          question: question.trim(),
          answer: answer.trim(),
          category,
          order: maxOrder,
        },
      ]);
    }
    resetForm();
    setShowForm(false);
  }, [question, answer, category, editId, items, setItems, resetForm]);

  const handleEdit = useCallback((item: FAQItem) => {
    setQuestion(item.question);
    setAnswer(item.answer);
    setCategory(item.category);
    setEditId(item.id);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [setItems]
  );

  const handleMoveUp = useCallback(
    (id: string) => {
      setItems((prev) => {
        const sorted = [...prev].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((i) => i.id === id);
        if (idx <= 0) return prev;
        const curr = sorted[idx].order;
        const above = sorted[idx - 1].order;
        return prev.map((item) => {
          if (item.id === sorted[idx].id) return { ...item, order: above };
          if (item.id === sorted[idx - 1].id) return { ...item, order: curr };
          return item;
        });
      });
    },
    [setItems]
  );

  const handleMoveDown = useCallback(
    (id: string) => {
      setItems((prev) => {
        const sorted = [...prev].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((i) => i.id === id);
        if (idx < 0 || idx >= sorted.length - 1) return prev;
        const curr = sorted[idx].order;
        const below = sorted[idx + 1].order;
        return prev.map((item) => {
          if (item.id === sorted[idx].id) return { ...item, order: below };
          if (item.id === sorted[idx + 1].id) return { ...item, order: curr };
          return item;
        });
      });
    },
    [setItems]
  );

  const handleAddCategory = useCallback(() => {
    const name = newCatName.trim();
    if (!name || categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
    if (editCatId) {
      const oldName = categories.find((c) => c.id === editCatId)?.name;
      setCategories((prev) =>
        prev.map((c) => (c.id === editCatId ? { ...c, name } : c))
      );
      if (oldName) {
        setItems((prev) =>
          prev.map((item) => (item.category === oldName ? { ...item, category: name } : item))
        );
      }
      setEditCatId(null);
    } else {
      setCategories((prev) => [
        ...prev,
        { id: generateId(), name, color: DEFAULT_COLORS[prev.length % DEFAULT_COLORS.length] },
      ]);
    }
    setNewCatName("");
    setShowCategoryForm(false);
  }, [newCatName, categories, editCatId, setCategories, setItems]);

  const handleDeleteCategory = useCallback(
    (id: string) => {
      const cat = categories.find((c) => c.id === id);
      if (!cat || categories.length <= 1) return;
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setItems((prev) =>
        prev.map((item) =>
          item.category === cat.name
            ? { ...item, category: categories[0].name }
            : item
        )
      );
    },
    [categories, setCategories, setItems]
  );

  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (Array.isArray(data)) {
            const imported: FAQItem[] = data.map((d: Record<string, unknown>, i: number) => {
              const acc = d.acceptedAnswer as Record<string, unknown> | undefined;
              return {
                id: generateId(),
                question: String(d.question || d.name || ""),
                answer: String(d.answer || acc?.text || d.text || ""),
                category: String(d.category || "General"),
                order: i,
              };
            }).filter((item: FAQItem) => item.question && item.answer);
            setItems((prev) => [...prev, ...imported]);
          } else if (data.mainEntity && Array.isArray(data.mainEntity)) {
            const imported: FAQItem[] = data.mainEntity.map(
              (d: Record<string, unknown>, i: number) => ({
                id: generateId(),
                question: String(d.name || ""),
                answer: String(
                  typeof d.acceptedAnswer === "object" && d.acceptedAnswer !== null
                    ? (d.acceptedAnswer as Record<string, unknown>).text || ""
                    : ""
                ),
                category: "General",
                order: items.length + i,
              })
            ).filter((item: FAQItem) => item.question && item.answer);
            setItems((prev) => [...prev, ...imported]);
          }
        } catch {
          // Invalid JSON, ignore
        }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [items.length, setItems]
  );

  const togglePreview = useCallback((id: string) => {
    setPreviewOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const sortedItems = useMemo(() => {
    let list = [...items].sort((a, b) => a.order - b.order);
    if (filterCategory !== "all") list = list.filter((i) => i.category === filterCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.question.toLowerCase().includes(q) ||
          i.answer.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, filterCategory, searchQuery]);

  const getCatColor = useCallback(
    (name: string) => {
      return categories.find((c) => c.name === name)?.color || "#8b5cf6";
    },
    [categories]
  );

  if (!hydrated || !catHydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="FAQ Page Builder"
        description="Create, organize, and export FAQ pages with structured data for SEO."
        icon={HelpCircle}
        badge="Free"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Import JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
            <Button
              size="sm"
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Q&A
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Q&A List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Add/Edit Form */}
          {showForm && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {editId ? "Edit Q&A" : "Add New Q&A"}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Question <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="What is your return policy?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Answer <span className="text-red-500">*</span></Label>
                  <Textarea
                    rows={3}
                    placeholder="We offer a 30-day return policy..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((cat) => (
                      <Badge
                        key={cat.id}
                        variant="secondary"
                        className={`cursor-pointer text-xs ${
                          category === cat.name
                            ? "ring-2 ring-violet-500/50"
                            : ""
                        }`}
                        style={{
                          backgroundColor: `${cat.color}15`,
                          color: cat.color,
                          borderColor: `${cat.color}30`,
                        }}
                        onClick={() => setCategory(cat.name)}
                      >
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
                    onClick={handleSave}
                    disabled={!question.trim() || !answer.trim()}
                  >
                    {editId ? "Update Q&A" : "Add Q&A"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search & Filter */}
          {items.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <Badge
                  variant="secondary"
                  className={`cursor-pointer text-xs ${
                    filterCategory === "all" ? "ring-2 ring-violet-500/50" : ""
                  }`}
                  onClick={() => setFilterCategory("all")}
                >
                  All ({items.length})
                </Badge>
                {categories.map((cat) => {
                  const count = items.filter((i) => i.category === cat.name).length;
                  return (
                    <Badge
                      key={cat.id}
                      variant="secondary"
                      className={`cursor-pointer text-xs ${
                        filterCategory === cat.name ? "ring-2 ring-violet-500/50" : ""
                      }`}
                      style={{
                        backgroundColor: `${cat.color}15`,
                        color: cat.color,
                        borderColor: `${cat.color}30`,
                      }}
                      onClick={() => setFilterCategory(cat.name)}
                    >
                      {cat.name} ({count})
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* FAQ List */}
          {items.length === 0 && !showForm ? (
            <Card>
              <CardContent className="py-16">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center">
                    <HelpCircle className="h-7 w-7 text-violet-400" />
                  </div>
                  <h3 className="text-sm font-medium">No FAQs Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Add your first question and answer pair, or import from a
                    JSON file. FAQs can be exported as HTML with accordion
                    functionality, JSON schema for SEO, or markdown.
                  </p>
                  <Button
                    className="mt-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
                    onClick={() => {
                      resetForm();
                      setShowForm(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add First Q&A
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {sortedItems.map((item, idx) => (
                <Card key={item.id}>
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleMoveUp(item.id)}
                          disabled={idx === 0 && filterCategory === "all" && !searchQuery}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleMoveDown(item.id)}
                          disabled={
                            idx === sortedItems.length - 1 &&
                            filterCategory === "all" &&
                            !searchQuery
                          }
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{item.question}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {item.answer}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Badge
                              variant="secondary"
                              className="text-[10px] border"
                              style={{
                                backgroundColor: `${getCatColor(item.category)}15`,
                                color: getCatColor(item.category),
                                borderColor: `${getCatColor(item.category)}30`,
                              }}
                            >
                              {item.category}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Categories */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-4 w-4 text-violet-500" />
                  Categories
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setShowCategoryForm(!showCategoryForm);
                    setEditCatId(null);
                    setNewCatName("");
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {showCategoryForm && (
                <div className="flex gap-1.5 mb-2">
                  <Input
                    placeholder="Category name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                    className="flex-1"
                  />
                  <Button variant="outline" size="icon" onClick={handleAddCategory}>
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({items.filter((i) => i.category === cat.name).length})
                    </span>
                  </div>
                  <div className="flex gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => {
                        setEditCatId(cat.id);
                        setNewCatName(cat.name);
                        setShowCategoryForm(true);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    {categories.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDeleteCategory(cat.id)}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Live Preview */}
          {items.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-violet-500" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sortedItems.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border overflow-hidden"
                  >
                    <button
                      className="w-full text-left p-3 flex items-center justify-between gap-2 hover:bg-muted/50 transition-colors"
                      onClick={() => togglePreview(item.id)}
                    >
                      <span className="text-xs font-medium">{item.question}</span>
                      {previewOpen.has(item.id) ? (
                        <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                    </button>
                    {previewOpen.has(item.id) && (
                      <div className="px-3 pb-3 text-xs text-muted-foreground leading-relaxed border-t bg-muted/30 pt-2">
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Export */}
          {items.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code className="h-4 w-4 text-violet-500" />
                  Export
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="html">
                  <TabsList>
                    <TabsTrigger value="html">HTML</TabsTrigger>
                    <TabsTrigger value="json">JSON-LD</TabsTrigger>
                    <TabsTrigger value="md">Markdown</TabsTrigger>
                  </TabsList>
                  <TabsContent value="html" className="space-y-2">
                    <div className="rounded-lg border bg-muted/30 p-2 max-h-48 overflow-y-auto">
                      <pre className="text-[10px] whitespace-pre-wrap font-mono text-muted-foreground">
                        {faqToHtml(sortedItems, categories).slice(0, 800)}...
                      </pre>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        handleCopy(faqToHtml(sortedItems, categories), "html")
                      }
                    >
                      {copied === "html" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copied === "html" ? "Copied!" : "Copy HTML"}
                    </Button>
                  </TabsContent>
                  <TabsContent value="json" className="space-y-2">
                    <div className="rounded-lg border bg-muted/30 p-2 max-h-48 overflow-y-auto">
                      <pre className="text-[10px] whitespace-pre-wrap font-mono text-muted-foreground">
                        {faqToJsonSchema(sortedItems).slice(0, 800)}...
                      </pre>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        handleCopy(faqToJsonSchema(sortedItems), "json")
                      }
                    >
                      {copied === "json" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copied === "json" ? "Copied!" : "Copy JSON-LD"}
                    </Button>
                  </TabsContent>
                  <TabsContent value="md" className="space-y-2">
                    <div className="rounded-lg border bg-muted/30 p-2 max-h-48 overflow-y-auto">
                      <pre className="text-[10px] whitespace-pre-wrap font-mono text-muted-foreground">
                        {faqToMarkdown(sortedItems, categories).slice(0, 800)}...
                      </pre>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        handleCopy(faqToMarkdown(sortedItems, categories), "md")
                      }
                    >
                      {copied === "md" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copied === "md" ? "Copied!" : "Copy Markdown"}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
