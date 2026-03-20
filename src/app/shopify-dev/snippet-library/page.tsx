"use client";

import { useState, useMemo, useCallback } from "react";
import {
  BookOpen,
  Copy,
  Check,
  Plus,
  Trash2,
  Search,
  Tag,
  Code,
  Edit2,
  X,
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

type Language = "liquid" | "css" | "js";

interface Snippet {
  id: string;
  name: string;
  description: string;
  language: Language;
  code: string;
  tags: string[];
  createdAt: string;
}

const DEFAULT_SNIPPETS: Snippet[] = [
  {
    id: "s1",
    name: "Announcement Bar",
    description: "Dismissible announcement bar with cookie persistence for promotions and messages.",
    language: "liquid",
    code: `{% if section.settings.show_announcement %}
<div id="announcement-bar" class="announcement-bar" style="background:{{ section.settings.bg_color }};color:{{ section.settings.text_color }};">
  <div class="announcement-bar__content">
    <p>{{ section.settings.text }}</p>
    {% if section.settings.link != blank %}
      <a href="{{ section.settings.link }}">{{ section.settings.link_text }}</a>
    {% endif %}
  </div>
  <button class="announcement-bar__close" onclick="this.parentElement.style.display='none';document.cookie='announcement_dismissed=1;max-age=86400;path=/';" aria-label="Close">&times;</button>
</div>
<script>
  if (document.cookie.includes('announcement_dismissed=1')) {
    document.getElementById('announcement-bar').style.display = 'none';
  }
</script>
{% endif %}`,
    tags: ["promotion", "bar", "dismissible"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "s2",
    name: "Countdown Timer",
    description: "Dynamic countdown timer for sales, launches, or limited-time offers.",
    language: "js",
    code: `function initCountdown(targetDate, elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  function update() {
    const now = new Date().getTime();
    const distance = new Date(targetDate).getTime() - now;
    if (distance < 0) { el.innerHTML = '<span class="countdown-ended">Sale ended!</span>'; return; }
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    el.innerHTML = \`
      <div class="countdown-unit"><span class="countdown-number">\${days}</span><span class="countdown-label">Days</span></div>
      <div class="countdown-unit"><span class="countdown-number">\${hours}</span><span class="countdown-label">Hours</span></div>
      <div class="countdown-unit"><span class="countdown-number">\${minutes}</span><span class="countdown-label">Min</span></div>
      <div class="countdown-unit"><span class="countdown-number">\${seconds}</span><span class="countdown-label">Sec</span></div>
    \`;
  }
  update();
  setInterval(update, 1000);
}
// Usage: initCountdown('2025-12-31T23:59:59', 'countdown');`,
    tags: ["timer", "sale", "urgency"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "s3",
    name: "Back to Top Button",
    description: "Smooth scroll back-to-top button that appears after scrolling down.",
    language: "js",
    code: `(function() {
  const btn = document.createElement('button');
  btn.id = 'back-to-top';
  btn.innerHTML = '&#8679;';
  btn.setAttribute('aria-label', 'Back to top');
  btn.style.cssText = 'position:fixed;bottom:2rem;right:2rem;width:44px;height:44px;border-radius:50%;background:#333;color:#fff;border:none;font-size:1.25rem;cursor:pointer;opacity:0;transition:opacity 0.3s;z-index:999;';
  document.body.appendChild(btn);
  btn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  window.addEventListener('scroll', function() {
    btn.style.opacity = window.scrollY > 400 ? '1' : '0';
    btn.style.pointerEvents = window.scrollY > 400 ? 'auto' : 'none';
  });
})();`,
    tags: ["scroll", "navigation", "UX"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "s4",
    name: "Lazy Load Images",
    description: "Native lazy loading with fallback for older browsers using IntersectionObserver.",
    language: "js",
    code: `(function() {
  if ('loading' in HTMLImageElement.prototype) {
    document.querySelectorAll('img[data-src]').forEach(function(img) {
      img.src = img.dataset.src;
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      img.loading = 'lazy';
    });
  } else {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          img.src = img.dataset.src;
          if (img.dataset.srcset) img.srcset = img.dataset.srcset;
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });
    document.querySelectorAll('img[data-src]').forEach(function(img) {
      observer.observe(img);
    });
  }
})();`,
    tags: ["performance", "images", "lazy"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "s5",
    name: "Sticky Header",
    description: "Header that becomes fixed on scroll with smooth transition and shadow.",
    language: "css",
    code: `.header-wrapper {
  position: sticky;
  top: 0;
  z-index: 100;
  transition: box-shadow 0.3s ease, background-color 0.3s ease;
}
.header-wrapper.scrolled {
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  background-color: rgba(255,255,255,0.98);
  backdrop-filter: blur(8px);
}
/* Add via JS: */
/* window.addEventListener('scroll', () => {
  document.querySelector('.header-wrapper')
    ?.classList.toggle('scrolled', window.scrollY > 50);
}); */`,
    tags: ["header", "navigation", "sticky"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "s6",
    name: "Infinite Scroll",
    description: "Load more products as user scrolls to bottom of collection page.",
    language: "js",
    code: `(function() {
  let loading = false;
  let nextUrl = document.querySelector('.pagination__next')?.href;
  const grid = document.querySelector('.collection-product-grid');
  if (!nextUrl || !grid) return;

  const observer = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting && !loading && nextUrl) {
      loading = true;
      fetch(nextUrl)
        .then(function(res) { return res.text(); })
        .then(function(html) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const newProducts = doc.querySelectorAll('.collection-product-grid > *');
          newProducts.forEach(function(product) { grid.appendChild(product); });
          const nextLink = doc.querySelector('.pagination__next');
          nextUrl = nextLink ? nextLink.href : null;
          loading = false;
          if (!nextUrl) observer.disconnect();
        })
        .catch(function() { loading = false; });
    }
  }, { rootMargin: '400px' });

  const sentinel = document.createElement('div');
  sentinel.id = 'infinite-scroll-sentinel';
  grid.parentNode.insertBefore(sentinel, grid.nextSibling);
  observer.observe(sentinel);
})();`,
    tags: ["pagination", "collection", "scroll"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "s7",
    name: "Color Swatch",
    description: "Color variant swatch selector with active state for product pages.",
    language: "liquid",
    code: `{% comment %} Color Swatch Selector {% endcomment %}
{% assign color_option_index = 0 %}
{% for option in product.options %}
  {% if option == 'Color' or option == 'Colour' %}
    {% assign color_option_index = forloop.index0 %}
  {% endif %}
{% endfor %}

<div class="color-swatches" data-option-index="{{ color_option_index }}">
  <p class="color-swatches__label">Color: <span id="selected-color">{{ product.variants.first.options[color_option_index] }}</span></p>
  <div class="color-swatches__list">
    {% assign seen_colors = '' %}
    {% for variant in product.variants %}
      {% assign color = variant.options[color_option_index] %}
      {% unless seen_colors contains color %}
        {% assign seen_colors = seen_colors | append: color | append: ',' %}
        {% assign color_handle = color | handleize %}
        <button
          class="color-swatch {% if forloop.first %}active{% endif %}"
          data-color="{{ color }}"
          style="background-color: {{ color_handle }};"
          title="{{ color }}"
          aria-label="Select color {{ color }}"
          onclick="document.querySelectorAll('.color-swatch').forEach(s=>s.classList.remove('active'));this.classList.add('active');document.getElementById('selected-color').textContent=this.dataset.color;"
        ></button>
      {% endunless %}
    {% endfor %}
  </div>
</div>

<style>
  .color-swatches__list { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
  .color-swatch { width: 32px; height: 32px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: border-color 0.2s; }
  .color-swatch:hover, .color-swatch.active { border-color: #333; outline: 2px solid #fff; outline-offset: -3px; }
</style>`,
    tags: ["variant", "color", "swatch", "product"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "s8",
    name: "Size Chart Popup",
    description: "Modal popup size chart with responsive table for product pages.",
    language: "liquid",
    code: `{% comment %} Size Chart Modal {% endcomment %}
<button class="size-chart-trigger" onclick="document.getElementById('size-chart-modal').classList.add('active');">
  Size Guide
</button>

<div id="size-chart-modal" class="size-chart-modal" onclick="if(event.target===this)this.classList.remove('active');">
  <div class="size-chart-modal__content">
    <button class="size-chart-modal__close" onclick="document.getElementById('size-chart-modal').classList.remove('active');" aria-label="Close">&times;</button>
    <h3>Size Guide</h3>
    <div class="size-chart-modal__table-wrap">
      <table>
        <thead><tr><th>Size</th><th>Chest (in)</th><th>Waist (in)</th><th>Length (in)</th></tr></thead>
        <tbody>
          <tr><td>S</td><td>34-36</td><td>28-30</td><td>27</td></tr>
          <tr><td>M</td><td>38-40</td><td>32-34</td><td>28</td></tr>
          <tr><td>L</td><td>42-44</td><td>36-38</td><td>29</td></tr>
          <tr><td>XL</td><td>46-48</td><td>40-42</td><td>30</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<style>
  .size-chart-trigger { background: none; border: none; text-decoration: underline; cursor: pointer; color: inherit; font-size: 0.875rem; }
  .size-chart-modal { display: none; position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; }
  .size-chart-modal.active { display: flex; }
  .size-chart-modal__content { background: #fff; color: #000; border-radius: 12px; padding: 2rem; max-width: 500px; width: 90%; position: relative; }
  .size-chart-modal__close { position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; cursor: pointer; }
  .size-chart-modal__table-wrap { overflow-x: auto; margin-top: 1rem; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 0.5rem 1rem; border-bottom: 1px solid #eee; text-align: left; }
  th { font-weight: 600; background: #f5f5f5; }
</style>`,
    tags: ["size", "chart", "modal", "product"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "s9",
    name: "Trust Badges",
    description: "Row of trust/security badges with icons for the product page or cart.",
    language: "liquid",
    code: `{% comment %} Trust Badges {% endcomment %}
<div class="trust-badges">
  <div class="trust-badge">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    <span>Secure Checkout</span>
  </div>
  <div class="trust-badge">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
    <span>Free Shipping</span>
  </div>
  <div class="trust-badge">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
    <span>30-Day Returns</span>
  </div>
  <div class="trust-badge">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    <span>Quality Guarantee</span>
  </div>
</div>

<style>
  .trust-badges { display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center; padding: 1.5rem 0; border-top: 1px solid #eee; margin-top: 1rem; }
  .trust-badge { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #666; text-align: center; }
  .trust-badge svg { color: #333; }
</style>`,
    tags: ["trust", "badges", "security", "product"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "s10",
    name: "Recently Viewed Products",
    description: "Track and display recently viewed products using localStorage.",
    language: "js",
    code: `(function() {
  const MAX_ITEMS = 8;
  const STORAGE_KEY = 'recently_viewed_products';

  function getRecentlyViewed() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }

  function addProduct(product) {
    const items = getRecentlyViewed().filter(function(p) { return p.handle !== product.handle; });
    items.unshift(product);
    if (items.length > MAX_ITEMS) items.length = MAX_ITEMS;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function renderRecentlyViewed(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var items = getRecentlyViewed();
    if (items.length === 0) { container.style.display = 'none'; return; }
    var html = '<h3 class="recently-viewed__title">Recently Viewed</h3><div class="recently-viewed__grid">';
    items.forEach(function(product) {
      html += '<a href="' + product.url + '" class="recently-viewed__item">';
      html += '<img src="' + product.image + '" alt="' + product.title + '" loading="lazy">';
      html += '<p>' + product.title + '</p>';
      html += '<span>' + product.price + '</span>';
      html += '</a>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  // Expose globally
  window.RecentlyViewed = { add: addProduct, render: renderRecentlyViewed, get: getRecentlyViewed };
})();
// Usage on product page:
// RecentlyViewed.add({ handle: '{{ product.handle }}', title: '{{ product.title }}', url: '{{ product.url }}', image: '{{ product.featured_image | image_url: width: 300 }}', price: '{{ product.price | money }}' });
// Usage on any page:
// RecentlyViewed.render('recently-viewed-container');`,
    tags: ["recently-viewed", "product", "localStorage"],
    createdAt: new Date().toISOString(),
  },
];

const LANG_COLORS: Record<Language, string> = {
  liquid: "bg-emerald-500/10 text-emerald-600",
  css: "bg-blue-500/10 text-blue-600",
  js: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
};

function highlightCode(code: string, language: Language) {
  if (language === "liquid") {
    return code
      .replace(/({% .+? %})/g, '<span class="text-purple-600 dark:text-purple-400">$1</span>')
      .replace(/({{ .+? }})/g, '<span class="text-blue-600 dark:text-blue-400">$1</span>')
      .replace(/({% comment %}[\s\S]*?{% endcomment %})/g, '<span class="text-muted-foreground italic">$1</span>');
  }
  if (language === "css") {
    return code
      .replace(/([\w-]+)\s*:/g, '<span class="text-blue-600 dark:text-blue-400">$1</span>:')
      .replace(/\/\*[\s\S]+?\*\//g, '<span class="text-muted-foreground italic">$&</span>');
  }
  // js
  return code
    .replace(/\b(function|var|let|const|return|if|else|for|while|new|this|typeof|try|catch)\b/g, '<span class="text-purple-600 dark:text-purple-400">$1</span>')
    .replace(/('.*?'|".*?")/g, '<span class="text-green-600 dark:text-green-400">$1</span>')
    .replace(/(\/\/.*)$/gm, '<span class="text-muted-foreground italic">$1</span>');
}

export default function SnippetLibraryPage() {
  const [snippets, setSnippets] = useLocalStorage<Snippet[]>(
    "shopify-snippet-library",
    DEFAULT_SNIPPETS
  );
  const [search, setSearch] = useState("");
  const [filterLang, setFilterLang] = useState<Language | "all">("all");
  const [copied, setCopied] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Partial<Snippet>>({
    name: "",
    description: "",
    language: "liquid",
    code: "",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");

  const filtered = useMemo(() => {
    return snippets.filter((s) => {
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
        s.description.toLowerCase().includes(search.toLowerCase());
      const matchLang = filterLang === "all" || s.language === filterLang;
      return matchSearch && matchLang;
    });
  }, [snippets, search, filterLang]);

  const handleCopy = useCallback(async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {}
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  const handleAdd = useCallback(() => {
    if (!form.name || !form.code) return;
    const newSnippet: Snippet = {
      id: generateId(),
      name: form.name || "",
      description: form.description || "",
      language: (form.language as Language) || "liquid",
      code: form.code || "",
      tags: form.tags || [],
      createdAt: new Date().toISOString(),
    };
    setSnippets((prev) => [newSnippet, ...prev]);
    setForm({ name: "", description: "", language: "liquid", code: "", tags: [] });
    setTagInput("");
    setShowAdd(false);
  }, [form, setSnippets]);

  const handleDelete = useCallback(
    (id: string) => {
      setSnippets((prev) => prev.filter((s) => s.id !== id));
    },
    [setSnippets]
  );

  const handleUpdate = useCallback(
    (id: string, updates: Partial<Snippet>) => {
      setSnippets((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
      setEditing(null);
    },
    [setSnippets]
  );

  const addTag = useCallback(() => {
    if (tagInput.trim() && !form.tags?.includes(tagInput.trim())) {
      setForm((prev) => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] }));
      setTagInput("");
    }
  }, [tagInput, form.tags]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Liquid Snippet Library"
        description="Manage and reuse Liquid, CSS, and JavaScript snippets for Shopify theme development."
        icon={BookOpen}
        badge="Shopify Dev"
        actions={
          <Button
            size="sm"
            onClick={() => setShowAdd(!showAdd)}
            className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Snippet
          </Button>
        }
      />

      {/* Add Form */}
      {showAdd && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">New Snippet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input
                  value={form.name || ""}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Snippet name"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Language</Label>
                <select
                  value={form.language || "liquid"}
                  onChange={(e) => setForm((p) => ({ ...p, language: e.target.value as Language }))}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="liquid">Liquid</option>
                  <option value="css">CSS</option>
                  <option value="js">JavaScript</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Input
                value={form.description || ""}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief description"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Code</Label>
              <Textarea
                value={form.code || ""}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                placeholder="Paste your code here..."
                className="text-sm font-mono min-h-[150px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="Add tag..."
                  className="text-sm flex-1"
                />
                <Button variant="outline" size="sm" onClick={addTag}>
                  Add
                </Button>
              </div>
              {form.tags && form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {form.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs gap-1">
                      {t}
                      <button
                        onClick={() => setForm((p) => ({ ...p, tags: p.tags?.filter((x) => x !== t) }))}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={!form.name || !form.code} size="sm">
                Save Snippet
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, tag, or description..."
            className="pl-9 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "liquid", "css", "js"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setFilterLang(lang)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                filterLang === lang
                  ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                  : "border-border hover:border-violet-300 text-muted-foreground"
              }`}
            >
              {lang === "all" ? "All" : lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Snippet List */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No snippets found. Try a different search or add a new snippet.
            </CardContent>
          </Card>
        )}
        {filtered.map((snippet) => (
          <Card key={snippet.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{snippet.name}</CardTitle>
                    <Badge className={`text-[10px] ${LANG_COLORS[snippet.language]}`}>
                      {snippet.language.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{snippet.description}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(snippet.id, snippet.code)}
                    className="h-7 px-2"
                  >
                    {copied === snippet.id ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(snippet.id)}
                    className="h-7 px-2 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-[200px] overflow-auto rounded-lg bg-muted/30 border p-3">
                <pre
                  className="text-xs font-mono whitespace-pre-wrap break-all leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: highlightCode(
                      snippet.code
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;"),
                      snippet.language
                    ),
                  }}
                />
              </div>
              {snippet.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {snippet.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
