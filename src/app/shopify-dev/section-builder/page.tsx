"use client";

import { useState, useMemo, useCallback } from "react";
import {
  LayoutTemplate,
  Copy,
  Check,
  Eye,
  Code,
  Plus,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type SectionType = "hero" | "featured-collection" | "image-with-text" | "newsletter" | "testimonial";

interface SectionSetting {
  id: string;
  key: string;
  type: "text" | "richtext" | "image_picker" | "url" | "color" | "range" | "checkbox" | "select";
  label: string;
  default: string;
}

interface SectionConfig {
  id: string;
  name: string;
  type: SectionType;
  heading: string;
  subheading: string;
  buttonText: string;
  buttonUrl: string;
  imageUrl: string;
  bgColor: string;
  textColor: string;
  settings: SectionSetting[];
}

const SECTION_TYPES: { value: SectionType; label: string }[] = [
  { value: "hero", label: "Hero Banner" },
  { value: "featured-collection", label: "Featured Collection" },
  { value: "image-with-text", label: "Image with Text" },
  { value: "newsletter", label: "Newsletter" },
  { value: "testimonial", label: "Testimonial" },
];

const DEFAULT_CONFIG: SectionConfig = {
  id: "",
  name: "hero-banner",
  type: "hero",
  heading: "Welcome to Our Store",
  subheading: "Discover amazing products curated just for you",
  buttonText: "Shop Now",
  buttonUrl: "/collections/all",
  imageUrl: "https://cdn.shopify.com/placeholder.jpg",
  bgColor: "#1a1a2e",
  textColor: "#ffffff",
  settings: [],
};

function generateLiquidCode(config: SectionConfig): string {
  const tag = config.name.replace(/[^a-z0-9-]/gi, "-").toLowerCase();

  if (config.type === "hero") {
    return `{% comment %}
  Section: ${config.name}
  Type: Hero Banner
{% endcomment %}

<section
  class="hero-section"
  style="background-color: {{ section.settings.bg_color }}; color: {{ section.settings.text_color }};"
>
  {% if section.settings.image != blank %}
    <div class="hero-image">
      {{ section.settings.image | image_url: width: 1920 | image_tag: loading: 'lazy' }}
    </div>
  {% endif %}
  <div class="hero-content">
    {% if section.settings.heading != blank %}
      <h1 class="hero-heading">{{ section.settings.heading }}</h1>
    {% endif %}
    {% if section.settings.subheading != blank %}
      <p class="hero-subheading">{{ section.settings.subheading }}</p>
    {% endif %}
    {% if section.settings.button_text != blank %}
      <a href="{{ section.settings.button_url }}" class="hero-button">
        {{ section.settings.button_text }}
      </a>
    {% endif %}
  </div>
</section>

<style>
  .hero-section {
    position: relative;
    min-height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    overflow: hidden;
  }
  .hero-image { position: absolute; inset: 0; }
  .hero-image img { width: 100%; height: 100%; object-fit: cover; }
  .hero-content { position: relative; z-index: 1; padding: 2rem; max-width: 800px; }
  .hero-heading { font-size: 3rem; font-weight: 700; margin-bottom: 1rem; }
  .hero-subheading { font-size: 1.25rem; margin-bottom: 2rem; opacity: 0.9; }
  .hero-button {
    display: inline-block; padding: 0.75rem 2rem;
    background: #fff; color: #000; text-decoration: none;
    font-weight: 600; border-radius: 4px;
  }
</style>

{% schema %}
{
  "name": "${config.name}",
  "tag": "section",
  "class": "${tag}",
  "settings": [
    { "type": "image_picker", "id": "image", "label": "Background Image" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "${config.heading}" },
    { "type": "text", "id": "subheading", "label": "Subheading", "default": "${config.subheading}" },
    { "type": "text", "id": "button_text", "label": "Button Text", "default": "${config.buttonText}" },
    { "type": "url", "id": "button_url", "label": "Button URL", "default": "${config.buttonUrl}" },
    { "type": "color", "id": "bg_color", "label": "Background Color", "default": "${config.bgColor}" },
    { "type": "color", "id": "text_color", "label": "Text Color", "default": "${config.textColor}" }
  ],
  "presets": [
    { "name": "${config.name}" }
  ]
}
{% endschema %}`;
  }

  if (config.type === "featured-collection") {
    return `{% comment %}
  Section: ${config.name}
  Type: Featured Collection
{% endcomment %}

<section class="featured-collection" style="background-color: {{ section.settings.bg_color }}; color: {{ section.settings.text_color }};">
  <div class="featured-collection__container">
    {% if section.settings.heading != blank %}
      <h2 class="featured-collection__heading">{{ section.settings.heading }}</h2>
    {% endif %}
    {% if section.settings.subheading != blank %}
      <p class="featured-collection__subheading">{{ section.settings.subheading }}</p>
    {% endif %}
    {% assign collection = collections[section.settings.collection] %}
    {% if collection %}
      <div class="featured-collection__grid">
        {% for product in collection.products limit: 4 %}
          <div class="featured-collection__product">
            <a href="{{ product.url }}">
              {{ product.featured_image | image_url: width: 400 | image_tag: loading: 'lazy' }}
              <h3>{{ product.title }}</h3>
              <p>{{ product.price | money }}</p>
            </a>
          </div>
        {% endfor %}
      </div>
    {% endif %}
    {% if section.settings.button_text != blank %}
      <a href="{{ collection.url }}" class="featured-collection__button">{{ section.settings.button_text }}</a>
    {% endif %}
  </div>
</section>

<style>
  .featured-collection { padding: 4rem 2rem; }
  .featured-collection__container { max-width: 1200px; margin: 0 auto; text-align: center; }
  .featured-collection__heading { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
  .featured-collection__subheading { opacity: 0.8; margin-bottom: 2rem; }
  .featured-collection__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 2rem; }
  .featured-collection__product a { text-decoration: none; color: inherit; }
  .featured-collection__product img { width: 100%; border-radius: 8px; }
  .featured-collection__button {
    display: inline-block; margin-top: 2rem; padding: 0.75rem 2rem;
    border: 2px solid currentColor; text-decoration: none; color: inherit; font-weight: 600;
  }
</style>

{% schema %}
{
  "name": "${config.name}",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "${config.heading}" },
    { "type": "text", "id": "subheading", "label": "Subheading", "default": "${config.subheading}" },
    { "type": "collection", "id": "collection", "label": "Collection" },
    { "type": "text", "id": "button_text", "label": "Button Text", "default": "${config.buttonText}" },
    { "type": "color", "id": "bg_color", "label": "Background Color", "default": "${config.bgColor}" },
    { "type": "color", "id": "text_color", "label": "Text Color", "default": "${config.textColor}" }
  ],
  "presets": [{ "name": "${config.name}" }]
}
{% endschema %}`;
  }

  if (config.type === "image-with-text") {
    return `{% comment %}
  Section: ${config.name}
  Type: Image with Text
{% endcomment %}

<section class="image-with-text" style="background-color: {{ section.settings.bg_color }}; color: {{ section.settings.text_color }};">
  <div class="image-with-text__container">
    <div class="image-with-text__image">
      {% if section.settings.image != blank %}
        {{ section.settings.image | image_url: width: 800 | image_tag: loading: 'lazy' }}
      {% endif %}
    </div>
    <div class="image-with-text__content">
      {% if section.settings.heading != blank %}
        <h2>{{ section.settings.heading }}</h2>
      {% endif %}
      {% if section.settings.subheading != blank %}
        <p>{{ section.settings.subheading }}</p>
      {% endif %}
      {% if section.settings.button_text != blank %}
        <a href="{{ section.settings.button_url }}" class="image-with-text__button">
          {{ section.settings.button_text }}
        </a>
      {% endif %}
    </div>
  </div>
</section>

<style>
  .image-with-text { padding: 4rem 2rem; }
  .image-with-text__container { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }
  .image-with-text__image img { width: 100%; border-radius: 12px; }
  .image-with-text__content h2 { font-size: 2rem; font-weight: 700; margin-bottom: 1rem; }
  .image-with-text__content p { opacity: 0.8; margin-bottom: 2rem; line-height: 1.8; }
  .image-with-text__button { display: inline-block; padding: 0.75rem 2rem; background: currentColor; color: {{ section.settings.bg_color }}; text-decoration: none; font-weight: 600; border-radius: 4px; }
  @media (max-width: 768px) { .image-with-text__container { grid-template-columns: 1fr; } }
</style>

{% schema %}
{
  "name": "${config.name}",
  "settings": [
    { "type": "image_picker", "id": "image", "label": "Image" },
    { "type": "text", "id": "heading", "label": "Heading", "default": "${config.heading}" },
    { "type": "textarea", "id": "subheading", "label": "Text Content", "default": "${config.subheading}" },
    { "type": "text", "id": "button_text", "label": "Button Text", "default": "${config.buttonText}" },
    { "type": "url", "id": "button_url", "label": "Button URL", "default": "${config.buttonUrl}" },
    { "type": "color", "id": "bg_color", "label": "Background Color", "default": "${config.bgColor}" },
    { "type": "color", "id": "text_color", "label": "Text Color", "default": "${config.textColor}" }
  ],
  "presets": [{ "name": "${config.name}" }]
}
{% endschema %}`;
  }

  if (config.type === "newsletter") {
    return `{% comment %}
  Section: ${config.name}
  Type: Newsletter Signup
{% endcomment %}

<section class="newsletter-section" style="background-color: {{ section.settings.bg_color }}; color: {{ section.settings.text_color }};">
  <div class="newsletter-section__container">
    {% if section.settings.heading != blank %}
      <h2 class="newsletter-section__heading">{{ section.settings.heading }}</h2>
    {% endif %}
    {% if section.settings.subheading != blank %}
      <p class="newsletter-section__subheading">{{ section.settings.subheading }}</p>
    {% endif %}
    {% form 'customer', id: 'newsletter-form' %}
      <input type="hidden" name="contact[tags]" value="newsletter">
      <div class="newsletter-section__form">
        <input type="email" name="contact[email]" placeholder="Enter your email" required class="newsletter-section__input">
        <button type="submit" class="newsletter-section__button">{{ section.settings.button_text }}</button>
      </div>
    {% endform %}
  </div>
</section>

<style>
  .newsletter-section { padding: 4rem 2rem; text-align: center; }
  .newsletter-section__container { max-width: 600px; margin: 0 auto; }
  .newsletter-section__heading { font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
  .newsletter-section__subheading { opacity: 0.8; margin-bottom: 2rem; }
  .newsletter-section__form { display: flex; gap: 0.5rem; max-width: 400px; margin: 0 auto; }
  .newsletter-section__input { flex: 1; padding: 0.75rem 1rem; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; background: transparent; color: inherit; }
  .newsletter-section__button { padding: 0.75rem 1.5rem; background: #fff; color: #000; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; }
</style>

{% schema %}
{
  "name": "${config.name}",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "${config.heading}" },
    { "type": "text", "id": "subheading", "label": "Subheading", "default": "${config.subheading}" },
    { "type": "text", "id": "button_text", "label": "Button Text", "default": "${config.buttonText}" },
    { "type": "color", "id": "bg_color", "label": "Background Color", "default": "${config.bgColor}" },
    { "type": "color", "id": "text_color", "label": "Text Color", "default": "${config.textColor}" }
  ],
  "presets": [{ "name": "${config.name}" }]
}
{% endschema %}`;
  }

  // testimonial
  return `{% comment %}
  Section: ${config.name}
  Type: Testimonial
{% endcomment %}

<section class="testimonial-section" style="background-color: {{ section.settings.bg_color }}; color: {{ section.settings.text_color }};">
  <div class="testimonial-section__container">
    {% if section.settings.heading != blank %}
      <h2 class="testimonial-section__heading">{{ section.settings.heading }}</h2>
    {% endif %}
    <div class="testimonial-section__grid">
      {% for block in section.blocks %}
        <div class="testimonial-card" {{ block.shopify_attributes }}>
          <p class="testimonial-card__quote">"{{ block.settings.quote }}"</p>
          <div class="testimonial-card__author">
            <strong>{{ block.settings.author }}</strong>
            {% if block.settings.role != blank %}
              <span>{{ block.settings.role }}</span>
            {% endif %}
          </div>
        </div>
      {% endfor %}
    </div>
  </div>
</section>

<style>
  .testimonial-section { padding: 4rem 2rem; }
  .testimonial-section__container { max-width: 1200px; margin: 0 auto; text-align: center; }
  .testimonial-section__heading { font-size: 2rem; font-weight: 700; margin-bottom: 2rem; }
  .testimonial-section__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem; }
  .testimonial-card { padding: 2rem; border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); text-align: left; }
  .testimonial-card__quote { font-style: italic; line-height: 1.8; margin-bottom: 1rem; }
  .testimonial-card__author strong { display: block; }
  .testimonial-card__author span { opacity: 0.7; font-size: 0.875rem; }
</style>

{% schema %}
{
  "name": "${config.name}",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "${config.heading}" },
    { "type": "color", "id": "bg_color", "label": "Background Color", "default": "${config.bgColor}" },
    { "type": "color", "id": "text_color", "label": "Text Color", "default": "${config.textColor}" }
  ],
  "blocks": [
    {
      "type": "testimonial",
      "name": "Testimonial",
      "settings": [
        { "type": "textarea", "id": "quote", "label": "Quote" },
        { "type": "text", "id": "author", "label": "Author Name" },
        { "type": "text", "id": "role", "label": "Role / Title" }
      ]
    }
  ],
  "presets": [{ "name": "${config.name}", "blocks": [{ "type": "testimonial" }] }]
}
{% endschema %}`;
}

export default function SectionBuilderPage() {
  const [config, setConfig] = useLocalStorage<SectionConfig>(
    "shopify-section-builder",
    { ...DEFAULT_CONFIG, id: "default" }
  );
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);

  const generatedCode = useMemo(() => generateLiquidCode(config), [config]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [generatedCode]);

  const updateField = useCallback(
    (field: keyof SectionConfig, value: string) => {
      setConfig((prev) => ({ ...prev, [field]: value }));
    },
    [setConfig]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Section Builder"
        description="Visually configure Shopify sections and generate production-ready Liquid code with JSON schema."
        icon={LayoutTemplate}
        badge="Shopify Dev"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Section Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Section Name</Label>
                  <Input
                    value={config.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="e.g., hero-banner"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Section Type</Label>
                  <select
                    value={config.type}
                    onChange={(e) => updateField("type", e.target.value)}
                    className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                  >
                    {SECTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Heading</Label>
                <Input
                  value={config.heading}
                  onChange={(e) => updateField("heading", e.target.value)}
                  placeholder="Section heading"
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Subheading / Text</Label>
                <Textarea
                  value={config.subheading}
                  onChange={(e) => updateField("subheading", e.target.value)}
                  placeholder="Supporting text"
                  className="text-sm min-h-[60px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Button Text</Label>
                  <Input
                    value={config.buttonText}
                    onChange={(e) => updateField("buttonText", e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Button URL</Label>
                  <Input
                    value={config.buttonUrl}
                    onChange={(e) => updateField("buttonUrl", e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Image URL</Label>
                <Input
                  value={config.imageUrl}
                  onChange={(e) => updateField("imageUrl", e.target.value)}
                  placeholder="https://cdn.shopify.com/..."
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Background Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.bgColor}
                      onChange={(e) => updateField("bgColor", e.target.value)}
                      className="h-9 w-12 rounded border cursor-pointer"
                    />
                    <Input
                      value={config.bgColor}
                      onChange={(e) => updateField("bgColor", e.target.value)}
                      className="text-sm font-mono flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Text Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.textColor}
                      onChange={(e) => updateField("textColor", e.target.value)}
                      className="h-9 w-12 rounded border cursor-pointer"
                    />
                    <Input
                      value={config.textColor}
                      onChange={(e) => updateField("textColor", e.target.value)}
                      className="text-sm font-mono flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview / Code */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Output
                </CardTitle>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewMode("preview")}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                      viewMode === "preview"
                        ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Eye className="h-3 w-3" /> Preview
                  </button>
                  <button
                    onClick={() => setViewMode("code")}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                      viewMode === "code"
                        ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Code className="h-3 w-3" /> Code
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === "preview" ? (
                <div
                  className="rounded-lg overflow-hidden border min-h-[300px]"
                  style={{ backgroundColor: config.bgColor, color: config.textColor }}
                >
                  {config.type === "hero" && (
                    <div className="flex flex-col items-center justify-center text-center p-8 min-h-[300px]">
                      <h2 className="text-2xl font-bold mb-2">{config.heading}</h2>
                      <p className="opacity-80 mb-4">{config.subheading}</p>
                      {config.buttonText && (
                        <span className="inline-block px-4 py-2 bg-white text-black rounded font-semibold text-sm">
                          {config.buttonText}
                        </span>
                      )}
                    </div>
                  )}
                  {config.type === "featured-collection" && (
                    <div className="p-8 text-center">
                      <h2 className="text-2xl font-bold mb-2">{config.heading}</h2>
                      <p className="opacity-80 mb-4">{config.subheading}</p>
                      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto mb-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="rounded-lg bg-white/10 p-4 text-sm">
                            <div className="w-full h-16 bg-white/10 rounded mb-2" />
                            Product {i}
                          </div>
                        ))}
                      </div>
                      {config.buttonText && (
                        <span className="inline-block px-4 py-2 border border-current rounded font-semibold text-sm">
                          {config.buttonText}
                        </span>
                      )}
                    </div>
                  )}
                  {config.type === "image-with-text" && (
                    <div className="grid grid-cols-2 gap-4 p-6 items-center">
                      <div className="bg-white/10 rounded-lg h-40 flex items-center justify-center text-xs opacity-50">
                        Image
                      </div>
                      <div>
                        <h2 className="text-xl font-bold mb-2">{config.heading}</h2>
                        <p className="opacity-80 text-sm mb-3">{config.subheading}</p>
                        {config.buttonText && (
                          <span className="inline-block px-3 py-1.5 bg-white/20 rounded text-sm font-semibold">
                            {config.buttonText}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {config.type === "newsletter" && (
                    <div className="p-8 text-center">
                      <h2 className="text-2xl font-bold mb-2">{config.heading}</h2>
                      <p className="opacity-80 mb-4">{config.subheading}</p>
                      <div className="flex gap-2 max-w-sm mx-auto">
                        <div className="flex-1 h-9 rounded border border-white/30 bg-transparent" />
                        <span className="px-4 py-2 bg-white text-black rounded font-semibold text-sm">
                          {config.buttonText}
                        </span>
                      </div>
                    </div>
                  )}
                  {config.type === "testimonial" && (
                    <div className="p-8 text-center">
                      <h2 className="text-2xl font-bold mb-4">{config.heading}</h2>
                      <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-left">
                          <p className="italic text-sm mb-2 opacity-80">&ldquo;Amazing product, highly recommend!&rdquo;</p>
                          <strong className="text-sm">Jane Doe</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-h-[500px] overflow-auto rounded-lg bg-muted/30 border p-4">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-all leading-relaxed text-foreground/80">
                    {generatedCode}
                  </pre>
                </div>
              )}

              <div className="mt-3">
                <Button onClick={handleCopy} variant="outline" className="w-full">
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-emerald-500" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" /> Copy Generated Code
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
