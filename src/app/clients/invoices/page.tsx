"use client";

import { useState, useMemo } from "react";
import {
  Receipt,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Printer,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  X,
  Building2,
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
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

interface PartyDetails {
  name: string;
  email: string;
  address: string;
  company: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  from: PartyDetails;
  to: PartyDetails;
  lineItems: LineItem[];
  taxRate: number;
  discount: number;
  notes: string;
  dueDate: string;
  status: InvoiceStatus;
  createdAt: string;
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; icon: React.ElementType; className: string }> = {
  draft: { label: "Draft", icon: Clock, className: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-0" },
  sent: { label: "Sent", icon: Send, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0" },
  paid: { label: "Paid", icon: CheckCircle, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0" },
  overdue: { label: "Overdue", icon: AlertCircle, className: "bg-red-500/10 text-red-600 dark:text-red-400 border-0" },
};

const EMPTY_FROM: PartyDetails = { name: "", email: "", address: "", company: "" };
const EMPTY_TO: PartyDetails = { name: "", email: "", address: "", company: "" };

function newLineItem(): LineItem {
  return { id: generateId(), description: "", quantity: 1, rate: 0 };
}

function calcInvoice(items: LineItem[], taxRate: number, discount: number) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.rate, 0);
  const discountAmt = (subtotal * discount) / 100;
  const taxable = subtotal - discountAmt;
  const taxAmt = (taxable * taxRate) / 100;
  const total = taxable + taxAmt;
  return { subtotal, discountAmt, taxAmt, total };
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>("invoices", []);
  const [invoiceCounter, setInvoiceCounter] = useLocalStorage<number>("invoice-counter", 1);
  const [view, setView] = useState<"list" | "form">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);

  const [from, setFrom] = useState<PartyDetails>(EMPTY_FROM);
  const [to, setTo] = useState<PartyDetails>(EMPTY_TO);
  const [lineItems, setLineItems] = useState<LineItem[]>([newLineItem()]);
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<InvoiceStatus>("draft");

  const { subtotal, discountAmt, taxAmt, total } = useMemo(
    () => calcInvoice(lineItems, taxRate, discount),
    [lineItems, taxRate, discount]
  );

  const stats = useMemo(() => {
    const paid = invoices.filter((i) => i.status === "paid").reduce((s, i) => {
      const { total } = calcInvoice(i.lineItems, i.taxRate, i.discount);
      return s + total;
    }, 0);
    const pending = invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => {
      const { total } = calcInvoice(i.lineItems, i.taxRate, i.discount);
      return s + total;
    }, 0);
    return { paid, pending, total: invoices.length, overdue: invoices.filter((i) => i.status === "overdue").length };
  }, [invoices]);

  function startNew() {
    setFrom(EMPTY_FROM);
    setTo(EMPTY_TO);
    setLineItems([newLineItem()]);
    setTaxRate(0);
    setDiscount(0);
    setNotes("");
    setDueDate("");
    setStatus("draft");
    setEditingId(null);
    setView("form");
  }

  function startEdit(inv: Invoice) {
    setFrom(inv.from);
    setTo(inv.to);
    setLineItems(inv.lineItems);
    setTaxRate(inv.taxRate);
    setDiscount(inv.discount);
    setNotes(inv.notes);
    setDueDate(inv.dueDate);
    setStatus(inv.status);
    setEditingId(inv.id);
    setView("form");
  }

  function handleSave() {
    if (!to.name.trim()) return;
    if (editingId) {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === editingId
            ? { ...inv, from, to, lineItems, taxRate, discount, notes, dueDate, status }
            : inv
        )
      );
    } else {
      const invNum = `INV-${String(invoiceCounter).padStart(4, "0")}`;
      setInvoiceCounter((n) => n + 1);
      setInvoices((prev) => [
        {
          id: generateId(),
          invoiceNumber: invNum,
          from,
          to,
          lineItems,
          taxRate,
          discount,
          notes,
          dueDate,
          status,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
    setView("list");
  }

  function handleDelete(id: string) {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  }

  function updateStatus(id: string, s: InvoiceStatus) {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status: s } : inv)));
  }

  function updateLineItem(id: string, field: keyof LineItem, val: string | number) {
    setLineItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: val } : i)));
  }

  const PartyForm = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: PartyDetails;
    onChange: (v: PartyDetails) => void;
  }) => (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" /> {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} placeholder="Full name" />
        </div>
        <div className="space-y-1.5">
          <Label>Company</Label>
          <Input value={value.company} onChange={(e) => onChange({ ...value, company: e.target.value })} placeholder="Company" />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" value={value.email} onChange={(e) => onChange({ ...value, email: e.target.value })} placeholder="email@example.com" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Address</Label>
          <Input value={value.address} onChange={(e) => onChange({ ...value, address: e.target.value })} placeholder="Street, City, Country" />
        </div>
      </CardContent>
    </Card>
  );

  const InvoiceDocument = ({ inv }: { inv: Invoice }) => {
    const { subtotal, discountAmt, taxAmt, total } = calcInvoice(inv.lineItems, inv.taxRate, inv.discount);
    const cfg = STATUS_CONFIG[inv.status];
    return (
      <div className="bg-white dark:bg-slate-950 p-8 rounded-xl border border-border/50 space-y-6 text-sm print:shadow-none print:border-none">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 mb-3" />
            <h1 className="text-3xl font-black text-foreground">INVOICE</h1>
            <p className="text-muted-foreground mt-1 font-mono">{inv.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <Badge className={cfg.className}>{cfg.label}</Badge>
            <p className="text-muted-foreground text-xs mt-2">Date: {new Date(inv.createdAt).toLocaleDateString()}</p>
            {inv.dueDate && <p className="text-muted-foreground text-xs">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>}
          </div>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">From</p>
            <p className="font-semibold">{inv.from.name || "—"}</p>
            {inv.from.company && <p className="text-muted-foreground">{inv.from.company}</p>}
            {inv.from.email && <p className="text-muted-foreground">{inv.from.email}</p>}
            {inv.from.address && <p className="text-muted-foreground">{inv.from.address}</p>}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Bill To</p>
            <p className="font-semibold">{inv.to.name || "—"}</p>
            {inv.to.company && <p className="text-muted-foreground">{inv.to.company}</p>}
            {inv.to.email && <p className="text-muted-foreground">{inv.to.email}</p>}
            {inv.to.address && <p className="text-muted-foreground">{inv.to.address}</p>}
          </div>
        </div>

        <Separator />

        {/* Line Items */}
        <div>
          <div className="grid grid-cols-12 gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
            <div className="col-span-6">Description</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-2 text-right">Rate</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>
          <div className="space-y-2">
            {inv.lineItems.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2">
                <div className="col-span-6">{item.description || "—"}</div>
                <div className="col-span-2 text-center text-muted-foreground">{item.quantity}</div>
                <div className="col-span-2 text-right text-muted-foreground">${item.rate.toFixed(2)}</div>
                <div className="col-span-2 text-right font-medium">${(item.quantity * item.rate).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            {inv.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount ({inv.discount}%)</span><span>-${discountAmt.toFixed(2)}</span>
              </div>
            )}
            {inv.taxRate > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax ({inv.taxRate}%)</span><span>${taxAmt.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-violet-600 dark:text-violet-400">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {inv.notes && (
          <>
            <Separator />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
              <p className="text-muted-foreground">{inv.notes}</p>
            </div>
          </>
        )}
      </div>
    );
  };

  if (view === "form") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader
            title={editingId ? "Edit Invoice" : "New Invoice"}
            description="Fill in the details to generate a professional invoice"
            icon={Receipt}
          />
          <Button variant="outline" onClick={() => setView("list")}>Back to List</Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <PartyForm label="From (Your Details)" value={from} onChange={setFrom} />
            <PartyForm label="Bill To (Client)" value={to} onChange={setTo} />

            {/* Line Items */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Line Items</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setLineItems((p) => [...p, newLineItem()])}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Line
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium mb-1">
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-center">Rate ($)</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-1" />
                </div>
                {lineItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Input
                        placeholder="Service description"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                        className="text-center"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate || ""}
                        onChange={(e) => updateLineItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2 text-right text-sm font-medium">
                      ${(item.quantity * item.rate).toFixed(2)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {lineItems.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-destructive"
                          onClick={() => setLineItems((p) => p.filter((i) => i.id !== item.id))}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <Separator className="my-3" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Discount (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={discount || ""}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={taxRate || ""}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-1.5 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount ({discount}%)</span><span>-${discountAmt.toFixed(2)}</span>
                    </div>
                  )}
                  {taxRate > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax ({taxRate}%)</span><span>${taxAmt.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span className="text-violet-600 dark:text-violet-400">${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-4">
                <div className="space-y-1.5">
                  <Label>Notes / Payment Instructions</Label>
                  <Textarea
                    placeholder="Bank details, payment methods, thank you message..."
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setView("list")}>Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={!to.name.trim()}
                className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0"
              >
                {editingId ? "Save Changes" : "Save Invoice"}
              </Button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Live Preview</h3>
            <div className="sticky top-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
              <InvoiceDocument
                inv={{
                  id: "preview",
                  invoiceNumber: editingId ? "EDITING" : `INV-${String(invoiceCounter).padStart(4, "0")}`,
                  from,
                  to,
                  lineItems,
                  taxRate,
                  discount,
                  notes,
                  dueDate,
                  status,
                  createdAt: new Date().toISOString(),
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Invoice Generator"
          description="Create, track and manage professional invoices"
          icon={Receipt}
          badge="Generator"
          replaces="FreshBooks / Wave"
        />
        <Button
          onClick={startNew}
          className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0"
        >
          <Plus className="h-4 w-4 mr-2" /> New Invoice
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Invoices", value: stats.total, icon: Receipt, color: "text-violet-600 dark:text-violet-400" },
          { label: "Revenue Collected", value: `$${stats.paid.toFixed(0)}`, icon: CheckCircle, color: "text-emerald-600" },
          { label: "Pending Collection", value: `$${stats.pending.toFixed(0)}`, icon: Clock, color: "text-amber-600" },
          { label: "Overdue", value: stats.overdue, icon: AlertCircle, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center mb-3">
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {invoices.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center mb-4">
              <Receipt className="h-7 w-7 text-violet-400" />
            </div>
            <p className="font-medium text-muted-foreground mb-1">No invoices yet</p>
            <p className="text-sm text-muted-foreground/70">Create your first invoice to start tracking payments</p>
            <Button onClick={startNew} className="mt-4" variant="outline">
              <Plus className="h-4 w-4 mr-2" /> Create Invoice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const { total } = calcInvoice(inv.lineItems, inv.taxRate, inv.discount);
            const cfg = STATUS_CONFIG[inv.status];
            return (
              <Card key={inv.id} className="border-border/50 hover:border-violet-500/30 transition-colors group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono font-semibold text-sm">{inv.invoiceNumber}</span>
                        <Badge className={cfg.className}>{cfg.label}</Badge>
                      </div>
                      <p className="text-sm font-medium">{inv.to.name}{inv.to.company ? ` · ${inv.to.company}` : ""}</p>
                      <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{new Date(inv.createdAt).toLocaleDateString()}</span>
                        {inv.dueDate && <span>Due: {new Date(inv.dueDate).toLocaleDateString()}</span>}
                        <span>{inv.lineItems.length} line item{inv.lineItems.length !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-lg">${total.toFixed(2)}</p>
                      </div>
                      <Select value={inv.status} onValueChange={(v) => updateStatus(inv.id, v as InvoiceStatus)}>
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPrintInvoice(inv)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(inv)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(inv.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Invoice Preview/Print Dialog */}
      <Dialog open={!!printInvoice} onOpenChange={(o) => !o && setPrintInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Invoice Preview</DialogTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.print()}
                className="mr-8"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
              </Button>
            </div>
          </DialogHeader>
          {printInvoice && <InvoiceDocument inv={printInvoice} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
