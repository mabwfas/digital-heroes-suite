"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  ImageIcon,
  Upload,
  Download,
  Lock,
  Unlock,
  RefreshCw,
  Check,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type OutputFormat = "image/png" | "image/jpeg" | "image/webp";

interface FileInfo {
  file: File;
  url: string;
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
}

interface ConversionResult {
  dataUrl: string;
  width: number;
  height: number;
  size: number;
  format: string;
}

const FORMAT_OPTIONS: { id: OutputFormat; label: string; ext: string }[] = [
  { id: "image/png", label: "PNG", ext: "png" },
  { id: "image/jpeg", label: "JPEG", ext: "jpg" },
  { id: "image/webp", label: "WebP", ext: "webp" },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function dataUrlToBytes(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.round((base64.length * 3) / 4);
}

export default function ConverterPage() {
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/png");
  const [quality, setQuality] = useState(90);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setFileInfo({
        file,
        url,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        originalSize: file.size,
      });
      setWidth(img.naturalWidth);
      setHeight(img.naturalHeight);
      setResult(null);
    };
    img.src = url;
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) loadFile(f);
    },
    [loadFile]
  );

  const handleWidthChange = (val: string) => {
    const w = parseInt(val) || 0;
    setWidth(w);
    if (lockAspect && fileInfo && fileInfo.originalWidth > 0) {
      setHeight(Math.round((w / fileInfo.originalWidth) * fileInfo.originalHeight));
    }
  };

  const handleHeightChange = (val: string) => {
    const h = parseInt(val) || 0;
    setHeight(h);
    if (lockAspect && fileInfo && fileInfo.originalHeight > 0) {
      setWidth(Math.round((h / fileInfo.originalHeight) * fileInfo.originalWidth));
    }
  };

  const resetDimensions = () => {
    if (!fileInfo) return;
    setWidth(fileInfo.originalWidth);
    setHeight(fileInfo.originalHeight);
  };

  const handleConvert = useCallback(() => {
    if (!fileInfo) return;
    setIsConverting(true);
    setResult(null);

    const img = new window.Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) { setIsConverting(false); return; }

      const outW = Math.max(1, width || fileInfo.originalWidth);
      const outH = Math.max(1, height || fileInfo.originalHeight);
      canvas.width = outW;
      canvas.height = outH;

      const ctx = canvas.getContext("2d");
      if (!ctx) { setIsConverting(false); return; }

      // Fill white background for JPEG (no transparency)
      if (outputFormat === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, outW, outH);
      }

      ctx.drawImage(img, 0, 0, outW, outH);

      const q = outputFormat === "image/png" ? undefined : quality / 100;
      const dataUrl = canvas.toDataURL(outputFormat, q);
      const size = dataUrlToBytes(dataUrl);

      setResult({
        dataUrl,
        width: outW,
        height: outH,
        size,
        format: FORMAT_OPTIONS.find((f) => f.id === outputFormat)?.ext || "png",
      });
      setIsConverting(false);
    };
    img.src = fileInfo.url;
  }, [fileInfo, width, height, outputFormat, quality]);

  const handleDownload = () => {
    if (!result || !fileInfo) return;
    const a = document.createElement("a");
    a.href = result.dataUrl;
    const baseName = fileInfo.file.name.replace(/\.[^/.]+$/, "");
    a.download = `${baseName}-converted.${result.format}`;
    a.click();
  };

  const sizeDiff = result && fileInfo
    ? ((result.size - fileInfo.originalSize) / fileInfo.originalSize) * 100
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Image Converter & Resizer"
        description="Resize and convert images between PNG, JPEG, and WebP in-browser. No upload required."
        icon={Layers}
        badge="Utilities"
        replaces="Squoosh, Convertio"
      />

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Upload Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
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
                  onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
                />
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">Drop image here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPEG, WebP, GIF, BMP supported</p>
              </div>

              {fileInfo && (
                <div className="mt-3 p-3 rounded-xl bg-muted/40 border">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fileInfo.url}
                      alt="preview"
                      className="h-12 w-12 object-cover rounded-lg border"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fileInfo.file.name}</p>
                      <div className="flex gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {fileInfo.originalWidth}×{fileInfo.originalHeight}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {formatBytes(fileInfo.originalSize)}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {fileInfo.file.type.split("/")[1]}
                        </Badge>
                      </div>
                    </div>
                    <Check className="h-5 w-5 text-emerald-500 shrink-0" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resize */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Resize
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1.5"
                  onClick={resetDimensions}
                  disabled={!fileInfo}
                >
                  <RefreshCw className="h-3 w-3" />
                  Reset
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="width">Width (px)</Label>
                  <Input
                    id="width"
                    type="number"
                    min={1}
                    max={10000}
                    value={width || ""}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    disabled={!fileInfo}
                    placeholder="Width"
                  />
                </div>

                <button
                  onClick={() => setLockAspect(!lockAspect)}
                  className={`mb-1 p-2 rounded-lg border-2 transition-all ${
                    lockAspect
                      ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                      : "border-border text-muted-foreground hover:border-violet-300"
                  }`}
                  title={lockAspect ? "Unlock aspect ratio" : "Lock aspect ratio"}
                >
                  {lockAspect ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </button>

                <div className="flex-1 space-y-2">
                  <Label htmlFor="height">Height (px)</Label>
                  <Input
                    id="height"
                    type="number"
                    min={1}
                    max={10000}
                    value={height || ""}
                    onChange={(e) => handleHeightChange(e.target.value)}
                    disabled={!fileInfo}
                    placeholder="Height"
                  />
                </div>
              </div>

              {fileInfo && (
                <div className="flex flex-wrap gap-2">
                  <p className="text-xs text-muted-foreground w-full">Quick presets:</p>
                  {[
                    { label: "Original", w: fileInfo.originalWidth, h: fileInfo.originalHeight },
                    { label: "1080×1080", w: 1080, h: 1080 },
                    { label: "1920×1080", w: 1920, h: 1080 },
                    { label: "800×600", w: 800, h: 600 },
                    { label: "512×512", w: 512, h: 512 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => { setWidth(p.w); setHeight(p.h); }}
                      className="px-2.5 py-1 rounded-lg border text-xs hover:border-violet-400 hover:bg-violet-500/5 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Format & Quality */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Output Format & Quality
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {FORMAT_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setOutputFormat(f.id)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      outputFormat === f.id
                        ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        : "border-border hover:border-violet-300 text-muted-foreground"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {outputFormat !== "image/png" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Quality</Label>
                    <span className="text-sm font-mono text-violet-600 dark:text-violet-400">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Smaller file</span>
                    <span>Best quality</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    {[60, 75, 90, 100].map((q) => (
                      <button
                        key={q}
                        onClick={() => setQuality(q)}
                        className={`flex-1 py-1 rounded-lg text-xs border transition-colors ${
                          quality === q ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400" : "border-border hover:border-violet-300"
                        }`}
                      >
                        {q}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {outputFormat === "image/png" && (
                <p className="text-xs text-muted-foreground">
                  PNG is lossless — quality setting does not apply. Output will be full quality with transparency support.
                </p>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={handleConvert}
            disabled={!fileInfo || isConverting}
            className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0 h-12 text-base"
          >
            {isConverting ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Converting…</>
            ) : (
              <><Layers className="h-4 w-4 mr-2" />Convert & Resize</>
            )}
          </Button>
        </div>

        {/* Preview & Result */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {result ? "Result" : "Preview"}
                </CardTitle>
                {result && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 text-[10px]">
                    Ready
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square rounded-xl bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] dark:bg-[repeating-conic-gradient(#374151_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] flex items-center justify-center overflow-hidden">
                {result ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={result.dataUrl}
                    alt="Converted"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : fileInfo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fileInfo.url}
                    alt="Original"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Upload an image</p>
                  </div>
                )}
              </div>

              {result && (
                <>
                  <div className="space-y-2 p-3 rounded-xl bg-muted/30 border">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Output Info</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Dimensions</span>
                        <span className="font-mono">{result.width}×{result.height}px</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Format</span>
                        <span className="font-mono uppercase">{result.format}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">File Size</span>
                        <span className="font-mono">{formatBytes(result.size)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Original</span>
                        <span className="font-mono">{fileInfo ? formatBytes(fileInfo.originalSize) : "—"}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Size change</span>
                        <span className={`font-mono font-medium ${sizeDiff < 0 ? "text-emerald-500" : sizeDiff > 0 ? "text-red-500" : "text-muted-foreground"}`}>
                          {sizeDiff > 0 ? "+" : ""}{sizeDiff.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleDownload}
                    className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download {result.format.toUpperCase()}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "100% in-browser — files never leave your device",
                "Canvas API handles resizing and format conversion",
                "Lock aspect ratio prevents stretching",
                "WebP typically 25-35% smaller than JPEG at same quality",
                "PNG preserves transparency; JPEG/WebP do not",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">{tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
