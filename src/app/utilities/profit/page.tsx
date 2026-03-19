"use client";

import { useState, useMemo } from "react";
import {
  DollarSign,
  Plus,
  Trash2,
  Save,
  TrendingUp,
  TrendingDown,
  Download,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface LineItem {
  id: string;
  label: string;
  amount: number;
}

interface MonthlyReport {
  id: string;
  name: string;
  month: string;
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  margin: number;
  taxRate: number;
  savedAt: string;
}

const DEFAULT_INCOME: LineItem[] = [
  { id: generateId(), label: "Shopify Design Projects", amount: 3500 },
  { id: generateId(), label: "Monthly Maintenance", amount: 800 },
  { id: generateId(), label: "Consulting", amount: 500 },
];

const DEFAULT_EXPENSES: LineItem[] = [
  { id: generateId(), label: "Shopify / Tools Subscription", amount: 200 },
  { id: generateId(), label: "Hosting & Domains", amount: 50 },
  { id: generateId(), label: "Marketing & Ads", amount: 150 },
  { id: generateId(), label: "Other", amount: 100 },
];

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ProfitPage() {
  const [reports, setReports] = useLocalStorage<MonthlyReport[]>("profit-reports", []);
  const [isYearly, setIsYearly] = useState(false);
  const [taxRate, setTaxRate] = useState(25);
  const [income, setIncome] = useLocalStorage<LineItem[]>("profit-income-items", DEFAULT_INCOME);
  const [expenses, setExpenses] = useLocalStorage<LineItem[]>("profit-expense-items", DEFAULT_EXPENSES);
  const [reportName, setReportName] = useState("");
  const [activeTab, setActiveTab] = useState<"calculator" | "reports">("calculator");

  const mult = isYearly ? 12 : 1;

  const totals = useMemo(() => {
    const totalIncome = income.reduce((s, i) => s + (i.amount || 0), 0) * mult;
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0) * mult;
    const grossProfit = totalIncome - totalExpenses;
    const taxAmount = Math.max(0, grossProfit * (taxRate / 100));
    const netProfit = grossProfit - taxAmount;
    const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    return { totalIncome, totalExpenses, grossProfit, taxAmount, netProfit, margin };
  }, [income, expenses, taxRate, mult]);

  const addLine = (type: "income" | "expenses") => {
    const item: LineItem = { id: generateId(), label: "", amount: 0 };
    if (type === "income") setIncome((p) => [...p, item]);
    else setExpenses((p) => [...p, item]);
  };

  const updateLine = (type: "income" | "expenses", id: string, field: "label" | "amount", value: string) => {
    const update = (items: LineItem[]) =>
      items.map((i) => i.id === id ? { ...i, [field]: field === "amount" ? parseFloat(value) || 0 : value } : i);
    if (type === "income") setIncome(update);
    else setExpenses(update);
  };

  const removeLine = (type: "income" | "expenses", id: string) => {
    if (type === "income") setIncome((p) => p.filter((i) => i.id !== id));
    else setExpenses((p) => p.filter((i) => i.id !== id));
  };

  const saveReport = () => {
    const now = new Date();
    const report: MonthlyReport = {
      id: generateId(),
      name: reportName || `Report – ${now.toLocaleString("default", { month: "long", year: "numeric" })}`,
      month: now.toISOString().slice(0, 7),
      totalIncome: totals.totalIncome,
      totalExpenses: totals.totalExpenses,
      profit: totals.netProfit,
      margin: totals.margin,
      taxRate,
      savedAt: now.toISOString(),
    };
    setReports((prev) => [report, ...prev]);
    setReportName("");
  };

  const deleteReport = (id: string) => setReports((p) => p.filter((r) => r.id !== id));

  const incomeBarPct = totals.totalIncome > 0
    ? Math.min(100, (totals.totalIncome / (totals.totalIncome + totals.totalExpenses)) * 100)
    : 50;
  const expenseBarPct = 100 - incomeBarPct;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profit Calculator"
        description="Track income, expenses, and profit margins for your agency. Save monthly reports."
        icon={DollarSign}
        badge="Utilities"
        replaces="QuickBooks Lite, Wave"
      />

      <div className="flex items-center justify-between">
        <div className="flex gap-2 p-1 bg-muted/40 rounded-xl">
          {(["calculator", "reports"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? "bg-white dark:bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "reports" ? `Reports (${reports.length})` : "Calculator"}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsYearly(!isYearly)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border hover:border-violet-400 transition-colors text-sm"
        >
          {isYearly ? <ToggleRight className="h-4 w-4 text-violet-500" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
          <span className={isYearly ? "text-violet-600 dark:text-violet-400 font-medium" : "text-muted-foreground"}>
            {isYearly ? "Yearly" : "Monthly"}
          </span>
        </button>
      </div>

      {activeTab === "calculator" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Income & Expenses */}
          <div className="lg:col-span-2 space-y-4">
            {/* Income */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-muted-foreground uppercase tracking-wider">Income</span>
                  </CardTitle>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
                    ${fmt(income.reduce((s, i) => s + (i.amount || 0), 0) * mult)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {income.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Input
                      placeholder="Income source"
                      value={item.label}
                      onChange={(e) => updateLine("income", item.id, "label", e.target.value)}
                      className="flex-1 text-sm"
                    />
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.amount || ""}
                        onChange={(e) => updateLine("income", item.id, "amount", e.target.value)}
                        className="pl-6 w-28 text-sm"
                      />
                    </div>
                    <button onClick={() => removeLine("income", item.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={() => addLine("income")} className="w-full border border-dashed mt-1 h-8 text-xs text-muted-foreground hover:text-emerald-600">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Income Source
                </Button>
              </CardContent>
            </Card>

            {/* Expenses */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-muted-foreground uppercase tracking-wider">Expenses</span>
                  </CardTitle>
                  <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-0">
                    ${fmt(expenses.reduce((s, e) => s + (e.amount || 0), 0) * mult)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {expenses.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Input
                      placeholder="Expense category"
                      value={item.label}
                      onChange={(e) => updateLine("expenses", item.id, "label", e.target.value)}
                      className="flex-1 text-sm"
                    />
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.amount || ""}
                        onChange={(e) => updateLine("expenses", item.id, "amount", e.target.value)}
                        className="pl-6 w-28 text-sm"
                      />
                    </div>
                    <button onClick={() => removeLine("expenses", item.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={() => addLine("expenses")} className="w-full border border-dashed mt-1 h-8 text-xs text-muted-foreground hover:text-red-600">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Expense
                </Button>
              </CardContent>
            </Card>

            {/* Tax Rate */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tax Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="range"
                      min={0}
                      max={50}
                      step={0.5}
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-full accent-violet-500"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>0%</span><span>25%</span><span>50%</span>
                    </div>
                  </div>
                  <div className="w-20">
                    <div className="relative">
                      <Input
                        type="number"
                        min={0}
                        max={50}
                        value={taxRate}
                        onChange={(e) => setTaxRate(Math.min(50, Math.max(0, Number(e.target.value))))}
                        className="pr-6 text-sm text-center"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Report */}
            <div className="flex gap-2">
              <Input
                placeholder={`Report name (e.g. March ${new Date().getFullYear()})`}
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={saveReport} variant="outline" className="gap-2">
                <Save className="h-4 w-4" />
                Save Report
              </Button>
            </div>
          </div>

          {/* Summary Panel */}
          <div className="space-y-4">
            {/* Key Metrics */}
            <Card className="bg-gradient-to-br from-violet-500/5 to-pink-500/5 border-violet-500/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {isYearly ? "Yearly" : "Monthly"} Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Total Income</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">${fmt(totals.totalIncome)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Total Expenses</span>
                  <span className="font-bold text-red-500">-${fmt(totals.totalExpenses)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Gross Profit</span>
                  <span className={`font-bold ${totals.grossProfit >= 0 ? "text-blue-600" : "text-red-500"}`}>${fmt(totals.grossProfit)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Tax ({taxRate}%)</span>
                  <span className="font-bold text-amber-500">-${fmt(totals.taxAmount)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-semibold">Net Profit</span>
                  <span className={`text-xl font-bold ${totals.netProfit >= 0 ? "text-violet-600 dark:text-violet-400" : "text-red-500"}`}>
                    ${fmt(totals.netProfit)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Profit Margin */}
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Profit Margin</p>
                <p className={`text-4xl font-bold ${totals.margin >= 30 ? "text-emerald-500" : totals.margin >= 15 ? "text-amber-500" : "text-red-500"}`}>
                  {totals.margin.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totals.margin >= 30 ? "Excellent margin" : totals.margin >= 15 ? "Good margin" : totals.margin >= 0 ? "Low margin — optimize expenses" : "Operating at a loss"}
                </p>
              </CardContent>
            </Card>

            {/* Visual Bar */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Income vs Expenses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Income</span>
                    <span className="text-muted-foreground">{incomeBarPct.toFixed(0)}%</span>
                  </div>
                  <div className="h-4 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                      style={{ width: `${incomeBarPct}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-red-500 font-medium">Expenses</span>
                    <span className="text-muted-foreground">{expenseBarPct.toFixed(0)}%</span>
                  </div>
                  <div className="h-4 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-400 to-rose-500 transition-all duration-500"
                      style={{ width: `${expenseBarPct}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-violet-600 dark:text-violet-400 font-medium">Net Profit</span>
                    <span className="text-muted-foreground">{Math.max(0, totals.margin).toFixed(0)}%</span>
                  </div>
                  <div className="h-4 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-400 to-pink-500 transition-all duration-500"
                      style={{ width: `${Math.max(0, totals.margin)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Income Breakdown */}
            {income.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Income Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {income.map((item) => {
                    const pct = totals.totalIncome > 0 ? ((item.amount * mult) / totals.totalIncome) * 100 : 0;
                    return (
                      <div key={item.id} className="space-y-0.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground truncate max-w-[120px]">{item.label || "Unnamed"}</span>
                          <span className="font-medium">{pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-400 to-pink-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Reports Tab */
        <div className="space-y-3">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <DollarSign className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No saved reports yet</p>
                <p className="text-xs text-muted-foreground mt-1">Save a report from the calculator to track your progress</p>
              </CardContent>
            </Card>
          ) : (
            reports.map((r) => (
              <Card key={r.id} className="hover:border-violet-300 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-sm">{r.name}</h3>
                        <Badge variant="secondary" className="text-[10px]">{r.month}</Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Income</p>
                          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">${fmt(r.totalIncome)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Expenses</p>
                          <p className="text-sm font-semibold text-red-500">${fmt(r.totalExpenses)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Net Profit</p>
                          <p className={`text-sm font-semibold ${r.profit >= 0 ? "text-violet-600 dark:text-violet-400" : "text-red-500"}`}>${fmt(r.profit)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Margin</p>
                          <p className={`text-sm font-semibold ${r.margin >= 30 ? "text-emerald-500" : r.margin >= 15 ? "text-amber-500" : "text-red-500"}`}>{r.margin.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive shrink-0"
                      onClick={() => deleteReport(r.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
