"use client";

import { useState, useMemo } from "react";
import {
  DollarSign,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Save,
  User,
  Pencil,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type PayFrequency = "monthly" | "bi-weekly" | "weekly";

interface PayrollProfile {
  id: string;
  name: string;
  baseSalary: number;
  frequency: PayFrequency;
  federalTax: number;
  stateTax: number;
  insurance: number;
  retirement: number;
  otherDeduction: number;
  overtimeHours: number;
  overtimeRate: number;
  bonus: number;
  periodsPaid: number; // how many periods paid YTD
}

const FREQ_LABELS: Record<PayFrequency, string> = {
  monthly: "Monthly",
  "bi-weekly": "Bi-Weekly",
  weekly: "Weekly",
};

const PERIODS_PER_YEAR: Record<PayFrequency, number> = {
  monthly: 12,
  "bi-weekly": 26,
  weekly: 52,
};

function fmt(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function calcPayroll(p: PayrollProfile) {
  const periodsPerYear = PERIODS_PER_YEAR[p.frequency];
  const basePerPeriod = p.baseSalary / periodsPerYear;
  const overtimePay = p.overtimeHours * p.overtimeRate;
  const grossPay = basePerPeriod + overtimePay + p.bonus;

  const federalTaxAmt = (grossPay * p.federalTax) / 100;
  const stateTaxAmt = (grossPay * p.stateTax) / 100;
  const totalDeductions =
    federalTaxAmt + stateTaxAmt + p.insurance + p.retirement + p.otherDeduction;
  const netPay = grossPay - totalDeductions;

  const ytdGross = grossPay * p.periodsPaid;
  const ytdNet = netPay * p.periodsPaid;
  const ytdTax = (federalTaxAmt + stateTaxAmt) * p.periodsPaid;

  return {
    basePerPeriod,
    overtimePay,
    grossPay,
    federalTaxAmt,
    stateTaxAmt,
    totalDeductions,
    netPay,
    ytdGross,
    ytdNet,
    ytdTax,
  };
}

const EMPTY_PROFILE: Omit<PayrollProfile, "id"> = {
  name: "",
  baseSalary: 60000,
  frequency: "monthly",
  federalTax: 22,
  stateTax: 5,
  insurance: 200,
  retirement: 150,
  otherDeduction: 0,
  overtimeHours: 0,
  overtimeRate: 0,
  bonus: 0,
  periodsPaid: 0,
};

function RowItem({
  label,
  value,
  sub,
  highlight,
  negative,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  negative?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2 ${highlight ? "font-semibold" : ""}`}
    >
      <div>
        <span className={`text-sm ${highlight ? "" : "text-muted-foreground"}`}>
          {label}
        </span>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
      <span
        className={`text-sm tabular-nums ${negative ? "text-red-500 dark:text-red-400" : highlight ? "text-violet-600 dark:text-violet-400" : ""}`}
      >
        {negative ? `− ${value}` : value}
      </span>
    </div>
  );
}

export default function PayrollPage() {
  const [profiles, setProfiles] = useLocalStorage<PayrollProfile[]>(
    "hr-payroll-profiles",
    []
  );
  const [activeId, setActiveId] = useLocalStorage<string | null>(
    "hr-payroll-active",
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<PayrollProfile, "id">>(EMPTY_PROFILE);
  const [showYTD, setShowYTD] = useState(false);

  const active = profiles.find((p) => p.id === activeId) || profiles[0] || null;

  const calc = useMemo(
    () => (active ? calcPayroll(active) : null),
    [active]
  );

  function num(field: keyof Omit<PayrollProfile, "id" | "name" | "frequency">) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: parseFloat(e.target.value) || 0 }));
  }

  function openNew() {
    setEditingId(null);
    setForm(EMPTY_PROFILE);
    setDialogOpen(true);
  }

  function openEdit(p: PayrollProfile) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      baseSalary: p.baseSalary,
      frequency: p.frequency,
      federalTax: p.federalTax,
      stateTax: p.stateTax,
      insurance: p.insurance,
      retirement: p.retirement,
      otherDeduction: p.otherDeduction,
      overtimeHours: p.overtimeHours,
      overtimeRate: p.overtimeRate,
      bonus: p.bonus,
      periodsPaid: p.periodsPaid,
    });
    setDialogOpen(true);
  }

  function saveProfile() {
    if (!form.name.trim()) return;
    if (editingId) {
      setProfiles((prev) =>
        prev.map((p) => (p.id === editingId ? { ...form, id: p.id } : p))
      );
    } else {
      const id = generateId();
      setProfiles((prev) => [...prev, { ...form, id }]);
      setActiveId(id);
    }
    setDialogOpen(false);
  }

  function deleteProfile(id: string) {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    if (activeId === id) setActiveId(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Calculator"
        description="Calculate net pay, deductions, and year-to-date summaries for your team"
        icon={DollarSign}
        badge="HR"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Employee Profiles</h2>
            <Button
              size="sm"
              onClick={openNew}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              New
            </Button>
          </div>
          {profiles.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <User className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-xs text-muted-foreground">
                  No profiles yet. Add an employee payroll profile.
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={openNew}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Profile
                </Button>
              </CardContent>
            </Card>
          ) : (
            profiles.map((p) => {
              const c = calcPayroll(p);
              const isActive = p.id === active?.id;
              return (
                <Card
                  key={p.id}
                  className={`cursor-pointer transition-all ${isActive ? "border-violet-500/60 shadow-md" : "hover:border-violet-500/30"}`}
                  onClick={() => setActiveId(p.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-violet-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {FREQ_LABELS[p.frequency]}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(p);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProfile(p.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t">
                      <span className="text-[10px] text-muted-foreground">Net / period</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {fmt(c.netPay)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Right: Breakdown */}
        {active && calc ? (
          <div className="lg:col-span-2 space-y-4">
            {/* Hero net pay */}
            <Card className="bg-gradient-to-br from-violet-500/10 to-pink-500/10 border-violet-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {active.name} — Net Pay
                    </p>
                    <p className="text-4xl font-bold text-violet-600 dark:text-violet-400">
                      {fmt(calc.netPay)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      per {FREQ_LABELS[active.frequency].toLowerCase()} period
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Annual salary</p>
                    <p className="text-xl font-semibold">{fmt(active.baseSalary)}</p>
                    <Badge className="mt-1 bg-violet-500/10 text-violet-600 dark:text-violet-400 border-0 text-[10px]">
                      {FREQ_LABELS[active.frequency]}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pay breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Pay Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="divide-y">
                  <RowItem label="Base Pay (per period)" value={fmt(calc.basePerPeriod)} />
                  {calc.overtimePay > 0 && (
                    <RowItem
                      label="Overtime Pay"
                      sub={`${active.overtimeHours}h × ${fmt(active.overtimeRate)}/h`}
                      value={fmt(calc.overtimePay)}
                    />
                  )}
                  {active.bonus > 0 && (
                    <RowItem label="Bonus" value={fmt(active.bonus)} />
                  )}
                  <RowItem
                    label="Gross Pay"
                    value={fmt(calc.grossPay)}
                    highlight
                  />
                </div>

                <Separator className="my-3" />
                <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                  Deductions
                </p>
                <div className="divide-y">
                  <RowItem
                    label="Federal Tax"
                    sub={`${active.federalTax}% of gross`}
                    value={fmt(calc.federalTaxAmt)}
                    negative
                  />
                  <RowItem
                    label="State Tax"
                    sub={`${active.stateTax}% of gross`}
                    value={fmt(calc.stateTaxAmt)}
                    negative
                  />
                  {active.insurance > 0 && (
                    <RowItem
                      label="Health Insurance"
                      value={fmt(active.insurance)}
                      negative
                    />
                  )}
                  {active.retirement > 0 && (
                    <RowItem
                      label="401(k)"
                      value={fmt(active.retirement)}
                      negative
                    />
                  )}
                  {active.otherDeduction > 0 && (
                    <RowItem
                      label="Other Deductions"
                      value={fmt(active.otherDeduction)}
                      negative
                    />
                  )}
                  <RowItem
                    label="Total Deductions"
                    value={fmt(calc.totalDeductions)}
                    negative
                    highlight
                  />
                </div>

                <div className="mt-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Net Pay</p>
                    <p className="text-[10px] text-muted-foreground">
                      Take-home per {FREQ_LABELS[active.frequency].toLowerCase()} period
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {fmt(calc.netPay)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* YTD Summary */}
            {active.periodsPaid > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <button
                    className="flex items-center justify-between w-full text-left"
                    onClick={() => setShowYTD((v) => !v)}
                  >
                    <CardTitle className="text-sm font-semibold">
                      Year-to-Date Summary
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {active.periodsPaid} periods paid
                      </Badge>
                      {showYTD ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                </CardHeader>
                {showYTD && (
                  <CardContent className="px-5 pb-5">
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        {
                          label: "YTD Gross",
                          value: fmt(calc.ytdGross),
                          color: "text-violet-600 dark:text-violet-400",
                        },
                        {
                          label: "YTD Tax",
                          value: fmt(calc.ytdTax),
                          color: "text-red-500 dark:text-red-400",
                        },
                        {
                          label: "YTD Net",
                          value: fmt(calc.ytdNet),
                          color: "text-emerald-600 dark:text-emerald-400",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-lg bg-muted/40 p-3 text-center"
                        >
                          <p className={`text-lg font-bold ${item.color}`}>
                            {item.value}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>
        ) : (
          <div className="lg:col-span-2 flex items-center justify-center">
            <Card className="border-dashed w-full">
              <CardContent className="py-20 text-center">
                <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">
                  Select a payroll profile to see the breakdown
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Payroll Profile" : "New Payroll Profile"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Employee Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Jane Smith"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Annual Base Salary ($)</Label>
                <Input
                  type="number"
                  value={form.baseSalary}
                  onChange={num("baseSalary")}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Pay Frequency</Label>
                <Select
                  value={form.frequency}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, frequency: v as PayFrequency }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Deductions */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Deductions
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Federal Tax (%)</Label>
                  <Input
                    type="number"
                    value={form.federalTax}
                    onChange={num("federalTax")}
                    min={0}
                    max={100}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>State Tax (%)</Label>
                  <Input
                    type="number"
                    value={form.stateTax}
                    onChange={num("stateTax")}
                    min={0}
                    max={100}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Health Insurance ($/period)</Label>
                  <Input
                    type="number"
                    value={form.insurance}
                    onChange={num("insurance")}
                    min={0}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>401(k) ($/period)</Label>
                  <Input
                    type="number"
                    value={form.retirement}
                    onChange={num("retirement")}
                    min={0}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Other Deductions ($/period)</Label>
                  <Input
                    type="number"
                    value={form.otherDeduction}
                    onChange={num("otherDeduction")}
                    min={0}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Additions */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Additions (This Period)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Overtime Hours</Label>
                  <Input
                    type="number"
                    value={form.overtimeHours}
                    onChange={num("overtimeHours")}
                    min={0}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Overtime Rate ($/hr)</Label>
                  <Input
                    type="number"
                    value={form.overtimeRate}
                    onChange={num("overtimeRate")}
                    min={0}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Bonus ($)</Label>
                  <Input
                    type="number"
                    value={form.bonus}
                    onChange={num("bonus")}
                    min={0}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label>Periods Paid YTD</Label>
              <Input
                type="number"
                value={form.periodsPaid}
                onChange={num("periodsPaid")}
                min={0}
                className="mt-1 w-36"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Used to calculate year-to-date totals
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveProfile}
              disabled={!form.name.trim()}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {editingId ? "Save Changes" : "Save Profile"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
