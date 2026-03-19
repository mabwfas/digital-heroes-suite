"use client";

import { useState, useMemo } from "react";
import {
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Timer,
  Search,
  Calendar,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type OrderStatus = "pending" | "in-progress" | "delivered" | "completed" | "cancelled";

interface Order {
  id: string;
  orderNumber: string;
  client: string;
  service: string;
  amount: number;
  status: OrderStatus;
  deadline: string;
  notes: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: React.ElementType; className: string; bg: string }> = {
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0",
    bg: "from-amber-500/5 to-amber-500/10",
  },
  "in-progress": {
    label: "In Progress",
    icon: Timer,
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0",
    bg: "from-blue-500/5 to-blue-500/10",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-0",
    bg: "from-violet-500/5 to-violet-500/10",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0",
    bg: "from-emerald-500/5 to-emerald-500/10",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-0",
    bg: "from-red-500/5 to-red-500/10",
  },
};

const EMPTY_FORM = (): Omit<Order, "id" | "orderNumber" | "createdAt"> => ({
  client: "",
  service: "",
  amount: 0,
  status: "pending",
  deadline: "",
  notes: "",
});

function getDeadlineInfo(deadline: string, status: OrderStatus) {
  if (!deadline || status === "completed" || status === "cancelled") return null;
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, urgent: true, color: "text-red-500" };
  if (diff === 0) return { label: "Due today", urgent: true, color: "text-red-500" };
  if (diff === 1) return { label: "Due tomorrow", urgent: true, color: "text-amber-600 dark:text-amber-400" };
  if (diff <= 3) return { label: `${diff}d left`, urgent: true, color: "text-amber-600 dark:text-amber-400" };
  return { label: `${diff}d left`, urgent: false, color: "text-muted-foreground" };
}

function getThisMonthEarnings(orders: Order[]) {
  const now = new Date();
  return orders
    .filter((o) => {
      if (o.status !== "completed") return false;
      const d = new Date(o.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, o) => s + o.amount, 0);
}

export default function OrdersPage() {
  const [orders, setOrders] = useLocalStorage<Order[]>("fiverr-orders", []);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | OrderStatus>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM());

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.client.toLowerCase().includes(search.toLowerCase()) ||
        o.service.toLowerCase().includes(search.toLowerCase()) ||
        o.orderNumber.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || o.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [orders, search, filterStatus]);

  const stats = useMemo(() => {
    const totalRevenue = orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.amount, 0);
    const pendingRevenue = orders.filter((o) => ["pending", "in-progress", "delivered"].includes(o.status)).reduce((s, o) => s + o.amount, 0);
    const thisMonth = getThisMonthEarnings(orders);
    const activeCount = orders.filter((o) => o.status === "in-progress").length;
    return { totalRevenue, pendingRevenue, thisMonth, activeCount };
  }, [orders]);

  function openAdd() {
    setForm(EMPTY_FORM());
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(order: Order) {
    setForm({
      client: order.client,
      service: order.service,
      amount: order.amount,
      status: order.status,
      deadline: order.deadline,
      notes: order.notes,
    });
    setEditingId(order.id);
    setShowForm(true);
  }

  function handleSave() {
    if (!form.client.trim() || !form.service.trim()) return;
    if (editingId) {
      setOrders((prev) =>
        prev.map((o) => (o.id === editingId ? { ...o, ...form } : o))
      );
    } else {
      const orderNum = `ORD-${Date.now().toString().slice(-6)}`;
      setOrders((prev) => [
        {
          ...form,
          id: generateId(),
          orderNumber: orderNum,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    setShowForm(false);
    setEditingId(null);
  }

  function handleDelete(id: string) {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }

  function updateStatus(id: string, status: OrderStatus) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fiverr Order Tracker"
        description="Track orders, earnings and deadlines across all your freelance platforms"
        icon={ShoppingBag}
        badge="Tracker"
        replaces="Spreadsheets"
      />

      {/* Earnings Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Earned",
            value: `$${stats.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: "text-emerald-600 dark:text-emerald-400",
            grad: "from-emerald-500/10 to-emerald-500/5",
          },
          {
            label: "This Month",
            value: `$${stats.thisMonth.toLocaleString()}`,
            icon: TrendingUp,
            color: "text-violet-600 dark:text-violet-400",
            grad: "from-violet-500/10 to-pink-500/5",
          },
          {
            label: "Pending Revenue",
            value: `$${stats.pendingRevenue.toLocaleString()}`,
            icon: Clock,
            color: "text-amber-600 dark:text-amber-400",
            grad: "from-amber-500/10 to-amber-500/5",
          },
          {
            label: "Active Orders",
            value: stats.activeCount,
            icon: Timer,
            color: "text-blue-600 dark:text-blue-400",
            grad: "from-blue-500/10 to-blue-500/5",
          },
        ].map((s) => (
          <Card key={s.label} className="border-border/50 overflow-hidden">
            <CardContent className="p-4">
              <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${s.grad} flex items-center justify-center mb-3`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Breakdown */}
      <div className="flex flex-wrap gap-2">
        {(["all", "pending", "in-progress", "delivered", "completed", "cancelled"] as const).map((s) => {
          const count = s === "all" ? orders.length : orders.filter((o) => o.status === s).length;
          const isActive = filterStatus === s;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-sm"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              {s === "all" ? "All" : STATUS_CONFIG[s].label} ({count})
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client, service or order number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={openAdd}
          className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0 shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Order
        </Button>
      </div>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center mb-4">
              <ShoppingBag className="h-7 w-7 text-violet-400" />
            </div>
            <p className="font-medium text-muted-foreground mb-1">No orders found</p>
            <p className="text-sm text-muted-foreground/70">
              {search || filterStatus !== "all" ? "Try adjusting filters" : "Add your first order to start tracking"}
            </p>
            {!search && filterStatus === "all" && (
              <Button onClick={openAdd} className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Add Order
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const cfg = STATUS_CONFIG[order.status];
            const StatusIcon = cfg.icon;
            const deadline = getDeadlineInfo(order.deadline, order.status);

            return (
              <Card key={order.id} className={`border-border/50 hover:border-violet-500/30 transition-colors group overflow-hidden`}>
                <div className={`h-1 bg-gradient-to-r ${cfg.bg} border-b border-border/30`} />
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${cfg.bg} flex items-center justify-center shrink-0`}>
                      <StatusIcon className={`h-4 w-4 ${cfg.className.split(" ")[1]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{order.orderNumber}</span>
                        <Badge className={cfg.className}>{cfg.label}</Badge>
                        {deadline && (
                          <span className={`flex items-center gap-1 text-xs font-medium ${deadline.color}`}>
                            <Timer className="h-3 w-3" />
                            {deadline.label}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold">{order.service}</p>
                      <p className="text-sm text-muted-foreground">
                        Client: <span className="font-medium text-foreground">{order.client}</span>
                      </p>
                      {order.notes && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{order.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                          ${order.amount.toLocaleString()}
                        </p>
                        {order.deadline && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {new Date(order.deadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v as OrderStatus)}>
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(order)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => handleDelete(order.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Order" : "New Order"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Client Name *</Label>
                <Input
                  placeholder="Client username"
                  value={form.client}
                  onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount || ""}
                  onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Service / Package *</Label>
              <Input
                placeholder="e.g. Shopify Store Design - Standard"
                value={form.service}
                onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as OrderStatus }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                placeholder="Order details, special requirements, revision notes..."
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.client.trim() || !form.service.trim()}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0"
            >
              {editingId ? "Save Changes" : "Add Order"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
