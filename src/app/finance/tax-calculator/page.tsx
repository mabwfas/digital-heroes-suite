"use client";

import { useState, useMemo } from "react";
import { Calculator, DollarSign, Building2, FileText, PiggyBank } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FilingStatus = "single" | "married_jointly" | "head_of_household";

interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

const FEDERAL_BRACKETS: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
  married_jointly: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 },
  ],
  head_of_household: [
    { min: 0, max: 16550, rate: 0.10 },
    { min: 16550, max: 63100, rate: 0.12 },
    { min: 63100, max: 100500, rate: 0.22 },
    { min: 100500, max: 191950, rate: 0.24 },
    { min: 191950, max: 243700, rate: 0.32 },
    { min: 243700, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
};

const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 14600,
  married_jointly: 29200,
  head_of_household: 21900,
};

const STATE_TAXES: Record<string, { name: string; rate: number }> = {
  AL: { name: "Alabama", rate: 0.05 },
  AK: { name: "Alaska", rate: 0 },
  AZ: { name: "Arizona", rate: 0.025 },
  AR: { name: "Arkansas", rate: 0.044 },
  CA: { name: "California", rate: 0.093 },
  CO: { name: "Colorado", rate: 0.044 },
  CT: { name: "Connecticut", rate: 0.0699 },
  DE: { name: "Delaware", rate: 0.066 },
  FL: { name: "Florida", rate: 0 },
  GA: { name: "Georgia", rate: 0.055 },
  HI: { name: "Hawaii", rate: 0.0825 },
  ID: { name: "Idaho", rate: 0.058 },
  IL: { name: "Illinois", rate: 0.0495 },
  IN: { name: "Indiana", rate: 0.0305 },
  IA: { name: "Iowa", rate: 0.06 },
  KS: { name: "Kansas", rate: 0.057 },
  KY: { name: "Kentucky", rate: 0.04 },
  LA: { name: "Louisiana", rate: 0.0425 },
  ME: { name: "Maine", rate: 0.0715 },
  MD: { name: "Maryland", rate: 0.0575 },
  MA: { name: "Massachusetts", rate: 0.05 },
  MI: { name: "Michigan", rate: 0.0425 },
  MN: { name: "Minnesota", rate: 0.0985 },
  MS: { name: "Mississippi", rate: 0.05 },
  MO: { name: "Missouri", rate: 0.048 },
  MT: { name: "Montana", rate: 0.059 },
  NE: { name: "Nebraska", rate: 0.0664 },
  NV: { name: "Nevada", rate: 0 },
  NH: { name: "New Hampshire", rate: 0 },
  NJ: { name: "New Jersey", rate: 0.1075 },
  NM: { name: "New Mexico", rate: 0.059 },
  NY: { name: "New York", rate: 0.109 },
  NC: { name: "North Carolina", rate: 0.045 },
  ND: { name: "North Dakota", rate: 0.029 },
  OH: { name: "Ohio", rate: 0.035 },
  OK: { name: "Oklahoma", rate: 0.0475 },
  OR: { name: "Oregon", rate: 0.099 },
  PA: { name: "Pennsylvania", rate: 0.0307 },
  RI: { name: "Rhode Island", rate: 0.0599 },
  SC: { name: "South Carolina", rate: 0.064 },
  SD: { name: "South Dakota", rate: 0 },
  TN: { name: "Tennessee", rate: 0 },
  TX: { name: "Texas", rate: 0 },
  UT: { name: "Utah", rate: 0.0465 },
  VT: { name: "Vermont", rate: 0.0875 },
  VA: { name: "Virginia", rate: 0.0575 },
  WA: { name: "Washington", rate: 0 },
  WV: { name: "West Virginia", rate: 0.065 },
  WI: { name: "Wisconsin", rate: 0.0765 },
  WY: { name: "Wyoming", rate: 0 },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function calcFederalTax(taxableIncome: number, status: FilingStatus): number {
  const brackets = FEDERAL_BRACKETS[status];
  let tax = 0;
  for (const b of brackets) {
    if (taxableIncome <= b.min) break;
    const amountInBracket = Math.min(taxableIncome, b.max) - b.min;
    tax += amountInBracket * b.rate;
  }
  return tax;
}

interface DeductionItem {
  label: string;
  amount: string;
}

export default function TaxCalculatorPage() {
  const [incomeInput, setIncomeInput] = useState("100000");
  const [isMonthly, setIsMonthly] = useState(false);
  const [filingStatus, setFilingStatus] = useState<FilingStatus>("single");
  const [stateCode, setStateCode] = useState("CA");
  const [useItemized, setUseItemized] = useState(false);
  const [deductions, setDeductions] = useState<DeductionItem[]>([
    { label: "Home Office", amount: "" },
    { label: "Health Insurance", amount: "" },
    { label: "Business Expenses", amount: "" },
    { label: "Retirement (SEP-IRA)", amount: "" },
  ]);

  const updateDeduction = (index: number, field: "label" | "amount", value: string) => {
    setDeductions((prev) => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  const addDeduction = () => {
    setDeductions((prev) => [...prev, { label: "", amount: "" }]);
  };

  const removeDeduction = (index: number) => {
    setDeductions((prev) => prev.filter((_, i) => i !== index));
  };

  const calc = useMemo(() => {
    const rawIncome = parseFloat(incomeInput) || 0;
    const grossIncome = isMonthly ? rawIncome * 12 : rawIncome;

    // Self-employment tax
    const seTaxableIncome = grossIncome * 0.9235;
    const selfEmploymentTax = seTaxableIncome * 0.153;
    const seDeduction = selfEmploymentTax / 2;

    // Deductions
    const standardDeduction = STANDARD_DEDUCTION[filingStatus];
    const itemizedTotal = deductions.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0);
    const totalDeductions = useItemized ? itemizedTotal : standardDeduction;

    // Taxable income
    const taxableIncome = Math.max(0, grossIncome - seDeduction - totalDeductions);

    // Federal tax
    const federalTax = calcFederalTax(taxableIncome, filingStatus);

    // State tax (simplified flat rate)
    const stateTax = taxableIncome * (STATE_TAXES[stateCode]?.rate || 0);

    // Totals
    const totalTax = federalTax + stateTax + selfEmploymentTax;
    const takeHome = grossIncome - totalTax;
    const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;
    const quarterlyPayment = totalTax / 4;

    return {
      grossIncome,
      selfEmploymentTax,
      seDeduction,
      standardDeduction,
      itemizedTotal,
      totalDeductions,
      taxableIncome,
      federalTax,
      stateTax,
      totalTax,
      takeHome,
      effectiveRate,
      quarterlyPayment,
    };
  }, [incomeInput, isMonthly, filingStatus, stateCode, useItemized, deductions]);

  const barTotal = calc.grossIncome || 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Freelancer Tax Calculator"
        description="Estimate federal, state, and self-employment taxes with 2024 US tax brackets."
        icon={Calculator}
        replaces="TurboTax ($89/yr)"
      />

      {/* Income & Filing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Income</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label htmlFor="income">Gross Income ($)</Label>
                <Input
                  id="income"
                  type="number"
                  min="0"
                  step="1000"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  placeholder="100000"
                />
              </div>
              <Button
                variant={isMonthly ? "default" : "outline"}
                onClick={() => setIsMonthly(!isMonthly)}
                className="shrink-0"
              >
                {isMonthly ? "Monthly (x12)" : "Annual"}
              </Button>
            </div>
            {isMonthly && (
              <p className="text-sm text-muted-foreground">Annual: {formatCurrency(calc.grossIncome)}</p>
            )}

            <div>
              <Label>Filing Status</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(
                  [
                    ["single", "Single"],
                    ["married_jointly", "Married Filing Jointly"],
                    ["head_of_household", "Head of Household"],
                  ] as [FilingStatus, string][]
                ).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setFilingStatus(val)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filingStatus === val
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>State</Label>
              <select
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                {Object.entries(STATE_TAXES)
                  .sort((a, b) => a[1].name.localeCompare(b[1].name))
                  .map(([code, st]) => (
                    <option key={code} value={code}>
                      {st.name} ({(st.rate * 100).toFixed(1)}%)
                    </option>
                  ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Deductions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Deductions</CardTitle>
              <div className="flex gap-1">
                <button
                  onClick={() => setUseItemized(false)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${!useItemized ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}
                >
                  Standard
                </button>
                <button
                  onClick={() => setUseItemized(true)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${useItemized ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}
                >
                  Itemized
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {!useItemized ? (
              <div className="py-4 text-center">
                <p className="text-2xl font-bold">{formatCurrency(calc.standardDeduction)}</p>
                <p className="text-sm text-muted-foreground mt-1">Standard Deduction</p>
              </div>
            ) : (
              <>
                {deductions.map((d, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Input
                        placeholder="Label"
                        value={d.label}
                        onChange={(e) => updateDeduction(i, "label", e.target.value)}
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        min="0"
                        placeholder="$0"
                        value={d.amount}
                        onChange={(e) => updateDeduction(i, "amount", e.target.value)}
                      />
                    </div>
                    <Button size="sm" variant="ghost" className="text-destructive h-8 px-2" onClick={() => removeDeduction(i)}>
                      &times;
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addDeduction} className="w-full">+ Add Line Item</Button>
                <p className="text-sm font-medium text-right">Total: {formatCurrency(calc.itemizedTotal)}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visual Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Income Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex h-10 rounded-lg overflow-hidden">
            <div
              className="bg-emerald-500 transition-all duration-500 flex items-center justify-center"
              style={{ width: `${(calc.takeHome / barTotal) * 100}%` }}
            >
              {calc.takeHome / barTotal > 0.1 && <span className="text-xs font-medium text-white">Take-Home</span>}
            </div>
            <div
              className="bg-blue-500 transition-all duration-500 flex items-center justify-center"
              style={{ width: `${(calc.federalTax / barTotal) * 100}%` }}
            >
              {calc.federalTax / barTotal > 0.08 && <span className="text-xs font-medium text-white">Federal</span>}
            </div>
            <div
              className="bg-violet-500 transition-all duration-500 flex items-center justify-center"
              style={{ width: `${(calc.stateTax / barTotal) * 100}%` }}
            >
              {calc.stateTax / barTotal > 0.05 && <span className="text-xs font-medium text-white">State</span>}
            </div>
            <div
              className="bg-orange-500 transition-all duration-500 flex items-center justify-center"
              style={{ width: `${(calc.selfEmploymentTax / barTotal) * 100}%` }}
            >
              {calc.selfEmploymentTax / barTotal > 0.05 && <span className="text-xs font-medium text-white">SE Tax</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <div>
                <p className="text-xs text-muted-foreground">Take-Home</p>
                <p className="text-sm font-bold">{formatCurrency(calc.takeHome)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Federal Tax</p>
                <p className="text-sm font-bold">{formatCurrency(calc.federalTax)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-violet-500" />
              <div>
                <p className="text-xs text-muted-foreground">State Tax ({STATE_TAXES[stateCode]?.name})</p>
                <p className="text-sm font-bold">{formatCurrency(calc.stateTax)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Self-Employment Tax</p>
                <p className="text-sm font-bold">{formatCurrency(calc.selfEmploymentTax)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Total Tax</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(calc.totalTax)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Effective rate: {calc.effectiveRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <PiggyBank className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Take-Home</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(calc.takeHome)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(calc.takeHome / 12)}/month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Quarterly Payment</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(calc.quarterlyPayment)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Due 4/15, 6/15, 9/15, 1/15</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Building2 className="h-4 w-4" />
              <span className="text-xs font-medium uppercase">Deductions</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(calc.totalDeductions)}</p>
            <Badge variant="secondary" className="text-[10px] mt-0.5">{useItemized ? "Itemized" : "Standard"}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Federal Bracket Detail */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">2024 Federal Tax Brackets ({filingStatus === "single" ? "Single" : filingStatus === "married_jointly" ? "Married Filing Jointly" : "Head of Household"})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {FEDERAL_BRACKETS[filingStatus].map((b, i) => {
              const taxableInBracket = Math.max(0, Math.min(calc.taxableIncome, b.max) - b.min);
              const taxInBracket = taxableInBracket * b.rate;
              const active = calc.taxableIncome > b.min;
              return (
                <div key={i} className={`flex items-center gap-4 text-sm p-2 rounded-lg ${active ? "bg-muted/50" : "opacity-50"}`}>
                  <span className="font-mono w-12 text-right">{(b.rate * 100).toFixed(0)}%</span>
                  <div className="flex-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                        style={{ width: active ? "100%" : "0%" }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground w-36 text-right">
                    {formatCurrency(b.min)} - {b.max === Infinity ? "+" : formatCurrency(b.max)}
                  </span>
                  <span className="font-medium w-20 text-right">{formatCurrency(taxInBracket)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
