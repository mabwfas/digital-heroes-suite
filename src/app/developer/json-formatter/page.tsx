"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Braces,
  Copy,
  Check,
  Minimize2,
  Sparkles,
  ChevronRight,
  ChevronDown,
  TreePine,
  Code,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type IndentOption = "2" | "4" | "8" | "tab";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getIndent(option: IndentOption): string | number {
  if (option === "tab") return "\t";
  return Number(option);
}

// Syntax-highlighted JSON renderer
function SyntaxHighlight({ json }: { json: string }) {
  const tokens = useMemo(() => {
    const result: { text: string; className: string }[] = [];
    const regex =
      /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|(true|false)|(null)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\]:,])|(\s+)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(json)) !== null) {
      if (match[1]) {
        // key
        const key = match[1].replace(/\s*:$/, "");
        result.push({ text: key, className: "text-blue-600 dark:text-blue-400" });
        result.push({ text: ": ", className: "text-foreground/60" });
      } else if (match[2]) {
        result.push({ text: match[2], className: "text-green-600 dark:text-green-400" });
      } else if (match[3]) {
        result.push({ text: match[3], className: "text-purple-600 dark:text-purple-400" });
      } else if (match[4]) {
        result.push({ text: match[4], className: "text-red-500 dark:text-red-400" });
      } else if (match[5]) {
        result.push({ text: match[5], className: "text-orange-600 dark:text-orange-400" });
      } else if (match[6]) {
        result.push({ text: match[6], className: "text-foreground/60" });
      } else if (match[7]) {
        result.push({ text: match[7], className: "" });
      }
    }
    return result;
  }, [json]);

  return (
    <pre className="text-sm font-mono whitespace-pre-wrap break-all leading-relaxed">
      {tokens.map((t, i) => (
        <span key={i} className={t.className}>
          {t.text}
        </span>
      ))}
    </pre>
  );
}

// Tree view component for JSON
function JsonTreeNode({ name, value, depth }: { name?: string; value: unknown; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (value === null) {
    return (
      <div className="flex items-center gap-1" style={{ paddingLeft: depth * 16 }}>
        {name && <span className="text-blue-600 dark:text-blue-400 text-sm font-mono">{name}: </span>}
        <span className="text-red-500 dark:text-red-400 text-sm font-mono">null</span>
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <div className="flex items-center gap-1" style={{ paddingLeft: depth * 16 }}>
        {name && <span className="text-blue-600 dark:text-blue-400 text-sm font-mono">{name}: </span>}
        <span className="text-purple-600 dark:text-purple-400 text-sm font-mono">{String(value)}</span>
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div className="flex items-center gap-1" style={{ paddingLeft: depth * 16 }}>
        {name && <span className="text-blue-600 dark:text-blue-400 text-sm font-mono">{name}: </span>}
        <span className="text-orange-600 dark:text-orange-400 text-sm font-mono">{String(value)}</span>
      </div>
    );
  }

  if (typeof value === "string") {
    return (
      <div className="flex items-center gap-1" style={{ paddingLeft: depth * 16 }}>
        {name && <span className="text-blue-600 dark:text-blue-400 text-sm font-mono">{name}: </span>}
        <span className="text-green-600 dark:text-green-400 text-sm font-mono">&quot;{value}&quot;</span>
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 hover:bg-muted/50 rounded px-1 -ml-1"
          style={{ paddingLeft: depth * 16 }}
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {name && <span className="text-blue-600 dark:text-blue-400 text-sm font-mono">{name}: </span>}
          <span className="text-foreground/60 text-sm font-mono">
            Array[{value.length}]
          </span>
        </button>
        {expanded &&
          value.map((item, i) => (
            <JsonTreeNode key={i} name={String(i)} value={item} depth={depth + 1} />
          ))}
      </div>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 hover:bg-muted/50 rounded px-1 -ml-1"
          style={{ paddingLeft: depth * 16 }}
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {name && <span className="text-blue-600 dark:text-blue-400 text-sm font-mono">{name}: </span>}
          <span className="text-foreground/60 text-sm font-mono">
            {"{"}
            {entries.length}
            {"}"}
          </span>
        </button>
        {expanded &&
          entries.map(([k, v]) => <JsonTreeNode key={k} name={k} value={v} depth={depth + 1} />)}
      </div>
    );
  }

  return null;
}

export default function JsonFormatterPage() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<IndentOption>("2");
  const [viewMode, setViewMode] = useState<"formatted" | "tree">("formatted");
  const [copied, setCopied] = useState(false);

  const { output, error, parsed } = useMemo(() => {
    if (!input.trim()) return { output: "", error: null, parsed: null };
    try {
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, getIndent(indent));
      return { output: formatted, error: null, parsed };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid JSON";
      return { output: "", error: msg, parsed: null };
    }
  }, [input, indent]);

  const minified = useMemo(() => {
    if (!input.trim()) return "";
    try {
      return JSON.stringify(JSON.parse(input));
    } catch {
      return "";
    }
  }, [input]);

  const handleFormat = useCallback(() => {
    if (output) setInput(output);
  }, [output]);

  const handleMinify = useCallback(() => {
    if (minified) setInput(minified);
  }, [minified]);

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, []);

  const inputSize = new Blob([input]).size;
  const outputSize = output ? new Blob([output]).size : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="JSON Formatter & Validator"
        description="Format, beautify, minify, and validate JSON with syntax highlighting and tree view."
        icon={Braces}
        badge="Developer"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Input JSON
                </CardTitle>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {formatBytes(inputSize)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder='Paste your JSON here, e.g. {"name": "John", "age": 30}'
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
              />

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600 dark:text-red-400 font-mono">{error}</p>
                </div>
              )}

              {!error && input.trim() && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Check className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Valid JSON</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Indentation</Label>
                <div className="flex flex-wrap gap-2">
                  {(["2", "4", "8", "tab"] as IndentOption[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setIndent(opt)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        indent === opt
                          ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                          : "border-border hover:border-violet-300 text-muted-foreground"
                      }`}
                    >
                      {opt === "tab" ? "Tab" : `${opt} spaces`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleFormat}
                  disabled={!output}
                  className="flex-1 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Format / Beautify
                </Button>
                <Button
                  onClick={handleMinify}
                  disabled={!minified}
                  variant="outline"
                  className="flex-1"
                >
                  <Minimize2 className="h-4 w-4 mr-2" />
                  Minify
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Output
                  </CardTitle>
                  {output && (
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {formatBytes(outputSize)}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewMode("formatted")}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                      viewMode === "formatted"
                        ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Code className="h-3 w-3" />
                    Code
                  </button>
                  <button
                    onClick={() => setViewMode("tree")}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                      viewMode === "tree"
                        ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <TreePine className="h-3 w-3" />
                    Tree
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!input.trim() ? (
                <div className="min-h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                  Paste JSON on the left to get started
                </div>
              ) : error ? (
                <div className="min-h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                  Fix the errors in the input to see output
                </div>
              ) : viewMode === "formatted" ? (
                <div className="min-h-[300px] max-h-[500px] overflow-auto rounded-lg bg-muted/30 border p-4">
                  <SyntaxHighlight json={output} />
                </div>
              ) : (
                <div className="min-h-[300px] max-h-[500px] overflow-auto rounded-lg bg-muted/30 border p-4">
                  {parsed !== null && <JsonTreeNode value={parsed} depth={0} />}
                </div>
              )}

              {output && (
                <div className="mt-3">
                  <Button
                    onClick={() => handleCopy(output)}
                    variant="outline"
                    className="w-full"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2 text-emerald-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Formatted Output
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Size Comparison */}
          {output && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Size Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold font-mono">{formatBytes(inputSize)}</p>
                    <p className="text-[10px] text-muted-foreground">Original</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold font-mono">{formatBytes(outputSize)}</p>
                    <p className="text-[10px] text-muted-foreground">Formatted</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold font-mono">
                      {minified ? formatBytes(new Blob([minified]).size) : "—"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Minified</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
