"use client";

import { useState, useMemo } from "react";
import { Receipt, Plus, Download, Trash2, Filter, Calendar, CreditCard, TrendingUp, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  paymentMethod: string;
  createdAt: string;
}

const CATEGORIES = ["Office", "Software", "Marketing", "Travel", "Equipment", "Meals", "Subscriptions", "Other"] as const;
const PAYMENT_METHODS = ["Credit Card", "Debit Card", "Bank Transfer", "Cash", "PayPal", "Other"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Office: "bg-blue-500",
  Software: "bg-violet-500",
  Marketing: "bg-orange-500",
  Travel: "bg-emerald-500",
  Equipment: "bg-rose-500",
  Meals: "bg-amber-500",
  Subscriptions: "bg-pink-500",
  Other: "bg-slate-500",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export default function ExpenseTrackerPage() {
  const [expenses, setExpenses, hydrated] = useLocalStorage<Expense[]>("finance-expenses", []);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);

  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const addExpense = () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0 || !description.trim()) return;
    const newExpense: Expense = {
      id: generateId(),
      amount: parsed,
      category,
      date,
      description: description.trim(),
      paymentMethod,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
    setAmount("");
    setDescription("");
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (filterCategory !== "all" && e.category !== filterCategory) return false;
      if (filterPayment !== "all" && e.paymentMethod !== filterPayment) return false;
      if (filterDateFrom && e.date < filterDateFrom) return false;
      if (filterDateTo && e.date > filterDateTo) return false;
      return true;
    });
  }, [expenses, filterCategory, filterPayment, filterDateFrom, filterDateTo]);

  const now = new Date();
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

  const stats = useMemo(() => {
    const total = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const uniqueDays = new Set(filteredExpenses.map((e) => e.date)).size;
    const avgPerDay = uniqueDays > 0 ? total / uniqueDays : 0;

    const catTotals: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    });
    const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    const thisMonthTotal = expenses.filter((e) => e.date.startsWith(thisMonthStr)).reduce((s, e) => s + e.amount, 0);
    const lastMonthTotal = expenses.filter((e) => e.date.startsWith(lastMonthStr)).reduce((s, e) => s + e.amount, 0);

    return { total, avgPerDay, topCategory, thisMonthTotal, lastMonthTotal };
  }, [filteredExpenses, expenses, thisMonthStr, lastMonthStr]);

  // Monthly bar chart data (last 6 months)
  const monthlyData = useMemo(() => {
    const months: { label: string; key: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const total = expenses.filter((e) => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
      months.push({ label, key, total });
    }
    return months;
  }, [expenses, now]);

  const maxMonthly = Math.max(...monthlyData.map((m) => m.total), 1);

  const exportCSV = () => {
    const header = "Date,Description,Category,Amount,Payment Method\n";
    const rows = filteredExpenses
      .map((e) => `${e.date},"${e.description}",${e.category},${e.amount},${e.paymentMethod}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Tracker"
        description="Track business expenses by category, payment method, and date with monthly analytics."
        icon={Receipt}
        replaces="Expensify ($5/mo)"
        actions={
          <Button onClick={exportCSV} variant="outline" disabled={filteredExpenses.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Total Expenses</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(stats.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Avg / Day</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(stats.avgPerDay)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Filter className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Top Category</span>
            </div>
            <p className="text-2xl font-bold">{stats.topCategory}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">This vs Last Month</span>
            </div>
            <p className="text-lg font-bold">
              {formatCurrency(stats.thisMonthTotal)}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                vs {formatCurrency(stats.lastMonthTotal)}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Monthly Expenses (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 h-48">
            {monthlyData.map((m) => (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">{formatCurrency(m.total)}</span>
                <div className="w-full bg-muted rounded-t-md relative" style={{ height: "160px" }}>
                  <div
                    className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-md transition-all duration-500"
                    style={{ height: `${(m.total / maxMonthly) * 100}%`, minHeight: m.total > 0 ? "4px" : "0px" }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Add Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="exp-amount">Amount ($)</Label>
              <Input
                id="exp-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="exp-category">Category</Label>
              <select
                id="exp-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="exp-date">Date</Label>
              <Input id="exp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="exp-desc">Description</Label>
              <Input
                id="exp-desc"
                placeholder="e.g. Adobe subscription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addExpense()}
              />
            </div>
            <div>
              <Label htmlFor="exp-payment">Payment Method</Label>
              <select
                id="exp-payment"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={addExpense} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        {(filterCategory !== "all" || filterPayment !== "all" || filterDateFrom || filterDateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterCategory("all");
              setFilterPayment("all");
              setFilterDateFrom("");
              setFilterDateTo("");
            }}
          >
            Clear Filters
          </Button>
        )}
        <span className="text-sm text-muted-foreground ml-auto">{filteredExpenses.length} expense{filteredExpenses.length !== 1 ? "s" : ""}</span>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>Category</Label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Payment Method</Label>
                <select
                  value={filterPayment}
                  onChange={(e) => setFilterPayment(e.target.value)}
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  <option value="all">All Methods</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>From Date</Label>
                <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
              </div>
              <div>
                <Label>To Date</Label>
                <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">No expenses yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Add your first expense above to start tracking.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                  <div className={`h-3 w-3 rounded-full shrink-0 ${CATEGORY_COLORS[expense.category] || "bg-slate-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{expense.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px]">{expense.category}</Badge>
                      <span className="text-xs text-muted-foreground">{expense.date}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CreditCard className="h-3 w-3" />
                        {expense.paymentMethod}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold shrink-0">{formatCurrency(expense.amount)}</span>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive shrink-0" onClick={() => deleteExpense(expense.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
