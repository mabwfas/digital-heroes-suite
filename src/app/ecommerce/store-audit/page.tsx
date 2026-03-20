"use client";

import { useState } from "react";
import { ClipboardCheck, Plus, Trash2, Copy, Check, ChevronDown, ChevronRight, FileText, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type Priority = "Critical" | "Important" | "Nice-to-Have";

interface AuditItem {
  id: string;
  label: string;
  priority: Priority;
  checked: boolean;
  note: string;
}

interface AuditSection {
  id: string;
  name: string;
  items: AuditItem[];
}

interface SavedAudit {
  id: string;
  storeName: string;
  sections: AuditSection[];
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_SECTIONS: Omit<AuditSection, "id">[] = [
  {
    name: "Homepage",
    items: [
      { id: "", label: "Hero banner with clear value proposition", priority: "Critical", checked: false, note: "" },
      { id: "", label: "Clear navigation menu with categories", priority: "Critical", checked: false, note: "" },
      { id: "", label: "Featured products section", priority: "Important", checked: false, note: "" },
      { id: "", label: "Trust badges (secure checkout, guarantees)", priority: "Critical", checked: false, note: "" },
      { id: "", label: "Social proof (reviews count, testimonials)", priority: "Important", checked: false, note: "" },
      { id: "", label: "Email signup / newsletter opt-in", priority: "Important", checked: false, note: "" },
      { id: "", label: "Search functionality visible", priority: "Important", checked: false, note: "" },
      { id: "", label: "Announcement bar for promotions", priority: "Nice-to-Have", checked: false, note: "" },
      { id: "", label: "Fast loading (under 3 seconds)", priority: "Critical", checked: false, note: "" },
      { id: "", label: "Consistent branding and color scheme", priority: "Important", checked: false, note: "" },
    ],
  },
  {
    name: "Product Pages",
    items: [
      { id: "", label: "High-quality product images (multiple angles)", priority: "Critical", checked: false, note: "" },
      { id: "", label: "Zoom functionality on images", priority: "Important", checked: false, note: "" },
      { id: "", label: "Detailed product description", priority: "Critical", checked: false, note: "" },
      { id: "", label: "Clear pricing display", priority: "Critical", checked: false, note: "" },
      { id: "", label: "Size/variant selector working properly", priority: "Critical", checked: false, note: "" },
      { id: "", label: "Add to cart button prominent", priority: "Critical", checked: false, note: "" },
      { id: "", label: "Customer reviews section", priority: "Important", checked: false, note: "" },
      { id: "", label: "Related/recommended products", priority: "Important", checked: false, note: "" },
      { id: "", label: "Shipping information displayed", priority: "Important", checked: false, note: "" },
      { id: "", label: "Return policy accessible", priority: "Important", checked: false, note: "" },
      { id: "", label: "Product video or 360 view", priority: "Nice-to-Have", checked: false, note: "" },
      { id: "", label: "Stock/availability indicator", priority: "Important", checked: false, note: "" },
    ],
  },
  {
    name: "Cart & Checkout",
    items: [
      { id: "", label: "Clear call-to-action buttons", priority: "Critical", checked: false, note: "" },
      { id: "", label: "Security badges at checkout", priority: "Critical", checked: false, note: "" },
      { id: "", label: "Multiple payment options (credit, PayPal, etc.)", priority: "Critical", checked: false, note: "" },
      { id: "", label: "Guest checkout option available", priority: "Important", checked: false, note: "" },
      { id: "", label: "Order summary visible throughout", priority: "Important", checked: false, note: "" },
      { id: "", label: "Promo/discount code field", priority: "Important", checked: false, note: "" },
      { id: "", label: "Shipping cost calculator", priority: "Important", checked: false, note: "" },
      { id: "", label: "Cart recovery / abandoned cart email", priority: "Important", checked: false, note: "" },
    ],
  },
  {
    name: "SEO",
    items: [
      { id: "", label: "Unique meta titles on all pages", priority: "Critical", checked: false, note: "" },
      { id: "", label: "Meta descriptions on all pages", priority: "Critical", checked: false, note: "" },
      { id: "", label: "Alt tags on all images", priority: "Important", checked: false, note: "" },
      { id: "", label: "XML sitemap submitted", priority: "Important", checked: false, note: "" },
      { id: "", label: "Clean URL structure", priority: "Important", checked: false, note: "" },
      { id: "", label: "Schema markup (product, review, breadcrumb)", priority: "Important", checked: false, note: "" },
      { id: "", label: "301 redirects for old/broken URLs", priority: "Important", checked: false, note: "" },
      { id: "", label: "Blog or content strategy in place", priority: "Nice-to-Have", checked: false, note: "" },
    ],
  },
  {
    name: "Mobile",
    items: [
      { id: "", label: "Fully responsive design", priority: "Critical", checked: false, note: "" },
      { id: "", label: "Touch-friendly buttons and links", priority: "Critical", checked: false, note: "" },
      { id: "", label: "Fast mobile load speed", priority: "Critical", checked: false, note: "" },
      { id: "", label: "Mobile menu works correctly", priority: "Critical", checked: false, note: "" },
      { id: "", label: "Images optimized for mobile", priority: "Important", checked: false, note: "" },
      { id: "", label: "Mobile checkout flow tested", priority: "Important", checked: false, note: "" },
    ],
  },
  {
    name: "Trust & Legal",
    items: [
      { id: "", label: "Privacy policy page", priority: "Critical", checked: false, note: "" },
      { id: "", label: "Terms and conditions page", priority: "Critical", checked: false, note: "" },
      { id: "", label: "Contact page with multiple options", priority: "Critical", checked: false, note: "" },
      { id: "", label: "SSL certificate active (HTTPS)", priority: "Critical", checked: false, note: "" },
      { id: "", label: "Return/refund policy page", priority: "Important", checked: false, note: "" },
      { id: "", label: "About us page with brand story", priority: "Nice-to-Have", checked: false, note: "" },
    ],
  },
];

function createDefaultSections(): AuditSection[] {
  return DEFAULT_SECTIONS.map(section => ({
    id: generateId(),
    name: section.name,
    items: section.items.map(item => ({ ...item, id: generateId() })),
  }));
}

function priorityColor(p: Priority): string {
  if (p === "Critical") return "bg-red-500/10 text-red-600 border-red-200";
  if (p === "Important") return "bg-amber-500/10 text-amber-600 border-amber-200";
  return "bg-blue-500/10 text-blue-600 border-blue-200";
}

export default function StoreAuditPage() {
  const [audits, setAudits, hydrated] = useLocalStorage<SavedAudit[]>("ecommerce-store-audits", []);

  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const currentAudit = audits.find(a => a.id === currentAuditId) ?? null;

  const createAudit = () => {
    if (!storeName.trim()) return;
    const audit: SavedAudit = {
      id: generateId(),
      storeName: storeName.trim(),
      sections: createDefaultSections(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAudits(prev => [audit, ...prev]);
    setCurrentAuditId(audit.id);
    setStoreName("");
    setCollapsedSections(new Set());
  };

  const updateAudit = (updater: (audit: SavedAudit) => SavedAudit) => {
    if (!currentAuditId) return;
    setAudits(prev => prev.map(a =>
      a.id === currentAuditId ? updater({ ...a, updatedAt: new Date().toISOString() }) : a
    ));
  };

  const toggleItem = (sectionId: string, itemId: string) => {
    updateAudit(audit => ({
      ...audit,
      sections: audit.sections.map(s =>
        s.id === sectionId
          ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i) }
          : s
      ),
    }));
  };

  const updateNote = (sectionId: string, itemId: string, note: string) => {
    updateAudit(audit => ({
      ...audit,
      sections: audit.sections.map(s =>
        s.id === sectionId
          ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, note } : i) }
          : s
      ),
    }));
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const deleteAudit = (id: string) => {
    setAudits(prev => prev.filter(a => a.id !== id));
    if (currentAuditId === id) setCurrentAuditId(null);
  };

  const getSectionStats = (section: AuditSection) => {
    const total = section.items.length;
    const checked = section.items.filter(i => i.checked).length;
    return { total, checked, pct: total > 0 ? Math.round((checked / total) * 100) : 0 };
  };

  const getOverallStats = (audit: SavedAudit) => {
    const total = audit.sections.reduce((acc, s) => acc + s.items.length, 0);
    const checked = audit.sections.reduce((acc, s) => acc + s.items.filter(i => i.checked).length, 0);
    return { total, checked, pct: total > 0 ? Math.round((checked / total) * 100) : 0 };
  };

  const exportAudit = async () => {
    if (!currentAudit) return;
    const overall = getOverallStats(currentAudit);
    const lines = [
      `STORE AUDIT REPORT: ${currentAudit.storeName}`,
      `Date: ${new Date(currentAudit.updatedAt).toLocaleDateString()}`,
      `Overall Completion: ${overall.checked}/${overall.total} (${overall.pct}%)`,
      `${"=".repeat(60)}`,
      "",
    ];

    for (const section of currentAudit.sections) {
      const stats = getSectionStats(section);
      lines.push(`## ${section.name} (${stats.checked}/${stats.total} - ${stats.pct}%)`);
      lines.push("");
      for (const item of section.items) {
        const check = item.checked ? "[x]" : "[ ]";
        lines.push(`  ${check} [${item.priority}] ${item.label}`);
        if (item.note) {
          lines.push(`      Note: ${item.note}`);
        }
      }
      lines.push("");
    }

    const text = lines.join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store Audit Checklist"
        description="Comprehensive Shopify store audit with section-by-section checklists, notes, and exportable reports."
        icon={ClipboardCheck}
        badge="E-Commerce"
        replaces="Google Sheets Audits"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Audit List */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Your Audits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createAudit()}
                  placeholder="Store name..."
                />
                <Button size="sm" onClick={createAudit} disabled={!storeName.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {audits.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No audits yet. Create one above!</p>
              ) : (
                <div className="space-y-1.5">
                  {audits.map(audit => {
                    const stats = getOverallStats(audit);
                    const isActive = currentAuditId === audit.id;
                    return (
                      <div
                        key={audit.id}
                        className={`p-2.5 rounded-lg cursor-pointer transition-all ${
                          isActive
                            ? "bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-200"
                            : "hover:bg-muted border border-transparent"
                        }`}
                        onClick={() => { setCurrentAuditId(audit.id); setCollapsedSections(new Set()); }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">{audit.storeName}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 shrink-0"
                            onClick={e => { e.stopPropagation(); deleteAudit(audit.id); }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all"
                              style={{ width: `${stats.pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">{stats.pct}%</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(audit.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main: Audit Content */}
        <div className="lg:col-span-3 space-y-4">
          {!currentAudit ? (
            <Card>
              <CardContent className="py-16 text-center">
                <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Select an audit from the sidebar or create a new one.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Overall Progress */}
              {(() => {
                const overall = getOverallStats(currentAudit);
                return (
                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h2 className="font-bold">{currentAudit.storeName}</h2>
                          <p className="text-xs text-muted-foreground">{overall.checked}/{overall.total} items completed</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold">{overall.pct}%</span>
                          <Button size="sm" variant="outline" onClick={exportAudit}>
                            {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Download className="h-3.5 w-3.5 mr-1" />}
                            {copied ? "Copied!" : "Export Report"}
                          </Button>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all"
                          style={{ width: `${overall.pct}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Section Progress Overview */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {currentAudit.sections.map(section => {
                  const stats = getSectionStats(section);
                  return (
                    <Card key={section.id} className="cursor-pointer" onClick={() => {
                      const el = document.getElementById(`section-${section.id}`);
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}>
                      <CardContent className="py-3 px-3 text-center">
                        <p className="text-xs font-medium truncate">{section.name}</p>
                        <p className={`text-lg font-bold ${stats.pct === 100 ? "text-emerald-600" : ""}`}>{stats.pct}%</p>
                        <p className="text-[10px] text-muted-foreground">{stats.checked}/{stats.total}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Sections */}
              {currentAudit.sections.map(section => {
                const stats = getSectionStats(section);
                const isCollapsed = collapsedSections.has(section.id);
                return (
                  <Card key={section.id} id={`section-${section.id}`}>
                    <CardHeader className="pb-2">
                      <button
                        className="flex items-center justify-between w-full text-left"
                        onClick={() => toggleSection(section.id)}
                      >
                        <div className="flex items-center gap-2">
                          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          <CardTitle className="text-sm">{section.name}</CardTitle>
                          <Badge variant="secondary" className="text-[10px]">{stats.checked}/{stats.total}</Badge>
                          {stats.pct === 100 && (
                            <Badge variant="default" className="text-[10px] bg-emerald-500">Complete</Badge>
                          )}
                        </div>
                        <span className="text-sm font-bold">{stats.pct}%</span>
                      </button>
                      <div className="h-1 bg-muted rounded-full overflow-hidden mt-2">
                        <div
                          className={`h-full transition-all ${stats.pct === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-violet-500 to-pink-500"}`}
                          style={{ width: `${stats.pct}%` }}
                        />
                      </div>
                    </CardHeader>
                    {!isCollapsed && (
                      <CardContent className="space-y-1">
                        {section.items.map(item => (
                          <div key={item.id} className="group">
                            <div className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-all">
                              <button
                                onClick={() => toggleItem(section.id, item.id)}
                                className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                  item.checked
                                    ? "bg-gradient-to-r from-violet-500 to-pink-500 border-transparent"
                                    : "border-muted-foreground/30 hover:border-violet-400"
                                }`}
                              >
                                {item.checked && <Check className="h-3 w-3 text-white" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm ${item.checked ? "line-through text-muted-foreground" : ""}`}>
                                    {item.label}
                                  </span>
                                  <Badge variant="outline" className={`text-[10px] shrink-0 ${priorityColor(item.priority)}`}>
                                    {item.priority}
                                  </Badge>
                                </div>
                                <div className="mt-1">
                                  <Input
                                    value={item.note}
                                    onChange={e => updateNote(section.id, item.id, e.target.value)}
                                    placeholder="Add a note..."
                                    className="h-7 text-xs opacity-60 focus:opacity-100 transition-opacity"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
