"use client";

import { useState, useCallback } from "react";
import { LayoutTemplate, Copy, Check, Eye, Code, Edit2, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface Template {
  id: string;
  name: string;
  category: string;
  subject: string;
  heading: string;
  body: string;
  ctaText: string;
  ctaColor: string;
}

const BUILT_IN: Template[] = [
  { id: "welcome", name: "Welcome Email", category: "Onboarding", subject: "Welcome to {Brand}!", heading: "We're glad you're here!", body: "Thanks for joining us! Here's what you can expect:\n\n- Exclusive deals and offers\n- Early access to new products\n- Weekly tips and inspiration\n\nUse code WELCOME10 for 10% off your first order.", ctaText: "Shop Now", ctaColor: "#7c3aed" },
  { id: "order-confirm", name: "Order Confirmation", category: "Transactional", subject: "Order #{order_id} confirmed!", heading: "Your order is on its way!", body: "Great news — your order has been confirmed.\n\nOrder: #{order_id}\nTotal: ${total}\nEstimated delivery: 3-5 business days\n\nYou'll receive tracking info once it ships.", ctaText: "Track Order", ctaColor: "#059669" },
  { id: "abandoned", name: "Abandoned Cart", category: "Recovery", subject: "You left something behind!", heading: "Your cart misses you!", body: "You left some great items in your cart. Don't let them slip away!\n\nYour cart is saved and ready when you are.\n\nUse code COMEBACK10 for 10% off — limited time only.", ctaText: "Complete Purchase", ctaColor: "#dc2626" },
  { id: "winback", name: "Win-Back", category: "Re-engagement", subject: "We miss you, {name}!", heading: "It's been a while!", body: "We noticed you haven't visited us in a while. We've been busy making things even better.\n\nHere's an exclusive offer to welcome you back:\n20% off your next order with code MISSYOU20", ctaText: "Come Back", ctaColor: "#ea580c" },
  { id: "review", name: "Review Request", category: "Post-Purchase", subject: "How was your experience?", heading: "We'd love your feedback!", body: "Your opinion matters! Please take a moment to share your experience with your recent purchase.\n\nIt only takes 30 seconds and helps other shoppers make great choices.", ctaText: "Leave a Review", ctaColor: "#7c3aed" },
  { id: "newsletter", name: "Newsletter", category: "Content", subject: "This week at {Brand}", heading: "What's new this week", body: "Hello!\n\nHere's what's been happening this week:\n\n1. NEW: Spring collection is live\n2. TRENDING: Our bestsellers are back in stock\n3. TIP: How to style this season's must-haves\n\nThank you for being part of our community!", ctaText: "Read More", ctaColor: "#7c3aed" },
];

function buildHTML(t: Template): string {
  const bodyHtml = t.body.split("\n").map(l => l.trim() ? `<p style="margin:0 0 10px;line-height:1.6;color:#374151;">${l}</p>` : "<br/>").join("");
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${t.subject}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">
<tr><td style="background:linear-gradient(135deg,#7c3aed,#db2777);padding:24px 32px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:20px;">${t.subject}</h1></td></tr>
<tr><td style="padding:32px;"><h2 style="margin:0 0 16px;color:#111827;font-size:22px;">${t.heading}</h2>${bodyHtml}<div style="text-align:center;margin:24px 0;">
<a href="#" style="display:inline-block;padding:14px 28px;background:${t.ctaColor};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">${t.ctaText}</a></div></td></tr>
<tr><td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;"><p style="margin:0;color:#9ca3af;font-size:12px;">Unsubscribe | Update Preferences</p></td></tr>
</table></td></tr></table></body></html>`;
}

export default function TemplateLibPage() {
  const [custom, setCustom, hydrated] = useLocalStorage<Template[]>("email-template-lib", []);
  const [selected, setSelected] = useState<Template | null>(null);
  const [editing, setEditing] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);
  const [editState, setEditState] = useState<Template | null>(null);

  const allTemplates = [...BUILT_IN, ...custom];

  const handleCopy = useCallback(() => {
    if (!selected) return;
    navigator.clipboard.writeText(buildHTML(selected));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [selected]);

  const handleStartEdit = () => {
    if (!selected) return;
    setEditState({ ...selected });
    setEditing(true);
  };

  const handleSaveEdit = () => {
    if (!editState) return;
    const isBuiltIn = BUILT_IN.some(t => t.id === editState.id);
    if (isBuiltIn) {
      const newT = { ...editState, id: generateId() };
      setCustom(prev => [newT, ...prev]);
      setSelected(newT);
    } else {
      setCustom(prev => prev.map(t => t.id === editState.id ? editState : t));
      setSelected(editState);
    }
    setEditing(false);
  };

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Template Library"
        description="Pre-built email templates you can edit and export as HTML."
        icon={LayoutTemplate}
        badge="Free"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-2">
          {allTemplates.map(t => (
            <button key={t.id} onClick={() => { setSelected(t); setEditing(false); }}
              className={`w-full text-left rounded-lg border p-3 transition-all ${selected?.id === t.id ? "border-violet-500 bg-violet-500/10" : "hover:border-violet-300"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t.name}</span>
                <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">{t.subject}</p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {!selected ? (
            <Card><CardContent className="py-16 text-center">
              <LayoutTemplate className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Select a template to preview.</p>
            </CardContent></Card>
          ) : editing && editState ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Edit Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5"><Label className="text-xs">Subject</Label><Input value={editState.subject} onChange={e => setEditState({ ...editState, subject: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Heading</Label><Input value={editState.heading} onChange={e => setEditState({ ...editState, heading: e.target.value })} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Body</Label><Textarea rows={6} value={editState.body} onChange={e => setEditState({ ...editState, body: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label className="text-xs">CTA Text</Label><Input value={editState.ctaText} onChange={e => setEditState({ ...editState, ctaText: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">CTA Color</Label><div className="flex gap-2"><input type="color" value={editState.ctaColor} onChange={e => setEditState({ ...editState, ctaColor: e.target.value })} className="h-9 w-12 rounded border cursor-pointer bg-transparent" /><Input value={editState.ctaColor} onChange={e => setEditState({ ...editState, ctaColor: e.target.value })} className="font-mono text-xs" /></div></div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleSaveEdit}><Save className="h-4 w-4" /> Save</Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border overflow-hidden">
                  <button onClick={() => setViewMode("preview")} className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${viewMode === "preview" ? "bg-violet-600 text-white" : "hover:bg-muted"}`}><Eye className="h-3.5 w-3.5" /> Preview</button>
                  <button onClick={() => setViewMode("code")} className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${viewMode === "code" ? "bg-violet-600 text-white" : "hover:bg-muted"}`}><Code className="h-3.5 w-3.5" /> HTML</button>
                </div>
                <Button variant="outline" size="sm" onClick={handleStartEdit}><Edit2 className="h-3.5 w-3.5" /> Edit</Button>
                <Button variant="outline" size="sm" onClick={handleCopy} className="ml-auto">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied!" : "Copy HTML"}
                </Button>
              </div>
              <Card className="overflow-hidden">
                {viewMode === "preview" ? (
                  <div className="bg-[#f3f4f6] p-4 min-h-[400px]">
                    <div className="max-w-[500px] mx-auto bg-white rounded-xl overflow-hidden shadow-lg">
                      <div className="bg-gradient-to-r from-violet-600 to-pink-600 p-5 text-center"><h1 className="text-white font-bold text-lg">{selected.subject}</h1></div>
                      <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">{selected.heading}</h2>
                        <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{selected.body}</div>
                        <div className="text-center mt-6">
                          <span className="inline-block px-6 py-3 text-white font-semibold rounded-lg text-sm" style={{ backgroundColor: selected.ctaColor }}>{selected.ctaText}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 px-6 py-4 border-t text-center"><p className="text-xs text-gray-400">Unsubscribe | Update Preferences</p></div>
                    </div>
                  </div>
                ) : (
                  <pre className="p-4 text-xs font-mono overflow-auto max-h-[500px] bg-zinc-950 text-zinc-100 leading-relaxed">{buildHTML(selected)}</pre>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
