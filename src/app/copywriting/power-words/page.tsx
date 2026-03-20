"use client";

import { useState, useMemo } from "react";
import { Zap, Copy, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Category = "urgency" | "trust" | "curiosity" | "fear" | "greed" | "exclusivity" | "power" | "emotion";

interface PowerWord {
  word: string;
  category: Category;
  example: string;
}

const CATEGORY_CONFIG: Record<Category, { label: string; color: string }> = {
  urgency: { label: "Urgency", color: "bg-red-500/10 text-red-600" },
  trust: { label: "Trust", color: "bg-blue-500/10 text-blue-600" },
  curiosity: { label: "Curiosity", color: "bg-amber-500/10 text-amber-600" },
  fear: { label: "Fear", color: "bg-orange-500/10 text-orange-600" },
  greed: { label: "Greed", color: "bg-emerald-500/10 text-emerald-600" },
  exclusivity: { label: "Exclusivity", color: "bg-violet-500/10 text-violet-600" },
  power: { label: "Power", color: "bg-pink-500/10 text-pink-600" },
  emotion: { label: "Emotion", color: "bg-sky-500/10 text-sky-600" },
};

const WORDS: PowerWord[] = [
  // Urgency
  { word: "Now", category: "urgency", example: "Get started now" },
  { word: "Hurry", category: "urgency", example: "Hurry, offer ends soon" },
  { word: "Limited", category: "urgency", example: "Limited spots available" },
  { word: "Deadline", category: "urgency", example: "Deadline approaching fast" },
  { word: "Instant", category: "urgency", example: "Instant access granted" },
  { word: "Immediately", category: "urgency", example: "See results immediately" },
  { word: "Today", category: "urgency", example: "Start today" },
  { word: "Fast", category: "urgency", example: "Fast-track your results" },
  { word: "Quick", category: "urgency", example: "Quick and easy setup" },
  { word: "Rush", category: "urgency", example: "Rush delivery available" },
  { word: "Act", category: "urgency", example: "Act before it's gone" },
  { word: "Expires", category: "urgency", example: "This offer expires at midnight" },
  { word: "Final", category: "urgency", example: "Final chance to save" },
  { word: "Last", category: "urgency", example: "Last call for enrollment" },
  { word: "Running out", category: "urgency", example: "Stock is running out" },
  { word: "Before", category: "urgency", example: "Before it's too late" },
  { word: "Countdown", category: "urgency", example: "Countdown to launch" },
  { word: "Fleeting", category: "urgency", example: "A fleeting opportunity" },
  { word: "Rapid", category: "urgency", example: "Rapid transformation" },
  { word: "Time-sensitive", category: "urgency", example: "Time-sensitive deal" },
  { word: "Don't miss", category: "urgency", example: "Don't miss this chance" },
  { word: "While supplies last", category: "urgency", example: "Available while supplies last" },
  { word: "Once", category: "urgency", example: "Once in a lifetime" },
  { word: "Closing", category: "urgency", example: "Closing soon" },
  { word: "Disappearing", category: "urgency", example: "Disappearing deal" },
  // Trust
  { word: "Proven", category: "trust", example: "Proven by 10,000 users" },
  { word: "Guaranteed", category: "trust", example: "100% money-back guaranteed" },
  { word: "Certified", category: "trust", example: "Certified professionals" },
  { word: "Authentic", category: "trust", example: "Authentic quality" },
  { word: "Reliable", category: "trust", example: "Reliable performance" },
  { word: "Trusted", category: "trust", example: "Trusted by leaders" },
  { word: "Official", category: "trust", example: "The official guide" },
  { word: "Verified", category: "trust", example: "Verified reviews" },
  { word: "Backed", category: "trust", example: "Backed by science" },
  { word: "Research", category: "trust", example: "Research-based approach" },
  { word: "Expert", category: "trust", example: "Expert-approved methods" },
  { word: "Award-winning", category: "trust", example: "Award-winning service" },
  { word: "Tested", category: "trust", example: "Rigorously tested" },
  { word: "Safe", category: "trust", example: "Safe and secure" },
  { word: "Endorsed", category: "trust", example: "Endorsed by professionals" },
  { word: "Recognized", category: "trust", example: "Globally recognized" },
  { word: "Accredited", category: "trust", example: "Fully accredited" },
  { word: "Dependable", category: "trust", example: "Dependable results" },
  { word: "No-risk", category: "trust", example: "No-risk trial" },
  { word: "Transparent", category: "trust", example: "Transparent pricing" },
  { word: "Honest", category: "trust", example: "Honest reviews" },
  { word: "Secure", category: "trust", example: "Secure checkout" },
  { word: "Protected", category: "trust", example: "Your data is protected" },
  { word: "Legitimate", category: "trust", example: "A legitimate approach" },
  { word: "Professional", category: "trust", example: "Professional quality" },
  // Curiosity
  { word: "Secret", category: "curiosity", example: "The secret to success" },
  { word: "Discover", category: "curiosity", example: "Discover what's possible" },
  { word: "Revealed", category: "curiosity", example: "Top strategies revealed" },
  { word: "Hidden", category: "curiosity", example: "Hidden features you missed" },
  { word: "Uncover", category: "curiosity", example: "Uncover the truth" },
  { word: "Surprising", category: "curiosity", example: "Surprising results" },
  { word: "Behind-the-scenes", category: "curiosity", example: "A behind-the-scenes look" },
  { word: "Unusual", category: "curiosity", example: "An unusual approach" },
  { word: "Little-known", category: "curiosity", example: "Little-known strategies" },
  { word: "Bizarre", category: "curiosity", example: "Bizarre but effective" },
  { word: "Strange", category: "curiosity", example: "Strange but true" },
  { word: "Mysterious", category: "curiosity", example: "A mysterious phenomenon" },
  { word: "Unexpected", category: "curiosity", example: "Unexpected benefits" },
  { word: "Controversial", category: "curiosity", example: "A controversial method" },
  { word: "Forbidden", category: "curiosity", example: "Forbidden knowledge" },
  { word: "Underground", category: "curiosity", example: "Underground tactics" },
  { word: "Insider", category: "curiosity", example: "Insider secrets" },
  { word: "Myth", category: "curiosity", example: "Myth vs. reality" },
  { word: "Trick", category: "curiosity", example: "One simple trick" },
  { word: "Sneak peek", category: "curiosity", example: "A sneak peek inside" },
  { word: "What if", category: "curiosity", example: "What if you could?" },
  { word: "Imagine", category: "curiosity", example: "Imagine the possibilities" },
  { word: "Unlock", category: "curiosity", example: "Unlock your potential" },
  { word: "Unbelievable", category: "curiosity", example: "Unbelievable results" },
  { word: "Eye-opening", category: "curiosity", example: "An eye-opening report" },
  // Fear
  { word: "Warning", category: "fear", example: "Warning: Don't make this mistake" },
  { word: "Danger", category: "fear", example: "The danger of ignoring this" },
  { word: "Avoid", category: "fear", example: "Avoid these costly errors" },
  { word: "Mistake", category: "fear", example: "The #1 mistake people make" },
  { word: "Devastating", category: "fear", example: "Devastating consequences" },
  { word: "Nightmare", category: "fear", example: "A customer service nightmare" },
  { word: "Crisis", category: "fear", example: "How to survive a crisis" },
  { word: "Alarming", category: "fear", example: "Alarming new data" },
  { word: "Risky", category: "fear", example: "A risky gamble" },
  { word: "Beware", category: "fear", example: "Beware of imitations" },
  { word: "Threat", category: "fear", example: "A growing threat" },
  { word: "Painful", category: "fear", example: "Painful lessons learned" },
  { word: "Catastrophe", category: "fear", example: "Prevent a catastrophe" },
  { word: "Scam", category: "fear", example: "How to spot a scam" },
  { word: "Trap", category: "fear", example: "Don't fall into this trap" },
  { word: "Toxic", category: "fear", example: "Toxic habits to eliminate" },
  { word: "Vulnerable", category: "fear", example: "Are you vulnerable?" },
  { word: "Failing", category: "fear", example: "Signs you're failing" },
  { word: "Costly", category: "fear", example: "A costly oversight" },
  { word: "Destroy", category: "fear", example: "Don't destroy your progress" },
  { word: "Ruin", category: "fear", example: "Don't ruin your chances" },
  { word: "Suffer", category: "fear", example: "Don't suffer in silence" },
  { word: "Horrifying", category: "fear", example: "A horrifying statistic" },
  { word: "Exposed", category: "fear", example: "Your weaknesses exposed" },
  { word: "Lethal", category: "fear", example: "A lethal combination" },
  // Greed
  { word: "Free", category: "greed", example: "Get it free today" },
  { word: "Bonus", category: "greed", example: "Exclusive bonus included" },
  { word: "Save", category: "greed", example: "Save 50% this week" },
  { word: "Discount", category: "greed", example: "Members-only discount" },
  { word: "Double", category: "greed", example: "Double your results" },
  { word: "Triple", category: "greed", example: "Triple your output" },
  { word: "Massive", category: "greed", example: "Massive savings" },
  { word: "Profit", category: "greed", example: "Maximize your profit" },
  { word: "Jackpot", category: "greed", example: "Hit the jackpot" },
  { word: "Fortune", category: "greed", example: "A small fortune" },
  { word: "Bargain", category: "greed", example: "The bargain of the year" },
  { word: "Wealthy", category: "greed", example: "Build a wealthy future" },
  { word: "Cash", category: "greed", example: "Cash in on this deal" },
  { word: "Extra", category: "greed", example: "Extra value at no cost" },
  { word: "Reward", category: "greed", example: "Claim your reward" },
  { word: "Value", category: "greed", example: "Incredible value" },
  { word: "Giveaway", category: "greed", example: "Limited giveaway" },
  { word: "Treasure", category: "greed", example: "A hidden treasure" },
  { word: "Premium", category: "greed", example: "Premium features free" },
  { word: "Priceless", category: "greed", example: "Priceless insights" },
  { word: "Steal", category: "greed", example: "An absolute steal" },
  { word: "Windfall", category: "greed", example: "An unexpected windfall" },
  { word: "Bundle", category: "greed", example: "The ultimate bundle" },
  { word: "Half-price", category: "greed", example: "Half-price sale" },
  { word: "Leverage", category: "greed", example: "Leverage your assets" },
  // Exclusivity
  { word: "Exclusive", category: "exclusivity", example: "Exclusive access" },
  { word: "Members-only", category: "exclusivity", example: "Members-only perks" },
  { word: "VIP", category: "exclusivity", example: "VIP treatment awaits" },
  { word: "Private", category: "exclusivity", example: "Private invitation" },
  { word: "Elite", category: "exclusivity", example: "Join the elite" },
  { word: "Invitation", category: "exclusivity", example: "By invitation only" },
  { word: "Insider", category: "exclusivity", example: "Insider access" },
  { word: "Handpicked", category: "exclusivity", example: "Handpicked selection" },
  { word: "Select", category: "exclusivity", example: "For select customers" },
  { word: "Rare", category: "exclusivity", example: "A rare opportunity" },
  { word: "One-of-a-kind", category: "exclusivity", example: "One-of-a-kind offer" },
  { word: "Limited edition", category: "exclusivity", example: "Limited edition release" },
  { word: "First access", category: "exclusivity", example: "Get first access" },
  { word: "Prestige", category: "exclusivity", example: "The prestige collection" },
  { word: "Reserved", category: "exclusivity", example: "Reserved for you" },
  { word: "Bespoke", category: "exclusivity", example: "A bespoke experience" },
  { word: "Curated", category: "exclusivity", example: "Carefully curated" },
  { word: "Classified", category: "exclusivity", example: "Classified information" },
  { word: "Privileged", category: "exclusivity", example: "Privileged access" },
  { word: "Coveted", category: "exclusivity", example: "The most coveted spot" },
  { word: "Sought-after", category: "exclusivity", example: "Highly sought-after" },
  { word: "Premier", category: "exclusivity", example: "The premier destination" },
  { word: "Flagship", category: "exclusivity", example: "Our flagship product" },
  { word: "Pinnacle", category: "exclusivity", example: "The pinnacle of design" },
  { word: "Distinguished", category: "exclusivity", example: "A distinguished choice" },
  // Power
  { word: "Ultimate", category: "power", example: "The ultimate guide" },
  { word: "Revolutionary", category: "power", example: "A revolutionary approach" },
  { word: "Breakthrough", category: "power", example: "A major breakthrough" },
  { word: "Dominate", category: "power", example: "Dominate your market" },
  { word: "Unleash", category: "power", example: "Unleash your potential" },
  { word: "Transform", category: "power", example: "Transform your business" },
  { word: "Conquer", category: "power", example: "Conquer your goals" },
  { word: "Supercharge", category: "power", example: "Supercharge your growth" },
  { word: "Skyrocket", category: "power", example: "Skyrocket your sales" },
  { word: "Amplify", category: "power", example: "Amplify your message" },
  { word: "Turbocharge", category: "power", example: "Turbocharge performance" },
  { word: "Unstoppable", category: "power", example: "Become unstoppable" },
  { word: "Epic", category: "power", example: "Epic results" },
  { word: "Crushing", category: "power", example: "Crushing the competition" },
  { word: "Game-changing", category: "power", example: "A game-changing tool" },
  { word: "Hack", category: "power", example: "The ultimate growth hack" },
  { word: "Master", category: "power", example: "Master your craft" },
  { word: "Empower", category: "power", example: "Empower your team" },
  { word: "Ignite", category: "power", example: "Ignite your passion" },
  { word: "Accelerate", category: "power", example: "Accelerate growth" },
  { word: "Catapult", category: "power", example: "Catapult to success" },
  { word: "Maximize", category: "power", example: "Maximize your output" },
  { word: "Electrify", category: "power", example: "Electrify your audience" },
  { word: "Surge", category: "power", example: "A surge of momentum" },
  { word: "Propel", category: "power", example: "Propel forward" },
  // Emotion
  { word: "Love", category: "emotion", example: "You'll love this" },
  { word: "Inspire", category: "emotion", example: "Inspire greatness" },
  { word: "Heartwarming", category: "emotion", example: "A heartwarming story" },
  { word: "Joy", category: "emotion", example: "Pure joy delivered" },
  { word: "Passion", category: "emotion", example: "Fuel your passion" },
  { word: "Beautiful", category: "emotion", example: "Beautiful results" },
  { word: "Dream", category: "emotion", example: "Make your dream real" },
  { word: "Bliss", category: "emotion", example: "Experience pure bliss" },
  { word: "Hope", category: "emotion", example: "New hope for growth" },
  { word: "Magic", category: "emotion", example: "Pure magic" },
  { word: "Breathtaking", category: "emotion", example: "Breathtaking views" },
  { word: "Thrilling", category: "emotion", example: "A thrilling adventure" },
  { word: "Soulful", category: "emotion", example: "A soulful experience" },
  { word: "Enchanting", category: "emotion", example: "Enchanting design" },
  { word: "Dazzling", category: "emotion", example: "Dazzling performance" },
  { word: "Captivating", category: "emotion", example: "A captivating story" },
  { word: "Sensational", category: "emotion", example: "Sensational results" },
  { word: "Delightful", category: "emotion", example: "A delightful surprise" },
  { word: "Radiant", category: "emotion", example: "A radiant smile" },
  { word: "Wonderful", category: "emotion", example: "Wonderful things ahead" },
  { word: "Glorious", category: "emotion", example: "A glorious victory" },
  { word: "Mesmerizing", category: "emotion", example: "Mesmerizing content" },
  { word: "Extraordinary", category: "emotion", example: "Extraordinary talent" },
  { word: "Astonishing", category: "emotion", example: "Astonishing growth" },
  { word: "Phenomenal", category: "emotion", example: "Phenomenal support" },
];

export default function PowerWordsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return WORDS.filter((w) => {
      const matchCat = category === "all" || w.category === category;
      const matchSearch = !search || w.word.toLowerCase().includes(search.toLowerCase()) || w.example.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, category]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: WORDS.length };
    for (const w of WORDS) c[w.category] = (c[w.category] || 0) + 1;
    return c;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Power Words Library"
        description={`Searchable database of ${WORDS.length}+ power words organized by emotional trigger category.`}
        icon={Zap}
        badge="Copywriting"
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search power words..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories ({counts.all})</SelectItem>
            {(Object.entries(CATEGORY_CONFIG) as [Category, { label: string }][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label} ({counts[k] || 0})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="text-xs text-muted-foreground">{filtered.length} words found</div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((w) => (
          <Card key={w.word + w.category} className="border-border/50 hover:border-violet-500/30 transition-colors group">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm">{w.word}</span>
                  <Badge className={`${CATEGORY_CONFIG[w.category].color} border-0 text-[10px]`}>{CATEGORY_CONFIG[w.category].label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate italic">{w.example}</p>
              </div>
              <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={() => { navigator.clipboard.writeText(w.word); setCopied(w.word); setTimeout(() => setCopied(null), 1500); }}>
                <Copy className={`h-3.5 w-3.5 ${copied === w.word ? "text-emerald-500" : ""}`} />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
