"use client";

import { useState, useCallback } from "react";
import {
  FileText,
  Copy,
  Save,
  Trash2,
  Tag,
  RefreshCw,
  BookOpen,
  Plus,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface Outline {
  id: string;
  topic: string;
  audience: string;
  tone: string;
  wordCount: number;
  titles: string[];
  hook: string;
  sections: { heading: string; points: string[] }[];
  conclusion: string;
  cta: string;
  tags: string[];
  createdAt: string;
}

const HOOKS = [
  "Did you know that most people overlook",
  "In a world where everyone talks about",
  "If you have ever struggled with",
  "The biggest mistake professionals make regarding",
  "Imagine being able to master",
  "Whether you are a beginner or an expert,",
  "Here is a question that might surprise you about",
  "The secret to understanding",
  "Stop wasting time on the wrong approach to",
  "What separates great results from mediocre ones when it comes to",
];

const SECTION_TEMPLATES: Record<
  string,
  { heading: string; points: string[] }[]
> = {
  professional: [
    {
      heading: "Understanding the Fundamentals of [TOPIC]",
      points: [
        "Define key terminology and concepts",
        "Historical context and evolution",
        "Why this matters in today's landscape",
      ],
    },
    {
      heading: "Current Industry Trends and Data",
      points: [
        "Recent statistics and research findings",
        "Market shifts and emerging patterns",
        "Expert opinions and forecasts",
      ],
    },
    {
      heading: "Step-by-Step Implementation Strategy",
      points: [
        "Planning and preparation phase",
        "Core execution framework",
        "Measuring and tracking progress",
      ],
    },
    {
      heading: "Common Challenges and How to Overcome Them",
      points: [
        "Identifying potential roadblocks early",
        "Proven solutions and workarounds",
        "When to pivot your approach",
      ],
    },
    {
      heading: "Advanced Techniques for [AUDIENCE]",
      points: [
        "Optimization strategies",
        "Scaling best practices",
        "Leveraging tools and automation",
      ],
    },
    {
      heading: "Case Studies and Real-World Examples",
      points: [
        "Success story analysis",
        "Lessons learned from failures",
        "Adaptable templates and frameworks",
      ],
    },
    {
      heading: "Future Outlook and Recommendations",
      points: [
        "Predictions for the next 12 months",
        "Actionable next steps",
        "Resources for continued learning",
      ],
    },
  ],
  casual: [
    {
      heading: "So, What Exactly Is [TOPIC]?",
      points: [
        "The simple explanation (no jargon!)",
        "Why you should care about this",
        "A quick reality check",
      ],
    },
    {
      heading: "Why Everyone Is Talking About This",
      points: [
        "The buzz explained",
        "What is actually changing",
        "Who benefits the most",
      ],
    },
    {
      heading: "Getting Started (The Easy Way)",
      points: [
        "Baby steps that actually work",
        "Tools you probably already have",
        "The 5-minute quick start",
      ],
    },
    {
      heading: "The Stuff Nobody Tells You",
      points: [
        "Hidden gotchas to watch for",
        "Myths vs reality",
        "Honest pros and cons",
      ],
    },
    {
      heading: "Level Up: Tips From the Pros",
      points: [
        "Shortcuts that save hours",
        "Creative hacks and workarounds",
        "Community favorites and recommendations",
      ],
    },
    {
      heading: "Real People, Real Results",
      points: [
        "Inspiring stories from the community",
        "Before and after comparisons",
        "What surprised people the most",
      ],
    },
  ],
  educational: [
    {
      heading: "Introduction to [TOPIC]: Core Concepts",
      points: [
        "Foundational definitions",
        "Key principles and theories",
        "Prerequisite knowledge",
      ],
    },
    {
      heading: "The Science and Research Behind It",
      points: [
        "Peer-reviewed findings",
        "Data-driven insights",
        "Methodology overview",
      ],
    },
    {
      heading: "Detailed Analysis and Breakdown",
      points: [
        "Component-by-component examination",
        "Comparative analysis",
        "Critical evaluation",
      ],
    },
    {
      heading: "Practical Applications and Exercises",
      points: [
        "Hands-on activities for [AUDIENCE]",
        "Guided practice examples",
        "Self-assessment checkpoints",
      ],
    },
    {
      heading: "Common Misconceptions Clarified",
      points: [
        "Debunking popular myths",
        "Evidence-based corrections",
        "Why these mistakes persist",
      ],
    },
    {
      heading: "Further Study and Resources",
      points: [
        "Recommended reading list",
        "Online courses and tools",
        "Academic references",
      ],
    },
    {
      heading: "Summary and Key Takeaways",
      points: [
        "Essential points to remember",
        "Quick reference cheat sheet",
        "Knowledge check questions",
      ],
    },
  ],
  persuasive: [
    {
      heading: "The Problem You Cannot Ignore",
      points: [
        "Eye-opening statistics",
        "The real cost of inaction",
        "Who is most affected",
      ],
    },
    {
      heading: "Why Traditional Approaches Fall Short",
      points: [
        "Common solutions and their limitations",
        "What experts have been getting wrong",
        "The missing piece of the puzzle",
      ],
    },
    {
      heading: "A Better Way Forward with [TOPIC]",
      points: [
        "The core value proposition",
        "How it addresses root causes",
        "Unique advantages over alternatives",
      ],
    },
    {
      heading: "Proof That This Actually Works",
      points: [
        "Testimonials and success metrics",
        "Third-party validation",
        "Before-and-after evidence",
      ],
    },
    {
      heading: "How to Get Started Today",
      points: [
        "Step-by-step action plan",
        "Quick wins to build momentum",
        "Common objections addressed",
      ],
    },
    {
      heading: "What You Stand to Gain",
      points: [
        "Short-term and long-term benefits",
        "ROI projections for [AUDIENCE]",
        "The compound effect over time",
      ],
    },
  ],
};

const TITLE_PATTERNS = [
  "The Ultimate Guide to [TOPIC] for [AUDIENCE]",
  "[NUMBER] Proven Strategies for [TOPIC] That Actually Work",
  "How to Master [TOPIC]: A Complete Guide for [AUDIENCE]",
  "[TOPIC] 101: Everything [AUDIENCE] Need to Know",
  "Why [TOPIC] Matters More Than Ever (And How to Get It Right)",
  "The [AUDIENCE]'s Playbook for [TOPIC]",
  "Unlocking the Power of [TOPIC]: A Step-by-Step Blueprint",
  "[TOPIC] Explained: [NUMBER] Key Insights for [AUDIENCE]",
  "From Zero to Hero: Your Complete [TOPIC] Journey",
  "The Truth About [TOPIC] That [AUDIENCE] Need to Hear",
];

const CONCLUSIONS: Record<string, string[]> = {
  professional: [
    "Mastering [TOPIC] requires deliberate practice and strategic thinking, but the ROI for [AUDIENCE] is substantial.",
    "By implementing these frameworks, [AUDIENCE] can transform their approach to [TOPIC] and achieve measurable outcomes.",
  ],
  casual: [
    "At the end of the day, [TOPIC] doesn't have to be complicated. Start small, stay consistent, and you'll be amazed at the progress.",
    "There you have it! Everything you need to dive into [TOPIC] and actually enjoy the process.",
  ],
  educational: [
    "Understanding [TOPIC] at this depth equips [AUDIENCE] with the knowledge foundation needed for advanced exploration and application.",
    "This comprehensive overview of [TOPIC] provides the building blocks for further research and practical implementation.",
  ],
  persuasive: [
    "The evidence is clear: [TOPIC] is not just an option — it is a necessity for [AUDIENCE] who want to stay ahead of the curve.",
    "Every day you delay taking action on [TOPIC] is a day of lost potential. The best time to start was yesterday; the next best time is now.",
  ],
};

const CTAS: Record<string, string[]> = {
  professional: [
    "Download our free [TOPIC] assessment template to benchmark your current performance.",
    "Schedule a consultation to see how these strategies apply to your specific situation.",
  ],
  casual: [
    "Drop a comment below and let us know which tip you are trying first!",
    "Share this with a friend who needs to hear this, and join our community for more updates.",
  ],
  educational: [
    "Take the quiz at the end of this guide to test your understanding of [TOPIC].",
    "Enroll in our comprehensive course to deepen your knowledge and earn a certificate.",
  ],
  persuasive: [
    "Claim your free trial today and experience the difference for yourself — no credit card required.",
    "Join the thousands of [AUDIENCE] who have already transformed their results. Start now.",
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateOutline(
  topic: string,
  audience: string,
  tone: string,
  wordCount: number
): Omit<Outline, "id" | "tags" | "createdAt"> {
  const templates = SECTION_TEMPLATES[tone] || SECTION_TEMPLATES.professional;
  const numSections = wordCount < 1000 ? 5 : wordCount < 2000 ? 6 : 7;
  const shuffled = [...templates].sort(() => Math.random() - 0.5);
  const sections = shuffled.slice(0, numSections).map((s) => ({
    heading: s.heading
      .replace("[TOPIC]", topic)
      .replace("[AUDIENCE]", audience),
    points: s.points.map((p) =>
      p.replace("[TOPIC]", topic).replace("[AUDIENCE]", audience)
    ),
  }));

  const num = Math.floor(Math.random() * 6) + 5;
  const titlePool = [...TITLE_PATTERNS].sort(() => Math.random() - 0.5);
  const titles = titlePool.slice(0, 3).map((t) =>
    t
      .replace(/\[TOPIC\]/g, topic)
      .replace(/\[AUDIENCE\]/g, audience)
      .replace(/\[NUMBER\]/g, String(num))
  );

  const hookBase = pick(HOOKS);
  const hook = `${hookBase} ${topic.toLowerCase()}? This guide is designed specifically for ${audience.toLowerCase()} who want to take their knowledge to the next level.`;

  const conclusionPool = CONCLUSIONS[tone] || CONCLUSIONS.professional;
  const conclusion = pick(conclusionPool)
    .replace(/\[TOPIC\]/g, topic)
    .replace(/\[AUDIENCE\]/g, audience);

  const ctaPool = CTAS[tone] || CTAS.professional;
  const cta = pick(ctaPool)
    .replace(/\[TOPIC\]/g, topic)
    .replace(/\[AUDIENCE\]/g, audience);

  return { topic, audience, tone, wordCount, titles, hook, sections, conclusion, cta };
}

function outlineToMarkdown(o: Outline): string {
  let md = `# ${o.titles[0]}\n\n`;
  md += `**Topic:** ${o.topic}  \n`;
  md += `**Target Audience:** ${o.audience}  \n`;
  md += `**Tone:** ${o.tone}  \n`;
  md += `**Target Word Count:** ${o.wordCount.toLocaleString()}\n\n`;
  md += `## Title Options\n`;
  o.titles.forEach((t, i) => {
    md += `${i + 1}. ${t}\n`;
  });
  md += `\n## Introduction\n${o.hook}\n\n`;
  o.sections.forEach((s, i) => {
    md += `## ${i + 1}. ${s.heading}\n`;
    s.points.forEach((p) => {
      md += `- ${p}\n`;
    });
    md += "\n";
  });
  md += `## Conclusion\n${o.conclusion}\n\n`;
  md += `## Call to Action\n${o.cta}\n`;
  if (o.tags.length > 0) {
    md += `\n---\n**Tags:** ${o.tags.join(", ")}\n`;
  }
  return md;
}

export default function BlogOutlinePage() {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("professional");
  const [wordCount, setWordCount] = useState(1500);
  const [currentOutline, setCurrentOutline] = useState<Outline | null>(null);
  const [savedOutlines, setSavedOutlines, hydrated] = useLocalStorage<Outline[]>(
    "blog-outlines",
    []
  );
  const [tagInput, setTagInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [filterTag, setFilterTag] = useState("");

  const handleGenerate = useCallback(() => {
    if (!topic.trim() || !audience.trim()) return;
    const raw = generateOutline(topic.trim(), audience.trim(), tone, wordCount);
    setCurrentOutline({
      ...raw,
      id: generateId(),
      tags: [],
      createdAt: new Date().toISOString(),
    });
    setCopied(false);
  }, [topic, audience, tone, wordCount]);

  const handleCopy = useCallback(() => {
    if (!currentOutline) return;
    navigator.clipboard.writeText(outlineToMarkdown(currentOutline));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentOutline]);

  const handleSave = useCallback(() => {
    if (!currentOutline) return;
    setSavedOutlines((prev) => [currentOutline, ...prev]);
  }, [currentOutline, setSavedOutlines]);

  const handleDelete = useCallback(
    (id: string) => {
      setSavedOutlines((prev) => prev.filter((o) => o.id !== id));
    },
    [setSavedOutlines]
  );

  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || !currentOutline || currentOutline.tags.includes(tag)) return;
    setCurrentOutline({ ...currentOutline, tags: [...currentOutline.tags, tag] });
    setTagInput("");
  }, [tagInput, currentOutline]);

  const handleRemoveTag = useCallback(
    (tag: string) => {
      if (!currentOutline) return;
      setCurrentOutline({
        ...currentOutline,
        tags: currentOutline.tags.filter((t) => t !== tag),
      });
    },
    [currentOutline]
  );

  const handleLoadOutline = useCallback((o: Outline) => {
    setCurrentOutline(o);
    setTopic(o.topic);
    setAudience(o.audience);
    setTone(o.tone);
    setWordCount(o.wordCount);
    setShowLibrary(false);
  }, []);

  const allTags = Array.from(
    new Set(savedOutlines.flatMap((o) => o.tags))
  ).sort();

  const filteredOutlines = filterTag
    ? savedOutlines.filter((o) => o.tags.includes(filterTag))
    : savedOutlines;

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog Post Outline Generator"
        description="Generate structured blog outlines with title suggestions, sections, and CTAs."
        icon={FileText}
        badge="Free"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLibrary(!showLibrary)}
          >
            <BookOpen className="h-4 w-4" />
            Library ({savedOutlines.length})
          </Button>
        }
      />

      {showLibrary ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Saved Outlines</CardTitle>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowLibrary(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge
                  variant="secondary"
                  className={`cursor-pointer text-xs ${!filterTag ? "bg-violet-500/20 text-violet-600" : ""}`}
                  onClick={() => setFilterTag("")}
                >
                  All
                </Badge>
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className={`cursor-pointer text-xs ${filterTag === tag ? "bg-violet-500/20 text-violet-600" : ""}`}
                    onClick={() => setFilterTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {filteredOutlines.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {savedOutlines.length === 0
                    ? "No saved outlines yet. Generate one and save it to your library."
                    : "No outlines match the selected tag."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOutlines.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {o.titles[0]}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {o.topic} &middot; {o.tone} &middot;{" "}
                          {new Date(o.createdAt).toLocaleDateString()}
                        </p>
                        {o.tags.length > 0 && (
                          <div className="flex gap-1 mt-1.5">
                            {o.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleLoadOutline(o)}
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(o.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-violet-500" />
                  Outline Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="topic">
                    Topic <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Content Marketing Strategies"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="audience">
                    Target Audience <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="audience"
                    placeholder="e.g., Small Business Owners"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Tone</Label>
                  <Select value={tone} onValueChange={(v) => { if (v) setTone(v); }}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="persuasive">Persuasive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="wordcount">
                    Word Count Target:{" "}
                    <span className="font-mono text-violet-600">
                      {wordCount.toLocaleString()}
                    </span>
                  </Label>
                  <input
                    id="wordcount"
                    type="range"
                    min={500}
                    max={5000}
                    step={100}
                    value={wordCount}
                    onChange={(e) => setWordCount(Number(e.target.value))}
                    className="w-full accent-violet-600"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>500</span>
                    <span>5,000</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
                  onClick={handleGenerate}
                  disabled={!topic.trim() || !audience.trim()}
                >
                  <RefreshCw className="h-4 w-4" />
                  Generate Outline
                </Button>
              </CardContent>
            </Card>

            {currentOutline && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="h-4 w-4 text-violet-500" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon" onClick={handleAddTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {currentOutline.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {currentOutline.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs gap-1 pr-1"
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-0.5 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      className="flex-1"
                      size="sm"
                      onClick={handleCopy}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied ? "Copied!" : "Copy Markdown"}
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
                      size="sm"
                      onClick={handleSave}
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Outline Preview */}
          <div className="lg:col-span-2">
            {currentOutline ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Generated Outline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Title Suggestions */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">
                      Title Suggestions
                    </h3>
                    <div className="space-y-2">
                      {currentOutline.titles.map((t, i) => (
                        <div
                          key={i}
                          className="rounded-lg border p-2.5 text-sm bg-gradient-to-r from-violet-500/5 to-pink-500/5"
                        >
                          <span className="text-muted-foreground mr-2 font-mono text-xs">
                            {i + 1}.
                          </span>
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Introduction Hook */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">
                      Introduction Hook
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3">
                      {currentOutline.hook}
                    </p>
                  </div>

                  <Separator />

                  {/* Sections */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">
                      Main Sections ({currentOutline.sections.length})
                    </h3>
                    <div className="space-y-3">
                      {currentOutline.sections.map((s, i) => (
                        <div key={i} className="rounded-lg border p-3">
                          <h4 className="text-sm font-medium mb-2">
                            <span className="text-violet-500 font-mono mr-1.5">
                              {i + 1}.
                            </span>
                            {s.heading}
                          </h4>
                          <ul className="space-y-1">
                            {s.points.map((p, j) => (
                              <li
                                key={j}
                                className="text-xs text-muted-foreground flex gap-2"
                              >
                                <span className="text-violet-400 shrink-0">
                                  &bull;
                                </span>
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Conclusion */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Conclusion</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 rounded-lg p-3">
                      {currentOutline.conclusion}
                    </p>
                  </div>

                  <Separator />

                  {/* CTA */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">
                      Call to Action
                    </h3>
                    <p className="text-sm font-medium leading-relaxed bg-gradient-to-r from-violet-500/10 to-pink-500/10 rounded-lg p-3">
                      {currentOutline.cta}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex gap-2 flex-wrap pt-2">
                    <Badge variant="secondary" className="text-xs">
                      {currentOutline.tone}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      ~{currentOutline.wordCount.toLocaleString()} words
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {currentOutline.sections.length} sections
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-16">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center">
                      <FileText className="h-7 w-7 text-violet-400" />
                    </div>
                    <h3 className="text-sm font-medium">
                      No Outline Generated Yet
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Enter your blog topic and target audience, then click
                      Generate to create a structured outline with title
                      suggestions, sections, and a call to action.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
