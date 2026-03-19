"use client";

import { useState, useMemo } from "react";
import {
  Star,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  User,
  ClipboardList,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface RatingCategories {
  quality: number;
  productivity: number;
  communication: number;
  teamwork: number;
  initiative: number;
}

interface PerformanceReview {
  id: string;
  employeeName: string;
  reviewPeriod: string;
  reviewDate: string;
  ratings: RatingCategories;
  overallScore: number;
  strengths: string;
  improvements: string;
  goals: string;
}

const CATEGORIES: { key: keyof RatingCategories; label: string }[] = [
  { key: "quality", label: "Quality of Work" },
  { key: "productivity", label: "Productivity" },
  { key: "communication", label: "Communication" },
  { key: "teamwork", label: "Teamwork" },
  { key: "initiative", label: "Initiative" },
];

function calcOverall(r: RatingCategories): number {
  const vals = Object.values(r);
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

function ScoreStars({
  value,
  onChange,
}: {
  value: number;
  onChange?: (v: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={`transition-colors ${onChange ? "cursor-pointer" : "cursor-default"}`}
        >
          <Star
            className={`h-5 w-5 ${n <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
          />
        </button>
      ))}
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 4
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : score >= 3
      ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
      : score >= 2
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      : "bg-red-500/10 text-red-600 dark:text-red-400";
  const label =
    score >= 4.5
      ? "Exceptional"
      : score >= 4
      ? "Exceeds Expectations"
      : score >= 3
      ? "Meets Expectations"
      : score >= 2
      ? "Needs Improvement"
      : "Unsatisfactory";
  return (
    <Badge className={`text-[10px] border-0 ${color}`}>{label}</Badge>
  );
}

function TrendIcon({ trend }: { trend: "improving" | "stable" | "declining" }) {
  if (trend === "improving")
    return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (trend === "declining")
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function calcTrend(
  reviews: PerformanceReview[]
): "improving" | "stable" | "declining" {
  if (reviews.length < 2) return "stable";
  const sorted = [...reviews].sort((a, b) =>
    a.reviewDate.localeCompare(b.reviewDate)
  );
  const last = sorted[sorted.length - 1].overallScore;
  const prev = sorted[sorted.length - 2].overallScore;
  if (last > prev + 0.2) return "improving";
  if (last < prev - 0.2) return "declining";
  return "stable";
}

const EMPTY_RATINGS: RatingCategories = {
  quality: 3,
  productivity: 3,
  communication: 3,
  teamwork: 3,
  initiative: 3,
};

export default function PerformanceReviewsPage() {
  const [reviews, setReviews] = useLocalStorage<PerformanceReview[]>(
    "hr-reviews",
    []
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [form, setForm] = useState({
    employeeName: "",
    reviewPeriod: "",
    reviewDate: new Date().toISOString().split("T")[0],
    ratings: { ...EMPTY_RATINGS },
    strengths: "",
    improvements: "",
    goals: "",
  });

  // Group by employee
  const byEmployee = useMemo(() => {
    const map: Record<string, PerformanceReview[]> = {};
    reviews.forEach((r) => {
      if (!map[r.employeeName]) map[r.employeeName] = [];
      map[r.employeeName].push(r);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [reviews]);

  // Unique employee names for autocomplete
  const employeeNames = useMemo(
    () => [...new Set(reviews.map((r) => r.employeeName))],
    [reviews]
  );

  function openNew() {
    setForm({
      employeeName: "",
      reviewPeriod: "",
      reviewDate: new Date().toISOString().split("T")[0],
      ratings: { ...EMPTY_RATINGS },
      strengths: "",
      improvements: "",
      goals: "",
    });
    setDialogOpen(true);
  }

  function saveReview() {
    if (!form.employeeName.trim()) return;
    const overallScore = calcOverall(form.ratings);
    setReviews((prev) => [
      {
        id: generateId(),
        employeeName: form.employeeName.trim(),
        reviewPeriod: form.reviewPeriod,
        reviewDate: form.reviewDate,
        ratings: form.ratings,
        overallScore,
        strengths: form.strengths,
        improvements: form.improvements,
        goals: form.goals,
      },
      ...prev,
    ]);
    setDialogOpen(false);
  }

  function deleteReview(id: string) {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  const overallAvg =
    reviews.length > 0
      ? Math.round(
          (reviews.reduce((s, r) => s + r.overallScore, 0) / reviews.length) *
            10
        ) / 10
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Reviews"
        description="Create and track performance reviews with ratings, feedback, and trends"
        icon={Star}
        badge="HR"
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Reviews",
            value: reviews.length,
            color: "text-violet-600 dark:text-violet-400",
          },
          {
            label: "Employees Reviewed",
            value: byEmployee.length,
            color: "text-pink-600 dark:text-pink-400",
          },
          {
            label: "Avg Score",
            value: overallAvg > 0 ? overallAvg.toFixed(1) : "—",
            color: "text-amber-600 dark:text-amber-400",
          },
          {
            label: "Improving",
            value: byEmployee.filter(
              ([, rs]) => calcTrend(rs) === "improving"
            ).length,
            color: "text-emerald-600 dark:text-emerald-400",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={openNew}
          className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Review
        </Button>
      </div>

      {/* Employee review groups */}
      {byEmployee.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">
              No performance reviews yet. Create the first one.
            </p>
            <Button variant="outline" className="mt-4" onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />
              New Review
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {byEmployee.map(([name, empReviews]) => {
            const latest = [...empReviews].sort((a, b) =>
              b.reviewDate.localeCompare(a.reviewDate)
            )[0];
            const trend = calcTrend(empReviews);
            const isExpanded = expandedEmployee === name;

            return (
              <Card
                key={name}
                className="overflow-hidden hover:border-violet-500/30 transition-colors"
              >
                <button
                  className="w-full text-left"
                  onClick={() =>
                    setExpandedEmployee(isExpanded ? null : name)
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-violet-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{name}</CardTitle>
                            <TrendIcon trend={trend} />
                            <span className="text-xs text-muted-foreground capitalize">
                              {trend}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {empReviews.length} review
                            {empReviews.length !== 1 ? "s" : ""} · Latest:{" "}
                            {new Date(latest.reviewDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1.5">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="text-lg font-bold">
                              {latest.overallScore.toFixed(1)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              / 5
                            </span>
                          </div>
                          <ScoreBadge score={latest.overallScore} />
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {isExpanded && (
                  <CardContent className="pt-0 pb-5 px-5">
                    <Separator className="mb-4" />
                    <div className="space-y-5">
                      {[...empReviews]
                        .sort((a, b) => b.reviewDate.localeCompare(a.reviewDate))
                        .map((review) => (
                          <div
                            key={review.id}
                            className="rounded-xl border bg-muted/20 p-4 space-y-4"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <p className="text-sm font-semibold">
                                  {review.reviewPeriod || "Performance Review"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(
                                    review.reviewDate
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                  <span className="font-bold text-sm">
                                    {review.overallScore.toFixed(1)}
                                  </span>
                                </div>
                                <ScoreBadge score={review.overallScore} />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-400 hover:text-red-500"
                                  onClick={() => deleteReview(review.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>

                            {/* Rating categories */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {CATEGORIES.map((cat) => (
                                <div
                                  key={cat.key}
                                  className="flex items-center justify-between"
                                >
                                  <span className="text-xs text-muted-foreground">
                                    {cat.label}
                                  </span>
                                  <ScoreStars
                                    value={review.ratings[cat.key]}
                                  />
                                </div>
                              ))}
                            </div>

                            {(review.strengths ||
                              review.improvements ||
                              review.goals) && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t">
                                {review.strengths && (
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 mb-1">
                                      Strengths
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {review.strengths}
                                    </p>
                                  </div>
                                )}
                                {review.improvements && (
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-1">
                                      Improvements
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {review.improvements}
                                    </p>
                                  </div>
                                )}
                                {review.goals && (
                                  <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400 mb-1">
                                      Goals
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {review.goals}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Performance Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Employee Name *</Label>
                <Input
                  list="employee-names-list"
                  value={form.employeeName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, employeeName: e.target.value }))
                  }
                  placeholder="Jane Smith"
                  className="mt-1"
                />
                <datalist id="employee-names-list">
                  {employeeNames.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label>Review Period</Label>
                <Input
                  value={form.reviewPeriod}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reviewPeriod: e.target.value }))
                  }
                  placeholder="Q1 2025"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Review Date</Label>
                <Input
                  type="date"
                  value={form.reviewDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reviewDate: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Ratings (1–5 stars)
              </p>
              <div className="space-y-3">
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat.key}
                    className="flex items-center justify-between"
                  >
                    <Label className="text-sm">{cat.label}</Label>
                    <ScoreStars
                      value={form.ratings[cat.key]}
                      onChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          ratings: { ...f.ratings, [cat.key]: v },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-pink-500/10 px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-semibold">Overall Score</span>
                <div className="flex items-center gap-2">
                  <ScoreStars value={Math.round(calcOverall(form.ratings))} />
                  <span className="text-lg font-bold text-violet-600 dark:text-violet-400">
                    {calcOverall(form.ratings).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label>Strengths</Label>
              <Textarea
                value={form.strengths}
                onChange={(e) =>
                  setForm((f) => ({ ...f, strengths: e.target.value }))
                }
                placeholder="What does this employee do exceptionally well?"
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Areas for Improvement</Label>
              <Textarea
                value={form.improvements}
                onChange={(e) =>
                  setForm((f) => ({ ...f, improvements: e.target.value }))
                }
                placeholder="What areas need development?"
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Goals for Next Period</Label>
              <Textarea
                value={form.goals}
                onChange={(e) =>
                  setForm((f) => ({ ...f, goals: e.target.value }))
                }
                placeholder="What should this employee focus on next?"
                rows={2}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveReview}
              disabled={!form.employeeName.trim()}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
            >
              Save Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
