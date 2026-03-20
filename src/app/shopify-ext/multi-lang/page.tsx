"use client";

import { useState, useMemo } from "react";
import { Languages, Plus, Trash2, Edit2, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type ContentType = "pages" | "products" | "emails" | "checkout" | "navigation" | "policies";

interface TranslationKey {
  id: string;
  key: string;
  original: string;
  translated: string;
  contentType: ContentType;
}

interface LanguageSetup {
  id: string;
  code: string;
  name: string;
  keys: TranslationKey[];
}

const CONTENT_TYPES: { type: ContentType; label: string; count: number }[] = [
  { type: "pages", label: "Pages", count: 0 },
  { type: "products", label: "Products", count: 0 },
  { type: "emails", label: "Emails", count: 0 },
  { type: "checkout", label: "Checkout", count: 0 },
  { type: "navigation", label: "Navigation", count: 0 },
  { type: "policies", label: "Policies", count: 0 },
];

export default function MultiLangPage() {
  const [languages, setLanguages] = useLocalStorage<LanguageSetup[]>("multi-lang-data", []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAddLang, setShowAddLang] = useState(false);
  const [newLang, setNewLang] = useState({ code: "", name: "" });
  const [showAddKey, setShowAddKey] = useState(false);
  const [keyForm, setKeyForm] = useState<Omit<TranslationKey, "id">>({ key: "", original: "", translated: "", contentType: "pages" });
  const [filterType, setFilterType] = useState<"all" | ContentType>("all");

  const active = languages.find((l) => l.id === activeId);

  const progress = useMemo(() => {
    if (!active) return { total: 0, translated: 0, pct: 0, byType: {} as Record<ContentType, { total: number; translated: number }> };
    const total = active.keys.length;
    const translated = active.keys.filter((k) => k.translated.trim().length > 0).length;
    const byType = {} as Record<ContentType, { total: number; translated: number }>;
    CONTENT_TYPES.forEach(({ type }) => {
      const typeKeys = active.keys.filter((k) => k.contentType === type);
      byType[type] = { total: typeKeys.length, translated: typeKeys.filter((k) => k.translated.trim()).length };
    });
    return { total, translated, pct: total > 0 ? Math.round((translated / total) * 100) : 0, byType };
  }, [active]);

  const filteredKeys = useMemo(() => {
    if (!active) return [];
    if (filterType === "all") return active.keys;
    return active.keys.filter((k) => k.contentType === filterType);
  }, [active, filterType]);

  function addLanguage() {
    if (!newLang.code.trim() || !newLang.name.trim()) return;
    const lang: LanguageSetup = { id: generateId(), code: newLang.code, name: newLang.name, keys: [] };
    setLanguages((prev) => [...prev, lang]);
    setActiveId(lang.id);
    setNewLang({ code: "", name: "" });
    setShowAddLang(false);
  }

  function addKey() {
    if (!keyForm.key.trim() || !activeId) return;
    setLanguages((prev) => prev.map((l) => l.id === activeId ? { ...l, keys: [...l.keys, { id: generateId(), ...keyForm }] } : l));
    setKeyForm({ key: "", original: "", translated: "", contentType: "pages" });
    setShowAddKey(false);
  }

  function updateTranslation(keyId: string, translated: string) {
    if (!activeId) return;
    setLanguages((prev) => prev.map((l) => l.id === activeId ? { ...l, keys: l.keys.map((k) => k.id === keyId ? { ...k, translated } : k) } : l));
  }

  function removeKey(keyId: string) {
    if (!activeId) return;
    setLanguages((prev) => prev.map((l) => l.id === activeId ? { ...l, keys: l.keys.filter((k) => k.id !== keyId) } : l));
  }

  function removeLang(id: string) {
    setLanguages((prev) => prev.filter((l) => l.id !== id));
    if (activeId === id) setActiveId(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Multi-Language Setup Planner"
        description="Track translation progress per language, manage translation keys, and monitor completion"
        icon={Languages}
        badge="Shopify Ext"
        replaces="Spreadsheets / Weglot dashboard"
        actions={
          <Button onClick={() => setShowAddLang(true)} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Add Language
          </Button>
        }
      />

      {languages.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Languages className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground mb-1">No languages configured</p>
            <p className="text-sm text-muted-foreground/70">Add languages to start tracking translations</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            {languages.map((lang) => {
              const t = lang.keys.length;
              const d = lang.keys.filter((k) => k.translated.trim()).length;
              const pct = t > 0 ? Math.round((d / t) * 100) : 0;
              return (
                <Card key={lang.id} className={`cursor-pointer transition-colors ${activeId === lang.id ? "border-violet-500/50 bg-violet-500/5" : "hover:border-violet-500/30"}`} onClick={() => setActiveId(lang.id)}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{lang.code.toUpperCase()}</span>
                        <span className="text-sm font-medium">{lang.name}</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeLang(lang.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{d}/{t} keys translated</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="lg:col-span-3 space-y-4">
            {active ? (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {CONTENT_TYPES.map(({ type, label }) => {
                    const data = progress.byType[type] || { total: 0, translated: 0 };
                    const pct = data.total > 0 ? Math.round((data.translated / data.total) * 100) : 0;
                    return (
                      <Card key={type} className={`cursor-pointer transition-colors ${filterType === type ? "border-violet-500/50" : ""}`} onClick={() => setFilterType(filterType === type ? "all" : type)}>
                        <CardContent className="p-2 text-center">
                          <p className="text-lg font-bold">{pct}%</p>
                          <p className="text-[10px] text-muted-foreground">{label}</p>
                          <p className="text-[10px] text-muted-foreground">{data.translated}/{data.total}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{active.name} Translation Keys</h3>
                    <p className="text-xs text-muted-foreground">{progress.translated}/{progress.total} translated ({progress.pct}%)</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowAddKey(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Key
                  </Button>
                </div>

                {filteredKeys.length === 0 ? (
                  <Card className="border-dashed"><CardContent className="py-8 text-center"><p className="text-sm text-muted-foreground">No translation keys yet</p></CardContent></Card>
                ) : (
                  <div className="space-y-2">
                    {filteredKeys.map((key) => (
                      <Card key={key.id} className="border-border/50">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{key.key}</code>
                                <Badge variant="secondary" className="text-[10px]">{key.contentType}</Badge>
                                {key.translated.trim() ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-0">Pending</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">Original: {key.original}</p>
                              <Input
                                placeholder="Translation..."
                                value={key.translated}
                                onChange={(e) => updateTranslation(key.id, e.target.value)}
                                className="h-8 text-sm"
                              />
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive shrink-0" onClick={() => removeKey(key.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Card className="border-dashed border-border/60">
                <CardContent className="flex items-center justify-center py-16">
                  <p className="text-sm text-muted-foreground">Select a language to manage translations</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      <Dialog open={showAddLang} onOpenChange={setShowAddLang}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Language</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Language Code *</Label><Input placeholder="e.g., fr, es, de" value={newLang.code} onChange={(e) => setNewLang((f) => ({ ...f, code: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Language Name *</Label><Input placeholder="e.g., French" value={newLang.name} onChange={(e) => setNewLang((f) => ({ ...f, name: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddLang(false)}>Cancel</Button>
            <Button onClick={addLanguage} disabled={!newLang.code.trim() || !newLang.name.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">Add</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddKey} onOpenChange={setShowAddKey}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Translation Key</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Key *</Label><Input placeholder="e.g., header.welcome" value={keyForm.key} onChange={(e) => setKeyForm((f) => ({ ...f, key: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Original Text</Label><Input placeholder="English text" value={keyForm.original} onChange={(e) => setKeyForm((f) => ({ ...f, original: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Translation</Label><Input placeholder="Translated text" value={keyForm.translated} onChange={(e) => setKeyForm((f) => ({ ...f, translated: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Content Type</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={keyForm.contentType} onChange={(e) => setKeyForm((f) => ({ ...f, contentType: e.target.value as ContentType }))}>
                {CONTENT_TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddKey(false)}>Cancel</Button>
            <Button onClick={addKey} disabled={!keyForm.key.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">Add Key</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
