"use client";

import { useState, useMemo } from "react";
import { Send, Copy, Check, Search, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface DMTemplate {
  id: string;
  name: string;
  platform: string;
  purpose: string;
  body: string;
  variables: string[];
  isBuiltIn: boolean;
}

const BUILT_IN: Omit<DMTemplate, "id">[] = [
  { name: "Instagram Collab Request", platform: "Instagram", purpose: "Collaboration", body: "Hey {name}! I've been following your content and love what you're doing with {their_niche}. I'm {your_name}, a {your_role}.\n\nI think we could create something amazing together - specifically {collab_idea}.\n\nWould you be open to a quick chat about it?", variables: ["name","their_niche","your_name","your_role","collab_idea"], isBuiltIn: true },
  { name: "Instagram Partnership", platform: "Instagram", purpose: "Partnership", body: "Hi {name}! I'm {your_name} from {company}. We specialize in {service} and I noticed {compliment}.\n\nI'd love to explore a partnership where {partnership_idea}. We've helped brands like {social_proof} achieve {result}.\n\nInterested in learning more?", variables: ["name","your_name","company","service","compliment","partnership_idea","social_proof","result"], isBuiltIn: true },
  { name: "LinkedIn Connection Request", platform: "LinkedIn", purpose: "Networking", body: "Hi {name}, I came across your profile and was impressed by your work in {field}. I'm {your_name}, specializing in {your_specialty}.\n\nI'd love to connect and exchange ideas about {topic}. I recently {recent_achievement} and think we could learn from each other.", variables: ["name","field","your_name","your_specialty","topic","recent_achievement"], isBuiltIn: true },
  { name: "LinkedIn Service Pitch", platform: "LinkedIn", purpose: "Sales", body: "Hi {name}, congratulations on {their_achievement}! I'm {your_name} and I help {target_audience} with {service}.\n\nI noticed {observation} and thought of a way I could help - {value_prop}.\n\nWould you be open to a 15-minute call this week?", variables: ["name","their_achievement","your_name","target_audience","service","observation","value_prop"], isBuiltIn: true },
  { name: "LinkedIn Hiring Outreach", platform: "LinkedIn", purpose: "Hiring", body: "Hi {name}, I'm {your_name}, {your_title} at {company}. We're building something exciting and looking for a {role}.\n\nYour experience with {their_skill} caught my eye. The role involves {role_details} with {benefits}.\n\nWould you be interested in learning more?", variables: ["name","your_name","your_title","company","role","their_skill","role_details","benefits"], isBuiltIn: true },
  { name: "Twitter/X Engagement DM", platform: "Twitter/X", purpose: "Networking", body: "Hey {name}! Loved your thread on {topic}. The point about {specific_point} really resonated.\n\nI'm {your_name} and I work on similar things. Would love to chat about {discussion_topic} sometime.", variables: ["name","topic","specific_point","your_name","discussion_topic"], isBuiltIn: true },
  { name: "Twitter/X Testimonial Request", platform: "Twitter/X", purpose: "Testimonial", body: "Hey {name}! Hope you're enjoying {product_or_service}. Would you be willing to share a quick testimonial about your experience?\n\nEven a simple tweet like \"{suggested_text}\" would mean the world. Happy to {offer} in return!", variables: ["name","product_or_service","suggested_text","offer"], isBuiltIn: true },
  { name: "Instagram Testimonial Ask", platform: "Instagram", purpose: "Testimonial", body: "Hey {name}! I hope the {project_type} I delivered is working well for you!\n\nWould you mind sharing a quick review of your experience? It would really help other potential clients.\n\nI can make it easy - just reply with a few sentences and I'll format it!", variables: ["name","project_type"], isBuiltIn: true },
  { name: "Cross-Platform Follow-Up", platform: "Any", purpose: "Follow-up", body: "Hey {name}! We connected on {original_platform} about {topic}. Just following up to see if you had a chance to think about {proposal}.\n\nNo pressure at all - just wanted to stay on your radar. Let me know if you have any questions!", variables: ["name","original_platform","topic","proposal"], isBuiltIn: true },
  { name: "Community Invite", platform: "Any", purpose: "Community", body: "Hey {name}! I'm building a community of {community_description} and I think you'd be a great fit.\n\nWe {community_benefits} and it's completely {pricing}.\n\nHere's the link: {link}\n\nWould love to have you!", variables: ["name","community_description","community_benefits","pricing","link"], isBuiltIn: true },
];

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "bg-pink-500/10 text-pink-600 border-0",
  LinkedIn: "bg-blue-500/10 text-blue-600 border-0",
  "Twitter/X": "bg-slate-500/10 text-slate-600 border-0",
  Any: "bg-violet-500/10 text-violet-600 border-0",
};

export default function SocialDMPage() {
  const [customTemplates, setCustomTemplates] = useLocalStorage<DMTemplate[]>("social-dm-custom", []);
  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", platform: "Instagram", purpose: "", body: "" });
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const allTemplates = useMemo(() => {
    const builtIn = BUILT_IN.map((t) => ({ ...t, id: `builtin-${t.name.toLowerCase().replace(/\s+/g, "-")}` }));
    return [...builtIn, ...customTemplates];
  }, [customTemplates]);

  const filtered = useMemo(() => {
    return allTemplates.filter((t) => {
      const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.purpose.toLowerCase().includes(search.toLowerCase());
      const matchesPlatform = filterPlatform === "all" || t.platform === filterPlatform;
      return matchesSearch && matchesPlatform;
    });
  }, [allTemplates, search, filterPlatform]);

  const activeTemplate = allTemplates.find((t) => t.id === activeId);

  function extractVars(body: string): string[] {
    const matches = body.match(/\{(\w+)\}/g) || [];
    return [...new Set(matches.map((m) => m.slice(1, -1)))];
  }

  function resolve(text: string): string {
    return text.replace(/\{(\w+)\}/g, (match, key) => varValues[key] || match);
  }

  function copyTemplate() {
    if (!activeTemplate) return;
    navigator.clipboard.writeText(resolve(activeTemplate.body));
    setCopiedId(activeTemplate.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleSave() {
    if (!form.name.trim() || !form.body.trim()) return;
    setCustomTemplates((prev) => [...prev, { id: generateId(), ...form, variables: extractVars(form.body), isBuiltIn: false }]);
    setShowForm(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Social DM Templates"
        description="Outreach templates for Instagram, LinkedIn, and Twitter with personalization variables"
        icon={Send}
        badge="Templates"
        replaces="Notes app / Memory"
        actions={
          <Button onClick={() => { setForm({ name: "", platform: "Instagram", purpose: "", body: "" }); setShowForm(true); }} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Custom Template
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1">
          {["all", "Instagram", "LinkedIn", "Twitter/X", "Any"].map((p) => (
            <Button key={p} variant={filterPlatform === p ? "default" : "outline"} size="sm" onClick={() => setFilterPlatform(p)}>
              {p === "all" ? "All" : p}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-3">
          {filtered.map((t) => (
            <Card key={t.id} className={`cursor-pointer transition-colors ${activeId === t.id ? "border-violet-500/50 bg-violet-500/5" : "hover:border-violet-500/30"}`} onClick={() => { setActiveId(t.id); setVarValues({}); }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-sm">{t.name}</p>
                  {!t.isBuiltIn && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={(e) => { e.stopPropagation(); setCustomTemplates((p) => p.filter((x) => x.id !== t.id)); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="flex gap-1.5 mb-2">
                  <Badge className={`text-[10px] ${PLATFORM_COLORS[t.platform] || PLATFORM_COLORS.Any}`}>{t.platform}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{t.purpose}</Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{t.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          {activeTemplate ? (
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Personalize &amp; Copy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeTemplate.variables.map((v) => (
                  <div key={v} className="space-y-1">
                    <Label className="text-xs capitalize">{v.replace(/_/g, " ")}</Label>
                    <Input placeholder={v.replace(/_/g, " ")} value={varValues[v] || ""} onChange={(e) => setVarValues((prev) => ({ ...prev, [v]: e.target.value }))} className="h-8 text-sm" />
                  </div>
                ))}
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-sm whitespace-pre-wrap">{resolve(activeTemplate.body)}</p>
                </div>
                <Button className="w-full" onClick={copyTemplate}>
                  {copiedId === activeTemplate.id ? <><Check className="h-4 w-4 mr-2" /> Copied!</> : <><Copy className="h-4 w-4 mr-2" /> Copy DM</>}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-border/60">
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">Select a template</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New DM Template</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}>
                  <option>Instagram</option><option>LinkedIn</option><option>Twitter/X</option><option>Any</option>
                </select>
              </div>
              <div className="space-y-1.5"><Label>Purpose</Label><Input placeholder="e.g., Outreach" value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Message *</Label><Textarea placeholder="Use {variable} for personalization..." value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} rows={6} /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || !form.body.trim()} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
