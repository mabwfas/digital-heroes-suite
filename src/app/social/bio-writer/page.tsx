"use client";

import { useState, useCallback } from "react";
import { UserCircle, Copy, Check, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface BioResult {
  platform: string;
  bio: string;
  charCount: number;
  maxChars: number;
}

interface SavedBio {
  id: string;
  name: string;
  bios: BioResult[];
  savedAt: string;
}

const PLATFORMS = [
  { id: "instagram", label: "Instagram", maxChars: 150 },
  { id: "twitter", label: "Twitter/X", maxChars: 160 },
  { id: "linkedin", label: "LinkedIn", maxChars: 220 },
  { id: "tiktok", label: "TikTok", maxChars: 80 },
] as const;

const BIO_TEMPLATES = {
  instagram: [
    (n: string, r: string, kw: string[], cta: string) => `${r} | ${kw.slice(0, 2).join(" & ")} ${cta ? `\n${cta}` : ""}`,
    (n: string, r: string, kw: string[], cta: string) => `${n} | ${r}\n${kw.map(k => `#${k.replace(/\s/g, "")}`).join(" ")}${cta ? `\n${cta}` : ""}`,
    (n: string, r: string, kw: string[], cta: string) => `Helping you with ${kw.slice(0, 2).join(" & ")}\n${r} | ${n}${cta ? `\n${cta}` : ""}`,
  ],
  twitter: [
    (n: string, r: string, kw: string[], cta: string) => `${r} sharing insights on ${kw.slice(0, 2).join(", ")}. ${cta}`,
    (n: string, r: string, kw: string[], cta: string) => `${n} | ${r} | Passionate about ${kw.slice(0, 2).join(" & ")}. ${cta}`,
    (n: string, r: string, kw: string[], cta: string) => `${kw.slice(0, 2).join(" + ")} nerd. ${r}. ${cta}`,
  ],
  linkedin: [
    (n: string, r: string, kw: string[], cta: string) => `${r} with expertise in ${kw.join(", ")}. Helping businesses grow through strategic ${kw[0] || "solutions"}. ${cta}`,
    (n: string, r: string, kw: string[], cta: string) => `Experienced ${r} specializing in ${kw.slice(0, 2).join(" and ")}. Let's connect and build something amazing. ${cta}`,
    (n: string, r: string, kw: string[], cta: string) => `${r} | ${kw.join(" | ")} | Turning ideas into results. ${cta}`,
  ],
  tiktok: [
    (n: string, r: string, kw: string[], cta: string) => `${kw[0] || "content"} tips daily ${cta}`,
    (n: string, r: string, kw: string[], cta: string) => `${r} | ${kw.slice(0, 1).join("")} ${cta}`,
    (n: string, r: string, kw: string[], cta: string) => `Your ${kw[0] || "go-to"} bestie ${cta}`,
  ],
};

function generateBios(name: string, role: string, keywords: string[], cta: string): BioResult[] {
  return PLATFORMS.map(p => {
    const templates = BIO_TEMPLATES[p.id];
    const idx = Math.floor(Math.random() * templates.length);
    let bio = templates[idx](name, role, keywords, cta);
    if (bio.length > p.maxChars) bio = bio.slice(0, p.maxChars - 3) + "...";
    return { platform: p.label, bio, charCount: bio.length, maxChars: p.maxChars };
  });
}

export default function BioWriterPage() {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [keywords, setKeywords] = useState("");
  const [cta, setCta] = useState("");
  const [results, setResults] = useState<BioResult[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [saved, setSaved, hydrated] = useLocalStorage<SavedBio[]>("bio-writer-saved", []);

  const handleGenerate = useCallback(() => {
    if (!name.trim() || !role.trim()) return;
    const kws = keywords.split(",").map(k => k.trim()).filter(Boolean);
    setResults(generateBios(name.trim(), role.trim(), kws, cta.trim()));
  }, [name, role, keywords, cta]);

  const handleCopy = useCallback((bio: string, platform: string) => {
    navigator.clipboard.writeText(bio);
    setCopied(platform);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const handleSave = useCallback(() => {
    if (results.length === 0) return;
    setSaved(prev => [{ id: generateId(), name: name.trim(), bios: results, savedAt: new Date().toISOString() }, ...prev.slice(0, 19)]);
  }, [results, name, setSaved]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social Bio Writer"
        description="Generate optimized bios for Instagram, Twitter, LinkedIn, and TikTok."
        icon={UserCircle}
        badge="Free"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-violet-500" />
            Your Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input placeholder="Jane Doe" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Role / Title</Label>
              <Input placeholder="Marketing Consultant" value={role} onChange={e => setRole(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Keywords (comma-separated)</Label>
            <Input placeholder="digital marketing, SEO, content strategy" value={keywords} onChange={e => setKeywords(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Call to Action (optional)</Label>
            <Input placeholder="DM me for collabs!" value={cta} onChange={e => setCta(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
              onClick={handleGenerate}
              disabled={!name.trim() || !role.trim()}
            >
              Generate Bios
            </Button>
            <Button variant="outline" onClick={handleGenerate} disabled={!name.trim() || !role.trim()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleSave}>Save All Bios</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map(r => (
              <Card key={r.platform}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{r.platform}</CardTitle>
                    <Badge variant="secondary" className={`text-[10px] ${r.charCount > r.maxChars ? "text-red-500" : "text-emerald-500"}`}>
                      {r.charCount}/{r.maxChars}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-line mb-3">{r.bio}</p>
                  <Button size="sm" variant="outline" onClick={() => handleCopy(r.bio, r.platform)}>
                    {copied === r.platform ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    {copied === r.platform ? "Copied!" : "Copy"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
