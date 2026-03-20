"use client";

import { useState, useCallback, useMemo } from "react";
import {
  MessageSquareQuote,
  Plus,
  Trash2,
  Copy,
  Star,
  Code,
  Filter,
  X,
  CheckCircle2,
  Users,
  BarChart3,
  Globe,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface Testimonial {
  id: string;
  clientName: string;
  company: string;
  role: string;
  rating: number;
  text: string;
  date: string;
  photoUrl: string;
  platform: string;
}

const PLATFORMS = ["Google", "Trustpilot", "Fiverr", "Custom"];

const PLATFORM_COLORS: Record<string, string> = {
  Google: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Trustpilot: "bg-green-500/10 text-green-600 border-green-500/20",
  Fiverr: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Custom: "bg-violet-500/10 text-violet-600 border-violet-500/20",
};

function StarRating({
  rating,
  onChange,
  size = "md",
}: {
  rating: number;
  onChange?: (r: number) => void;
  size?: "sm" | "md";
}) {
  const cls = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          disabled={!onChange}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            className={`${cls} ${
              i <= rating
                ? "fill-amber-400 text-amber-400"
                : "fill-muted text-muted"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function generateEmbedCode(t: Testimonial): string {
  const stars = Array(5)
    .fill(0)
    .map(
      (_, i) =>
        `<span style="color:${i < t.rating ? "#fbbf24" : "#d1d5db"};font-size:16px;">&#9733;</span>`
    )
    .join("");

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:400px;border:1px solid #e5e7eb;border-radius:12px;padding:20px;background:#fff;">
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
    ${
      t.photoUrl
        ? `<img src="${t.photoUrl}" alt="${t.clientName}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />`
        : `<div style="width:40px;height:40px;border-radius:50%;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-weight:600;color:#6b7280;">${t.clientName.charAt(0).toUpperCase()}</div>`
    }
    <div>
      <div style="font-weight:600;font-size:14px;color:#111827;">${t.clientName}</div>
      <div style="font-size:12px;color:#6b7280;">${t.role}${t.company ? ` at ${t.company}` : ""}</div>
    </div>
  </div>
  <div style="margin-bottom:8px;">${stars}</div>
  <p style="font-size:14px;line-height:1.6;color:#374151;margin:0 0 12px 0;">"${t.text}"</p>
  <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#9ca3af;">
    <span>${new Date(t.date).toLocaleDateString()}</span>
    <span style="padding:2px 8px;border-radius:4px;background:#f3f4f6;">${t.platform}</span>
  </div>
</div>`;
}

export default function TestimonialBuilderPage() {
  const [testimonials, setTestimonials, hydrated] = useLocalStorage<Testimonial[]>(
    "testimonials",
    []
  );
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterRating, setFilterRating] = useState(0);
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [copied, setCopied] = useState<string | null>(null);
  const [showEmbed, setShowEmbed] = useState<string | null>(null);
  const [showWall, setShowWall] = useState(false);

  // Form fields
  const [clientName, setClientName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [platform, setPlatform] = useState("Google");

  const resetForm = useCallback(() => {
    setClientName("");
    setCompany("");
    setRole("");
    setRating(5);
    setText("");
    setDate(new Date().toISOString().split("T")[0]);
    setPhotoUrl("");
    setPlatform("Google");
    setEditId(null);
  }, []);

  const handleSave = useCallback(() => {
    if (!clientName.trim() || !text.trim()) return;
    const testimonial: Testimonial = {
      id: editId || generateId(),
      clientName: clientName.trim(),
      company: company.trim(),
      role: role.trim(),
      rating,
      text: text.trim(),
      date,
      photoUrl: photoUrl.trim(),
      platform,
    };
    if (editId) {
      setTestimonials((prev) =>
        prev.map((t) => (t.id === editId ? testimonial : t))
      );
    } else {
      setTestimonials((prev) => [testimonial, ...prev]);
    }
    resetForm();
    setShowForm(false);
  }, [
    clientName, company, role, rating, text, date, photoUrl, platform,
    editId, setTestimonials, resetForm,
  ]);

  const handleEdit = useCallback((t: Testimonial) => {
    setClientName(t.clientName);
    setCompany(t.company);
    setRole(t.role);
    setRating(t.rating);
    setText(t.text);
    setDate(t.date);
    setPhotoUrl(t.photoUrl);
    setPlatform(t.platform);
    setEditId(t.id);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
    },
    [setTestimonials]
  );

  const handleCopyEmbed = useCallback(
    (t: Testimonial) => {
      navigator.clipboard.writeText(generateEmbedCode(t));
      setCopied(t.id);
      setTimeout(() => setCopied(null), 2000);
    },
    []
  );

  const filtered = useMemo(() => {
    let list = testimonials;
    if (filterRating > 0) list = list.filter((t) => t.rating >= filterRating);
    if (filterPlatform !== "all") list = list.filter((t) => t.platform === filterPlatform);
    return list;
  }, [testimonials, filterRating, filterPlatform]);

  const avgRating = useMemo(() => {
    if (testimonials.length === 0) return 0;
    return testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length;
  }, [testimonials]);

  const socialProofBanner = useMemo(() => {
    if (testimonials.length === 0) return "";
    return `Rated ${avgRating.toFixed(1)}/5 from ${testimonials.length} review${testimonials.length !== 1 ? "s" : ""}`;
  }, [testimonials, avgRating]);

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Testimonial & Review Manager"
        description="Collect, manage, and showcase client testimonials with embeddable widgets."
        icon={MessageSquareQuote}
        badge="Free"
        actions={
          <div className="flex gap-2">
            {testimonials.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWall(!showWall)}
              >
                <Users className="h-4 w-4" />
                {showWall ? "List View" : "Wall View"}
              </Button>
            )}
            <Button
              size="sm"
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Testimonial
            </Button>
          </div>
        }
      />

      {/* Social Proof Banner */}
      {testimonials.length > 0 && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <StarRating rating={Math.round(avgRating)} size="sm" />
                </div>
                <span className="text-sm font-medium">{socialProofBanner}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(socialProofBanner);
                  setCopied("banner");
                  setTimeout(() => setCopied(null), 2000);
                }}
              >
                {copied === "banner" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied === "banner" ? "Copied!" : "Copy Banner"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {editId ? "Edit Testimonial" : "Add New Testimonial"}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Client Name <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="John Smith"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input
                  placeholder="Acme Corp"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Input
                  placeholder="CEO"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Platform</Label>
                <Select value={platform} onValueChange={(v) => { if (v) setPlatform(v); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Photo URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input
                  placeholder="https://example.com/photo.jpg"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Rating</Label>
              <StarRating rating={rating} onChange={setRating} />
            </div>

            <div className="space-y-1.5">
              <Label>Testimonial Text <span className="text-red-500">*</span></Label>
              <Textarea
                rows={3}
                placeholder="Write the testimonial text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
                onClick={handleSave}
                disabled={!clientName.trim() || !text.trim()}
              >
                {editId ? "Update Testimonial" : "Save Testimonial"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {testimonials.length > 0 && !showForm && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter:</span>
          </div>
          <Select value={filterPlatform} onValueChange={(v) => { if (v) setFilterPlatform(v); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {PLATFORMS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(filterRating)}
            onValueChange={(v) => { if (v) setFilterRating(Number(v)); }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4+ Stars</SelectItem>
              <SelectItem value="3">3+ Stars</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="text-xs">
            {filtered.length} testimonial{filtered.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      )}

      {/* Testimonials Display */}
      {testimonials.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center">
                <MessageSquareQuote className="h-7 w-7 text-violet-400" />
              </div>
              <h3 className="text-sm font-medium">No Testimonials Yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Add your first testimonial to start building your social proof.
                You can generate embed codes and create a testimonial wall.
              </p>
              <Button
                className="mt-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add First Testimonial
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : showWall ? (
        /* Wall View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <Card key={t.id} className="flex flex-col">
              <CardContent className="pt-4 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  {t.photoUrl ? (
                    <img
                      src={t.photoUrl}
                      alt={t.clientName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center text-sm font-semibold text-violet-600">
                      {t.clientName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.clientName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.role}{t.company ? ` at ${t.company}` : ""}
                    </p>
                  </div>
                </div>
                <StarRating rating={t.rating} size="sm" />
                <p className="text-sm text-muted-foreground mt-2 flex-1 leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(t.date).toLocaleDateString()}
                  </span>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] border ${PLATFORM_COLORS[t.platform] || PLATFORM_COLORS.Custom}`}
                  >
                    {t.platform}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filtered.map((t) => (
            <Card key={t.id}>
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  {t.photoUrl ? (
                    <img
                      src={t.photoUrl}
                      alt={t.clientName}
                      className="h-10 w-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center text-sm font-semibold text-violet-600 shrink-0">
                      {t.clientName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{t.clientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.role}{t.company ? ` at ${t.company}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] border ${PLATFORM_COLORS[t.platform] || PLATFORM_COLORS.Custom}`}
                        >
                          {t.platform}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-1.5">
                      <StarRating rating={t.rating} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      &ldquo;{t.text}&rdquo;
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="text-xs text-muted-foreground">
                        {new Date(t.date).toLocaleDateString()}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(t)}
                        >
                          <MessageSquareQuote className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            setShowEmbed(showEmbed === t.id ? null : t.id)
                          }
                        >
                          <Code className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleCopyEmbed(t)}
                        >
                          {copied === t.id ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(t.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                    {showEmbed === t.id && (
                      <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                        <p className="text-xs font-medium mb-2">Embed Code:</p>
                        <pre className="text-[11px] whitespace-pre-wrap font-mono text-muted-foreground max-h-40 overflow-y-auto">
                          {generateEmbedCode(t)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
