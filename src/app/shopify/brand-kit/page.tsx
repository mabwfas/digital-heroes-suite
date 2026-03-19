"use client";

import { useState } from "react";
import { Briefcase, Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp, Star, Copy } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface BrandKit {
  id: string;
  name: string;
  logoUrl: string;
  colors: string[];
  primaryFont: string;
  secondaryFont: string;
  tagline: string;
  notes: string;
  industry: string;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_KIT: Omit<BrandKit, "id" | "createdAt" | "updatedAt"> = {
  name: "",
  logoUrl: "",
  colors: ["#5B21B6", "#DB2777", "#F59E0B", "#10B981", "#0EA5E9"],
  primaryFont: "Inter",
  secondaryFont: "Playfair Display",
  tagline: "",
  notes: "",
  industry: "",
};

const PRESET_COLORS = [
  "#5B21B6", "#7C3AED", "#8B5CF6",
  "#DB2777", "#EC4899", "#F472B6",
  "#F59E0B", "#F97316", "#EF4444",
  "#10B981", "#059669", "#06B6D4",
  "#0EA5E9", "#3B82F6", "#6366F1",
  "#1E293B", "#374151", "#6B7280",
  "#FFFFFF", "#F8FAFC", "#FEF3C7",
];

function ColorPicker({ colors, onChange }: { colors: string[]; onChange: (colors: string[]) => void }) {
  const updateColor = (i: number, val: string) => {
    const next = [...colors];
    next[i] = val;
    onChange(next);
  };
  const removeColor = (i: number) => onChange(colors.filter((_, idx) => idx !== i));
  const addColor = () => onChange([...colors, "#000000"]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {colors.map((c, i) => (
          <div key={i} className="relative group">
            <div className="h-9 w-9 rounded-lg border-2 border-transparent group-hover:border-muted-foreground/30 overflow-hidden transition-all">
              <input
                type="color"
                value={c}
                onChange={e => updateColor(i, e.target.value)}
                className="h-full w-full cursor-pointer border-0 p-0 scale-125"
              />
            </div>
            <button
              onClick={() => removeColor(i)}
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
        {colors.length < 8 && (
          <button
            onClick={addColor}
            className="h-9 w-9 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:border-violet-400 hover:text-violet-500 transition-all"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
      {/* Quick Presets */}
      <div>
        <p className="text-[10px] text-muted-foreground mb-1.5">Quick add:</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => { if (colors.length < 8 && !colors.includes(c)) onChange([...colors, c]); }}
              className="h-5 w-5 rounded-md border border-muted-foreground/20 hover:scale-110 transition-transform"
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function BrandKitCard({
  kit,
  isActive,
  onActivate,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  kit: BrandKit;
  isActive: boolean;
  onActivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`transition-all ${isActive ? "border-violet-500 shadow-md shadow-violet-500/10" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Logo / Initial */}
          <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border" style={{ backgroundColor: kit.colors[0] + "20" }}>
            {kit.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={kit.logoUrl} alt={kit.name} className="h-full w-full object-contain" />
            ) : (
              <span className="text-xl font-bold" style={{ color: kit.colors[0] }}>
                {kit.name.charAt(0).toUpperCase() || "?"}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm truncate">{kit.name || "Unnamed Kit"}</h3>
              {isActive && (
                <Badge className="bg-gradient-to-r from-violet-500 to-pink-500 text-white border-0 text-[10px] shrink-0">
                  <Star className="h-2.5 w-2.5 mr-0.5" />
                  Active
                </Badge>
              )}
              {kit.industry && <Badge variant="secondary" className="text-[10px] shrink-0">{kit.industry}</Badge>}
            </div>
            {kit.tagline && <p className="text-xs text-muted-foreground italic truncate">&quot;{kit.tagline}&quot;</p>}
            <div className="flex gap-1 mt-2">
              {kit.colors.slice(0, 6).map((c, i) => (
                <div key={i} className="h-4 w-4 rounded-sm" style={{ backgroundColor: c }} title={c} />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {!isActive && (
              <Button size="sm" variant="outline" onClick={onActivate} className="text-xs h-7 px-2">Set Active</Button>
            )}
            <button onClick={() => setExpanded(v => !v)} className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-0.5">Primary Font</p>
                <p className="font-medium">{kit.primaryFont || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Secondary Font</p>
                <p className="font-medium">{kit.secondaryFont || "—"}</p>
              </div>
              {kit.logoUrl && (
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-0.5">Logo URL</p>
                  <p className="font-mono text-[10px] truncate">{kit.logoUrl}</p>
                </div>
              )}
              {kit.notes && (
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-0.5">Notes</p>
                  <p className="leading-relaxed">{kit.notes}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onEdit} className="text-xs">
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={onDuplicate} className="text-xs">
                <Copy className="h-3 w-3 mr-1" />
                Duplicate
              </Button>
              <Button size="sm" variant="outline" onClick={onDelete} className="text-xs text-destructive hover:text-destructive hover:border-destructive">
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function BrandKitPage() {
  const [kits, setKits] = useLocalStorage<BrandKit[]>("shopify-brand-kits", []);
  const [activeKitId, setActiveKitId] = useLocalStorage<string | null>("shopify-brand-kit-active", null);
  const [showForm, setShowForm] = useState(false);
  const [editingKit, setEditingKit] = useState<BrandKit | null>(null);
  const [form, setForm] = useState<Omit<BrandKit, "id" | "createdAt" | "updatedAt">>(EMPTY_KIT);

  const openCreate = () => {
    setForm(EMPTY_KIT);
    setEditingKit(null);
    setShowForm(true);
  };

  const openEdit = (kit: BrandKit) => {
    setEditingKit(kit);
    setForm({ name: kit.name, logoUrl: kit.logoUrl, colors: [...kit.colors], primaryFont: kit.primaryFont, secondaryFont: kit.secondaryFont, tagline: kit.tagline, notes: kit.notes, industry: kit.industry });
    setShowForm(true);
  };

  const saveKit = () => {
    if (!form.name.trim()) return;
    if (editingKit) {
      setKits(prev => prev.map(k => k.id === editingKit.id ? { ...k, ...form, updatedAt: new Date().toISOString() } : k));
    } else {
      const now = new Date().toISOString();
      const newKit: BrandKit = { ...form, id: generateId(), createdAt: now, updatedAt: now };
      setKits(prev => [newKit, ...prev]);
      if (kits.length === 0) setActiveKitId(newKit.id);
    }
    setShowForm(false);
    setEditingKit(null);
  };

  const deleteKit = (id: string) => {
    setKits(prev => prev.filter(k => k.id !== id));
    if (activeKitId === id) setActiveKitId(null);
  };

  const duplicateKit = (kit: BrandKit) => {
    const now = new Date().toISOString();
    const dup: BrandKit = { ...kit, id: generateId(), name: `${kit.name} (Copy)`, createdAt: now, updatedAt: now };
    setKits(prev => [dup, ...prev]);
  };

  const updateForm = (key: keyof typeof form, value: string | string[]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const activeKit = kits.find(k => k.id === activeKitId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brand Kit Manager"
        description="Store and manage complete brand identities for all your clients in one place."
        icon={Briefcase}
        badge="Client Management"
        replaces="Brandfolder, Frontify"
      />

      {/* Active Kit Banner */}
      {activeKit && (
        <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-500/5 to-pink-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border-2 border-violet-300/50" style={{ backgroundColor: activeKit.colors[0] + "25" }}>
              <span className="text-xl font-bold" style={{ color: activeKit.colors[0] }}>
                {activeKit.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{activeKit.name}</p>
                <Badge className="bg-gradient-to-r from-violet-500 to-pink-500 text-white border-0 text-[10px]">
                  <Star className="h-2.5 w-2.5 mr-0.5" />
                  Active Brand Kit
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground italic">{activeKit.tagline || "No tagline set"}</p>
              <div className="flex gap-1 mt-1.5">
                {activeKit.colors.map((c, i) => (
                  <div key={i} className="h-4 w-4 rounded-sm border border-white/20" style={{ backgroundColor: c }} title={c} />
                ))}
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p className="font-medium">{activeKit.primaryFont}</p>
              <p>{activeKit.secondaryFont}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{kits.length} Brand Kit{kits.length !== 1 ? "s" : ""}</p>
          <p className="text-xs text-muted-foreground">Click any kit to expand details</p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Brand Kit
        </Button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <Card className="border-violet-300 dark:border-violet-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{editingKit ? "Edit Brand Kit" : "New Brand Kit"}</CardTitle>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Brand / Client Name *</Label>
                <Input value={form.name} onChange={e => updateForm("name", e.target.value)} placeholder="e.g. Luminary Studio" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Industry</Label>
                <Input value={form.industry} onChange={e => updateForm("industry", e.target.value)} placeholder="e.g. Fashion, F&B, Tech..." />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Tagline</Label>
                <Input value={form.tagline} onChange={e => updateForm("tagline", e.target.value)} placeholder="e.g. Crafted with purpose" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Logo URL</Label>
                <Input value={form.logoUrl} onChange={e => updateForm("logoUrl", e.target.value)} placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Primary Font</Label>
                  <Input value={form.primaryFont} onChange={e => updateForm("primaryFont", e.target.value)} placeholder="Inter" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Secondary Font</Label>
                  <Input value={form.secondaryFont} onChange={e => updateForm("secondaryFont", e.target.value)} placeholder="Playfair Display" />
                </div>
              </div>
            </div>

            {/* Colors */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Brand Colors</Label>
              <ColorPicker colors={form.colors} onChange={colors => updateForm("colors", colors)} />
            </div>

            {/* Notes */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={e => updateForm("notes", e.target.value)}
                placeholder="Client preferences, brand voice, usage guidelines..."
                className="min-h-[80px] text-sm"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                onClick={saveKit}
                disabled={!form.name.trim()}
                className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
              >
                <Check className="h-4 w-4 mr-2" />
                {editingKit ? "Save Changes" : "Create Brand Kit"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kit List */}
      {kits.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center mb-4">
              <Briefcase className="h-8 w-8 text-violet-500/50" />
            </div>
            <h3 className="font-semibold mb-1">No Brand Kits Yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Create your first brand kit to store all the visual identity elements for you or your clients.
            </p>
            <Button onClick={openCreate} className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Brand Kit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {kits.map(kit => (
            <BrandKitCard
              key={kit.id}
              kit={kit}
              isActive={kit.id === activeKitId}
              onActivate={() => setActiveKitId(kit.id)}
              onEdit={() => openEdit(kit)}
              onDelete={() => deleteKit(kit.id)}
              onDuplicate={() => duplicateKit(kit)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
