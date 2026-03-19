"use client";

import { useState } from "react";
import {
  Languages,
  ArrowLeftRight,
  Copy,
  Check,
  Clock,
  Trash2,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface TranslationRecord {
  id: string;
  sourceLang: string;
  targetLang: string;
  inputText: string;
  outputText: string;
  createdAt: string;
}

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "de", label: "German", flag: "🇩🇪" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
  { code: "zh", label: "Chinese", flag: "🇨🇳" },
  { code: "pt", label: "Portuguese", flag: "🇵🇹" },
  { code: "it", label: "Italian", flag: "🇮🇹" },
  { code: "ko", label: "Korean", flag: "🇰🇷" },
  { code: "ar", label: "Arabic", flag: "🇸🇦" },
  { code: "ru", label: "Russian", flag: "🇷🇺" },
  { code: "nl", label: "Dutch", flag: "🇳🇱" },
  { code: "pl", label: "Polish", flag: "🇵🇱" },
  { code: "tr", label: "Turkish", flag: "🇹🇷" },
  { code: "sv", label: "Swedish", flag: "🇸🇪" },
];

const MAX_CHARS = 5000;

export default function TranslatePage() {
  const [history, setHistory] = useLocalStorage<TranslationRecord[]>("translate-history", []);
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("es");
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(outputText);
    setOutputText(inputText);
  };

  const handleTranslate = () => {
    if (!inputText.trim()) return;
    setIsTranslating(true);
    setOutputText("");
    setTimeout(() => {
      const placeholder = `[${LANGUAGES.find((l) => l.code === targetLang)?.label} translation via Gemini MCP]\n\n${inputText}`;
      setOutputText(placeholder);
      setIsTranslating(false);
      const record: TranslationRecord = {
        id: generateId(),
        sourceLang,
        targetLang,
        inputText: inputText.trim(),
        outputText: placeholder,
        createdAt: new Date().toISOString(),
      };
      setHistory((prev) => [record, ...prev].slice(0, 30));
    }, 1400);
  };

  const copyOutput = async () => {
    if (!outputText) return;
    await navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const loadHistory = (r: TranslationRecord) => {
    setSourceLang(r.sourceLang);
    setTargetLang(r.targetLang);
    setInputText(r.inputText);
    setOutputText(r.outputText);
  };

  const deleteHistory = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const getLang = (code: string) => LANGUAGES.find((l) => l.code === code);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Translator"
        description="Translate text between 15+ languages. Connect Gemini MCP for accurate AI translation."
        icon={Languages}
        badge="AI Studio"
        replaces="DeepL, Google Translate Pro"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Translator */}
        <div className="lg:col-span-3 space-y-4">
          {/* Language Selector Bar */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                {/* Source Language */}
                <div className="flex-1">
                  <Label className="text-[10px] text-muted-foreground uppercase mb-1 block">From</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-1">
                    {LANGUAGES.slice(0, 8).map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setSourceLang(lang.code)}
                        className={`flex flex-col items-center py-1.5 px-1 rounded-lg text-[10px] transition-all ${
                          sourceLang === lang.code
                            ? "bg-violet-500/15 text-violet-600 dark:text-violet-400 font-medium"
                            : "hover:bg-muted/60 text-muted-foreground"
                        }`}
                      >
                        <span className="text-base">{lang.flag}</span>
                        <span className="truncate max-w-full">{lang.label.slice(0, 5)}</span>
                      </button>
                    ))}
                  </div>
                  <select
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="mt-1 w-full text-xs rounded-lg border bg-background px-2 py-1.5 text-muted-foreground"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                    ))}
                  </select>
                </div>

                {/* Swap */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={swapLanguages}
                  className="shrink-0 h-8 w-8 p-0 rounded-full self-end mb-0.5"
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                </Button>

                {/* Target Language */}
                <div className="flex-1">
                  <Label className="text-[10px] text-muted-foreground uppercase mb-1 block">To</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-1">
                    {LANGUAGES.slice(0, 8).map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setTargetLang(lang.code)}
                        className={`flex flex-col items-center py-1.5 px-1 rounded-lg text-[10px] transition-all ${
                          targetLang === lang.code
                            ? "bg-pink-500/15 text-pink-600 dark:text-pink-400 font-medium"
                            : "hover:bg-muted/60 text-muted-foreground"
                        }`}
                      >
                        <span className="text-base">{lang.flag}</span>
                        <span className="truncate max-w-full">{lang.label.slice(0, 5)}</span>
                      </button>
                    ))}
                  </div>
                  <select
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="mt-1 w-full text-xs rounded-lg border bg-background px-2 py-1.5 text-muted-foreground"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Text Areas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Input */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{getLang(sourceLang)?.flag}</span>
                    <CardTitle className="text-sm">{getLang(sourceLang)?.label}</CardTitle>
                  </div>
                  <span className={`text-[10px] ${inputText.length > MAX_CHARS * 0.9 ? "text-red-500" : "text-muted-foreground"}`}>
                    {inputText.length}/{MAX_CHARS}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter text to translate…"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value.slice(0, MAX_CHARS))}
                  className="min-h-[200px] resize-none text-sm"
                />
              </CardContent>
            </Card>

            {/* Output */}
            <Card className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{getLang(targetLang)?.flag}</span>
                    <CardTitle className="text-sm">{getLang(targetLang)?.label}</CardTitle>
                  </div>
                  {outputText && (
                    <button
                      onClick={copyOutput}
                      className="p-1 rounded text-muted-foreground hover:text-violet-500 transition-colors"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={`min-h-[200px] rounded-lg border bg-muted/20 p-3 text-sm relative ${
                    isTranslating ? "animate-pulse" : ""
                  }`}
                >
                  {isTranslating ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Sparkles className="h-4 w-4 animate-spin text-violet-500" />
                      <span>Translating…</span>
                    </div>
                  ) : outputText ? (
                    <p className="whitespace-pre-wrap">{outputText}</p>
                  ) : (
                    <p className="text-muted-foreground/50">Translation will appear here</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleTranslate}
              disabled={!inputText.trim() || isTranslating}
              className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0 h-11 px-8"
            >
              <Languages className="h-4 w-4 mr-2" />
              Translate
            </Button>
            {outputText && (
              <Button onClick={copyOutput} variant="outline" className="h-11">
                {copied ? <Check className="h-4 w-4 mr-2 text-emerald-500" /> : <Copy className="h-4 w-4 mr-2" />}
                Copy Translation
              </Button>
            )}
            <div className="ml-auto">
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]">
                Gemini MCP required for real translation
              </Badge>
            </div>
          </div>
        </div>

        {/* History Sidebar */}
        <div>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  History
                </CardTitle>
                {history.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => setHistory([])}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No translations yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="group p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer"
                      onClick={() => loadHistory(item)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <span>{getLang(item.sourceLang)?.flag}</span>
                          <ArrowLeftRight className="h-2.5 w-2.5" />
                          <span>{getLang(item.targetLang)?.flag}</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteHistory(item.id); }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-xs truncate">{item.inputText}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Languages", value: "15+" },
          { label: "Max Characters", value: "5,000" },
          { label: "History Saved", value: "Last 30" },
          { label: "Powered By", value: "Gemini MCP" },
        ].map((info) => (
          <div key={info.label} className="p-3 rounded-xl bg-muted/30 border text-center">
            <p className="text-xs text-muted-foreground">{info.label}</p>
            <p className="text-sm font-semibold mt-0.5">{info.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
