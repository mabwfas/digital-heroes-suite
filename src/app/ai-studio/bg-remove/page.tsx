"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Eraser,
  Upload,
  Eye,
  EyeOff,
  ImageIcon,
  Check,
  Download,
  SlidersHorizontal,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type BgReplacement = "transparent" | "white" | "black" | "gradient-violet" | "gradient-warm" | "blur";

const BG_OPTIONS: { id: BgReplacement; label: string; preview: string }[] = [
  { id: "transparent", label: "Transparent", preview: "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI2NjYyIvPjxyZWN0IHg9IjgiIHk9IjgiIHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNjY2MiLz48cmVjdCB4PSIwIiB5PSI4IiB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIi8+PHJlY3QgeD0iOCIgeT0iMCIgd2lkdGg9IjgiIGhlaWdodD0iOCIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')]" },
  { id: "white", label: "White", preview: "bg-white border" },
  { id: "black", label: "Black", preview: "bg-black" },
  { id: "gradient-violet", label: "Violet Gradient", preview: "bg-gradient-to-br from-violet-500 to-pink-500" },
  { id: "gradient-warm", label: "Warm Gradient", preview: "bg-gradient-to-br from-orange-400 to-pink-400" },
  { id: "blur", label: "Blur BG", preview: "bg-gradient-to-br from-sky-200 to-blue-300" },
];

const checkerBg = "bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]";

export default function BgRemovePage() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [showBefore, setShowBefore] = useState(false);
  const [bgChoice, setBgChoice] = useState<BgReplacement>("transparent");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [threshold, setThreshold] = useState(240);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const processedDataRef = useRef<ImageData | null>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f);
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    setOriginalUrl(URL.createObjectURL(f));
    setProcessed(false);
    setShowBefore(false);
    processedDataRef.current = null;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleProcess = () => {
    if (!originalUrl || !canvasRef.current) return;
    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current!;
      const origCanvas = originalCanvasRef.current!;

      canvas.width = img.width;
      canvas.height = img.height;
      origCanvas.width = img.width;
      origCanvas.height = img.height;

      // Draw original for before/after
      const origCtx = origCanvas.getContext("2d")!;
      origCtx.drawImage(img, 0, 0);

      // Draw to main canvas for processing
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      // Get pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Remove white/light backgrounds by checking if pixel is close to white
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Check if pixel is close to white/light
        if (r > threshold && g > threshold && b > threshold) {
          // Make transparent
          data[i + 3] = 0;
        } else if (r > threshold - 20 && g > threshold - 20 && b > threshold - 20) {
          // Semi-transparent for edge blending
          const avg = (r + g + b) / 3;
          const factor = Math.max(0, (avg - (threshold - 20)) / 20);
          data[i + 3] = Math.round(255 * (1 - factor));
        }
      }

      // Store processed pixel data
      processedDataRef.current = imageData;

      // Render with chosen background
      renderWithBackground(canvas, imageData, bgChoice);

      setIsProcessing(false);
      setProcessed(true);
    };
    img.src = originalUrl;
  };

  const renderWithBackground = (
    canvas: HTMLCanvasElement,
    imageData: ImageData,
    bg: BgReplacement
  ) => {
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    if (bg === "white") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (bg === "black") {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (bg === "gradient-violet") {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "#8b5cf6");
      grad.addColorStop(1, "#ec4899");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (bg === "gradient-warm") {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "#fb923c");
      grad.addColorStop(1, "#f472b6");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (bg === "blur") {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "#7dd3fc");
      grad.addColorStop(1, "#60a5fa");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    // "transparent" = no background drawn

    // Draw processed image on top
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d")!;
    tempCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(tempCanvas, 0, 0);
  };

  // Re-render when background choice changes (if already processed)
  useEffect(() => {
    if (processed && processedDataRef.current && canvasRef.current) {
      renderWithBackground(canvasRef.current, processedDataRef.current, bgChoice);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgChoice, processed]);

  const handleDownload = () => {
    if (!canvasRef.current || !processed) return;
    const link = document.createElement("a");
    const format = bgChoice === "transparent" ? "png" : "png";
    link.download = `bg-edited-${file?.name?.replace(/\.[^.]+$/, "") ?? "image"}.${format}`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Image Background Editor"
        description="Remove white/light backgrounds from images using Canvas pixel manipulation. Replace with transparent, solid colors, or gradients."
        icon={Eraser}
        badge="AI Studio"
        replaces="Remove.bg ($9/mo)"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload & Controls */}
        <div className="space-y-4">
          {/* Upload Area */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Upload Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-violet-500 bg-violet-500/10"
                    : "border-border hover:border-violet-400 hover:bg-muted/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">Drop image here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                <p className="text-[10px] text-muted-foreground mt-2">PNG, JPG, WebP up to 20MB</p>
              </div>

              {file && (
                <div className="mt-3 p-3 rounded-lg bg-muted/40 flex items-center gap-3">
                  <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{file.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatSize(file.size)}</p>
                  </div>
                  <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Threshold Control */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Sensitivity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">White threshold</Label>
                <span className="text-xs font-mono text-muted-foreground">{threshold}</span>
              </div>
              <input
                type="range"
                min={180}
                max={255}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
              <p className="text-[10px] text-muted-foreground">
                Lower = removes more shades of grey. Higher = only very white pixels removed.
              </p>
            </CardContent>
          </Card>

          {/* Background Replacement */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Background Replacement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {BG_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setBgChoice(opt.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all ${
                    bgChoice === opt.id
                      ? "border-violet-500 bg-violet-500/5"
                      : "border-border hover:border-violet-300"
                  }`}
                >
                  <div className={`h-7 w-12 rounded-md shrink-0 ${opt.preview}`} />
                  <span className={`text-sm ${bgChoice === opt.id ? "text-violet-600 dark:text-violet-400 font-medium" : "text-muted-foreground"}`}>
                    {opt.label}
                  </span>
                  {bgChoice === opt.id && (
                    <Check className="h-4 w-4 text-violet-500 ml-auto" />
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <Button
            onClick={handleProcess}
            disabled={!file || isProcessing}
            className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0 h-11"
          >
            {isProcessing ? (
              <>
                <Eraser className="h-4 w-4 mr-2 animate-pulse" />
                Processing...
              </>
            ) : (
              <>
                <Eraser className="h-4 w-4 mr-2" />
                Remove Background
              </>
            )}
          </Button>

          {processed && (
            <Button onClick={handleDownload} variant="outline" className="w-full h-11">
              <Download className="h-4 w-4 mr-2" />
              Download Result (PNG)
            </Button>
          )}
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Preview
                </CardTitle>
                {file && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {showBefore ? "Original" : processed ? "Result" : "Original"}
                    </Badge>
                    {processed && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => setShowBefore(!showBefore)}
                      >
                        {showBefore ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {showBefore ? "After" : "Before"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`min-h-[400px] rounded-xl flex items-center justify-center overflow-hidden transition-all ${
                  processed && !showBefore && bgChoice === "transparent" ? checkerBg : "bg-muted/30"
                }`}
              >
                {!file ? (
                  <div className="text-center">
                    <ImageIcon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Upload an image to get started</p>
                  </div>
                ) : isProcessing ? (
                  <div className="text-center">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-3 animate-pulse">
                      <Eraser className="h-8 w-8 text-violet-500" />
                    </div>
                    <p className="text-sm font-medium text-violet-600 dark:text-violet-400">Processing pixels...</p>
                    <p className="text-xs text-muted-foreground mt-1">Analyzing and removing light background</p>
                  </div>
                ) : showBefore ? (
                  <div className="relative w-full h-full flex items-center justify-center p-4">
                    <canvas
                      ref={originalCanvasRef}
                      className="max-w-full max-h-[360px] object-contain rounded-lg"
                      style={{ width: "auto", height: "auto", maxWidth: "100%", maxHeight: "360px" }}
                    />
                  </div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center p-4">
                    {processed ? (
                      <>
                        <canvas
                          ref={canvasRef}
                          className="max-w-full max-h-[360px] object-contain rounded-lg"
                          style={{ width: "auto", height: "auto", maxWidth: "100%", maxHeight: "360px" }}
                        />
                        <div className="absolute bottom-3 right-3">
                          <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-0 text-[10px]">
                            Background Removed
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={originalUrl!}
                          alt="Preview"
                          className="max-w-full max-h-[360px] object-contain rounded-lg"
                        />
                        {/* Hidden canvases for processing */}
                        <canvas ref={canvasRef} className="hidden" />
                        <canvas ref={originalCanvasRef} className="hidden" />
                      </>
                    )}
                  </div>
                )}
              </div>

              {processed && (
                <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-[11px] text-blue-600 dark:text-blue-400">
                    <strong>How it works:</strong> This tool removes white and near-white pixels using Canvas API pixel manipulation. Adjust the threshold slider for better results. Works best with images that have solid white or light-colored backgrounds.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Supported Formats", value: "PNG, JPG, WebP" },
          { label: "Processing", value: "Client-side Canvas API" },
          { label: "Output Format", value: "PNG with transparency" },
        ].map((info) => (
          <div key={info.label} className="p-3 rounded-xl bg-muted/30 border text-center">
            <p className="text-xs text-muted-foreground">{info.label}</p>
            <p className="text-sm font-medium mt-0.5">{info.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
