"use client";

import { useState, useCallback, useMemo } from "react";
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  History,
  Shuffle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

// Passphrase word list (200+ common memorable words)
const WORD_LIST = [
  "apple","river","cloud","stone","flame","ocean","tiger","dream","frost","light",
  "storm","eagle","pearl","blade","crown","amber","cedar","coral","crane","delta",
  "ember","forge","globe","haven","ivory","jewel","karma","lunar","maple","noble",
  "oasis","pixel","quest","raven","solar","thorn","ultra","vivid","wrath","xenon",
  "yield","blaze","charm","drift","earth","flora","grain","heart","indie","jolly",
  "knack","lemon","magic","nerve","orbit","plume","quilt","ridge","spice","tower",
  "unity","vault","wheat","youth","bliss","crest","dwell","elfin","fairy","grape",
  "haste","irony","joker","kayak","lilac","mango","nexus","olive","panda","robin",
  "surge","tempo","umbra","vigor","waltz","zebra","arrow","brave","candy","daisy",
  "elbow","flint","glyph","honey","input","jazzy","kites","lotus","mocha","nifty",
  "onion","prism","quota","rainy","swift","trout","usher","verse","windy","xenon",
  "yacht","zesty","acorn","basil","cabin","depot","epoch","fable","gamma","hazel",
  "index","jumbo","koala","latch","mirth","nudge","oxide","petal","quirk","roast",
  "scone","trend","ultra","valve","wager","xerox","yearn","zincs","ankle","brush",
  "chaos","dodge","equal","fresh","ghost","hatch","ionic","joint","kneel","liver",
  "mouse","ninth","outer","paint","queen","round","sharp","thick","under","vocal",
  "wrist","extra","young","zones","adapt","bench","click","depth","event","field",
  "green","house","image","juice","knife","layer","metal","north","ocean","plane",
  "quiet","reset","sight","trail","upper","video","waste","xerus","yodel","zilch",
  "align","boost","chart","debug","error","frame","guard","hover","infer","jumps",
];

interface PasswordSettings {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  customExclude: string;
  count: number;
  mode: "password" | "passphrase";
  passphraseWords: number;
}

interface HistoryEntry {
  id: string;
  value: string;
  timestamp: number;
  strength: string;
}

const DEFAULT_SETTINGS: PasswordSettings = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
  customExclude: "",
  count: 1,
  mode: "password",
  passphraseWords: 4,
};

const AMBIGUOUS_CHARS = "0O1lI|`";

function generatePassword(settings: PasswordSettings): string {
  if (settings.mode === "passphrase") {
    const words: string[] = [];
    for (let i = 0; i < settings.passphraseWords; i++) {
      const idx = Math.floor(Math.random() * WORD_LIST.length);
      let word = WORD_LIST[idx];
      // Capitalize first letter
      word = word.charAt(0).toUpperCase() + word.slice(1);
      words.push(word);
    }
    const num = Math.floor(Math.random() * 900) + 100;
    return words.join("-") + "-" + num;
  }

  let chars = "";
  if (settings.uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (settings.lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
  if (settings.numbers) chars += "0123456789";
  if (settings.symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";

  if (!chars) chars = "abcdefghijklmnopqrstuvwxyz";

  if (settings.excludeAmbiguous) {
    chars = chars.split("").filter((c) => !AMBIGUOUS_CHARS.includes(c)).join("");
  }

  if (settings.customExclude) {
    const exclude = new Set(settings.customExclude.split(""));
    chars = chars.split("").filter((c) => !exclude.has(c)).join("");
  }

  if (!chars) chars = "abcdefghijklmnopqrstuvwxyz";

  const arr = new Uint32Array(settings.length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (v) => chars[v % chars.length]).join("");
}

function calculateEntropy(password: string): number {
  const charsets: { regex: RegExp; size: number }[] = [
    { regex: /[a-z]/, size: 26 },
    { regex: /[A-Z]/, size: 26 },
    { regex: /[0-9]/, size: 10 },
    { regex: /[^a-zA-Z0-9]/, size: 32 },
  ];
  let poolSize = 0;
  for (const cs of charsets) {
    if (cs.regex.test(password)) poolSize += cs.size;
  }
  if (poolSize === 0) return 0;
  return password.length * Math.log2(poolSize);
}

function getStrength(entropy: number): { label: string; color: string; percent: number } {
  if (entropy < 28) return { label: "Very Weak", color: "bg-red-500", percent: 10 };
  if (entropy < 36) return { label: "Weak", color: "bg-orange-500", percent: 25 };
  if (entropy < 60) return { label: "Fair", color: "bg-yellow-500", percent: 50 };
  if (entropy < 80) return { label: "Strong", color: "bg-emerald-500", percent: 75 };
  return { label: "Very Strong", color: "bg-emerald-600", percent: 100 };
}

export default function PasswordGenPage() {
  const [settings, setSettings, hydrated] = useLocalStorage<PasswordSettings>(
    "password-gen-settings",
    DEFAULT_SETTINGS
  );
  const [passwords, setPasswords] = useState<string[]>([]);
  const [history, setHistory] = useLocalStorage<HistoryEntry[]>("password-gen-history", []);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedHistIdx, setCopiedHistIdx] = useState<string | null>(null);

  const handleGenerate = useCallback(() => {
    const count = Math.max(1, Math.min(10, settings.count));
    const newPasswords = Array.from({ length: count }, () => generatePassword(settings));
    setPasswords(newPasswords);

    // Add to history
    const newEntries: HistoryEntry[] = newPasswords.map((p) => ({
      id: generateId(),
      value: p,
      timestamp: Date.now(),
      strength: getStrength(calculateEntropy(p)).label,
    }));
    setHistory((prev) => [...newEntries, ...prev].slice(0, 50));
  }, [settings, setHistory]);

  const handleCopy = useCallback(async (text: string, idx: number) => {
    try { await navigator.clipboard.writeText(text); } catch { /* */ }
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }, []);

  const handleCopyHist = useCallback(async (text: string, id: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* */ }
    setCopiedHistIdx(id);
    setTimeout(() => setCopiedHistIdx(null), 1500);
  }, []);

  const updateSetting = useCallback(
    <K extends keyof PasswordSettings>(key: K, value: PasswordSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    [setSettings]
  );

  // Show current strength for first password
  const currentStrength = useMemo(() => {
    if (passwords.length === 0) return null;
    const entropy = calculateEntropy(passwords[0]);
    return { ...getStrength(entropy), entropy: Math.round(entropy) };
  }, [passwords]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Password Generator"
        description="Generate secure passwords and passphrases with customizable options and strength analysis."
        icon={KeyRound}
        badge="Developer"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings */}
        <div className="lg:col-span-2 space-y-4">
          {/* Mode selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {(["password", "passphrase"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateSetting("mode", mode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                      settings.mode === mode
                        ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        : "border-border hover:border-violet-300 text-muted-foreground"
                    }`}
                  >
                    {mode === "password" ? <Shield className="h-4 w-4" /> : <Shuffle className="h-4 w-4" />}
                    {mode === "password" ? "Password" : "Passphrase"}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.mode === "password" ? (
                <>
                  {/* Length slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Length</Label>
                      <span className="text-sm font-mono font-bold text-violet-600 dark:text-violet-400">
                        {settings.length}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={8}
                      max={128}
                      value={settings.length}
                      onChange={(e) => updateSetting("length", Number(e.target.value))}
                      className="w-full accent-violet-500"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>8</span>
                      <span>128</span>
                    </div>
                  </div>

                  {/* Character toggles */}
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { key: "uppercase" as const, label: "Uppercase (A-Z)" },
                      { key: "lowercase" as const, label: "Lowercase (a-z)" },
                      { key: "numbers" as const, label: "Numbers (0-9)" },
                      { key: "symbols" as const, label: "Symbols (!@#$...)" },
                      { key: "excludeAmbiguous" as const, label: "Exclude Ambiguous (0O1lI)" },
                    ]).map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => updateSetting(opt.key, !settings[opt.key])}
                        className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                          settings[opt.key]
                            ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                            : "border-border hover:border-violet-300 text-muted-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom exclude */}
                  <div className="space-y-2">
                    <Label className="text-xs">Custom Exclude Characters</Label>
                    <Input
                      value={settings.customExclude}
                      onChange={(e) => updateSetting("customExclude", e.target.value)}
                      placeholder="e.g. {}[]~"
                      className="font-mono"
                    />
                  </div>
                </>
              ) : (
                /* Passphrase options */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Number of Words</Label>
                    <span className="text-sm font-mono font-bold text-violet-600 dark:text-violet-400">
                      {settings.passphraseWords}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={8}
                    value={settings.passphraseWords}
                    onChange={(e) => updateSetting("passphraseWords", Number(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>3 words</span>
                    <span>8 words</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Format: Word-Word-Word-Number (e.g. Tiger-Cloud-Maple-472)
                  </p>
                </div>
              )}

              {/* Count */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Generate Count</Label>
                  <span className="text-sm font-mono font-bold">{settings.count}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={settings.count}
                  onChange={(e) => updateSetting("count", Number(e.target.value))}
                  className="w-full accent-violet-500"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>1</span>
                  <span>10 (bulk)</span>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate {settings.count > 1 ? `${settings.count} Passwords` : "Password"}
              </Button>
            </CardContent>
          </Card>

          {/* Generated passwords */}
          {passwords.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Generated {passwords.length > 1 ? "Passwords" : "Password"}
                  </CardTitle>
                  {currentStrength && (
                    <Badge
                      variant="secondary"
                      className="text-[10px]"
                    >
                      {currentStrength.label} ({currentStrength.entropy} bits)
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Strength meter */}
                {currentStrength && (
                  <div className="space-y-1">
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${currentStrength.color}`}
                        style={{ width: `${currentStrength.percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Entropy: {currentStrength.entropy} bits</span>
                      <span className="flex items-center gap-1">
                        {currentStrength.percent >= 75 ? (
                          <ShieldCheck className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <ShieldAlert className="h-3 w-3 text-orange-500" />
                        )}
                        {currentStrength.label}
                      </span>
                    </div>
                  </div>
                )}

                {passwords.map((pw, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20"
                  >
                    <span className="font-mono text-sm break-all flex-1 select-all">{pw}</span>
                    <button
                      onClick={() => handleCopy(pw, i)}
                      className="shrink-0 p-1.5 rounded hover:bg-muted transition-colors"
                    >
                      {copiedIdx === i ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* History sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    History
                  </CardTitle>
                </div>
                {hydrated && history.length > 0 && (
                  <button
                    onClick={() => setHistory([])}
                    className="p-1 rounded hover:bg-muted transition-colors"
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!hydrated || history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Generated passwords will appear here
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[600px] overflow-auto">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-2 p-2 rounded-lg border bg-muted/10 group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs truncate">{entry.value}</p>
                        <p className="text-[10px] text-muted-foreground">{entry.strength}</p>
                      </div>
                      <button
                        onClick={() => handleCopyHist(entry.value, entry.id)}
                        className="shrink-0 p-1 rounded hover:bg-muted transition-colors opacity-60 group-hover:opacity-100"
                      >
                        {copiedHistIdx === entry.id ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Security Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "Use 16+ characters for important accounts",
                "Enable all character types for max entropy",
                "Passphrases are easier to remember",
                "Never reuse passwords across services",
                "Use a password manager for storage",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">{tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
