"use client";

import { useState, useMemo } from "react";
import {
  Palmtree,
  Plus,
  Calendar,
  Check,
  X,
  Clock,
  Umbrella,
  Heart,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type LeaveType = "vacation" | "sick" | "personal" | "other";
type LeaveStatus = "pending" | "approved" | "rejected";

interface LeaveRequest {
  id: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  submittedAt: string;
  days: number;
}

interface LeaveBalance {
  vacation: number;
  sick: number;
  personal: number;
}

const TYPE_CONFIG: Record<
  LeaveType,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  vacation: {
    label: "Vacation",
    icon: Palmtree,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
  },
  sick: {
    label: "Sick Leave",
    icon: Heart,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
  },
  personal: {
    label: "Personal",
    icon: Umbrella,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
  },
  other: {
    label: "Other",
    icon: MoreHorizontal,
    color: "text-muted-foreground",
    bg: "bg-muted/60",
  },
};

const STATUS_CONFIG: Record<
  LeaveStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0",
  },
  approved: {
    label: "Approved",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-0",
  },
};

function calcBusinessDays(start: string, end: string): number {
  let count = 0;
  const cur = new Date(start + "T12:00:00");
  const endDate = new Date(end + "T12:00:00");
  while (cur <= endDate) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const DEFAULT_BALANCE: LeaveBalance = { vacation: 20, sick: 10, personal: 5 };

export default function LeaveManagementPage() {
  const [requests, setRequests] = useLocalStorage<LeaveRequest[]>(
    "hr-leave-requests",
    []
  );
  const [balance, setBalance] = useLocalStorage<LeaveBalance>(
    "hr-leave-balance",
    DEFAULT_BALANCE
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [editBalance, setEditBalance] = useState<LeaveBalance>(DEFAULT_BALANCE);
  const [form, setForm] = useState({
    type: "vacation" as LeaveType,
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());

  const usedDays = useMemo(() => {
    const approved = requests.filter((r) => r.status === "approved");
    return {
      vacation: approved
        .filter((r) => r.type === "vacation")
        .reduce((s, r) => s + r.days, 0),
      sick: approved
        .filter((r) => r.type === "sick")
        .reduce((s, r) => s + r.days, 0),
      personal: approved
        .filter((r) => r.type === "personal")
        .reduce((s, r) => s + r.days, 0),
    };
  }, [requests]);

  function openRequest() {
    setForm({
      type: "vacation",
      startDate: "",
      endDate: "",
      reason: "",
    });
    setDialogOpen(true);
  }

  function submitRequest() {
    if (!form.startDate || !form.endDate) return;
    const days = calcBusinessDays(form.startDate, form.endDate);
    setRequests((prev) => [
      {
        id: generateId(),
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
        status: "pending",
        submittedAt: new Date().toISOString(),
        days,
      },
      ...prev,
    ]);
    setDialogOpen(false);
  }

  function updateStatus(id: string, status: LeaveStatus) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  }

  function deleteRequest(id: string) {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  // Calendar: highlight approved leave days
  const calDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(calYear, calMonth);
    const firstDay = getFirstDayOfMonth(calYear, calMonth);
    const cells: { day: number; request: LeaveRequest | null }[] = [];

    const approvedInMonth = requests.filter((r) => r.status === "approved");

    for (let i = 0; i < firstDay; i++) cells.push({ day: 0, request: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const match = approvedInMonth.find(
        (r) => dateStr >= r.startDate && dateStr <= r.endDate
      );
      cells.push({ day: d, request: match || null });
    }
    return cells;
  }, [requests, calMonth, calYear]);

  const monthName = new Date(calYear, calMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const leaveDays = form.startDate && form.endDate
    ? calcBusinessDays(form.startDate, form.endDate)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        description="Submit and manage leave requests, track balances, and view approvals"
        icon={Palmtree}
        badge="HR"
      />

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["vacation", "sick", "personal"] as LeaveType[]).map((type) => {
          const cfg = TYPE_CONFIG[type];
          const used = usedDays[type as keyof typeof usedDays];
          const total = balance[type as keyof LeaveBalance];
          const pct = total > 0 ? (used / total) * 100 : 0;
          return (
            <Card key={type} className={`border-${type === "vacation" ? "violet" : type === "sick" ? "red" : "blue"}-500/20`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`h-8 w-8 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                    <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                  </div>
                  <span className="font-medium text-sm">{cfg.label}</span>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className={`text-2xl font-bold ${cfg.color}`}>
                    {total - used}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {used} / {total} used
                  </span>
                </div>
                <Progress value={pct} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {total - used} days remaining
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditBalance(balance);
            setBalanceDialogOpen(true);
          }}
        >
          Edit Balances
        </Button>
        <Button
          onClick={openRequest}
          className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Request Leave
        </Button>
      </div>

      <Tabs defaultValue="requests">
        <TabsList className="mb-4">
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-3">
          {requests.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-14 text-center">
                <Calendar className="h-9 w-9 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">
                  No leave requests yet. Submit your first request.
                </p>
                <Button variant="outline" className="mt-4" onClick={openRequest}>
                  <Plus className="h-4 w-4 mr-2" />
                  Request Leave
                </Button>
              </CardContent>
            </Card>
          ) : (
            requests.map((req) => {
              const cfg = TYPE_CONFIG[req.type];
              const sCfg = STATUS_CONFIG[req.status];
              return (
                <Card
                  key={req.id}
                  className="hover:border-violet-500/30 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-9 w-9 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {cfg.label}
                          </span>
                          <Badge className={`text-[10px] ${sCfg.className}`}>
                            {sCfg.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {req.days} business day{req.days !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(req.startDate + "T12:00:00").toLocaleDateString()} –{" "}
                          {new Date(req.endDate + "T12:00:00").toLocaleDateString()}
                        </p>
                        {req.reason && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {req.reason}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {req.status === "pending" && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                              onClick={() => updateStatus(req.id, "approved")}
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                              onClick={() => updateStatus(req.id, "rejected")}
                              title="Reject"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          onClick={() => deleteRequest(req.id)}
                          title="Delete"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-500" />
                  {monthName} — Approved Leaves
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      if (calMonth === 0) {
                        setCalMonth(11);
                        setCalYear((y) => y - 1);
                      } else setCalMonth((m) => m - 1);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      if (calMonth === 11) {
                        setCalMonth(0);
                        setCalYear((y) => y + 1);
                      } else setCalMonth((m) => m + 1);
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div
                    key={d}
                    className="text-[10px] text-muted-foreground font-medium py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calDays.map((cell, idx) => {
                  if (cell.day === 0) return <div key={idx} />;
                  const req = cell.request;
                  const bg = req
                    ? TYPE_CONFIG[req.type].bg
                    : "bg-muted/20";
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
                  const isToday =
                    dateStr === new Date().toISOString().split("T")[0];
                  return (
                    <div
                      key={idx}
                      className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium ${bg} ${isToday ? "ring-2 ring-violet-500" : ""}`}
                      title={req ? `${TYPE_CONFIG[req.type].label}` : undefined}
                    >
                      {cell.day}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-4 text-xs text-muted-foreground">
                {(["vacation", "sick", "personal"] as LeaveType[]).map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-sm ${TYPE_CONFIG[t].bg}`}
                    />
                    {TYPE_CONFIG[t].label}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Leave Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, type: v as LeaveType }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
            </div>
            {leaveDays > 0 && (
              <div className="rounded-lg bg-violet-500/10 px-3 py-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-violet-500" />
                <span className="text-sm text-violet-600 dark:text-violet-400 font-medium">
                  {leaveDays} business day{leaveDays !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            <div>
              <Label>Reason (optional)</Label>
              <Textarea
                value={form.reason}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reason: e.target.value }))
                }
                placeholder="Briefly describe the reason for your leave…"
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitRequest}
              disabled={!form.startDate || !form.endDate}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
            >
              Submit Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Balance Edit Dialog */}
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Leave Balances</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {(["vacation", "sick", "personal"] as const).map((type) => (
              <div key={type}>
                <Label className="capitalize">{TYPE_CONFIG[type].label} Days</Label>
                <Input
                  type="number"
                  min={0}
                  value={editBalance[type]}
                  onChange={(e) =>
                    setEditBalance((b) => ({
                      ...b,
                      [type]: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="mt-1"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setBalanceDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setBalance(editBalance);
                setBalanceDialogOpen(false);
              }}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
            >
              Save Balances
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
