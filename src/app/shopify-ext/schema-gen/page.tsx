"use client";

import { useState } from "react";
import { Code, Copy, Check, AlertCircle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/lib/hooks";

type SchemaType = "Product" | "FAQPage" | "BreadcrumbList" | "Article" | "LocalBusiness" | "Organization";

interface SchemaFields {
  [key: string]: string;
}

const SCHEMA_FIELDS: Record<SchemaType, { label: string; fields: { key: string; label: string; placeholder: string; required?: boolean }[] }> = {
  Product: {
    label: "Product",
    fields: [
      { key: "name", label: "Product Name", placeholder: "e.g., Premium Widget", required: true },
      { key: "description", label: "Description", placeholder: "Product description..." },
      { key: "image", label: "Image URL", placeholder: "https://..." },
      { key: "sku", label: "SKU", placeholder: "e.g., WDG-001" },
      { key: "brand", label: "Brand", placeholder: "Brand name" },
      { key: "price", label: "Price", placeholder: "29.99", required: true },
      { key: "currency", label: "Currency", placeholder: "USD" },
      { key: "availability", label: "Availability", placeholder: "InStock / OutOfStock" },
      { key: "ratingValue", label: "Rating Value", placeholder: "4.5" },
      { key: "reviewCount", label: "Review Count", placeholder: "42" },
    ],
  },
  FAQPage: {
    label: "FAQ Page",
    fields: [
      { key: "faqs", label: "FAQs (Q|A per line)", placeholder: "What is this?|This is a product.\nHow much?|$29.99", required: true },
    ],
  },
  BreadcrumbList: {
    label: "Breadcrumb",
    fields: [
      { key: "items", label: "Breadcrumbs (name|url per line)", placeholder: "Home|https://example.com\nProducts|https://example.com/products\nWidget|https://example.com/products/widget", required: true },
    ],
  },
  Article: {
    label: "Article",
    fields: [
      { key: "headline", label: "Headline", placeholder: "Article title", required: true },
      { key: "description", label: "Description", placeholder: "Article description" },
      { key: "image", label: "Image URL", placeholder: "https://..." },
      { key: "authorName", label: "Author Name", placeholder: "John Doe", required: true },
      { key: "publisherName", label: "Publisher Name", placeholder: "My Blog" },
      { key: "publisherLogo", label: "Publisher Logo URL", placeholder: "https://..." },
      { key: "datePublished", label: "Date Published", placeholder: "2024-01-15" },
      { key: "dateModified", label: "Date Modified", placeholder: "2024-01-20" },
    ],
  },
  LocalBusiness: {
    label: "Local Business",
    fields: [
      { key: "name", label: "Business Name", placeholder: "My Store", required: true },
      { key: "description", label: "Description", placeholder: "Business description" },
      { key: "image", label: "Image URL", placeholder: "https://..." },
      { key: "telephone", label: "Phone", placeholder: "+1-555-000-0000" },
      { key: "streetAddress", label: "Street Address", placeholder: "123 Main St" },
      { key: "city", label: "City", placeholder: "New York" },
      { key: "state", label: "State", placeholder: "NY" },
      { key: "postalCode", label: "Postal Code", placeholder: "10001" },
      { key: "country", label: "Country", placeholder: "US" },
      { key: "openingHours", label: "Opening Hours", placeholder: "Mo-Fr 09:00-17:00" },
    ],
  },
  Organization: {
    label: "Organization",
    fields: [
      { key: "name", label: "Organization Name", placeholder: "My Company", required: true },
      { key: "url", label: "Website URL", placeholder: "https://example.com", required: true },
      { key: "logo", label: "Logo URL", placeholder: "https://..." },
      { key: "description", label: "Description", placeholder: "Organization description" },
      { key: "email", label: "Email", placeholder: "info@example.com" },
      { key: "telephone", label: "Phone", placeholder: "+1-555-000-0000" },
      { key: "sameAs", label: "Social URLs (one per line)", placeholder: "https://twitter.com/...\nhttps://linkedin.com/..." },
    ],
  },
};

function generateJsonLd(type: SchemaType, fields: SchemaFields): string {
  const f = fields;
  let schema: Record<string, unknown> = { "@context": "https://schema.org" };

  if (type === "Product") {
    schema = { ...schema, "@type": "Product", name: f.name, description: f.description, image: f.image, sku: f.sku, brand: f.brand ? { "@type": "Brand", name: f.brand } : undefined, offers: { "@type": "Offer", price: f.price, priceCurrency: f.currency || "USD", availability: `https://schema.org/${f.availability || "InStock"}` } };
    if (f.ratingValue) schema.aggregateRating = { "@type": "AggregateRating", ratingValue: f.ratingValue, reviewCount: f.reviewCount || "1" };
  } else if (type === "FAQPage") {
    const faqs = (f.faqs || "").split("\n").filter(Boolean).map((line) => { const [q, a] = line.split("|"); return { "@type": "Question", name: q?.trim(), acceptedAnswer: { "@type": "Answer", text: a?.trim() } }; });
    schema = { ...schema, "@type": "FAQPage", mainEntity: faqs };
  } else if (type === "BreadcrumbList") {
    const items = (f.items || "").split("\n").filter(Boolean).map((line, i) => { const [name, url] = line.split("|"); return { "@type": "ListItem", position: i + 1, name: name?.trim(), item: url?.trim() }; });
    schema = { ...schema, "@type": "BreadcrumbList", itemListElement: items };
  } else if (type === "Article") {
    schema = { ...schema, "@type": "Article", headline: f.headline, description: f.description, image: f.image, author: { "@type": "Person", name: f.authorName }, publisher: { "@type": "Organization", name: f.publisherName, logo: f.publisherLogo ? { "@type": "ImageObject", url: f.publisherLogo } : undefined }, datePublished: f.datePublished, dateModified: f.dateModified };
  } else if (type === "LocalBusiness") {
    schema = { ...schema, "@type": "LocalBusiness", name: f.name, description: f.description, image: f.image, telephone: f.telephone, address: { "@type": "PostalAddress", streetAddress: f.streetAddress, addressLocality: f.city, addressRegion: f.state, postalCode: f.postalCode, addressCountry: f.country }, openingHours: f.openingHours };
  } else if (type === "Organization") {
    const sameAs = (f.sameAs || "").split("\n").map((s) => s.trim()).filter(Boolean);
    schema = { ...schema, "@type": "Organization", name: f.name, url: f.url, logo: f.logo, description: f.description, email: f.email, telephone: f.telephone, sameAs: sameAs.length > 0 ? sameAs : undefined };
  }

  // Remove undefined values
  const clean = (obj: unknown): unknown => {
    if (Array.isArray(obj)) return obj.map(clean);
    if (obj && typeof obj === "object") {
      return Object.fromEntries(Object.entries(obj as Record<string, unknown>).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, clean(v)]));
    }
    return obj;
  };

  return JSON.stringify(clean(schema), null, 2);
}

function validateJsonLd(json: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  try {
    const parsed = JSON.parse(json);
    if (!parsed["@context"]) errors.push("Missing @context");
    if (!parsed["@type"]) errors.push("Missing @type");
    if (!parsed.name && !parsed.headline && !parsed.mainEntity && !parsed.itemListElement) errors.push("Missing main content field");
  } catch {
    errors.push("Invalid JSON");
  }
  return { valid: errors.length === 0, errors };
}

export default function SchemaGenPage() {
  const [schemaType, setSchemaType] = useLocalStorage<SchemaType>("schema-gen-type", "Product");
  const [fields, setFields] = useLocalStorage<SchemaFields>("schema-gen-fields", {});
  const [copied, setCopied] = useState(false);

  const output = generateJsonLd(schemaType, fields);
  const validation = validateJsonLd(output);
  const scriptTag = `<script type="application/ld+json">\n${output}\n</script>`;

  function copyOutput() {
    navigator.clipboard.writeText(scriptTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Schema Markup Generator"
        description="Generate valid JSON-LD structured data for Shopify SEO"
        icon={Code}
        badge="Shopify Ext"
        replaces="Schema generators / Manual coding"
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Schema Type</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(SCHEMA_FIELDS) as SchemaType[]).map((type) => (
                  <Button key={type} variant={schemaType === type ? "default" : "outline"} size="sm" className="text-xs" onClick={() => { setSchemaType(type); setFields({}); }}>
                    {SCHEMA_FIELDS[type].label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Fields</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {SCHEMA_FIELDS[schemaType].fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label className="text-xs">{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
                  {field.placeholder.includes("\n") ? (
                    <Textarea placeholder={field.placeholder} value={fields[field.key] || ""} onChange={(e) => setFields((prev) => ({ ...prev, [field.key]: e.target.value }))} rows={3} className="text-sm" />
                  ) : (
                    <Input placeholder={field.placeholder} value={fields[field.key] || ""} onChange={(e) => setFields((prev) => ({ ...prev, [field.key]: e.target.value }))} className="h-8 text-sm" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm">Generated JSON-LD</CardTitle>
                  {validation.valid ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-1" /> Valid</Badge>
                  ) : (
                    <Badge className="bg-red-500/10 text-red-600 border-0 text-[10px]"><AlertCircle className="h-3 w-3 mr-1" /> Issues</Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={copyOutput}>
                  {copied ? <><Check className="h-3.5 w-3.5 mr-1" /> Copied</> : <><Copy className="h-3.5 w-3.5 mr-1" /> Copy</>}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!validation.valid && (
                <div className="mb-3 space-y-1">
                  {validation.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {err}</p>
                  ))}
                </div>
              )}
              <pre className="bg-muted/50 rounded-md p-4 text-xs overflow-x-auto font-mono whitespace-pre-wrap">{scriptTag}</pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
