"use client";

import { useState, useCallback, useMemo } from "react";
import { ListFilter, Trash2, Copy, Check, Download, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface CleanResult {
  id: string;
  total: number;
  valid: string[];
  duplicates: string[];
  invalid: string[];
  roleBased: string[];
  cleanedAt: string;
}

const ROLE_PREFIXES = ["info", "admin", "support", "sales", "contact", "help", "office", "team", "hello", "webmaster", "postmaster", "noreply", "no-reply", "abuse", "marketing", "billing", "hr", "careers", "jobs", "press", "media"];

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function cleanList(raw: string): Omit<CleanResult, "id" | "cleanedAt"> {
  const lines = raw.split(/[\n,;]+/).map(l => l.trim().toLowerCase()).filter(Boolean);
  const total = lines.length;
  const seen = new Set<string>();
  const valid: string[] = [];
  const duplicates: string[] = [];
  const invalid: string[] = [];
  const roleBased: string[] = [];

  for (const email of lines) {
    if (!EMAIL_REGEX.test(email)) {
      invalid.push(email);
      continue;
    }
    if (seen.has(email)) {
      duplicates.push(email);
      continue;
    }
    seen.add(email);
    const local = email.split("@")[0];
    if (ROLE_PREFIXES.some(p => local === p || local.startsWith(p + "."))) {
      roleBased.push(email);
      continue;
    }
    valid.push(email);
  }

  return { total, valid, duplicates, invalid, roleBased };
}

export default function ListCleanerPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<CleanResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory, hydrated] = useLocalStorage<CleanResult[]>("list-cleaner-history", []);

  const handleClean = useCallback(() => {
    if (!input.trim()) return;
    const data = cleanList(input);
    const r: CleanResult = { ...data, id: generateId(), cleanedAt: new Date().toISOString() };
    setResult(r);
    setHistory(prev => [r, ...prev.slice(0, 9)]);
  }, [input, setHistory]);

  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result.valid.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleExport = useCallback(() => {
    if (!result) return;
    const blob = new Blob([result.valid.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clean-emails.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email List Cleaner"
        description="Detect duplicates, invalid formats, and role-based emails. Export a clean list."
        icon={ListFilter}
        badge="Free"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-violet-500" /> Paste Your Email List
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Emails (one per line, or comma/semicolon separated)</Label>
            <Textarea rows={8} placeholder="john@example.com&#10;jane@example.com&#10;info@company.com&#10;invalid-email&#10;john@example.com" value={input} onChange={e => setInput(e.target.value)} className="font-mono text-sm" />
          </div>
          <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white" onClick={handleClean} disabled={!input.trim()}>
            <ListFilter className="h-4 w-4" /> Clean List
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold">{result.total}</p>
                <p className="text-xs text-muted-foreground">Total Input</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-emerald-500">{result.valid.length}</p>
                <p className="text-xs text-muted-foreground">Valid & Clean</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-amber-500">{result.duplicates.length}</p>
                <p className="text-xs text-muted-foreground">Duplicates</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-2xl font-bold text-red-500">{result.invalid.length + result.roleBased.length}</p>
                <p className="text-xs text-muted-foreground">Removed</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy Clean List"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>

          {result.invalid.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-500 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Invalid Emails ({result.invalid.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.invalid.map((e, i) => <Badge key={i} variant="secondary" className="text-[10px] bg-red-500/10 text-red-600">{e}</Badge>)}
                </div>
              </CardContent>
            </Card>
          )}

          {result.duplicates.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-500">Duplicates ({result.duplicates.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.duplicates.map((e, i) => <Badge key={i} variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-600">{e}</Badge>)}
                </div>
              </CardContent>
            </Card>
          )}

          {result.roleBased.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-orange-500">Role-Based Emails ({result.roleBased.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.roleBased.map((e, i) => <Badge key={i} variant="secondary" className="text-[10px] bg-orange-500/10 text-orange-600">{e}</Badge>)}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
