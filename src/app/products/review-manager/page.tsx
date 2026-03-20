"use client";

import { useState, useMemo } from "react";
import { Star, Plus, Trash2, Search, MessageSquare, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface Review {
  id: string;
  productName: string;
  rating: number;
  text: string;
  customer: string;
  platform: string;
  date: string;
  responded: boolean;
  responseText: string;
}

const POSITIVE_KEYWORDS = ["great", "excellent", "love", "amazing", "perfect", "best", "quality", "recommend", "beautiful", "fast"];
const NEGATIVE_KEYWORDS = ["bad", "poor", "terrible", "broken", "worst", "disappointed", "slow", "cheap", "defective", "return"];

function analyzeSentiment(text: string): { positive: string[]; negative: string[]; sentiment: "positive" | "neutral" | "negative" } {
  const lower = text.toLowerCase();
  const positive = POSITIVE_KEYWORDS.filter((kw) => lower.includes(kw));
  const negative = NEGATIVE_KEYWORDS.filter((kw) => lower.includes(kw));
  const sentiment = positive.length > negative.length ? "positive" : negative.length > positive.length ? "negative" : "neutral";
  return { positive, negative, sentiment };
}

const EMPTY: Omit<Review, "id"> = {
  productName: "", rating: 5, text: "", customer: "", platform: "Website", date: new Date().toISOString().split("T")[0], responded: false, responseText: "",
};

export default function ReviewManagerPage() {
  const [reviews, setReviews] = useLocalStorage<Review[]>("products-reviews", []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [filterRating, setFilterRating] = useState("all");

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const q = search.toLowerCase();
      const matchSearch = r.productName.toLowerCase().includes(q) || r.text.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q);
      const matchRating = filterRating === "all" || r.rating === parseInt(filterRating);
      return matchSearch && matchRating;
    });
  }, [reviews, search, filterRating]);

  const stats = useMemo(() => {
    if (reviews.length === 0) return { avg: 0, total: 0, responded: 0, unresponded: 0 };
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    return {
      avg: Math.round(avg * 10) / 10,
      total: reviews.length,
      responded: reviews.filter((r) => r.responded).length,
      unresponded: reviews.filter((r) => !r.responded).length,
    };
  }, [reviews]);

  const productStats = useMemo(() => {
    const map = new Map<string, { total: number; sum: number }>();
    reviews.forEach((r) => {
      const cur = map.get(r.productName) || { total: 0, sum: 0 };
      cur.total++;
      cur.sum += r.rating;
      map.set(r.productName, cur);
    });
    return Array.from(map.entries())
      .map(([name, { total, sum }]) => ({ name, avg: Math.round((sum / total) * 10) / 10, total }))
      .sort((a, b) => b.total - a.total);
  }, [reviews]);

  function handleSave() {
    if (!form.productName.trim()) return;
    setReviews((prev) => [{ ...form, id: generateId() }, ...prev]);
    setForm(EMPTY);
    setShowForm(false);
  }

  function toggleResponded(id: string) {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, responded: !r.responded } : r)));
  }

  function updateResponse(id: string, responseText: string) {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, responseText, responded: true } : r)));
  }

  function handleDelete(id: string) {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />
    ));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Review Manager"
        description="Log and manage product reviews, track response rates, and analyze review sentiment."
        icon={Star}
        badge="Products"
        replaces="Review spreadsheets"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Reviews</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold flex items-center gap-1">{stats.avg} <Star className="h-4 w-4 text-amber-400 fill-amber-400" /></p><p className="text-xs text-muted-foreground">Avg Rating</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{stats.responded}</p><p className="text-xs text-muted-foreground">Responded</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold text-amber-600">{stats.unresponded}</p><p className="text-xs text-muted-foreground">Needs Response</p></CardContent></Card>
      </div>

      {productStats.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">By Product</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {productStats.map((p) => (
                <div key={p.name} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30 text-sm">
                  <span className="font-medium">{p.name}</span>
                  <div className="flex">{renderStars(Math.round(p.avg))}</div>
                  <span className="text-muted-foreground text-xs">{p.avg} ({p.total})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search reviews..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterRating} onValueChange={(v) => setFilterRating(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((r) => <SelectItem key={r} value={String(r)}>{r} Stars</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
          <Plus className="h-4 w-4 mr-2" />Add Review
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><Star className="h-10 w-10 text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">No reviews yet</p></CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => {
            const { positive, negative, sentiment } = analyzeSentiment(r.text);
            return (
              <Card key={r.id} className="border-border/50 group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{r.productName}</span>
                        <div className="flex">{renderStars(r.rating)}</div>
                        <Badge variant="outline" className="text-xs">{r.platform}</Badge>
                        <Badge className={`text-xs border-0 ${sentiment === "positive" ? "bg-emerald-500/10 text-emerald-600" : sentiment === "negative" ? "bg-red-500/10 text-red-600" : "bg-slate-500/10 text-slate-600"}`}>
                          {sentiment}
                        </Badge>
                        {r.responded ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-xs">Responded</Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-600 border-0 text-xs">Pending</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.customer} &middot; {r.date}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive opacity-0 group-hover:opacity-100" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm mb-2">{r.text}</p>
                  {(positive.length > 0 || negative.length > 0) && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {positive.map((kw) => <Badge key={kw} className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px]">{kw}</Badge>)}
                      {negative.map((kw) => <Badge key={kw} className="bg-red-500/10 text-red-600 border-0 text-[10px]">{kw}</Badge>)}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Type response..."
                      value={r.responseText}
                      onChange={(e) => updateResponse(r.id, e.target.value)}
                      className="flex-1 h-8 text-xs"
                    />
                    <Button size="sm" variant="outline" onClick={() => toggleResponded(r.id)}>
                      <MessageSquare className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Review</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Product Name *</Label><Input value={form.productName} onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Customer</Label><Input value={form.customer} onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Rating</Label>
                <Select value={String(form.rating)} onValueChange={(v) => setForm((f) => ({ ...f, rating: parseInt(v ?? "5") }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{[5, 4, 3, 2, 1].map((r) => <SelectItem key={r} value={String(r)}>{r} Stars</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Platform</Label><Input value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Review Text</Label><Textarea value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} rows={3} /></div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={handleSave} disabled={!form.productName.trim()}>Add Review</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
