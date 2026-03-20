"use client";

import { useState, useMemo } from "react";
import {
  Filter,
  Plus,
  Trash2,
  ArrowDown,
  TrendingDown,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface FunnelStage {
  id: string;
  name: string;
  count: number;
}

interface Funnel {
  id: string;
  name: string;
  stages: FunnelStage[];
  createdAt: string;
}

function conversionRate(from: number, to: number): number {
  if (from === 0) return 0;
  return Math.round((to / from) * 1000) / 10;
}

function dropOff(from: number, to: number): number {
  if (from === 0) return 0;
  return Math.round(((from - to) / from) * 1000) / 10;
}

export default function FunnelBuilderPage() {
  const [funnels, setFunnels, hydrated] = useLocalStorage<Funnel[]>("analytics-funnel-builder", []);
  const [funnelName, setFunnelName] = useState("");
  const [stageName, setStageName] = useState("");
  const [stageCount, setStageCount] = useState("");
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  function addStage() {
    if (!stageName.trim()) return;
    setStages((prev) => [...prev, { id: generateId(), name: stageName.trim(), count: parseInt(stageCount) || 0 }]);
    setStageName("");
    setStageCount("");
  }

  function saveFunnel() {
    if (!funnelName.trim() || stages.length < 2) return;
    if (editingId) {
      setFunnels((prev) => prev.map((f) => (f.id === editingId ? { ...f, name: funnelName.trim(), stages } : f)));
      setEditingId(null);
    } else {
      const funnel: Funnel = {
        id: generateId(),
        name: funnelName.trim(),
        stages,
        createdAt: new Date().toISOString(),
      };
      setFunnels((prev) => [...prev, funnel]);
    }
    setFunnelName("");
    setStages([]);
  }

  function editFunnel(f: Funnel) {
    setEditingId(f.id);
    setFunnelName(f.name);
    setStages(f.stages);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funnel Builder"
        description="Define conversion funnel stages, input numbers, and auto-calculate conversion rates and drop-off percentages."
        icon={Filter}
        badge="Analytics"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4 text-violet-500" />
            {editingId ? "Edit Funnel" : "Build Funnel"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Funnel Name *</Label>
            <Input placeholder="Sales Funnel" value={funnelName} onChange={(e) => setFunnelName(e.target.value)} className="max-w-sm" />
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-lg">
            <div className="space-y-1.5">
              <Label>Stage Name</Label>
              <Input placeholder="Visitors" value={stageName} onChange={(e) => setStageName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Count</Label>
              <Input type="number" placeholder="10000" value={stageCount} onChange={(e) => setStageCount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="invisible">Add</Label>
              <Button variant="outline" className="w-full" onClick={addStage} disabled={!stageName.trim()}>
                <Plus className="h-4 w-4" />
                Add Stage
              </Button>
            </div>
          </div>

          {stages.length > 0 && (
            <div className="space-y-2">
              {stages.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{i + 1}</Badge>
                  <span className="text-sm font-medium w-32">{s.name}</span>
                  <span className="text-sm text-muted-foreground">{s.count.toLocaleString()}</span>
                  {i > 0 && (
                    <span className="text-xs text-emerald-600 ml-2">
                      {conversionRate(stages[i - 1].count, s.count)}% conv
                    </span>
                  )}
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setStages((prev) => prev.filter((x) => x.id !== s.id))}>
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button
            className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
            onClick={saveFunnel}
            disabled={!funnelName.trim() || stages.length < 2}
          >
            {editingId ? "Update Funnel" : "Save Funnel"}
          </Button>
        </CardContent>
      </Card>

      {funnels.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Filter className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Build your first funnel with at least 2 stages.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {funnels.map((funnel) => {
            const totalConv = funnel.stages.length >= 2
              ? conversionRate(funnel.stages[0].count, funnel.stages[funnel.stages.length - 1].count)
              : 0;
            return (
              <Card key={funnel.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{funnel.name}</CardTitle>
                    <div className="flex gap-2">
                      <Badge className="bg-violet-500/10 text-violet-600 border-0">
                        Overall: {totalConv}%
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => editFunnel(funnel)}>Edit</Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFunnels((prev) => prev.filter((x) => x.id !== funnel.id))}>
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-0">
                    {funnel.stages.map((stage, i) => {
                      const widthPct = funnel.stages[0].count > 0
                        ? Math.max(8, (stage.count / funnel.stages[0].count) * 100)
                        : 100;
                      const conv = i > 0 ? conversionRate(funnel.stages[i - 1].count, stage.count) : 100;
                      const drop = i > 0 ? dropOff(funnel.stages[i - 1].count, stage.count) : 0;
                      return (
                        <div key={stage.id}>
                          {i > 0 && (
                            <div className="flex items-center gap-2 py-1 pl-4">
                              <ArrowDown className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[10px] text-emerald-600 font-medium">{conv}% converted</span>
                              <span className="text-[10px] text-red-500">{drop}% drop-off ({(funnel.stages[i - 1].count - stage.count).toLocaleString()} lost)</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <div
                              className="h-10 rounded bg-gradient-to-r from-violet-500/80 to-pink-500/60 flex items-center px-3 transition-all"
                              style={{ width: `${widthPct}%` }}
                            >
                              <span className="text-xs font-semibold text-white truncate">{stage.name}</span>
                            </div>
                            <span className="text-sm font-bold whitespace-nowrap">{stage.count.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {funnel.stages.length > 1 && (
                    <>
                      <Separator className="my-4" />
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b">
                              {["Stage", "Count", "Stage Conv %", "Cumulative Conv %", "Drop-off %", "Lost"].map((h) => (
                                <th key={h} className="text-left p-1.5 font-medium text-muted-foreground">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {funnel.stages.map((stage, i) => (
                              <tr key={stage.id} className="border-b last:border-0">
                                <td className="p-1.5 font-medium">{stage.name}</td>
                                <td className="p-1.5">{stage.count.toLocaleString()}</td>
                                <td className="p-1.5 text-emerald-600 font-medium">
                                  {i === 0 ? "—" : `${conversionRate(funnel.stages[i - 1].count, stage.count)}%`}
                                </td>
                                <td className="p-1.5 text-violet-600 font-medium">
                                  {conversionRate(funnel.stages[0].count, stage.count)}%
                                </td>
                                <td className="p-1.5 text-red-500">
                                  {i === 0 ? "—" : `${dropOff(funnel.stages[i - 1].count, stage.count)}%`}
                                </td>
                                <td className="p-1.5 text-muted-foreground">
                                  {i === 0 ? "—" : (funnel.stages[i - 1].count - stage.count).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
