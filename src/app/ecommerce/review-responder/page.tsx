"use client";

import { useState } from "react";
import { MessageSquare, Copy, Check, Star, Trash2, Plus, BookOpen, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

interface CustomTemplate {
  id: string;
  name: string;
  rating: number;
  template: string;
}

interface ResponseHistory {
  id: string;
  customerName: string;
  productName: string;
  rating: number;
  reviewSnippet: string;
  response: string;
  createdAt: string;
}

type Tone = "Professional" | "Friendly" | "Empathetic";
type Length = "Short" | "Medium" | "Long";

function generateResponse(
  reviewText: string,
  rating: number,
  customerName: string,
  productName: string,
  tone: Tone,
  length: Length
): string {
  const name = customerName || "valued customer";
  const product = productName || "our product";
  const greeting = tone === "Professional"
    ? `Dear ${name},`
    : tone === "Friendly"
    ? `Hi ${name}!`
    : `Dear ${name},`;

  const signoff = tone === "Professional"
    ? "Best regards,\nCustomer Support Team"
    : tone === "Friendly"
    ? "Thanks again!\nThe Team"
    : "With warm regards,\nYour Support Team";

  if (rating === 5) {
    const bodies: Record<Length, string> = {
      Short: `Thank you so much for the wonderful 5-star review of ${product}! We're thrilled you're enjoying it. If you have a moment, we'd love if you shared your experience with friends and family.`,
      Medium: `Thank you so much for your amazing 5-star review of ${product}! Your kind words truly made our day. We're so glad that ${product} has met your expectations and that you're enjoying the experience.\n\nIf you love it as much as your review suggests, we'd be incredibly grateful if you shared your experience with friends, family, or on social media. Word of mouth from happy customers like you means the world to us!`,
      Long: `Thank you so much for taking the time to leave such a wonderful 5-star review of ${product}! Your kind words truly brighten our day and motivate our entire team.\n\nWe're absolutely thrilled to hear that ${product} has exceeded your expectations. It's feedback like yours that reminds us why we do what we do. Every detail in ${product} has been carefully crafted with customers like you in mind, and knowing it resonated with you means everything.\n\nIf you're loving your experience, we'd be incredibly grateful if you could share it with friends, family, or on your social media. Honest reviews and word-of-mouth recommendations from valued customers like you are the most powerful way to help others discover what makes ${product} special.\n\nWe'd also love for you to check out our other products - we think you'd enjoy them just as much!`,
    };
    return `${greeting}\n\n${bodies[length]}\n\n${signoff}`;
  }

  if (rating === 4) {
    const bodies: Record<Length, string> = {
      Short: `Thank you for the great review of ${product}! We're happy to hear you're enjoying it. We'd love to know what would make it a 5-star experience for you - your feedback helps us improve!`,
      Medium: `Thank you for your generous 4-star review of ${product}! We're really pleased that you've had a positive experience.\n\nWe're always striving for perfection, though, and we'd love to hear what would take your experience from great to exceptional. Is there anything specific we could improve to earn that 5th star? Your insights are invaluable to us.`,
      Long: `Thank you so much for your thoughtful 4-star review of ${product}! We truly appreciate you taking the time to share your experience, and we're delighted that ${product} has largely met your expectations.\n\nAt the same time, we notice there's room for us to grow. We're genuinely curious - what would it take to make your experience a perfect 5 stars? Whether it's a feature enhancement, a quality improvement, or anything else, your honest feedback is incredibly valuable to our team.\n\nWe take every piece of feedback seriously and use it to continuously improve. Please don't hesitate to reach out to us directly at any time - we're always here to help and listen.\n\nThank you for being a valued customer and for helping us get better every day!`,
    };
    return `${greeting}\n\n${bodies[length]}\n\n${signoff}`;
  }

  if (rating === 3) {
    const bodies: Record<Length, string> = {
      Short: `Thank you for your honest feedback about ${product}. We appreciate your perspective and would love to help improve your experience. Please reach out to our support team so we can make things right.`,
      Medium: `Thank you for your honest review of ${product}. We appreciate you sharing your experience, and we're sorry it wasn't everything you hoped for.\n\nYour feedback is truly important to us, and we want to make things better. We'd love the chance to understand your concerns in more detail and find a solution. Would you mind reaching out to our support team? We're committed to turning your experience around.`,
      Long: `Thank you for taking the time to share your honest feedback about ${product}. We genuinely appreciate your perspective, even when it highlights areas where we can do better.\n\nWe're sorry to hear that your experience wasn't everything you expected. Your satisfaction is our top priority, and we take your concerns seriously. We understand that a 3-star experience means there's significant room for improvement, and we want to address that.\n\nWe'd love the opportunity to learn more about what fell short and how we can make it right. Our support team is standing by and ready to help. Whether it's troubleshooting, a replacement, or simply listening to your detailed feedback, we're here for you.\n\nPlease don't hesitate to contact us directly. We're committed to ensuring every customer has an outstanding experience with ${product}.`,
    };
    return `${greeting}\n\n${bodies[length]}\n\n${signoff}`;
  }

  if (rating === 2) {
    const bodies: Record<Length, string> = {
      Short: `We sincerely apologize for your disappointing experience with ${product}. This isn't the standard we set for ourselves. Please contact our support team and we'll work to resolve this immediately.`,
      Medium: `We're truly sorry to hear about your disappointing experience with ${product}. Please know that this does not reflect the quality standards we hold ourselves to, and we take your feedback very seriously.\n\nWe want to make this right. Our support team is ready to help you with a resolution - whether that's a replacement, troubleshooting assistance, or a refund. Please reach out to us at your earliest convenience so we can address your concerns promptly.`,
      Long: `We're truly sorry to hear about your experience with ${product}. Reading your review, we can understand your frustration, and we sincerely apologize for not meeting your expectations.\n\nThis is not the experience we want any of our customers to have. We hold ourselves to high standards, and it's clear we fell short in your case. Your feedback is a wake-up call that we take very seriously.\n\nWe want to make this right for you. Our dedicated support team is standing by and ready to provide a personalized resolution. This could include a full replacement, detailed troubleshooting support, or a complete refund - whatever works best for you.\n\nPlease reach out to our support team at your earliest convenience. We've flagged your case as a priority, and we won't rest until you're satisfied with the outcome. You deserve better, and we're committed to delivering on that promise.`,
    };
    return `${greeting}\n\n${bodies[length]}\n\n${signoff}`;
  }

  // rating === 1
  const bodies: Record<Length, string> = {
    Short: `We are deeply sorry for your terrible experience with ${product}. We take this extremely seriously. Please contact our support team immediately - we will escalate this and make it right.`,
    Medium: `We are deeply sorry for your experience with ${product}. Please know that your review has been escalated to our senior support team for immediate attention.\n\nWe understand that words alone aren't enough - we need to take action. Please reach out to our support team right away, and we will prioritize your case. We're committed to providing a swift resolution and ensuring this doesn't happen to anyone else.`,
    Long: `We are deeply sorry for the experience you've had with ${product}. Reading your review, we can feel your frustration, and we want you to know that this has been escalated immediately to our senior management team.\n\nThis is completely unacceptable, and we take full responsibility. No customer should ever have this kind of experience, and we sincerely apologize for letting you down.\n\nWe want to make this right - not just for you, but to prevent this from happening to any future customer. Your case has been flagged as highest priority, and our senior support team is standing by to provide a comprehensive resolution.\n\nPlease contact our support team at your earliest convenience. We will be reaching out to you directly as well. We are committed to not only resolving your immediate concerns but also implementing changes to ensure this situation never occurs again.\n\nYou have our word that we will do everything in our power to restore your faith in our brand and our products.`,
  };
  return `${greeting}\n\n${bodies[length]}\n\n${signoff}`;
}

export default function ReviewResponderPage() {
  const [templates, setTemplates, hydrated] = useLocalStorage<CustomTemplate[]>("ecommerce-review-templates", []);
  const [history, setHistory] = useLocalStorage<ResponseHistory[]>("ecommerce-review-history", []);

  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [customerName, setCustomerName] = useState("");
  const [productName, setProductName] = useState("");
  const [tone, setTone] = useState<Tone>("Professional");
  const [length, setLength] = useState<Length>("Medium");

  const [generatedResponse, setGeneratedResponse] = useState("");
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"generate" | "templates" | "history">("generate");

  // Template form
  const [tplName, setTplName] = useState("");
  const [tplRating, setTplRating] = useState(5);
  const [tplText, setTplText] = useState("");

  const generate = () => {
    const response = generateResponse(reviewText, rating, customerName, productName, tone, length);
    setGeneratedResponse(response);
  };

  const copyResponse = async () => {
    if (!generatedResponse) return;
    await navigator.clipboard.writeText(generatedResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const markSent = () => {
    if (!generatedResponse) return;
    const entry: ResponseHistory = {
      id: generateId(),
      customerName,
      productName,
      rating,
      reviewSnippet: reviewText.slice(0, 100),
      response: generatedResponse,
      createdAt: new Date().toISOString(),
    };
    setHistory(prev => [entry, ...prev]);
  };

  const addTemplate = () => {
    if (!tplName.trim() || !tplText.trim()) return;
    const tpl: CustomTemplate = {
      id: generateId(),
      name: tplName,
      rating: tplRating,
      template: tplText,
    };
    setTemplates(prev => [...prev, tpl]);
    setTplName("");
    setTplText("");
  };

  const removeTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const useTemplate = (tpl: CustomTemplate) => {
    const filled = tpl.template
      .replace(/\{customer\}/g, customerName || "valued customer")
      .replace(/\{product\}/g, productName || "our product");
    setGeneratedResponse(filled);
    setView("generate");
  };

  const removeHistory = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const renderStars = (count: number, interactive = false, onChange?: (n: number) => void) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => interactive && onChange?.(n)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
          disabled={!interactive}
        >
          <Star
            className={`h-4 w-4 ${n <= count ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
          />
        </button>
      ))}
    </div>
  );

  if (!hydrated) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Response Generator"
        description="Generate professional responses to customer reviews with customizable tone and templates."
        icon={MessageSquare}
        badge="E-Commerce"
        replaces="Manual Review Responses"
      />

      <div className="flex gap-2 mb-4">
        {([
          { key: "generate" as const, label: "Generator", icon: Sparkles },
          { key: "templates" as const, label: `Templates (${templates.length})`, icon: BookOpen },
          { key: "history" as const, label: `History (${history.length})`, icon: MessageSquare },
        ]).map(v => (
          <Button
            key={v.key}
            variant={view === v.key ? "default" : "outline"}
            size="sm"
            onClick={() => setView(v.key)}
          >
            <v.icon className="h-4 w-4 mr-1" /> {v.label}
          </Button>
        ))}
      </div>

      {view === "generate" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Review Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Customer Review</Label>
                  <Textarea
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    placeholder="Paste the customer review here..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Star Rating</Label>
                  <div className="flex items-center gap-3">
                    {renderStars(rating, true, setRating)}
                    <span className="text-sm text-muted-foreground">{rating}/5</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Customer Name</Label>
                  <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="John Doe" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Product Name</Label>
                  <Input value={productName} onChange={e => setProductName(e.target.value)} placeholder="Widget Pro Max" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Response Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Tone</Label>
                  <div className="flex gap-1.5">
                    {(["Professional", "Friendly", "Empathetic"] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${
                          tone === t
                            ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Response Length</Label>
                  <div className="flex gap-1.5">
                    {(["Short", "Medium", "Long"] as const).map(l => (
                      <button
                        key={l}
                        onClick={() => setLength(l)}
                        className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${
                          length === l
                            ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={generate}
              className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
            >
              <Sparkles className="h-4 w-4 mr-2" /> Generate Response
            </Button>
          </div>

          {/* Output */}
          <div className="space-y-4">
            {!generatedResponse ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Enter review details and generate a response.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        Generated Response
                        {renderStars(rating)}
                      </CardTitle>
                      <Badge variant="secondary" className="text-[10px]">{tone} &middot; {length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={generatedResponse}
                      onChange={e => setGeneratedResponse(e.target.value)}
                      rows={12}
                      className="text-sm"
                    />
                  </CardContent>
                </Card>

                <div className="flex gap-2">
                  <Button onClick={copyResponse} variant="outline" className="flex-1">
                    {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? "Copied!" : "Copy Response"}
                  </Button>
                  <Button
                    onClick={markSent}
                    className="flex-1 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
                  >
                    <Check className="h-4 w-4 mr-2" /> Mark as Sent
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {view === "templates" && (
        <div className="space-y-4">
          {/* Add Template */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Create Custom Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Use <code className="bg-muted px-1 rounded">{"{customer}"}</code> and <code className="bg-muted px-1 rounded">{"{product}"}</code> as placeholders.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Template Name</Label>
                  <Input value={tplName} onChange={e => setTplName(e.target.value)} placeholder="e.g. Warranty Follow-up" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">For Rating</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(tplRating, true, setTplRating)}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Template Text</Label>
                <Textarea
                  value={tplText}
                  onChange={e => setTplText(e.target.value)}
                  placeholder={"Dear {customer},\n\nThank you for your review of {product}..."}
                  rows={5}
                />
              </div>
              <Button size="sm" onClick={addTemplate} disabled={!tplName.trim() || !tplText.trim()}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Save Template
              </Button>
            </CardContent>
          </Card>

          {/* Template List */}
          {templates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No custom templates yet. Create your first one above!</p>
              </CardContent>
            </Card>
          ) : (
            templates.map(tpl => (
              <Card key={tpl.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">{tpl.name}</CardTitle>
                      {renderStars(tpl.rating)}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => useTemplate(tpl)}>Use</Button>
                      <Button size="sm" variant="ghost" onClick={() => removeTemplate(tpl.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{tpl.template.slice(0, 300)}{tpl.template.length > 300 ? "..." : ""}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {view === "history" && (
        <div className="space-y-4">
          {history.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No response history yet. Generate and mark responses as sent.</p>
              </CardContent>
            </Card>
          ) : (
            history.map(entry => (
              <Card key={entry.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">{entry.customerName || "Anonymous"}</CardTitle>
                      {renderStars(entry.rating)}
                      <Badge variant="outline" className="text-[10px]">{entry.productName || "N/A"}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString()}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeHistory(entry.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {entry.reviewSnippet && (
                    <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground italic">
                      &ldquo;{entry.reviewSnippet}{entry.reviewSnippet.length >= 100 ? "..." : ""}&rdquo;
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{entry.response.slice(0, 300)}{entry.response.length > 300 ? "..." : ""}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
