"use client";

import { useState, useCallback } from "react";
import {
  LayoutTemplate,
  Plus,
  Trash2,
  Copy,
  Save,
  Eye,
  Code,
  ChevronUp,
  ChevronDown,
  BookOpen,
  X,
  Star,
  MessageSquareQuote,
  HelpCircle,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type SectionType = "hero" | "features" | "testimonials" | "pricing" | "faq" | "cta";

interface HeroData { headline: string; subheading: string; ctaText: string; ctaUrl: string; }
interface FeatureItem { icon: string; title: string; description: string; }
interface TestimonialItem { quote: string; author: string; role: string; }
interface PricingTier { name: string; price: string; features: string[]; highlighted: boolean; }
interface FaqItem { question: string; answer: string; }
interface CtaData { headline: string; description: string; buttonText: string; buttonUrl: string; }

interface Section {
  id: string;
  type: SectionType;
  data: HeroData | FeatureItem[] | TestimonialItem[] | PricingTier[] | FaqItem[] | CtaData;
}

interface LandingPage {
  id: string;
  name: string;
  sections: Section[];
  createdAt: string;
}

const SECTION_LABELS: Record<SectionType, string> = { hero: "Hero", features: "Features", testimonials: "Testimonials", pricing: "Pricing", faq: "FAQ", cta: "CTA" };

function defaultData(type: SectionType): Section["data"] {
  switch (type) {
    case "hero": return { headline: "", subheading: "", ctaText: "Get Started", ctaUrl: "#" };
    case "features": return [{ icon: "Zap", title: "", description: "" }, { icon: "Star", title: "", description: "" }, { icon: "Code", title: "", description: "" }];
    case "testimonials": return [{ quote: "", author: "", role: "" }];
    case "pricing": return [{ name: "Basic", price: "$9/mo", features: ["Feature 1"], highlighted: false }, { name: "Pro", price: "$29/mo", features: ["Feature 1", "Feature 2"], highlighted: true }];
    case "faq": return [{ question: "", answer: "" }];
    case "cta": return { headline: "", description: "", buttonText: "Start Free Trial", buttonUrl: "#" };
  }
}

function sectionToHtml(section: Section): string {
  const { type, data } = section;
  switch (type) {
    case "hero": { const d = data as HeroData; return `<section style="text-align:center;padding:80px 20px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff"><h1 style="font-size:3rem;margin:0">${d.headline}</h1><p style="font-size:1.2rem;opacity:0.9;margin:16px 0">${d.subheading}</p><a href="${d.ctaUrl}" style="display:inline-block;padding:14px 32px;background:#fff;color:#7c3aed;border-radius:8px;text-decoration:none;font-weight:bold">${d.ctaText}</a></section>`; }
    case "features": { const items = data as FeatureItem[]; return `<section style="padding:60px 20px;max-width:900px;margin:auto"><h2 style="text-align:center;margin-bottom:40px">Features</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:24px">${items.map((f) => `<div style="padding:24px;border:1px solid #e5e7eb;border-radius:12px"><h3>${f.title}</h3><p style="color:#6b7280">${f.description}</p></div>`).join("")}</div></section>`; }
    case "testimonials": { const items = data as TestimonialItem[]; return `<section style="padding:60px 20px;background:#f9fafb"><div style="max-width:700px;margin:auto">${items.map((t) => `<blockquote style="padding:24px;border-left:4px solid #7c3aed;margin:16px 0;background:#fff;border-radius:0 8px 8px 0"><p>"${t.quote}"</p><footer style="color:#6b7280;margin-top:8px">— ${t.author}, ${t.role}</footer></blockquote>`).join("")}</div></section>`; }
    case "pricing": { const tiers = data as PricingTier[]; return `<section style="padding:60px 20px"><h2 style="text-align:center;margin-bottom:40px">Pricing</h2><div style="display:flex;justify-content:center;gap:24px;flex-wrap:wrap">${tiers.map((t) => `<div style="padding:32px;border:${t.highlighted ? "2px solid #7c3aed" : "1px solid #e5e7eb"};border-radius:12px;min-width:250px;text-align:center"><h3>${t.name}</h3><p style="font-size:2rem;font-weight:bold;margin:16px 0">${t.price}</p><ul style="list-style:none;padding:0">${t.features.map((f) => `<li style="padding:4px 0">✓ ${f}</li>`).join("")}</ul></div>`).join("")}</div></section>`; }
    case "faq": { const items = data as FaqItem[]; return `<section style="padding:60px 20px;max-width:700px;margin:auto"><h2 style="text-align:center;margin-bottom:40px">FAQ</h2>${items.map((f) => `<details style="padding:16px;border:1px solid #e5e7eb;border-radius:8px;margin:8px 0"><summary style="font-weight:bold;cursor:pointer">${f.question}</summary><p style="margin:12px 0 0;color:#6b7280">${f.answer}</p></details>`).join("")}</section>`; }
    case "cta": { const d = data as CtaData; return `<section style="text-align:center;padding:60px 20px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;border-radius:12px;margin:20px"><h2 style="font-size:2rem">${d.headline}</h2><p style="opacity:0.9;margin:12px 0">${d.description}</p><a href="${d.buttonUrl}" style="display:inline-block;padding:14px 32px;background:#fff;color:#7c3aed;border-radius:8px;text-decoration:none;font-weight:bold">${d.buttonText}</a></section>`; }
  }
}

export default function LandingPageBuilderPage() {
  const [templates, setTemplates, hydrated] = useLocalStorage<LandingPage[]>("ads-landing-templates", []);
  const [sections, setSections] = useState<Section[]>([]);
  const [pageName, setPageName] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [copied, setCopied] = useState(false);

  function addSection(type: SectionType) {
    setSections((prev) => [...prev, { id: generateId(), type, data: defaultData(type) }]);
  }

  function removeSection(id: string) { setSections((prev) => prev.filter((s) => s.id !== id)); }

  function moveSection(id: string, dir: -1 | 1) {
    setSections((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      if (i < 0 || (dir === -1 && i === 0) || (dir === 1 && i === prev.length - 1)) return prev;
      const next = [...prev]; [next[i], next[i + dir]] = [next[i + dir], next[i]]; return next;
    });
  }

  function updateSectionData(id: string, data: Section["data"]) {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, data } : s));
  }

  const fullHtml = useCallback(() => {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${pageName || "Landing Page"}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;line-height:1.6;color:#1f2937}</style></head><body>${sections.map(sectionToHtml).join("\n")}</body></html>`;
  }, [sections, pageName]);

  function handleSave() {
    if (!pageName.trim() || sections.length === 0) return;
    const page: LandingPage = { id: generateId(), name: pageName.trim(), sections: [...sections], createdAt: new Date().toISOString() };
    setTemplates((prev) => [page, ...prev]);
  }

  function handleCopyHtml() {
    navigator.clipboard.writeText(fullHtml());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function loadTemplate(t: LandingPage) {
    setPageName(t.name);
    setSections(t.sections.map((s) => ({ ...s, id: generateId() })));
    setShowLibrary(false);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Landing Page Builder" description="Build landing pages with sections, live preview, and HTML export." icon={LayoutTemplate} badge="Ads" actions={
        <Button variant="outline" size="sm" onClick={() => setShowLibrary(!showLibrary)}><BookOpen className="h-4 w-4" />Templates ({templates.length})</Button>
      } />

      {showLibrary ? (
        <Card>
          <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base">Saved Templates</CardTitle><Button variant="ghost" size="icon" onClick={() => setShowLibrary(false)}><X className="h-4 w-4" /></Button></div></CardHeader>
          <CardContent>{templates.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No saved templates.</p> : <div className="space-y-2">{templates.map((t) => (<div key={t.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"><div><p className="text-sm font-medium">{t.name}</p><p className="text-xs text-muted-foreground">{t.sections.length} sections</p></div><div className="flex gap-1"><Button variant="outline" size="sm" onClick={() => loadTemplate(t)}>Load</Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTemplates((prev) => prev.filter((x) => x.id !== t.id))}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button></div></div>))}</div>}</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Page Settings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5"><Label>Page Name</Label><Input placeholder="My Landing Page" value={pageName} onChange={(e) => setPageName(e.target.value)} /></div>
                <Separator />
                <Label>Add Sections</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(SECTION_LABELS) as SectionType[]).map((type) => (
                    <Button key={type} variant="outline" size="sm" className="justify-start" onClick={() => addSection(type)}><Plus className="h-3.5 w-3.5" />{SECTION_LABELS[type]}</Button>
                  ))}
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" size="sm" onClick={() => setShowPreview(!showPreview)}><Eye className="h-3.5 w-3.5" />{showPreview ? "Edit" : "Preview"}</Button>
                  <Button variant="outline" className="flex-1" size="sm" onClick={() => setShowCode(!showCode)}><Code className="h-3.5 w-3.5" />{showCode ? "Hide" : "HTML"}</Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" size="sm" onClick={handleCopyHtml}><Copy className="h-3.5 w-3.5" />{copied ? "Copied!" : "Copy HTML"}</Button>
                  <Button className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" size="sm" onClick={handleSave} disabled={!pageName.trim() || sections.length === 0}><Save className="h-3.5 w-3.5" />Save</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {showCode ? (
              <Card><CardHeader className="pb-3"><CardTitle className="text-base">HTML Code</CardTitle></CardHeader>
                <CardContent><pre className="text-xs bg-muted/50 rounded-lg p-4 overflow-auto max-h-[600px] whitespace-pre-wrap">{fullHtml()}</pre></CardContent>
              </Card>
            ) : showPreview ? (
              <Card><CardHeader className="pb-3"><CardTitle className="text-base">Live Preview</CardTitle></CardHeader>
                <CardContent><div className="border rounded-lg overflow-hidden"><iframe srcDoc={fullHtml()} className="w-full h-[600px] border-0" title="Preview" /></div></CardContent>
              </Card>
            ) : sections.length === 0 ? (
              <Card><CardContent className="py-16 text-center">
                <LayoutTemplate className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Add sections to build your landing page.</p>
              </CardContent></Card>
            ) : (
              <div className="space-y-4">
                {sections.map((section, idx) => (
                  <Card key={section.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{idx + 1}</Badge>
                          {SECTION_LABELS[section.type]}
                        </CardTitle>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(section.id, -1)} disabled={idx === 0}><ChevronUp className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveSection(section.id, 1)} disabled={idx === sections.length - 1}><ChevronDown className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeSection(section.id)}><Trash2 className="h-3.5 w-3.5 text-red-500" /></Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {section.type === "hero" && (() => { const d = section.data as HeroData; return (<>
                        <div className="space-y-1.5"><Label>Headline</Label><Input value={d.headline} onChange={(e) => updateSectionData(section.id, { ...d, headline: e.target.value })} placeholder="Transform Your Business Today" /></div>
                        <div className="space-y-1.5"><Label>Subheading</Label><Input value={d.subheading} onChange={(e) => updateSectionData(section.id, { ...d, subheading: e.target.value })} placeholder="The all-in-one platform..." /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5"><Label>CTA Text</Label><Input value={d.ctaText} onChange={(e) => updateSectionData(section.id, { ...d, ctaText: e.target.value })} /></div>
                          <div className="space-y-1.5"><Label>CTA URL</Label><Input value={d.ctaUrl} onChange={(e) => updateSectionData(section.id, { ...d, ctaUrl: e.target.value })} /></div>
                        </div>
                      </>); })()}
                      {section.type === "features" && (() => { const items = section.data as FeatureItem[]; return (<>
                        {items.map((f, fi) => (<div key={fi} className="rounded-lg border p-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2"><Input placeholder="Feature title" value={f.title} onChange={(e) => { const n = [...items]; n[fi] = { ...f, title: e.target.value }; updateSectionData(section.id, n); }} /><Button variant="ghost" size="icon" className="h-8 w-8 justify-self-end" onClick={() => updateSectionData(section.id, items.filter((_, i) => i !== fi))}><Trash2 className="h-3 w-3 text-red-500" /></Button></div>
                          <Textarea placeholder="Description" value={f.description} onChange={(e) => { const n = [...items]; n[fi] = { ...f, description: e.target.value }; updateSectionData(section.id, n); }} rows={2} />
                        </div>))}
                        <Button variant="outline" size="sm" onClick={() => updateSectionData(section.id, [...items, { icon: "Star", title: "", description: "" }])}><Plus className="h-3.5 w-3.5" />Add Feature</Button>
                      </>); })()}
                      {section.type === "testimonials" && (() => { const items = section.data as TestimonialItem[]; return (<>
                        {items.map((t, ti) => (<div key={ti} className="rounded-lg border p-3 space-y-2">
                          <Textarea placeholder="Quote" value={t.quote} onChange={(e) => { const n = [...items]; n[ti] = { ...t, quote: e.target.value }; updateSectionData(section.id, n); }} rows={2} />
                          <div className="grid grid-cols-2 gap-2"><Input placeholder="Author" value={t.author} onChange={(e) => { const n = [...items]; n[ti] = { ...t, author: e.target.value }; updateSectionData(section.id, n); }} /><Input placeholder="Role" value={t.role} onChange={(e) => { const n = [...items]; n[ti] = { ...t, role: e.target.value }; updateSectionData(section.id, n); }} /></div>
                          <Button variant="ghost" size="sm" onClick={() => updateSectionData(section.id, items.filter((_, i) => i !== ti))}><Trash2 className="h-3 w-3 text-red-500" />Remove</Button>
                        </div>))}
                        <Button variant="outline" size="sm" onClick={() => updateSectionData(section.id, [...items, { quote: "", author: "", role: "" }])}><Plus className="h-3.5 w-3.5" />Add Testimonial</Button>
                      </>); })()}
                      {section.type === "pricing" && (() => { const tiers = section.data as PricingTier[]; return (<>
                        {tiers.map((t, ti) => (<div key={ti} className={`rounded-lg border p-3 space-y-2 ${t.highlighted ? "border-violet-500/50" : ""}`}>
                          <div className="grid grid-cols-3 gap-2">
                            <Input placeholder="Plan name" value={t.name} onChange={(e) => { const n = [...tiers]; n[ti] = { ...t, name: e.target.value }; updateSectionData(section.id, n); }} />
                            <Input placeholder="$29/mo" value={t.price} onChange={(e) => { const n = [...tiers]; n[ti] = { ...t, price: e.target.value }; updateSectionData(section.id, n); }} />
                            <div className="flex items-center gap-2"><label className="text-xs"><input type="checkbox" checked={t.highlighted} onChange={(e) => { const n = [...tiers]; n[ti] = { ...t, highlighted: e.target.checked }; updateSectionData(section.id, n); }} className="mr-1" />Featured</label></div>
                          </div>
                          <Textarea placeholder="Features (one per line)" value={t.features.join("\n")} onChange={(e) => { const n = [...tiers]; n[ti] = { ...t, features: e.target.value.split("\n") }; updateSectionData(section.id, n); }} rows={3} />
                          <Button variant="ghost" size="sm" onClick={() => updateSectionData(section.id, tiers.filter((_, i) => i !== ti))}><Trash2 className="h-3 w-3 text-red-500" />Remove</Button>
                        </div>))}
                        <Button variant="outline" size="sm" onClick={() => updateSectionData(section.id, [...tiers, { name: "", price: "", features: [], highlighted: false }])}><Plus className="h-3.5 w-3.5" />Add Tier</Button>
                      </>); })()}
                      {section.type === "faq" && (() => { const items = section.data as FaqItem[]; return (<>
                        {items.map((f, fi) => (<div key={fi} className="rounded-lg border p-3 space-y-2">
                          <Input placeholder="Question" value={f.question} onChange={(e) => { const n = [...items]; n[fi] = { ...f, question: e.target.value }; updateSectionData(section.id, n); }} />
                          <Textarea placeholder="Answer" value={f.answer} onChange={(e) => { const n = [...items]; n[fi] = { ...f, answer: e.target.value }; updateSectionData(section.id, n); }} rows={2} />
                          <Button variant="ghost" size="sm" onClick={() => updateSectionData(section.id, items.filter((_, i) => i !== fi))}><Trash2 className="h-3 w-3 text-red-500" />Remove</Button>
                        </div>))}
                        <Button variant="outline" size="sm" onClick={() => updateSectionData(section.id, [...items, { question: "", answer: "" }])}><Plus className="h-3.5 w-3.5" />Add Question</Button>
                      </>); })()}
                      {section.type === "cta" && (() => { const d = section.data as CtaData; return (<>
                        <div className="space-y-1.5"><Label>Headline</Label><Input value={d.headline} onChange={(e) => updateSectionData(section.id, { ...d, headline: e.target.value })} placeholder="Ready to Get Started?" /></div>
                        <div className="space-y-1.5"><Label>Description</Label><Textarea value={d.description} onChange={(e) => updateSectionData(section.id, { ...d, description: e.target.value })} rows={2} /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5"><Label>Button Text</Label><Input value={d.buttonText} onChange={(e) => updateSectionData(section.id, { ...d, buttonText: e.target.value })} /></div>
                          <div className="space-y-1.5"><Label>Button URL</Label><Input value={d.buttonUrl} onChange={(e) => updateSectionData(section.id, { ...d, buttonUrl: e.target.value })} /></div>
                        </div>
                      </>); })()}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
