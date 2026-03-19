"use client";

import { useState, useMemo } from "react";
import { ArrowLeftRight, Clock, Trash2, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface ConversionRecord {
  id: string;
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  timestamp: string;
}

interface CurrencyInfo {
  code: string;
  name: string;
  flag: string;
  rateToUSD: number; // 1 unit of this currency = X USD
}

const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", name: "US Dollar", flag: "\u{1F1FA}\u{1F1F8}", rateToUSD: 1 },
  { code: "EUR", name: "Euro", flag: "\u{1F1EA}\u{1F1FA}", rateToUSD: 1.085 },
  { code: "GBP", name: "British Pound", flag: "\u{1F1EC}\u{1F1E7}", rateToUSD: 1.265 },
  { code: "CAD", name: "Canadian Dollar", flag: "\u{1F1E8}\u{1F1E6}", rateToUSD: 0.741 },
  { code: "AUD", name: "Australian Dollar", flag: "\u{1F1E6}\u{1F1FA}", rateToUSD: 0.652 },
  { code: "JPY", name: "Japanese Yen", flag: "\u{1F1EF}\u{1F1F5}", rateToUSD: 0.00667 },
  { code: "INR", name: "Indian Rupee", flag: "\u{1F1EE}\u{1F1F3}", rateToUSD: 0.012 },
  { code: "CNY", name: "Chinese Yuan", flag: "\u{1F1E8}\u{1F1F3}", rateToUSD: 0.138 },
  { code: "BRL", name: "Brazilian Real", flag: "\u{1F1E7}\u{1F1F7}", rateToUSD: 0.198 },
  { code: "MXN", name: "Mexican Peso", flag: "\u{1F1F2}\u{1F1FD}", rateToUSD: 0.058 },
  { code: "KRW", name: "South Korean Won", flag: "\u{1F1F0}\u{1F1F7}", rateToUSD: 0.000752 },
  { code: "SGD", name: "Singapore Dollar", flag: "\u{1F1F8}\u{1F1EC}", rateToUSD: 0.745 },
  { code: "CHF", name: "Swiss Franc", flag: "\u{1F1E8}\u{1F1ED}", rateToUSD: 1.12 },
  { code: "SEK", name: "Swedish Krona", flag: "\u{1F1F8}\u{1F1EA}", rateToUSD: 0.096 },
  { code: "NZD", name: "New Zealand Dollar", flag: "\u{1F1F3}\u{1F1FF}", rateToUSD: 0.605 },
];

function getCurrency(code: string): CurrencyInfo {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0];
}

function convert(amount: number, from: string, to: string): number {
  const fromC = getCurrency(from);
  const toC = getCurrency(to);
  const usdAmount = amount * fromC.rateToUSD;
  return usdAmount / toC.rateToUSD;
}

function getRate(from: string, to: string): number {
  return convert(1, from, to);
}

function formatAmount(amount: number, code: string): string {
  const c = getCurrency(code);
  if (c.rateToUSD < 0.01) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);
  }
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

export default function CurrencyConverterPage() {
  const [history, setHistory, hydrated] = useLocalStorage<ConversionRecord[]>("finance-currency-history", []);

  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EUR");
  const [amount, setAmount] = useState("1000");
  const [showComparison, setShowComparison] = useState(false);

  const parsedAmount = parseFloat(amount) || 0;
  const convertedAmount = convert(parsedAmount, fromCurrency, toCurrency);
  const rate = getRate(fromCurrency, toCurrency);

  const swap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const logConversion = () => {
    if (parsedAmount <= 0) return;
    const record: ConversionRecord = {
      id: generateId(),
      fromCurrency,
      toCurrency,
      fromAmount: parsedAmount,
      toAmount: convertedAmount,
      rate,
      timestamp: new Date().toISOString(),
    };
    setHistory((prev) => [record, ...prev].slice(0, 20));
  };

  const clearHistory = () => setHistory([]);

  const comparisonData = useMemo(() => {
    return CURRENCIES.filter((c) => c.code !== fromCurrency).map((c) => ({
      ...c,
      converted: convert(parsedAmount, fromCurrency, c.code),
      rate: getRate(fromCurrency, c.code),
    }));
  }, [parsedAmount, fromCurrency]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Currency Converter"
        description="Convert between 15+ major world currencies with hardcoded realistic exchange rates."
        icon={DollarSign}
        replaces="XE.com"
      />

      {/* Converter */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            {/* From */}
            <div className="flex-1 w-full">
              <Label>From</Label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 mb-2"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} - {c.name}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="text-lg font-bold"
              />
            </div>

            {/* Swap */}
            <Button variant="outline" size="icon" onClick={swap} className="shrink-0 mt-4 lg:mt-6">
              <ArrowLeftRight className="h-4 w-4" />
            </Button>

            {/* To */}
            <div className="flex-1 w-full">
              <Label>To</Label>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 mb-2"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} - {c.name}
                  </option>
                ))}
              </select>
              <div className="flex h-8 w-full items-center rounded-lg border border-input bg-muted/30 px-2.5 text-lg font-bold">
                {formatAmount(convertedAmount, toCurrency)}
              </div>
            </div>
          </div>

          {/* Rate & Save */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              1 {fromCurrency} = {rate.toFixed(rate < 1 ? 6 : 4)} {toCurrency}
            </p>
            <Button onClick={logConversion} variant="outline" size="sm">
              Save to History
            </Button>
          </div>

          {/* Quick Amounts */}
          <div className="flex flex-wrap gap-2 mt-4">
            {QUICK_AMOUNTS.map((qa) => (
              <Button
                key={qa}
                variant="outline"
                size="sm"
                onClick={() => setAmount(String(qa))}
                className={amount === String(qa) ? "border-emerald-500 text-emerald-600" : ""}
              >
                {getCurrency(fromCurrency).flag} {qa.toLocaleString()}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Multi-currency comparison */}
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => setShowComparison(!showComparison)}>
          {showComparison ? "Hide" : "Show"} All Currencies
        </Button>
      </div>

      {showComparison && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {formatAmount(parsedAmount, fromCurrency)} {fromCurrency} in All Currencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {comparisonData.map((c) => (
                <div
                  key={c.code}
                  className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setToCurrency(c.code);
                    setShowComparison(false);
                  }}
                >
                  <span className="text-2xl">{c.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{c.code}</p>
                    <p className="text-xs text-muted-foreground">{c.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatAmount(c.converted, c.code)}</p>
                    <p className="text-xs text-muted-foreground">1:{c.rate.toFixed(c.rate < 1 ? 6 : 4)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Conversion History</CardTitle>
          {history.length > 0 && (
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={clearHistory}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No conversions saved yet. Click &quot;Save to History&quot; to log conversions.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {getCurrency(r.fromCurrency).flag} {formatAmount(r.fromAmount, r.fromCurrency)} {r.fromCurrency} &rarr; {getCurrency(r.toCurrency).flag} {formatAmount(r.toAmount, r.toCurrency)} {r.toCurrency}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Rate: {r.rate.toFixed(r.rate < 1 ? 6 : 4)} &middot; {new Date(r.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{r.fromCurrency}/{r.toCurrency}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
