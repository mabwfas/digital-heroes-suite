"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Regex,
  Copy,
  Check,
  Replace,
  Hash,
  BookOpen,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PatternPreset {
  name: string;
  pattern: string;
  flags: string;
  description: string;
}

const COMMON_PATTERNS: PatternPreset[] = [
  { name: "Email", pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}", flags: "gi", description: "Match email addresses" },
  { name: "URL", pattern: "https?://[\\w\\-._~:/?#\\[\\]@!$&'()*+,;=%]+", flags: "gi", description: "Match HTTP/HTTPS URLs" },
  { name: "Phone (US)", pattern: "\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}", flags: "g", description: "US phone numbers" },
  { name: "IPv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b", flags: "g", description: "IPv4 addresses" },
  { name: "Date (YYYY-MM-DD)", pattern: "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])", flags: "g", description: "ISO date format" },
  { name: "Hex Color", pattern: "#(?:[0-9a-fA-F]{3}){1,2}\\b", flags: "gi", description: "Hex color codes" },
  { name: "HTML Tag", pattern: "<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>.*?</\\1>", flags: "gs", description: "HTML elements" },
  { name: "Numbers", pattern: "-?\\d+(?:\\.\\d+)?", flags: "g", description: "Integers and decimals" },
  { name: "Words", pattern: "\\b[a-zA-Z]+\\b", flags: "g", description: "Alphabetic words" },
  { name: "Whitespace", pattern: "\\s+", flags: "g", description: "One or more whitespace chars" },
  { name: "SSN (masked)", pattern: "\\d{3}-\\d{2}-\\d{4}", flags: "g", description: "Social security numbers" },
  { name: "Zip Code (US)", pattern: "\\b\\d{5}(?:-\\d{4})?\\b", flags: "g", description: "US zip codes" },
];

interface MatchInfo {
  match: string;
  index: number;
  groups: string[];
}

function buildRegex(pattern: string, flags: string): RegExp | null {
  try {
    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
}

function HighlightedText({
  text,
  pattern,
  flags,
}: {
  text: string;
  pattern: string;
  flags: string;
}) {
  const segments = useMemo(() => {
    if (!pattern || !text) return [{ text, highlight: false }];
    const regex = buildRegex(pattern, flags.includes("g") ? flags : flags + "g");
    if (!regex) return [{ text, highlight: false }];

    const result: { text: string; highlight: boolean }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let safety = 0;

    while ((match = regex.exec(text)) !== null && safety < 10000) {
      safety++;
      if (match.index > lastIndex) {
        result.push({ text: text.slice(lastIndex, match.index), highlight: false });
      }
      result.push({ text: match[0], highlight: true });
      lastIndex = regex.lastIndex;
      if (match[0].length === 0) {
        regex.lastIndex++;
      }
    }

    if (lastIndex < text.length) {
      result.push({ text: text.slice(lastIndex), highlight: false });
    }

    return result;
  }, [text, pattern, flags]);

  return (
    <div className="font-mono text-sm whitespace-pre-wrap break-all leading-relaxed">
      {segments.map((seg, i) =>
        seg.highlight ? (
          <span
            key={i}
            className="bg-yellow-300/50 dark:bg-yellow-500/30 text-yellow-900 dark:text-yellow-200 rounded px-0.5 border border-yellow-400/40"
          >
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </div>
  );
}

export default function RegexTesterPage() {
  const [pattern, setPattern] = useState("");
  const [flags, setFlags] = useState({ g: true, i: false, m: false, s: false, u: false });
  const [testString, setTestString] = useState("");
  const [replaceMode, setReplaceMode] = useState(false);
  const [replacement, setReplacement] = useState("");
  const [copied, setCopied] = useState(false);

  const flagStr = Object.entries(flags)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join("");

  const regex = useMemo(() => buildRegex(pattern, flagStr), [pattern, flagStr]);

  const regexError = useMemo(() => {
    if (!pattern) return null;
    try {
      new RegExp(pattern, flagStr);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Invalid regex";
    }
  }, [pattern, flagStr]);

  const matches = useMemo((): MatchInfo[] => {
    if (!regex || !testString || !pattern) return [];
    const results: MatchInfo[] = [];
    const searchRegex = buildRegex(pattern, flagStr.includes("g") ? flagStr : flagStr + "g");
    if (!searchRegex) return [];

    let m: RegExpExecArray | null;
    let safety = 0;
    while ((m = searchRegex.exec(testString)) !== null && safety < 10000) {
      safety++;
      results.push({
        match: m[0],
        index: m.index,
        groups: m.slice(1),
      });
      if (m[0].length === 0) searchRegex.lastIndex++;
    }
    return results;
  }, [regex, testString, pattern, flagStr]);

  const replaceResult = useMemo(() => {
    if (!regex || !testString || !pattern || !replaceMode) return "";
    try {
      return testString.replace(regex, replacement);
    } catch {
      return "";
    }
  }, [regex, testString, pattern, replacement, replaceMode]);

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

  const applyPreset = useCallback((preset: PatternPreset) => {
    setPattern(preset.pattern);
    setFlags({
      g: preset.flags.includes("g"),
      i: preset.flags.includes("i"),
      m: preset.flags.includes("m"),
      s: preset.flags.includes("s"),
      u: preset.flags.includes("u"),
    });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Regex Tester"
        description="Test regular expressions with real-time match highlighting, capture groups, and replace mode."
        icon={Regex}
        badge="Developer"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pattern + Test String */}
        <div className="lg:col-span-2 space-y-4">
          {/* Pattern input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Regular Expression
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg text-muted-foreground font-mono">/</span>
                <Input
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="Enter regex pattern..."
                  className="font-mono flex-1"
                />
                <span className="text-lg text-muted-foreground font-mono">/</span>
                <span className="text-sm font-mono text-violet-600 dark:text-violet-400 min-w-[40px]">
                  {flagStr || "—"}
                </span>
              </div>

              {regexError && (
                <p className="text-sm text-red-500 font-mono">{regexError}</p>
              )}

              {/* Flags */}
              <div className="flex flex-wrap gap-2">
                <Label className="text-xs text-muted-foreground self-center mr-1">Flags:</Label>
                {(["g", "i", "m", "s", "u"] as const).map((flag) => (
                  <button
                    key={flag}
                    onClick={() => setFlags((f) => ({ ...f, [flag]: !f[flag] }))}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-medium transition-all ${
                      flags[flag]
                        ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        : "border-border hover:border-violet-300 text-muted-foreground"
                    }`}
                  >
                    {flag}
                    <span className="text-[10px] ml-1 text-muted-foreground">
                      {flag === "g" && "global"}
                      {flag === "i" && "insensitive"}
                      {flag === "m" && "multiline"}
                      {flag === "s" && "dotAll"}
                      {flag === "u" && "unicode"}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Test string */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Test String
                </CardTitle>
                {matches.length > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    <Hash className="h-3 w-3 mr-1" />
                    {matches.length} match{matches.length !== 1 ? "es" : ""}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                placeholder="Enter text to test against..."
                className="min-h-[120px] font-mono text-sm"
              />

              {/* Highlighted output */}
              {testString && pattern && !regexError && (
                <div className="p-3 rounded-lg bg-muted/30 border min-h-[60px]">
                  <p className="text-[10px] text-muted-foreground mb-2 uppercase tracking-wider">Match Highlighting</p>
                  <HighlightedText text={testString} pattern={pattern} flags={flagStr} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Replace mode */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Replace Mode
                </CardTitle>
                <button
                  onClick={() => setReplaceMode(!replaceMode)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                    replaceMode
                      ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Replace className="h-3 w-3" />
                  {replaceMode ? "On" : "Off"}
                </button>
              </div>
            </CardHeader>
            {replaceMode && (
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Replacement String</Label>
                  <Input
                    value={replacement}
                    onChange={(e) => setReplacement(e.target.value)}
                    placeholder="Replacement text (use $1, $2 for groups)..."
                    className="font-mono"
                  />
                </div>
                {replaceResult && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Result Preview</Label>
                    <div className="p-3 rounded-lg bg-muted/30 border">
                      <pre className="font-mono text-sm whitespace-pre-wrap break-all">{replaceResult}</pre>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(replaceResult)}
                    >
                      {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      {copied ? "Copied!" : "Copy Result"}
                    </Button>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>

        {/* Sidebar: Matches + Patterns Library */}
        <div className="space-y-4">
          {/* Match Results */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Match Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {matches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {!pattern ? "Enter a regex pattern to start" : !testString ? "Enter test text" : "No matches found"}
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-auto">
                  {matches.map((m, i) => (
                    <div key={i} className="p-2 rounded-lg border bg-muted/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-[10px]">
                          Match {i + 1}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          index: {m.index}
                        </span>
                      </div>
                      <p className="font-mono text-sm text-green-600 dark:text-green-400 break-all">
                        &quot;{m.match}&quot;
                      </p>
                      {m.groups.length > 0 && (
                        <div className="space-y-0.5">
                          {m.groups.map((g, gi) => (
                            <p key={gi} className="text-[11px] text-muted-foreground font-mono">
                              ${gi + 1}: &quot;{g ?? "undefined"}&quot;
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Common Patterns */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Common Patterns
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 max-h-[400px] overflow-auto">
                {COMMON_PATTERNS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => applyPreset(p)}
                    className="w-full text-left p-2 rounded-lg border hover:border-violet-400 hover:bg-violet-500/5 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{p.name}</span>
                      <Zap className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{p.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
