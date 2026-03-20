"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Sparkles,
  Download,
  Copy,
  Check,
  Trash2,
  ArrowRight,
  Eye,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface CleaningOperation {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const DEFAULT_OPERATIONS: CleaningOperation[] = [
  { id: "trim", label: "Trim Whitespace", description: "Remove leading/trailing spaces from all fields", enabled: true },
  { id: "titlecase", label: "Fix Capitalization (Title Case)", description: "Convert product titles to Title Case", enabled: true },
  { id: "prices", label: "Standardize Prices", description: "Format all prices to 2 decimal places", enabled: true },
  { id: "empty", label: "Remove Empty Rows", description: "Delete rows where all fields are empty", enabled: true },
  { id: "dedup", label: "Deduplicate by Handle", description: "Remove duplicate rows with same handle", enabled: true },
  { id: "html", label: "Strip HTML Tags", description: "Remove HTML tags from description fields", enabled: false },
  { id: "special", label: "Fix Special Characters", description: "Replace encoded entities with characters", enabled: false },
];

function toTitleCase(str: string): string {
  const minor = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of", "on", "or", "so", "the", "to", "up", "yet"]);
  return str
    .toLowerCase()
    .split(" ")
    .map((word, i) => {
      if (i === 0 || !minor.has(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(" ");
}

function standardizePrice(val: string): string {
  const num = parseFloat(val.replace(/[^0-9.-]/g, ""));
  if (isNaN(num)) return val;
  return num.toFixed(2);
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function fixSpecialChars(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split("\n");
  for (const line of lines) {
    if (line.trim() === "") continue;
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        cells.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current);
    rows.push(cells);
  }
  return rows;
}

function toCSV(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(",")
    )
    .join("\n");
}

export default function ProductCleanerPage() {
  const [input, setInput] = useState("");
  const [operations, setOperations] = useState<CleaningOperation[]>(DEFAULT_OPERATIONS);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const toggleOp = useCallback((id: string) => {
    setOperations((prev) =>
      prev.map((op) => (op.id === id ? { ...op, enabled: !op.enabled } : op))
    );
  }, []);

  const { cleaned, stats } = useMemo(() => {
    if (!input.trim()) return { cleaned: "", stats: { rows: 0, removed: 0, modified: 0 } };

    const rows = parseCSV(input);
    if (rows.length === 0) return { cleaned: "", stats: { rows: 0, removed: 0, modified: 0 } };

    const enabledOps = new Set(operations.filter((o) => o.enabled).map((o) => o.id));
    const headers = rows[0];
    let dataRows = rows.slice(1);
    const originalCount = dataRows.length;
    let modifiedCount = 0;

    // Find column indices
    const titleIdx = headers.findIndex((h) => /title/i.test(h));
    const handleIdx = headers.findIndex((h) => /handle/i.test(h));
    const priceIdx = headers.findIndex((h) => /price/i.test(h) && !/compare/i.test(h));
    const comparePriceIdx = headers.findIndex((h) => /compare.*price/i.test(h));
    const bodyIdx = headers.findIndex((h) => /body|description/i.test(h));

    // Clean operations
    dataRows = dataRows.map((row) => {
      const newRow = [...row];
      let modified = false;

      if (enabledOps.has("trim")) {
        for (let i = 0; i < newRow.length; i++) {
          const trimmed = newRow[i].trim();
          if (trimmed !== newRow[i]) { newRow[i] = trimmed; modified = true; }
        }
      }

      if (enabledOps.has("titlecase") && titleIdx >= 0 && newRow[titleIdx]) {
        const tc = toTitleCase(newRow[titleIdx]);
        if (tc !== newRow[titleIdx]) { newRow[titleIdx] = tc; modified = true; }
      }

      if (enabledOps.has("prices")) {
        [priceIdx, comparePriceIdx].forEach((idx) => {
          if (idx >= 0 && newRow[idx] && newRow[idx].trim()) {
            const std = standardizePrice(newRow[idx]);
            if (std !== newRow[idx]) { newRow[idx] = std; modified = true; }
          }
        });
      }

      if (enabledOps.has("html") && bodyIdx >= 0 && newRow[bodyIdx]) {
        const stripped = stripHtml(newRow[bodyIdx]);
        if (stripped !== newRow[bodyIdx]) { newRow[bodyIdx] = stripped; modified = true; }
      }

      if (enabledOps.has("special")) {
        for (let i = 0; i < newRow.length; i++) {
          const fixed = fixSpecialChars(newRow[i]);
          if (fixed !== newRow[i]) { newRow[i] = fixed; modified = true; }
        }
      }

      if (modified) modifiedCount++;
      return newRow;
    });

    // Remove empty rows
    if (enabledOps.has("empty")) {
      dataRows = dataRows.filter((row) => row.some((cell) => cell.trim() !== ""));
    }

    // Deduplicate by handle
    if (enabledOps.has("dedup") && handleIdx >= 0) {
      const seen = new Set<string>();
      dataRows = dataRows.filter((row) => {
        const handle = row[handleIdx]?.trim().toLowerCase();
        if (!handle) return true;
        if (seen.has(handle)) return false;
        seen.add(handle);
        return true;
      });
    }

    const removedCount = originalCount - dataRows.length;
    const result = toCSV([headers, ...dataRows]);
    return { cleaned: result, stats: { rows: dataRows.length, removed: removedCount, modified: modifiedCount } };
  }, [input, operations]);

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(cleaned); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [cleaned]);

  const handleExport = useCallback(() => {
    if (!cleaned) return;
    const blob = new Blob([cleaned], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cleaned-products-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [cleaned]);

  const previewRows = useMemo(() => {
    if (!cleaned) return [];
    return parseCSV(cleaned).slice(0, 6);
  }, [cleaned]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Data Cleaner"
        description="Clean and standardize Shopify product CSV data with automated formatting operations."
        icon={Sparkles}
        badge="Shopify Dev"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Paste Product CSV
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Handle,Title,Body (HTML),Vendor,Type,Tags,Published,Variant Price,Variant Compare At Price
basic-tee, basic TEE ,<p>A simple tee</p>,Acme,Shirts,"cotton, basic",true,19.9,29.9
premium-hoodie, PREMIUM hoodie ,<b>Warm hoodie</b>,Acme,Hoodies,,true,49,
basic-tee, Basic Tee Duplicate,,Acme,Shirts,,true,19.90,`}
                className="min-h-[250px] font-mono text-xs"
              />
            </CardContent>
          </Card>

          {/* Operations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Cleaning Operations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {operations.map((op) => (
                <label
                  key={op.id}
                  className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={op.enabled}
                    onChange={() => toggleOp(op.id)}
                    className="mt-0.5 rounded"
                  />
                  <div>
                    <span className="text-sm font-medium">{op.label}</span>
                    <p className="text-xs text-muted-foreground">{op.description}</p>
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Output */}
        <div className="space-y-4">
          {/* Stats */}
          {input.trim() && (
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-2xl font-bold font-mono">{stats.rows}</p>
                  <p className="text-xs text-muted-foreground">Rows Kept</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-2xl font-bold font-mono text-emerald-500">{stats.modified}</p>
                  <p className="text-xs text-muted-foreground">Modified</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-2xl font-bold font-mono text-red-500">{stats.removed}</p>
                  <p className="text-xs text-muted-foreground">Removed</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Preview */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {showPreview ? "Table Preview" : "Cleaned Output"}
                </CardTitle>
                {cleaned && (
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="h-3 w-3" />
                    {showPreview ? "Raw CSV" : "Preview"}
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!input.trim() ? (
                <div className="min-h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                  Paste CSV data on the left to get started
                </div>
              ) : showPreview && previewRows.length > 0 ? (
                <div className="overflow-auto max-h-[400px] border rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        {previewRows[0]?.map((cell, i) => (
                          <th key={i} className="px-2 py-1.5 text-left font-medium border-b whitespace-nowrap">
                            {cell}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.slice(1).map((row, ri) => (
                        <tr key={ri} className="hover:bg-muted/30">
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-2 py-1.5 border-b whitespace-nowrap max-w-[200px] truncate">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-auto rounded-lg bg-muted/30 border p-3">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-all leading-relaxed">
                    {cleaned || "No output"}
                  </pre>
                </div>
              )}

              {cleaned && (
                <div className="mt-3 flex gap-2">
                  <Button onClick={handleCopy} variant="outline" className="flex-1">
                    {copied ? (
                      <><Check className="h-4 w-4 mr-2 text-emerald-500" /> Copied!</>
                    ) : (
                      <><Copy className="h-4 w-4 mr-2" /> Copy CSV</>
                    )}
                  </Button>
                  <Button
                    onClick={handleExport}
                    className="flex-1 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
                  >
                    <Download className="h-4 w-4 mr-2" /> Export CSV
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
