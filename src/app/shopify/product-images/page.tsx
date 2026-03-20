"use client";

import { useState, useRef } from "react";
import { Camera, Copy, Check, Upload, ImageIcon, Wand2, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/lib/hooks";

interface ProductImageConfig {
  description: string;
  background: string;
  aspectRatio: string;
  lightingStyle: string;
  cameraAngle: string;
  mood: string;
  extraPrompt: string;
}

const BACKGROUNDS = [
  { id: "studio-white", label: "Studio White", desc: "Clean white seamless backdrop", preview: "bg-white border" },
  { id: "studio-dark", label: "Studio Dark", desc: "Dramatic dark background", preview: "bg-zinc-900" },
  { id: "lifestyle", label: "Lifestyle", desc: "In-context real world setting", preview: "bg-gradient-to-br from-amber-100 to-orange-100" },
  { id: "flat-lay", label: "Flat Lay", desc: "Overhead arrangement on surface", preview: "bg-gradient-to-br from-slate-100 to-slate-200" },
  { id: "gradient", label: "Gradient", desc: "Smooth color gradient backdrop", preview: "bg-gradient-to-br from-violet-400 to-pink-400" },
  { id: "nature", label: "Nature", desc: "Outdoor natural environment", preview: "bg-gradient-to-br from-green-200 to-emerald-300" },
  { id: "marble", label: "Marble Surface", desc: "Elegant marble texture", preview: "bg-gradient-to-br from-gray-100 to-gray-300" },
  { id: "rustic", label: "Rustic Wood", desc: "Warm wooden surface", preview: "bg-gradient-to-br from-amber-200 to-amber-400" },
];

const ASPECT_RATIOS = [
  { id: "1:1", label: "1:1", desc: "Square — Shopify default", w: 1, h: 1 },
  { id: "4:3", label: "4:3", desc: "Landscape — banners", w: 4, h: 3 },
  { id: "3:4", label: "3:4", desc: "Portrait — tall product", w: 3, h: 4 },
  { id: "16:9", label: "16:9", desc: "Widescreen — hero", w: 16, h: 9 },
];

const LIGHTING = ["Natural Soft", "Studio Bright", "Golden Hour", "Dramatic Side", "Diffused Overhead", "Neon Accent"];
const ANGLES = ["Front-facing", "45° Angle", "Overhead Bird's-eye", "Close-up Detail", "3/4 View", "Behind/Side"];
const MOODS = ["Clean & Professional", "Cozy & Warm", "Bold & Energetic", "Minimal & Zen", "Luxurious & Premium", "Fun & Playful"];

function buildPrompt(config: ProductImageConfig, hasImage: boolean): string {
  const parts = [
    `Professional product photography of ${config.description || "a product"}`,
    `Background: ${BACKGROUNDS.find(b => b.id === config.background)?.label || config.background}`,
    `Lighting: ${config.lightingStyle}`,
    `Camera angle: ${config.cameraAngle}`,
    `Mood: ${config.mood}`,
    `Aspect ratio: ${config.aspectRatio}`,
    "High resolution, commercial grade, ready for e-commerce listing",
    config.extraPrompt,
  ].filter(Boolean);
  if (hasImage) parts.unshift("[Using uploaded reference image]");
  return parts.join(". ") + ".";
}

export default function ProductImagesPage() {
  const [config, setConfig] = useLocalStorage<ProductImageConfig>("shopify-product-img-config", {
    description: "",
    background: "studio-white",
    aspectRatio: "1:1",
    lightingStyle: "Natural Soft",
    cameraAngle: "Front-facing",
    mood: "Clean & Professional",
    extraPrompt: "",
  });
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (key: keyof ProductImageConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const fullPrompt = buildPrompt(config, !!uploadedImage);

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(fullPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const selectedRatio = ASPECT_RATIOS.find(r => r.id === config.aspectRatio) ?? ASPECT_RATIOS[0];
  const previewStyle = {
    aspectRatio: `${selectedRatio.w} / ${selectedRatio.h}`,
    maxHeight: 240,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Image Generator"
        description="Describe your product and generate AI-powered photography prompts for stunning e-commerce images."
        icon={Camera}
        badge="AI-Powered"
        replaces="Pebblely, Remove.bg, Photoroom"
      />

      {/* AI Banner */}
      <Card className="border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-500/5 to-pink-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0">
            <Wand2 className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">AI Image Generation Ready</p>
            <p className="text-xs text-muted-foreground">Configure your shot below, copy the prompt, then use it with Midjourney, DALL-E 3, or Stable Diffusion XL.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Product Description + Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Product Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Describe your product</Label>
                <Textarea
                  placeholder="e.g. A sleek matte black ceramic coffee mug with a minimalist handle, 12oz capacity..."
                  value={config.description}
                  onChange={e => update("description", e.target.value)}
                  className="min-h-[90px] text-sm"
                />
              </div>

              {/* Upload Reference */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Reference Image (optional)</Label>
                {uploadedImage ? (
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={uploadedImage} alt="Reference" className="w-full h-full object-cover" />
                    <button
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center"
                      onClick={() => setUploadedImage(null)}
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 p-4 w-full rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-violet-400 hover:bg-violet-500/5 transition-all text-muted-foreground hover:text-violet-500"
                  >
                    <Upload className="h-5 w-5 shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium">Upload reference photo</p>
                      <p className="text-xs">PNG, JPG up to 10MB</p>
                    </div>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </div>
            </CardContent>
          </Card>

          {/* Background */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Background Style</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BACKGROUNDS.map(bg => (
                  <button
                    key={bg.id}
                    onClick={() => update("background", bg.id)}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      config.background === bg.id ? "border-violet-500 shadow-sm" : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className={`h-10 w-full rounded-lg mb-2 ${bg.preview}`} />
                    <p className="text-xs font-medium leading-tight">{bg.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{bg.desc}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lighting, Angle, Mood */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([
              { label: "Lighting Style", key: "lightingStyle", options: LIGHTING },
              { label: "Camera Angle", key: "cameraAngle", options: ANGLES },
              { label: "Mood & Feel", key: "mood", options: MOODS },
            ] as const).map(({ label, key, options }) => (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => update(key, opt)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                        config[key] === opt
                          ? "bg-gradient-to-r from-violet-500/15 to-pink-500/15 text-violet-700 dark:text-violet-300 font-medium"
                          : "hover:bg-muted/60 text-muted-foreground"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column: Aspect Ratio + Preview + Prompt */}
        <div className="space-y-4">
          {/* Aspect Ratio */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Aspect Ratio</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {ASPECT_RATIOS.map(ratio => (
                <button
                  key={ratio.id}
                  onClick={() => update("aspectRatio", ratio.id)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    config.aspectRatio === ratio.id
                      ? "border-violet-500 bg-violet-500/5"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-center mb-1.5" style={{ height: 32 }}>
                    <div
                      className={`border-2 rounded-sm ${config.aspectRatio === ratio.id ? "border-violet-500" : "border-muted-foreground/40"}`}
                      style={{
                        width: ratio.w > ratio.h ? 28 : Math.round(28 * ratio.w / ratio.h),
                        height: ratio.h > ratio.w ? 28 : Math.round(28 * ratio.h / ratio.w),
                      }}
                    />
                  </div>
                  <p className="text-xs font-bold">{ratio.label}</p>
                  <p className="text-[10px] text-muted-foreground">{ratio.desc}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Preview Placeholder */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Preview Canvas</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="w-full rounded-xl border-2 border-dashed border-muted-foreground/20 bg-gradient-to-br from-violet-500/5 to-pink-500/5 flex items-center justify-center overflow-hidden"
                style={previewStyle}
              >
                <div className="text-center p-4">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground font-medium">AI Generated Image</p>
                  <p className="text-[10px] text-muted-foreground/60">{config.aspectRatio} · {BACKGROUNDS.find(b => b.id === config.background)?.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extra details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Extra Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any extra requirements..."
                value={config.extraPrompt}
                onChange={e => update("extraPrompt", e.target.value)}
                className="min-h-[70px] text-sm"
              />
            </CardContent>
          </Card>

          {/* Prompt Output */}
          <Card className="border-violet-200 dark:border-violet-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">AI Prompt</CardTitle>
                <Badge variant="secondary" className="text-[10px]">Ready to copy</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 text-xs leading-relaxed font-mono text-muted-foreground min-h-[80px]">
                {fullPrompt}
              </div>
              <Button
                className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
                onClick={copyPrompt}
              >
                {copied ? <><Check className="h-4 w-4 mr-2" /> Copied!</> : <><Copy className="h-4 w-4 mr-2" /> Copy Prompt</>}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
