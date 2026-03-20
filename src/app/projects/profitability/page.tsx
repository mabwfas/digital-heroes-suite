"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  Plus,
  Trash2,
  Pencil,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface Project {
  id: string;
  name: string;
  quotedPrice: number;
  actualHours: number;
  hourlyRate: number;
  expenses: number;
  estimatedHours: number;
  createdAt: string;
}

export default function ProfitabilityPage() {
  const [projects, setProjects] = useLocalStorage<Project[]>("projects-profitability", []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", quotedPrice: 0, actualHours: 0, hourlyRate: 0, expenses: 0, estimatedHours: 0 });

  function calc(p: Project) {
    const actualCost = p.actualHours * p.hourlyRate + p.expenses;
    const profit = p.quotedPrice - actualCost;
    const margin = p.quotedPrice > 0 ? (profit / p.quotedPrice) * 100 : 0;
    const effectiveRate = p.actualHours > 0 ? (p.quotedPrice - p.expenses) / p.actualHours : 0;
    return { actualCost, profit, margin, effectiveRate };
  }

  const summary = useMemo(() => {
    if (projects.length === 0) return { totalRevenue: 0, totalProfit: 0, avgMargin: 0, avgEffectiveRate: 0 };
    let totalRevenue = 0, totalProfit = 0, totalMargin = 0, totalEffRate = 0;
    projects.forEach((p) => {
      const c = calc(p);
      totalRevenue += p.quotedPrice;
      totalProfit += c.profit;
      totalMargin += c.margin;
      totalEffRate += c.effectiveRate;
    });
    return {
      totalRevenue,
      totalProfit,
      avgMargin: totalMargin / projects.length,
      avgEffectiveRate: totalEffRate / projects.length,
    };
  }, [projects]);

  function openCreate() {
    setEditingId(null);
    setForm({ name: "", quotedPrice: 0, actualHours: 0, hourlyRate: 0, expenses: 0, estimatedHours: 0 });
    setDialogOpen(true);
  }

  function openEdit(p: Project) {
    setEditingId(p.id);
    setForm({ name: p.name, quotedPrice: p.quotedPrice, actualHours: p.actualHours, hourlyRate: p.hourlyRate, expenses: p.expenses, estimatedHours: p.estimatedHours });
    setDialogOpen(true);
  }

  function save() {
    if (!form.name.trim()) return;
    if (editingId) {
      setProjects((prev) => prev.map((p) => p.id === editingId ? { ...p, ...form } : p));
    } else {
      setProjects((prev) => [...prev, { id: generateId(), ...form, createdAt: new Date().toISOString() }]);
    }
    setDialogOpen(false);
  }

  function remove(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  function fmt(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Profitability Tracker"
        description="Track project costs, margins, and profitability across all projects"
        icon={TrendingUp}
        badge="Projects"
        replaces="Harvest / Toggl"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Revenue", value: fmt(summary.totalRevenue), color: "text-violet-600 dark:text-violet-400" },
          { label: "Total Profit", value: fmt(summary.totalProfit), color: summary.totalProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400" },
          { label: "Avg Margin", value: `${summary.avgMargin.toFixed(1)}%`, color: summary.avgMargin >= 0 ? "text-pink-600 dark:text-pink-400" : "text-red-600 dark:text-red-400" },
          { label: "Avg Eff. Rate", value: `${fmt(summary.avgEffectiveRate)}/h`, color: "text-blue-600 dark:text-blue-400" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground mt-0.5">{s.label}</p></CardContent></Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">
          <Plus className="h-3.5 w-3.5 mr-1.5" />Add Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-16 text-center"><TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" /><p className="text-sm text-muted-foreground">No projects tracked yet. Add your first project to see profitability.</p><Button variant="outline" className="mt-4" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Project</Button></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const c = calc(p);
            const profitable = c.profit >= 0;
            const overBudget = p.estimatedHours > 0 && p.actualHours > p.estimatedHours;
            return (
              <Card key={p.id} className={`overflow-hidden transition-colors ${profitable ? "hover:border-emerald-500/30" : "border-red-500/30"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${profitable ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                        {profitable ? <ArrowUpRight className="h-5 w-5 text-emerald-500" /> : <ArrowDownRight className="h-5 w-5 text-red-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{p.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <Badge className={`text-[10px] border-0 ${profitable ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                            {c.margin.toFixed(1)}% margin
                          </Badge>
                          {overBudget && <Badge className="text-[10px] border-0 bg-amber-500/10 text-amber-600">Over budget</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => remove(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Quoted</p>
                      <p className="text-sm font-semibold">{fmt(p.quotedPrice)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Actual Cost</p>
                      <p className="text-sm font-semibold">{fmt(c.actualCost)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Profit/Loss</p>
                      <p className={`text-sm font-semibold ${profitable ? "text-emerald-600" : "text-red-600"}`}>{fmt(c.profit)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Eff. Rate</p>
                      <p className="text-sm font-semibold">{fmt(c.effectiveRate)}/h</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Est. Hours</p>
                      <p className="text-sm">{p.estimatedHours || "---"}h</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Actual Hours</p>
                      <p className={`text-sm ${overBudget ? "text-red-600 font-medium" : ""}`}>{p.actualHours}h</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Hourly Rate</p>
                      <p className="text-sm">{fmt(p.hourlyRate)}/h</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Expenses</p>
                      <p className="text-sm">{fmt(p.expenses)}</p>
                    </div>
                  </div>

                  {/* Est vs actual bar */}
                  {p.estimatedHours > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                        <span>Hours: {p.actualHours}/{p.estimatedHours}h est.</span>
                        <span>{Math.round((p.actualHours / p.estimatedHours) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${overBudget ? "bg-red-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min((p.actualHours / p.estimatedHours) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Edit Project" : "Add Project"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Project Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Project name" className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Quoted Price ($)</Label><Input type="number" value={form.quotedPrice} onChange={(e) => setForm((f) => ({ ...f, quotedPrice: parseFloat(e.target.value) || 0 }))} className="mt-1" /></div>
              <div><Label>Hourly Rate ($)</Label><Input type="number" value={form.hourlyRate} onChange={(e) => setForm((f) => ({ ...f, hourlyRate: parseFloat(e.target.value) || 0 }))} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Estimated Hours</Label><Input type="number" value={form.estimatedHours} onChange={(e) => setForm((f) => ({ ...f, estimatedHours: parseFloat(e.target.value) || 0 }))} className="mt-1" /></div>
              <div><Label>Actual Hours</Label><Input type="number" value={form.actualHours} onChange={(e) => setForm((f) => ({ ...f, actualHours: parseFloat(e.target.value) || 0 }))} className="mt-1" /></div>
            </div>
            <div><Label>Expenses ($)</Label><Input type="number" value={form.expenses} onChange={(e) => setForm((f) => ({ ...f, expenses: parseFloat(e.target.value) || 0 }))} className="mt-1" placeholder="Other project costs" /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={!form.name.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white">{editingId ? "Save" : "Add Project"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
