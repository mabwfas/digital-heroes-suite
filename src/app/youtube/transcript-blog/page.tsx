"use client";

import { useState, useCallback } from "react";
import {
  FileText,
  Copy,
  Trash2,
  Wand2,
  Download,
  Type,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

const FILLER_WORDS = [
  /\b(um|uh|er|ah|like|you know|i mean|basically|actually|literally|right|okay so|so yeah|sort of|kind of)\b/gi,
];

const TOPIC_SHIFT_MARKERS = [
  "now", "next", "moving on", "another", "first", "second", "third",
  "finally", "also", "in addition", "furthermore", "let's talk about",
  "the next thing", "on top of that", "speaking of", "when it comes to",
  "so the", "the key", "the main", "what about", "here's",
];

function cleanTranscript(raw: string): string {
  let text = raw;
  for (const re of FILLER_WORDS) {
    text = text.replace(re, "");
  }
  text = text.replace(/\s{2,}/g, " ");
  text = text.replace(/\s([.,!?;:])/g, "$1");
  text = text.replace(/([.!?])\s*/g, "$1 ");
  return text.trim();
}

function addParagraphs(text: string): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const paragraphs: string[] = [];
  let current: string[] = [];

  for (const sentence of sentences) {
    current.push(sentence);
    if (current.length >= 4) {
      paragraphs.push(current.join(" "));
      current = [];
    }
  }
  if (current.length > 0) {
    paragraphs.push(current.join(" "));
  }
  return paragraphs;
}

function generateHeadings(paragraphs: string[]): { heading: string; content: string }[] {
  const sections: { heading: string; content: string }[] = [];
  let sectionIdx = 0;

  for (const para of paragraphs) {
    const lower = para.toLowerCase();
    let foundTopic = false;

    for (const marker of TOPIC_SHIFT_MARKERS) {
      if (lower.startsWith(marker) || (lower.indexOf(marker) > -1 && lower.indexOf(marker) < 40)) {
        foundTopic = true;
        break;
      }
    }

    if (foundTopic || sections.length === 0 || sections[sections.length - 1].content.length > 600) {
      sectionIdx++;
      const words = para.split(" ").slice(0, 8).join(" ");
      const heading = words.replace(/[.!?,;:]$/, "");
      sections.push({
        heading: heading.charAt(0).toUpperCase() + heading.slice(1),
        content: para,
      });
    } else {
      sections[sections.length - 1].content += "\n\n" + para;
    }
  }

  return sections;
}

function generateMetaDescription(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/).slice(0, 2);
  const meta = sentences.join(" ");
  if (meta.length > 160) return meta.slice(0, 157) + "...";
  return meta;
}

function generateSuggestedTitle(text: string): string {
  const words = text.split(/\s+/).slice(0, 10);
  const meaningful = words.filter((w) => w.length > 3);
  if (meaningful.length >= 3) {
    return "Guide to " + meaningful.slice(0, 4).join(" ").replace(/[.!?,;:]$/, "");
  }
  return "Complete Guide: " + words.slice(0, 6).join(" ").replace(/[.!?,;:]$/, "");
}

function toMarkdown(title: string, meta: string, sections: { heading: string; content: string }[]): string {
  let md = `# ${title}\n\n`;
  md += `> **Meta Description:** ${meta}\n\n`;
  md += `---\n\n`;
  for (const s of sections) {
    md += `## ${s.heading}\n\n`;
    md += `${s.content}\n\n`;
  }
  return md;
}

function toPlainText(title: string, meta: string, sections: { heading: string; content: string }[]): string {
  let text = `${title}\n${"=".repeat(title.length)}\n\n`;
  text += `Meta Description: ${meta}\n\n`;
  text += `---\n\n`;
  for (const s of sections) {
    text += `${s.heading}\n${"-".repeat(s.heading.length)}\n\n`;
    text += `${s.content}\n\n`;
  }
  return text;
}

export default function TranscriptBlogPage() {
  const [rawTranscript, setRawTranscript] = useState("");
  const [converted, setConverted] = useState<{
    title: string;
    meta: string;
    sections: { heading: string; content: string }[];
    wordCount: number;
    removedFillers: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConvert = useCallback(() => {
    if (!rawTranscript.trim()) return;

    const originalWords = rawTranscript.split(/\s+/).length;
    const cleaned = cleanTranscript(rawTranscript);
    const cleanedWords = cleaned.split(/\s+/).length;
    const removedFillers = originalWords - cleanedWords;

    const paragraphs = addParagraphs(cleaned);
    const sections = generateHeadings(paragraphs);
    const meta = generateMetaDescription(cleaned);
    const title = generateSuggestedTitle(cleaned);

    setConverted({
      title,
      meta,
      sections,
      wordCount: cleanedWords,
      removedFillers,
    });
  }, [rawTranscript]);

  function handleCopy(format: "markdown" | "plain") {
    if (!converted) return;
    const text = format === "markdown"
      ? toMarkdown(converted.title, converted.meta, converted.sections)
      : toPlainText(converted.title, converted.meta, converted.sections);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transcript to Blog Converter"
        description="Convert video transcripts into well-formatted blog posts with headings and SEO metadata"
        icon={FileText}
        badge="YouTube"
        replaces="Manual Editing / Descript"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Type className="h-4 w-4 text-violet-500" />
              Paste Transcript
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste your video transcript here... The converter will remove filler words, add paragraph breaks, and generate headings automatically."
              value={rawTranscript}
              onChange={(e) => setRawTranscript(e.target.value)}
              rows={20}
              className="font-mono text-sm"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {rawTranscript.split(/\s+/).filter(Boolean).length} words
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => { setRawTranscript(""); setConverted(null); }}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Clear
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0"
                  onClick={handleConvert}
                  disabled={!rawTranscript.trim()}
                >
                  <Wand2 className="h-3.5 w-3.5 mr-1" />
                  Convert to Blog Post
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Output */}
        <div className="space-y-4">
          {converted ? (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="border-border/50">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-bold">{converted.wordCount}</p>
                    <p className="text-xs text-muted-foreground">Words</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-bold">{converted.removedFillers}</p>
                    <p className="text-xs text-muted-foreground">Fillers Removed</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-3 text-center">
                    <p className="text-xl font-bold">{converted.sections.length}</p>
                    <p className="text-xs text-muted-foreground">Sections</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Blog Post Preview</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleCopy("markdown")}>
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        {copied ? "Copied!" : "Markdown"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleCopy("plain")}>
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Plain Text
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Title */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Suggested Title</Label>
                    <Input
                      value={converted.title}
                      onChange={(e) => setConverted({ ...converted, title: e.target.value })}
                      className="mt-1 font-semibold"
                    />
                  </div>

                  {/* Meta */}
                  <div>
                    <Label className="text-xs text-muted-foreground">SEO Meta Description ({converted.meta.length}/160)</Label>
                    <Textarea
                      value={converted.meta}
                      onChange={(e) => setConverted({ ...converted, meta: e.target.value })}
                      rows={2}
                      className="mt-1 text-sm"
                    />
                  </div>

                  <Separator />

                  {/* Sections */}
                  <div className="space-y-4">
                    {converted.sections.map((section, idx) => (
                      <div key={idx}>
                        <h3 className="text-sm font-semibold text-violet-600 dark:text-violet-400 mb-1">
                          H2: {section.heading}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {section.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-16">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center">
                    <FileText className="h-7 w-7 text-violet-400" />
                  </div>
                  <h3 className="text-sm font-medium">Paste a Transcript to Convert</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Paste your video transcript on the left, then click Convert to transform it into a formatted blog post with headings, clean text, and SEO metadata.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
