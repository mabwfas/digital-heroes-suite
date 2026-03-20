"use client";

import { useState, useCallback } from "react";
import { Target, Copy, RefreshCw, Trash2, Save, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface Canvas {
  customerJobs: string;
  customerPains: string;
  customerGains: string;
  productFeatures: string;
  painRelievers: string;
  gainCreators: string;
}

interface SavedCanvas {
  id: string;
  name: string;
  canvas: Canvas;
  statement: string;
  createdAt: string;
}

const EMPTY: Canvas = {
  customerJobs: "", customerPains: "", customerGains: "",
  productFeatures: "", painRelievers: "", gainCreators: "",
};

function generateStatement(c: Canvas): string {
  const jobs = c.customerJobs || "achieve their goals";
  const pains = c.customerPains || "common frustrations";
  const gains = c.customerGains || "desired outcomes";
  const features = c.productFeatures || "our solution";
  const relievers = c.painRelievers || "eliminating key obstacles";
  const creators = c.gainCreators || "delivering real results";
  return `For customers who need to ${jobs} but struggle with ${pains}, ${features} provides ${creators} by ${relievers}, enabling them to achieve ${gains}.`;
}

export default function ValuePropPage() {
  const [canvas, setCanvas] = useState<Canvas>(EMPTY);
  const [statement, setStatement] = useState("");
  const [name, setName] = useState("");
  const [saved, setSaved, hydrated] = useLocalStorage<SavedCanvas[]>("value-prop-canvases", []);
  const [showSaved, setShowSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    setStatement(generateStatement(canvas));
  }, [canvas]);

  const handleSave = useCallback(() => {
    if (!statement) return;
    setSaved((prev) => [{ id: generateId(), name: name || "Untitled", canvas, statement, createdAt: new Date().toISOString() }, ...prev.slice(0, 19)]);
  }, [statement, name, canvas, setSaved]);

  const loadCanvas = useCallback((s: SavedCanvas) => {
    setCanvas(s.canvas);
    setStatement(s.statement);
    setName(s.name);
    setShowSaved(false);
  }, []);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Value Proposition Canvas"
        description="Map customer needs to product capabilities and generate a value proposition statement."
        icon={Target}
        badge="Copywriting"
        actions={
          <Button variant="outline" size="sm" onClick={() => setShowSaved(!showSaved)}>
            <Save className="h-4 w-4" />Saved ({saved.length})
          </Button>
        }
      />

      {showSaved ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Saved Canvases</CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowSaved(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {saved.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No saved canvases yet.</p>
            ) : (
              <div className="space-y-2">
                {saved.map((s) => (
                  <div key={s.id} className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-between" onClick={() => loadCanvas(s)}>
                    <div>
                      <span className="font-medium text-sm">{s.name}</span>
                      <p className="text-xs text-muted-foreground truncate max-w-md">{s.statement}</p>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setSaved((p) => p.filter((x) => x.id !== s.id)); }}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base text-pink-600">Customer Profile</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Customer Jobs</Label>
                  <Textarea placeholder="What are they trying to accomplish?" value={canvas.customerJobs} onChange={(e) => setCanvas((c) => ({ ...c, customerJobs: e.target.value }))} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label>Customer Pains</Label>
                  <Textarea placeholder="What frustrates them? What risks do they face?" value={canvas.customerPains} onChange={(e) => setCanvas((c) => ({ ...c, customerPains: e.target.value }))} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label>Customer Gains</Label>
                  <Textarea placeholder="What outcomes do they desire?" value={canvas.customerGains} onChange={(e) => setCanvas((c) => ({ ...c, customerGains: e.target.value }))} rows={2} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base text-violet-600">Value Map</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Products & Features</Label>
                  <Textarea placeholder="What do you offer?" value={canvas.productFeatures} onChange={(e) => setCanvas((c) => ({ ...c, productFeatures: e.target.value }))} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label>Pain Relievers</Label>
                  <Textarea placeholder="How do you alleviate customer pains?" value={canvas.painRelievers} onChange={(e) => setCanvas((c) => ({ ...c, painRelievers: e.target.value }))} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label>Gain Creators</Label>
                  <Textarea placeholder="How do you create customer gains?" value={canvas.gainCreators} onChange={(e) => setCanvas((c) => ({ ...c, gainCreators: e.target.value }))} rows={2} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Canvas name (optional)" value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
                <Button className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={generate}>
                  <RefreshCw className="h-4 w-4" />Generate Statement
                </Button>
                {statement && <Button variant="outline" onClick={handleSave}><Save className="h-4 w-4" />Save</Button>}
              </div>
              {statement && (
                <div className="rounded-lg border p-4 bg-muted/30">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm leading-relaxed">{statement}</p>
                    <Button variant="ghost" size="icon-sm" onClick={() => { navigator.clipboard.writeText(statement); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                      <Copy className={`h-3.5 w-3.5 ${copied ? "text-emerald-500" : ""}`} />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
