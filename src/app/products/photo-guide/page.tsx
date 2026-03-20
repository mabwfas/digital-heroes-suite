"use client";

import { useState, useMemo } from "react";
import { Camera, Plus, Trash2, CheckCircle2, Circle, Copy, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

const SHOT_TYPES = [
  { key: "hero", label: "Hero Shot", desc: "Main product image on white background" },
  { key: "lifestyle", label: "Lifestyle", desc: "Product in use/context" },
  { key: "detail", label: "Detail Close-up", desc: "Texture, material, craftsmanship" },
  { key: "scale", label: "Scale Reference", desc: "Product next to common object for size" },
  { key: "packaging", label: "Packaging", desc: "Product in packaging or unboxing" },
  { key: "360", label: "360 / Multi-angle", desc: "Multiple angles or 360 spin" },
];

interface PhotoProduct {
  id: string;
  name: string;
  shots: Record<string, boolean>;
  notes: string;
}

export default function PhotoGuidePage() {
  const [products, setProducts] = useLocalStorage<PhotoProduct[]>("products-photo-guide", []);
  const [newName, setNewName] = useState("");
  const [copied, setCopied] = useState(false);

  function addProduct() {
    if (!newName.trim()) return;
    const shots: Record<string, boolean> = {};
    SHOT_TYPES.forEach((s) => (shots[s.key] = false));
    setProducts((prev) => [{ id: generateId(), name: newName.trim(), shots, notes: "" }, ...prev]);
    setNewName("");
  }

  function toggleShot(productId: string, shotKey: string) {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, shots: { ...p.shots, [shotKey]: !p.shots[shotKey] } }
          : p
      )
    );
  }

  function removeProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function updateNotes(id: string, notes: string) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, notes } : p)));
  }

  const stats = useMemo(() => {
    const totalShots = products.length * SHOT_TYPES.length;
    const completed = products.reduce(
      (s, p) => s + Object.values(p.shots).filter(Boolean).length,
      0
    );
    return { totalShots, completed, pct: totalShots > 0 ? Math.round((completed / totalShots) * 100) : 0 };
  }, [products]);

  function generateSpec() {
    const lines = ["PRODUCT PHOTO REQUIREMENTS", "=".repeat(40), ""];
    SHOT_TYPES.forEach((s) => {
      lines.push(`${s.label}`);
      lines.push(`  ${s.desc}`);
      lines.push("");
    });
    lines.push("GENERAL SPECS:");
    lines.push("- Resolution: 2048x2048px minimum");
    lines.push("- Format: PNG or JPEG (quality 90+)");
    lines.push("- Background: Pure white (#FFFFFF) for hero shots");
    lines.push("- Lighting: Soft, even, no harsh shadows");
    lines.push("- Color accuracy: sRGB color space");
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Photo Guide"
        description="Track photo completion per product with a standard shot checklist and generate photo requirement specs."
        icon={Camera}
        badge="Products"
        replaces="Photo spreadsheet tracking"
        actions={
          <Button variant="outline" onClick={generateSpec}>
            {copied ? <Check className="h-4 w-4 mr-2 text-emerald-500" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied!" : "Copy Photo Spec"}
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{products.length}</p><p className="text-xs text-muted-foreground">Products</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{stats.completed}/{stats.totalShots}</p><p className="text-xs text-muted-foreground">Shots Complete</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{stats.pct}%</p><p className="text-xs text-muted-foreground">Overall Progress</p></CardContent></Card>
      </div>

      <div className="flex gap-3">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Product name" className="flex-1" onKeyDown={(e) => e.key === "Enter" && addProduct()} />
        <Button onClick={addProduct} disabled={!newName.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
          <Plus className="h-4 w-4 mr-2" />Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Camera className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="font-medium text-muted-foreground">Add products to start tracking photo completion</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {products.map((p) => {
            const done = Object.values(p.shots).filter(Boolean).length;
            const total = SHOT_TYPES.length;
            const pct = Math.round((done / total) * 100);
            return (
              <Card key={p.id} className="border-border/50 group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{p.name}</span>
                      <Badge variant={pct === 100 ? "default" : "secondary"}>
                        {done}/{total} ({pct}%)
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive opacity-0 group-hover:opacity-100" onClick={() => removeProduct(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mb-3">
                    <div className="bg-gradient-to-r from-violet-500 to-pink-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {SHOT_TYPES.map((s) => (
                      <button
                        key={s.key}
                        onClick={() => toggleShot(p.id, s.key)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-left text-sm transition-colors ${
                          p.shots[s.key]
                            ? "bg-emerald-500/10 border-emerald-500/30"
                            : "bg-muted/30 border-border/50 hover:border-violet-500/30"
                        }`}
                      >
                        {p.shots[s.key] ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-xs">{s.label}</p>
                          <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3">
                    <Input
                      placeholder="Notes..."
                      value={p.notes}
                      onChange={(e) => updateNotes(p.id, e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
