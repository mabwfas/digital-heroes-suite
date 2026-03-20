"use client";

import { useState, useCallback } from "react";
import { Crosshair, Copy, RefreshCw, Trash2, Save, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface PositioningData {
  brand: string;
  targetMarket: string;
  category: string;
  differentiator: string;
  benefit: string;
  reason: string;
}

interface SavedPositioning {
  id: string;
  data: PositioningData;
  statement: string;
  createdAt: string;
}

const EMPTY: PositioningData = {
  brand: "", targetMarket: "", category: "", differentiator: "", benefit: "", reason: "",
};

function generatePositioning(d: PositioningData): string {
  return `For ${d.targetMarket || "[target market]"} who ${d.differentiator || "[need/want]"}, ${d.brand || "[brand]"} is the ${d.category || "[category]"} that ${d.benefit || "[key benefit]"} because ${d.reason || "[reason to believe]"}.`;
}

export default function PositioningPage() {
  const [data, setData] = useState<PositioningData>(EMPTY);
  const [statement, setStatement] = useState("");
  const [saved, setSaved, hydrated] = useLocalStorage<SavedPositioning[]>("brand-positioning", []);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    setStatement(generatePositioning(data));
  }, [data]);

  const handleSave = useCallback(() => {
    if (!statement) return;
    setSaved((prev) => [{ id: generateId(), data, statement, createdAt: new Date().toISOString() }, ...prev.slice(0, 19)]);
  }, [statement, data, setSaved]);

  const loadSaved = useCallback((s: SavedPositioning) => {
    setData(s.data);
    setStatement(s.statement);
  }, []);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brand Positioning Tool"
        description="Generate a clear positioning statement using the proven positioning formula."
        icon={Crosshair}
        badge="Brand"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Positioning Inputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-3 bg-muted/30 text-xs text-muted-foreground">
            <strong>Formula:</strong> For <Badge variant="secondary" className="text-[10px]">target market</Badge> who <Badge variant="secondary" className="text-[10px]">need</Badge>, <Badge variant="secondary" className="text-[10px]">brand</Badge> is the <Badge variant="secondary" className="text-[10px]">category</Badge> that <Badge variant="secondary" className="text-[10px]">benefit</Badge> because <Badge variant="secondary" className="text-[10px]">reason</Badge>.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Brand Name</Label><Input placeholder="e.g. Acme" value={data.brand} onChange={(e) => setData((d) => ({ ...d, brand: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Target Market</Label><Input placeholder="e.g. small business owners" value={data.targetMarket} onChange={(e) => setData((d) => ({ ...d, targetMarket: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Category</Label><Input placeholder="e.g. project management tool" value={data.category} onChange={(e) => setData((d) => ({ ...d, category: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Differentiator (who/what need)</Label><Input placeholder="e.g. need to manage remote teams" value={data.differentiator} onChange={(e) => setData((d) => ({ ...d, differentiator: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Key Benefit</Label><Textarea placeholder="e.g. delivers seamless collaboration" value={data.benefit} onChange={(e) => setData((d) => ({ ...d, benefit: e.target.value }))} rows={2} /></div>
            <div className="space-y-1.5"><Label>Reason to Believe</Label><Textarea placeholder="e.g. our AI-powered workflow engine" value={data.reason} onChange={(e) => setData((d) => ({ ...d, reason: e.target.value }))} rows={2} /></div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={generate}>
              <RefreshCw className="h-4 w-4" />Generate Statement
            </Button>
            {statement && <Button variant="outline" onClick={handleSave}><Save className="h-4 w-4" />Save</Button>}
          </div>
        </CardContent>
      </Card>

      {statement && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Positioning Statement</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-lg border p-4 bg-muted/30">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm leading-relaxed font-medium">{statement}</p>
                <Button variant="ghost" size="icon-sm" onClick={() => { navigator.clipboard.writeText(statement); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                  <Copy className={`h-3.5 w-3.5 ${copied ? "text-emerald-500" : ""}`} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {saved.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Saved Statements</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {saved.map((s) => (
              <div key={s.id} className="border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-between" onClick={() => loadSaved(s)}>
                <p className="text-sm truncate flex-1">{s.statement}</p>
                <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setSaved((p) => p.filter((x) => x.id !== s.id)); }}>
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
