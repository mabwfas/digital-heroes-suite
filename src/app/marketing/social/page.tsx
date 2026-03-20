"use client";

import { useState } from "react";
import { Share2, Copy, Check, Trash2, Hash, Calendar, Sparkles, Eye } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type Platform = "instagram" | "facebook" | "twitter" | "linkedin" | "tiktok";

interface SavedPost {
  id: string;
  platform: Platform;
  content: string;
  hashtags: string;
  scheduledDate?: string;
  topic: string;
  savedAt: string;
}

const PLATFORMS: {
  value: Platform;
  label: string;
  limit: number;
  color: string;
  bg: string;
  icon: string;
}[] = [
  { value: "instagram", label: "Instagram", limit: 2200, color: "text-pink-600", bg: "bg-gradient-to-br from-pink-500 to-orange-400", icon: "📸" },
  { value: "facebook", label: "Facebook", limit: 63206, color: "text-blue-600", bg: "bg-blue-600", icon: "👍" },
  { value: "twitter", label: "Twitter / X", limit: 280, color: "text-sky-600", bg: "bg-black dark:bg-zinc-800", icon: "𝕏" },
  { value: "linkedin", label: "LinkedIn", limit: 3000, color: "text-[#0077b5]", bg: "bg-[#0077b5]", icon: "💼" },
  { value: "tiktok", label: "TikTok", limit: 2200, color: "text-foreground", bg: "bg-black", icon: "🎵" },
];

const HASHTAG_SUGGESTIONS: Record<string, string[]> = {
  fashion: ["#fashion", "#style", "#ootd", "#trending", "#outfitoftheday", "#fashionista"],
  beauty: ["#beauty", "#skincare", "#makeup", "#glam", "#selfcare", "#beautytips"],
  food: ["#food", "#foodie", "#yummy", "#instafood", "#foodphotography", "#delicious"],
  fitness: ["#fitness", "#workout", "#gym", "#health", "#motivation", "#fit"],
  travel: ["#travel", "#wanderlust", "#adventure", "#explore", "#travelphotography", "#vacation"],
  business: ["#business", "#entrepreneur", "#marketing", "#success", "#startup", "#productivity"],
  ecommerce: ["#shopnow", "#sale", "#newproduct", "#shopify", "#ecommerce", "#onlineshopping"],
};

function generateSamplePost(topic: string, message: string, platform: Platform): string {
  const name = topic || "our latest product";
  const msg = message || "something amazing";

  const posts: Record<Platform, string> = {
    instagram: `✨ Introducing ${name}!\n\n${msg}. We've poured our heart into creating something truly special — and we can't wait for you to experience it.\n\nSwipe to see all the details 👉\n\nDrop a ❤️ if you're as excited as we are!\n\n.\n.\n.\n#newlaunch #shopnow #musthave #trending`,
    facebook: `🎉 BIG NEWS — ${name} is here!\n\n${msg}. Whether you've been waiting for this or you're discovering us for the first time, today is a great day to treat yourself.\n\n✅ Premium quality\n✅ Fast shipping\n✅ 30-day returns\n\nClick the link below to shop now, and share this post with a friend who needs to see it! 👇`,
    twitter: `Just dropped: ${name} 🔥\n\n${msg}.\n\nGrab yours before they're gone → [link]`,
    linkedin: `Excited to share that ${name} is now available!\n\n${msg}. This launch represents months of hard work, research, and iteration — and we're incredibly proud of what we've built.\n\nIf you're looking for ${topic || "a solution that delivers results"}, I'd love for you to check it out. Link in comments.\n\n#ProductLaunch #Innovation #Entrepreneurship`,
    tiktok: `POV: You just discovered ${name} 😱\n\n${msg} and it's about to change everything. No really.\n\nSave this post because you'll want to come back to it. Link in bio 👆\n\n#fyp #foryou #viral #musthave #trending2024`,
  };

  return posts[platform];
}

function PlatformPreview({ platform, content, hashtags }: { platform: Platform; content: string; hashtags: string }) {
  const p = PLATFORMS.find(pl => pl.value === platform)!;
  const fullText = content + (hashtags ? "\n\n" + hashtags : "");
  const pct = (fullText.length / p.limit) * 100;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Platform bar */}
      <div className={`${p.bg} px-4 py-2 flex items-center gap-2`}>
        <span className="text-lg">{p.icon}</span>
        <span className="text-white text-sm font-semibold">{p.label}</span>
        <span className="ml-auto text-white/70 text-xs">{fullText.length} / {p.limit.toLocaleString()}</span>
      </div>

      {/* Post card */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className={`h-8 w-8 rounded-full ${p.bg} flex items-center justify-center text-white text-xs font-bold`}>
            {p.icon}
          </div>
          <div>
            <p className="text-xs font-semibold">Your Brand</p>
            <p className="text-[10px] text-muted-foreground">Just now</p>
          </div>
        </div>

        {content ? (
          <p className="text-sm whitespace-pre-line leading-relaxed">
            {content}
            {hashtags && (
              <span className="block mt-2 text-blue-500 dark:text-blue-400 text-xs">{hashtags}</span>
            )}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Your post preview will appear here…</p>
        )}

        {/* Character bar */}
        <div className="mt-3">
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          {fullText.length > p.limit && (
            <p className="text-xs text-red-500 mt-1">Exceeds {p.label} limit by {fullText.length - p.limit} characters</p>
          )}
        </div>

        {/* Fake engagement */}
        {content && (
          <div className="flex gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
            <span>❤️ Like</span>
            <span>💬 Comment</span>
            <span>↗️ Share</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SocialPostPage() {
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [generated, setGenerated] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [copied, setCopied] = useState(false);
  const [hashtagCategory, setHashtagCategory] = useState<keyof typeof HASHTAG_SUGGESTIONS>("ecommerce");
  const [saved, setSaved] = useLocalStorage<SavedPost[]>("social-posts", []);

  const currentPlatform = PLATFORMS.find(p => p.value === platform)!;
  const fullText = generated + (hashtags ? "\n\n" + hashtags : "");
  const pct = (fullText.length / currentPlatform.limit) * 100;

  function handleGenerate() {
    setGenerated(generateSamplePost(topic, message, platform));
  }

  function handleCopy() {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSave() {
    if (!generated) return;
    const item: SavedPost = {
      id: generateId(),
      platform,
      content: generated,
      hashtags,
      scheduledDate: scheduleDate || undefined,
      topic,
      savedAt: new Date().toLocaleDateString(),
    };
    setSaved(prev => [item, ...prev]);
  }

  function addHashtags(tags: string[]) {
    const current = hashtags ? hashtags.split(" ").filter(Boolean) : [];
    const merged = Array.from(new Set([...current, ...tags]));
    setHashtags(merged.join(" "));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social Media Post Generator"
        description="Create platform-optimized posts with hashtags and scheduling."
        icon={Share2}
        badge="AI"
        replaces="Buffer ($6/mo)"
      />

      <Tabs defaultValue="create">
        <TabsList>
          <TabsTrigger value="create">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Create Post
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="saved">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Saved
            {saved.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">{saved.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Inputs */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Platform</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {PLATFORMS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => setPlatform(p.value)}
                        className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-all ${platform === p.value ? "border-violet-500 bg-violet-500/10" : "border-border hover:border-violet-300"}`}
                      >
                        <span className="text-base">{p.icon}</span>
                        <span className="font-medium">{p.label}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{p.limit >= 1000 ? `${(p.limit/1000).toFixed(0)}k` : p.limit} chars</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    <Hash className="h-4 w-4 inline mr-1.5 text-violet-500" />
                    Hashtag Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {Object.keys(HASHTAG_SUGGESTIONS).map(cat => (
                      <Badge
                        key={cat}
                        variant={hashtagCategory === cat ? "default" : "secondary"}
                        className={`cursor-pointer text-xs capitalize ${hashtagCategory === cat ? "bg-violet-600 hover:bg-violet-700" : ""}`}
                        onClick={() => setHashtagCategory(cat as keyof typeof HASHTAG_SUGGESTIONS)}
                      >
                        {cat}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {HASHTAG_SUGGESTIONS[hashtagCategory].map(tag => (
                      <button
                        key={tag}
                        onClick={() => addHashtags([tag])}
                        className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => addHashtags(HASHTAG_SUGGESTIONS[hashtagCategory])}
                  >
                    Add All {hashtagCategory} tags
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Center */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Post Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Topic / Product</Label>
                      <Input placeholder="e.g. Summer Collection Drop" value={topic} onChange={e => setTopic(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Key Message</Label>
                      <Input placeholder="e.g. 30% off this weekend only" value={message} onChange={e => setMessage(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
                      onClick={handleGenerate}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Post
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label>Post Text</Label>
                      <span className={`text-xs font-mono ${pct > 100 ? "text-red-500 font-semibold" : pct > 80 ? "text-amber-500" : "text-muted-foreground"}`}>
                        {fullText.length} / {currentPlatform.limit.toLocaleString()}
                      </span>
                    </div>
                    <Textarea
                      rows={8}
                      placeholder="Your post content will appear here, or write your own…"
                      value={generated}
                      onChange={e => setGenerated(e.target.value)}
                    />
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${pct > 100 ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Hashtags</Label>
                    <Input
                      placeholder="#hashtag1 #hashtag2 #hashtag3"
                      value={hashtags}
                      onChange={e => setHashtags(e.target.value)}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-1.5">
                    <Label>Schedule Date <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input
                      type="datetime-local"
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy} disabled={!generated} className="gap-1.5">
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSave} disabled={!generated} className="gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Save to Calendar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLATFORMS.map(p => (
              <PlatformPreview
                key={p.value}
                platform={p.value}
                content={platform === p.value ? generated : ""}
                hashtags={platform === p.value ? hashtags : ""}
              />
            ))}
          </div>
          {!generated && (
            <p className="text-center text-sm text-muted-foreground mt-8">Generate a post first to see the preview across all platforms.</p>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-4">
          {saved.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center">
                  <Calendar className="h-7 w-7 text-violet-400" />
                </div>
                <div className="text-center">
                  <p className="font-medium">No saved posts</p>
                  <p className="text-xs text-muted-foreground mt-1">Generate and save posts to build your content calendar.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {saved.map(post => {
                const p = PLATFORMS.find(pl => pl.value === post.platform)!;
                return (
                  <Card key={post.id} className="group">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{p.icon}</span>
                          <div>
                            <p className="font-medium text-sm">{post.topic || "Post"}</p>
                            <p className="text-[10px] text-muted-foreground">{p.label} · Saved {post.savedAt}</p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setSaved(prev => prev.filter(s => s.id !== post.id))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {post.scheduledDate && (
                        <Badge variant="secondary" className="w-fit text-[10px] mt-1">
                          📅 {new Date(post.scheduledDate).toLocaleString()}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-line">{post.content}</p>
                      {post.hashtags && (
                        <p className="text-xs text-blue-500 dark:text-blue-400 mt-1 line-clamp-1">{post.hashtags}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
