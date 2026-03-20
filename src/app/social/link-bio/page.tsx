"use client";

import { useState, useCallback } from "react";
import { Link2, Plus, Trash2, GripVertical, Eye, Code, Copy, Check, Palette } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface BioLink {
  id: string;
  title: string;
  url: string;
  icon: string;
}

interface LinkBioConfig {
  name: string;
  bio: string;
  links: BioLink[];
  theme: string;
}

const THEMES: Record<string, { bg: string; card: string; text: string; accent: string }> = {
  Dark: { bg: "#0f0f0f", card: "#1a1a2e", text: "#ffffff", accent: "#7c3aed" },
  Light: { bg: "#f8f9fa", card: "#ffffff", text: "#1a1a1a", accent: "#7c3aed" },
  Ocean: { bg: "#0d1b2a", card: "#1b2838", text: "#e0e1dd", accent: "#3a86ff" },
  Sunset: { bg: "#2d1b2e", card: "#3d2b3e", text: "#ffecd2", accent: "#ff6b6b" },
  Forest: { bg: "#1a2e1a", card: "#2a3e2a", text: "#e8f5e9", accent: "#4caf50" },
  Candy: { bg: "#fff0f5", card: "#ffffff", text: "#333333", accent: "#ff69b4" },
};

const ICONS = ["🔗", "🌐", "📱", "📧", "🛒", "📺", "🎵", "📸", "💼", "📝"];

function buildHTML(config: LinkBioConfig): string {
  const theme = THEMES[config.theme] || THEMES.Dark;
  const links = config.links.map(l =>
    `<a href="${l.url}" target="_blank" style="display:block;padding:14px 20px;background:${theme.card};border-radius:12px;color:${theme.text};text-decoration:none;font-weight:500;text-align:center;margin-bottom:12px;border:1px solid ${theme.accent}33;transition:transform 0.2s;">${l.icon} ${l.title}</a>`
  ).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${config.name}</title></head>
<body style="margin:0;padding:40px 20px;background:${theme.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;justify-content:center;">
  <div style="max-width:400px;width:100%;">
    <div style="text-align:center;margin-bottom:30px;">
      <h1 style="color:${theme.text};font-size:24px;margin:0 0 8px 0;">${config.name}</h1>
      <p style="color:${theme.text}88;font-size:14px;margin:0;">${config.bio}</p>
    </div>
    ${links}
  </div>
</body>
</html>`;
}

export default function LinkBioPage() {
  const [config, setConfig, hydrated] = useLocalStorage<LinkBioConfig>("link-bio-config", {
    name: "Your Name", bio: "Creator | Designer | Dreamer", links: [], theme: "Dark",
  });
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);

  const addLink = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      links: [...prev.links, { id: generateId(), title: "New Link", url: "https://", icon: "🔗" }],
    }));
  }, [setConfig]);

  const updateLink = useCallback((id: string, field: keyof BioLink, value: string) => {
    setConfig(prev => ({
      ...prev,
      links: prev.links.map(l => l.id === id ? { ...l, [field]: value } : l),
    }));
  }, [setConfig]);

  const removeLink = useCallback((id: string) => {
    setConfig(prev => ({ ...prev, links: prev.links.filter(l => l.id !== id) }));
  }, [setConfig]);

  const moveLink = useCallback((idx: number, dir: -1 | 1) => {
    setConfig(prev => {
      const links = [...prev.links];
      const target = idx + dir;
      if (target < 0 || target >= links.length) return prev;
      [links[idx], links[target]] = [links[target], links[idx]];
      return { ...prev, links };
    });
  }, [setConfig]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(buildHTML(config));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [config]);

  const theme = THEMES[config.theme] || THEMES.Dark;

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Link in Bio Builder"
        description="Build a beautiful link page with custom themes. Export as HTML."
        icon={Link2}
        badge="Free"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4 text-violet-500" /> Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Display Name</Label>
                <Input value={config.name} onChange={e => setConfig(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Bio</Label>
                <Input value={config.bio} onChange={e => setConfig(prev => ({ ...prev, bio: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Theme</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(THEMES).map(t => (
                    <button key={t} onClick={() => setConfig(prev => ({ ...prev, theme: t }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${config.theme === t ? "border-violet-500 bg-violet-500/10 text-violet-600" : "border-border hover:border-violet-300"}`}
                    >
                      <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: THEMES[t].accent }} />
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Links ({config.links.length})</CardTitle>
                <Button variant="outline" size="sm" onClick={addLink}><Plus className="h-3.5 w-3.5" /> Add</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {config.links.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No links yet. Add your first link above.</p>
              )}
              {config.links.map((link, i) => (
                <div key={link.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveLink(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><GripVertical className="h-3 w-3" /></button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {ICONS.map(ic => (
                        <button key={ic} onClick={() => updateLink(link.id, "icon", ic)}
                          className={`text-sm p-0.5 rounded ${link.icon === ic ? "bg-violet-500/20" : ""}`}
                        >{ic}</button>
                      ))}
                    </div>
                    <Button variant="ghost" size="icon-sm" className="ml-auto" onClick={() => removeLink(link.id)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                  </div>
                  <Input placeholder="Link title" value={link.title} onChange={e => updateLink(link.id, "title", e.target.value)} className="text-sm" />
                  <Input placeholder="https://..." value={link.url} onChange={e => updateLink(link.id, "url", e.target.value)} className="text-sm font-mono" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border overflow-hidden">
              <button onClick={() => setViewMode("preview")}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${viewMode === "preview" ? "bg-violet-600 text-white" : "hover:bg-muted"}`}
              ><Eye className="h-3.5 w-3.5" /> Preview</button>
              <button onClick={() => setViewMode("code")}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${viewMode === "code" ? "bg-violet-600 text-white" : "hover:bg-muted"}`}
              ><Code className="h-3.5 w-3.5" /> HTML</button>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy} className="ml-auto">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy HTML"}
            </Button>
          </div>

          <Card className="overflow-hidden">
            {viewMode === "preview" ? (
              <div className="p-6 min-h-[500px] flex justify-center" style={{ backgroundColor: theme.bg }}>
                <div className="w-full max-w-[360px]">
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-bold" style={{ color: theme.text }}>{config.name}</h2>
                    <p className="text-sm mt-1" style={{ color: `${theme.text}88` }}>{config.bio}</p>
                  </div>
                  {config.links.map(link => (
                    <div key={link.id} className="mb-3 rounded-xl p-3.5 text-center font-medium text-sm cursor-pointer transition-transform hover:scale-[1.02]"
                      style={{ backgroundColor: theme.card, color: theme.text, border: `1px solid ${theme.accent}33` }}
                    >
                      {link.icon} {link.title}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <pre className="p-4 text-xs font-mono overflow-auto max-h-[600px] bg-zinc-950 text-zinc-100 leading-relaxed">
                {buildHTML(config)}
              </pre>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
