"use client";

import { useState, useMemo } from "react";
import {
  Layout,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  Download,
  Save,
  X,
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
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type PageType = "homepage" | "product" | "collection" | "about" | "contact" | "blog";

interface SectionDef {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface WireframeDoc {
  id: string;
  name: string;
  pageType: PageType;
  sections: SectionDef[];
  createdAt: string;
}

const PAGE_TYPES: { value: PageType; label: string }[] = [
  { value: "homepage", label: "Homepage" },
  { value: "product", label: "Product Page" },
  { value: "collection", label: "Collection Page" },
  { value: "about", label: "About Page" },
  { value: "contact", label: "Contact Page" },
  { value: "blog", label: "Blog Page" },
];

const SECTION_LIBRARY: SectionDef[] = [
  { id: "header", name: "Header / Navigation", description: "Logo, navigation links, cart icon, search bar", icon: "NAV" },
  { id: "hero", name: "Hero Banner", description: "Full-width hero with headline, subheadline, CTA button, background image", icon: "HERO" },
  { id: "featured-products", name: "Featured Products", description: "Grid of 4-8 product cards with images, titles, prices", icon: "GRID" },
  { id: "image-text", name: "Image + Text", description: "Two-column layout with image on one side, text and CTA on the other", icon: "IMG+TXT" },
  { id: "testimonials", name: "Testimonials", description: "Customer reviews carousel or grid with quotes, names, and ratings", icon: "QUOTE" },
  { id: "newsletter", name: "Newsletter Signup", description: "Email input field with subscribe button, optional incentive text", icon: "EMAIL" },
  { id: "footer", name: "Footer", description: "Multi-column footer with links, social icons, copyright, newsletter", icon: "FOOT" },
  { id: "collection-grid", name: "Collection Grid", description: "Filterable product grid with sidebar filters, sort options", icon: "FILTER" },
  { id: "product-detail", name: "Product Detail", description: "Product images gallery, title, price, variants, add to cart, description", icon: "PROD" },
  { id: "faq", name: "FAQ Section", description: "Accordion-style frequently asked questions", icon: "FAQ" },
  { id: "cta-banner", name: "CTA Banner", description: "Full-width call-to-action with bold text and button", icon: "CTA" },
  { id: "blog-grid", name: "Blog Post Grid", description: "Grid of article cards with featured images, titles, dates", icon: "BLOG" },
  { id: "contact-form", name: "Contact Form", description: "Form with name, email, subject, message fields and submit button", icon: "FORM" },
  { id: "team", name: "Team Section", description: "Grid of team member cards with photos, names, roles", icon: "TEAM" },
  { id: "stats", name: "Stats / Numbers", description: "Key metrics displayed with large numbers and labels", icon: "STAT" },
  { id: "logo-bar", name: "Logo Bar / Trust Badges", description: "Row of partner, press, or trust logos", icon: "LOGOS" },
  { id: "video", name: "Video Section", description: "Embedded video with optional text overlay or description", icon: "VIDEO" },
  { id: "timeline", name: "Timeline / Process", description: "Step-by-step process visualization", icon: "TIME" },
];

function wireframeToText(doc: WireframeDoc): string {
  let text = `WIREFRAME: ${doc.name}\n`;
  text += `Page Type: ${doc.pageType}\n`;
  text += `${"=".repeat(40)}\n\n`;
  doc.sections.forEach((s, idx) => {
    text += `[Section ${idx + 1}: ${s.name}]\n`;
    text += `${"-".repeat(30)}\n`;
    text += `${s.description}\n\n`;
  });
  return text;
}

export default function WireframePlannerPage() {
  const [wireframes, setWireframes, hydrated] = useLocalStorage<WireframeDoc[]>("wireframe-plans", []);
  const [pageName, setPageName] = useState("");
  const [pageType, setPageType] = useState<PageType>("homepage");
  const [sections, setSections] = useState<SectionDef[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function addSection(section: SectionDef) {
    setSections((prev) => [...prev, { ...section, id: generateId() }]);
  }

  function removeSection(id: string) {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }

  function moveSection(id: string, dir: "up" | "down") {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if ((dir === "up" && idx === 0) || (dir === "down" && idx === prev.length - 1)) return prev;
      const arr = [...prev];
      const swap = dir === "up" ? idx - 1 : idx + 1;
      [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
      return arr;
    });
  }

  function handleSave() {
    if (!pageName.trim() || sections.length === 0) return;
    if (editingId) {
      setWireframes((prev) => prev.map((w) => (w.id === editingId ? { ...w, name: pageName, pageType, sections } : w)));
    } else {
      setWireframes((prev) => [{ id: generateId(), name: pageName, pageType, sections, createdAt: new Date().toISOString() }, ...prev]);
    }
    resetForm();
  }

  function resetForm() { setPageName(""); setPageType("homepage"); setSections([]); setEditingId(null); }

  function loadWireframe(w: WireframeDoc) {
    setPageName(w.name);
    setPageType(w.pageType);
    setSections(w.sections);
    setEditingId(w.id);
  }

  function deleteWireframe(id: string) {
    setWireframes((prev) => prev.filter((w) => w.id !== id));
    if (editingId === id) resetForm();
  }

  function handleExport() {
    if (!pageName.trim() || sections.length === 0) return;
    const doc: WireframeDoc = { id: "temp", name: pageName, pageType, sections, createdAt: new Date().toISOString() };
    navigator.clipboard.writeText(wireframeToText(doc));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Wireframe Planner" description="Plan page layouts by selecting and ordering sections from a pre-built library" icon={Layout} badge="Design" replaces="Figma / Whimsical" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section Library */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3"><CardTitle className="text-base">Section Library</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
            {SECTION_LIBRARY.map((s) => (
              <div key={s.id} className="rounded-lg border p-2 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => addSection(s)}>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-10 rounded bg-violet-500/10 flex items-center justify-center text-[10px] font-bold text-violet-600 shrink-0">{s.icon}</div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{s.description}</p>
                  </div>
                  <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Builder */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Page Builder</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Page Name *</Label><Input value={pageName} onChange={(e) => setPageName(e.target.value)} placeholder="e.g., Homepage V2" /></div>
                <div className="space-y-1.5">
                  <Label>Page Type</Label>
                  <Select value={pageType} onValueChange={(v) => setPageType(v as PageType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAGE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <Label>Sections ({sections.length})</Label>
              {sections.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                  Click sections from the library to add them here
                </div>
              ) : (
                <div className="space-y-2">
                  {sections.map((s, idx) => (
                    <div key={s.id} className="rounded-lg border p-3 flex items-center gap-3 group bg-background">
                      <div className="h-10 w-12 rounded bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center text-[10px] font-bold text-violet-600 shrink-0">{s.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.description}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon-sm" onClick={() => moveSection(s.id, "up")} disabled={idx === 0}><ArrowUp className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => moveSection(s.id, "down")} disabled={idx === sections.length - 1}><ArrowDown className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => removeSection(s.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={!pageName.trim() || sections.length === 0} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
                  <Save className="h-4 w-4 mr-2" />{editingId ? "Update" : "Save"}
                </Button>
                <Button variant="outline" onClick={handleExport} disabled={sections.length === 0}>
                  <Copy className="h-4 w-4 mr-2" />{copied ? "Copied!" : "Export as Text"}
                </Button>
                {editingId && <Button variant="outline" onClick={resetForm}><X className="h-4 w-4 mr-2" />New</Button>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Saved */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3"><CardTitle className="text-base">Saved ({wireframes.length})</CardTitle></CardHeader>
          <CardContent>
            {wireframes.length === 0 ? (
              <div className="text-center py-8"><Layout className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" /><p className="text-xs text-muted-foreground">No wireframes saved</p></div>
            ) : (
              <div className="space-y-2">
                {wireframes.map((w) => (
                  <div key={w.id} className="rounded-lg border p-2 hover:bg-muted/50 transition-colors group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="cursor-pointer flex-1" onClick={() => loadWireframe(w)}>
                        <p className="text-sm font-medium truncate">{w.name}</p>
                        <p className="text-[10px] text-muted-foreground">{w.pageType} &middot; {w.sections.length} sections</p>
                      </div>
                      <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 shrink-0" onClick={() => deleteWireframe(w.id)}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
