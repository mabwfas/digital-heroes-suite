"use client";

import { useState, useCallback } from "react";
import { Filter, Plus, Trash2, Save, X, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface SegmentRule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface Segment {
  id: string;
  name: string;
  rules: SegmentRule[];
  logic: "AND" | "OR";
  savedAt: string;
}

const FIELDS = [
  { id: "last_purchase", label: "Last Purchase (days ago)" },
  { id: "emails_opened", label: "Emails Opened (count)" },
  { id: "total_spend", label: "Total Spend ($)" },
  { id: "location", label: "Location" },
  { id: "signup_date", label: "Signup Date (days ago)" },
  { id: "order_count", label: "Order Count" },
  { id: "avg_order_value", label: "Avg Order Value ($)" },
  { id: "cart_abandoned", label: "Cart Abandoned (count)" },
  { id: "tags", label: "Customer Tag" },
  { id: "source", label: "Acquisition Source" },
];

const OPERATORS = [
  { id: "gt", label: "greater than" },
  { id: "lt", label: "less than" },
  { id: "eq", label: "equals" },
  { id: "gte", label: "greater than or equal" },
  { id: "lte", label: "less than or equal" },
  { id: "contains", label: "contains" },
  { id: "not_eq", label: "does not equal" },
];

function emptyRule(): SegmentRule {
  return { id: generateId(), field: FIELDS[0].id, operator: "gt", value: "" };
}

export default function SegmentBuilderPage() {
  const [segName, setSegName] = useState("");
  const [rules, setRules] = useState<SegmentRule[]>([emptyRule()]);
  const [logic, setLogic] = useState<"AND" | "OR">("AND");
  const [saved, setSaved, hydrated] = useLocalStorage<Segment[]>("email-segments", []);
  const [showSaved, setShowSaved] = useState(false);

  const updateRule = useCallback((id: string, field: keyof SegmentRule, value: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }, []);

  const addRule = () => setRules(prev => [...prev, emptyRule()]);
  const removeRule = (id: string) => setRules(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev);

  const handleSave = useCallback(() => {
    if (!segName.trim() || rules.every(r => !r.value.trim())) return;
    const seg: Segment = { id: generateId(), name: segName.trim(), rules, logic, savedAt: new Date().toISOString() };
    setSaved(prev => [seg, ...prev.slice(0, 19)]);
    setSegName("");
    setRules([emptyRule()]);
  }, [segName, rules, logic, setSaved]);

  const loadSegment = (seg: Segment) => {
    setSegName(seg.name); setRules(seg.rules); setLogic(seg.logic); setShowSaved(false);
  };

  const fieldLabel = (id: string) => FIELDS.find(f => f.id === id)?.label || id;
  const opLabel = (id: string) => OPERATORS.find(o => o.id === id)?.label || id;

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audience Segment Builder"
        description="Define audience segments with visual rules for targeted email campaigns."
        icon={Filter}
        badge="Free"
        actions={
          <Button variant="outline" size="sm" onClick={() => setShowSaved(!showSaved)}>
            <Users className="h-4 w-4" /> Saved ({saved.length})
          </Button>
        }
      />

      {showSaved ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Saved Segments</CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowSaved(false)}><X className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {saved.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No saved segments.</p>
            ) : (
              <div className="space-y-2">
                {saved.map(seg => (
                  <div key={seg.id} className="rounded-lg border p-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer" onClick={() => loadSegment(seg)}>
                    <div>
                      <p className="text-sm font-medium">{seg.name}</p>
                      <p className="text-xs text-muted-foreground">{seg.rules.length} rules ({seg.logic}) | {new Date(seg.savedAt).toLocaleDateString()}</p>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={e => { e.stopPropagation(); setSaved(prev => prev.filter(s => s.id !== seg.id)); }}>
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4 text-violet-500" /> Build Segment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Segment Name</Label>
                <Input placeholder="e.g. High-Value Customers" value={segName} onChange={e => setSegName(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>Match Logic</Label>
                <div className="flex gap-2">
                  {(["AND", "OR"] as const).map(l => (
                    <button key={l} onClick={() => setLogic(l)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-all ${logic === l ? "border-violet-500 bg-violet-500/10 text-violet-600" : "border-border hover:border-violet-300"}`}
                    >Match {l} rules</button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {rules.map((rule, i) => (
                  <div key={rule.id} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Rule {i + 1}</span>
                      <Button variant="ghost" size="icon-sm" onClick={() => removeRule(rule.id)} disabled={rules.length <= 1}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select value={rule.field} onChange={e => updateRule(rule.id, "field", e.target.value)}
                        className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm">
                        {FIELDS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                      </select>
                      <select value={rule.operator} onChange={e => updateRule(rule.id, "operator", e.target.value)}
                        className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm">
                        {OPERATORS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </select>
                      <Input placeholder="Value..." value={rule.value} onChange={e => updateRule(rule.id, "value", e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full" onClick={addRule}>
                <Plus className="h-4 w-4" /> Add Rule
              </Button>

              <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleSave}
                disabled={!segName.trim() || rules.every(r => !r.value.trim())}>
                <Save className="h-4 w-4" /> Save Segment
              </Button>
            </CardContent>
          </Card>

          {rules.some(r => r.value.trim()) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Segment Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm font-medium mb-2">{segName || "Untitled Segment"}</p>
                  <div className="space-y-1">
                    {rules.filter(r => r.value.trim()).map((r, i) => (
                      <div key={r.id} className="flex items-center gap-2 text-xs">
                        {i > 0 && <Badge variant="secondary" className="text-[9px] h-4">{logic}</Badge>}
                        <span className="text-muted-foreground">{fieldLabel(r.field)}</span>
                        <span className="font-medium text-violet-600">{opLabel(r.operator)}</span>
                        <span className="font-bold">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
