"use client";

import { useState, useMemo } from "react";
import { CreditCard, Plus, Trash2, Edit2, Copy, Check, Download } from "lucide-react";
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

interface ServiceTier {
  name: string;
  price: number;
  features: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  deliveryTime: string;
  inclusions: string;
  tiers: ServiceTier[];
}

const CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "\u20AC" },
  { code: "GBP", symbol: "\u00A3" },
  { code: "CAD", symbol: "C$" },
  { code: "AUD", symbol: "A$" },
];

export default function RateCardPage() {
  const [services, setServices] = useLocalStorage<Service[]>("agency-rate-card", []);
  const [currency, setCurrency] = useLocalStorage<string>("agency-rate-currency", "USD");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [inclusions, setInclusions] = useState("");
  const [tiers, setTiers] = useState<ServiceTier[]>([
    { name: "Basic", price: 0, features: "" },
    { name: "Standard", price: 0, features: "" },
    { name: "Premium", price: 0, features: "" },
  ]);
  const [copied, setCopied] = useState(false);

  const sym = CURRENCIES.find((c) => c.code === currency)?.symbol || "$";

  function openAdd() {
    setName(""); setDescription(""); setDeliveryTime(""); setInclusions("");
    setTiers([{ name: "Basic", price: 0, features: "" }, { name: "Standard", price: 0, features: "" }, { name: "Premium", price: 0, features: "" }]);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(s: Service) {
    setName(s.name); setDescription(s.description); setDeliveryTime(s.deliveryTime); setInclusions(s.inclusions);
    setTiers(s.tiers.length > 0 ? [...s.tiers] : [{ name: "Basic", price: 0, features: "" }]);
    setEditingId(s.id);
    setShowForm(true);
  }

  function updateTier(idx: number, field: keyof ServiceTier, value: string | number) {
    setTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));
  }

  function handleSave() {
    if (!name.trim()) return;
    const service: Service = { id: editingId || generateId(), name: name.trim(), description: description.trim(), deliveryTime: deliveryTime.trim(), inclusions: inclusions.trim(), tiers: tiers.filter((t) => t.name.trim()) };
    if (editingId) {
      setServices((prev) => prev.map((s) => (s.id === editingId ? service : s)));
    } else {
      setServices((prev) => [service, ...prev]);
    }
    setShowForm(false);
  }

  function handleDelete(id: string) {
    setServices((prev) => prev.filter((s) => s.id !== id));
  }

  function exportRateCard() {
    const lines = [`RATE CARD (${currency})`, "=".repeat(50), ""];
    services.forEach((s) => {
      lines.push(s.name.toUpperCase());
      if (s.description) lines.push(s.description);
      if (s.deliveryTime) lines.push(`Delivery: ${s.deliveryTime}`);
      if (s.inclusions) lines.push(`Includes: ${s.inclusions}`);
      lines.push("");
      s.tiers.forEach((t) => {
        lines.push(`  ${t.name}: ${sym}${t.price.toLocaleString()}`);
        if (t.features) lines.push(`    ${t.features}`);
      });
      lines.push("", "-".repeat(50), "");
    });
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rate Card Builder"
        description="Define services with tier pricing, delivery times, and inclusions. Export a formatted rate card."
        icon={CreditCard}
        badge="Agency"
        replaces="PDF rate cards"
        actions={
          <div className="flex items-center gap-2">
            <Select value={currency} onValueChange={(v) => setCurrency(v ?? "USD")}>
              <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" onClick={exportRateCard} disabled={services.length === 0}>
              {copied ? <Check className="h-4 w-4 mr-2 text-emerald-500" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? "Copied!" : "Export"}
            </Button>
          </div>
        }
      />

      <Button onClick={openAdd} className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
        <Plus className="h-4 w-4 mr-2" />Add Service
      </Button>

      {services.length === 0 ? (
        <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16"><CreditCard className="h-10 w-10 text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">No services added yet</p></CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {services.map((s) => (
            <Card key={s.id} className="border-border/50 group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-semibold text-lg">{s.name}</span>
                    {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      {s.deliveryTime && <span>Delivery: {s.deliveryTime}</span>}
                      {s.inclusions && <span>Includes: {s.inclusions}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Edit2 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {s.tiers.map((t, i) => (
                    <div key={i} className={`p-4 rounded-lg border ${i === 1 ? "bg-gradient-to-br from-violet-500/10 to-pink-500/10 border-violet-500/20" : "bg-muted/30"}`}>
                      <p className="text-sm font-medium mb-1">{t.name}</p>
                      <p className="text-2xl font-bold">{sym}{t.price.toLocaleString()}</p>
                      {t.features && <p className="text-xs text-muted-foreground mt-2">{t.features}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit Service" : "Add Service"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5"><Label>Service Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Delivery Time</Label><Input value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} placeholder="e.g. 2-3 weeks" /></div>
              <div className="space-y-1.5"><Label>Inclusions</Label><Input value={inclusions} onChange={(e) => setInclusions(e.target.value)} placeholder="e.g. 2 revisions" /></div>
            </div>
            <div className="border rounded-lg p-3 space-y-3">
              <p className="text-sm font-medium">Pricing Tiers</p>
              {tiers.map((t, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <Input value={t.name} onChange={(e) => updateTier(i, "name", e.target.value)} placeholder="Tier name" className="h-8" />
                  <Input type="number" min="0" value={t.price || ""} onChange={(e) => updateTier(i, "price", parseFloat(e.target.value) || 0)} placeholder="Price" className="h-8" />
                  <Input value={t.features} onChange={(e) => updateTier(i, "features", e.target.value)} placeholder="Features" className="h-8" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={handleSave} disabled={!name.trim()}>Save</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
