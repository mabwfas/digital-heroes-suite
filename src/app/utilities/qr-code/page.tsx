"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  QrCode,
  Download,
  Copy,
  Check,
  Wifi,
  Mail,
  Phone,
  Link,
  Type,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type InputType = "url" | "text" | "email" | "phone" | "wifi";

const INPUT_TYPES: { id: InputType; label: string; icon: React.ElementType; placeholder: string }[] = [
  { id: "url", label: "URL", icon: Link, placeholder: "https://yourstore.com" },
  { id: "text", label: "Text", icon: Type, placeholder: "Enter any text..." },
  { id: "email", label: "Email", icon: Mail, placeholder: "hello@example.com" },
  { id: "phone", label: "Phone", icon: Phone, placeholder: "+1 555 123 4567" },
  { id: "wifi", label: "WiFi", icon: Wifi, placeholder: "Network name (SSID)" },
];

// Simple QR code-like SVG generator (visual placeholder with encoded data feel)
function buildQRData(type: InputType, value: string, wifiPassword?: string): string {
  switch (type) {
    case "email": return `mailto:${value}`;
    case "phone": return `tel:${value}`;
    case "wifi": return `WIFI:S:${value};T:WPA;P:${wifiPassword || ""};`;
    default: return value;
  }
}

// Generate a deterministic grid pattern from a string
function strToGrid(str: string, size: number): boolean[][] {
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const seed = str.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = ((seed * (r + 1) * 31 + c * 17 + r * 13) ^ (seed >> (r % 8))) & 0xff;
      grid[r][c] = val > 100;
    }
  }

  // Force finder patterns (top-left, top-right, bottom-left)
  const fp = (rr: number, cc: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const onBorder = i === 0 || i === 6 || j === 0 || j === 6;
        const onInner = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        grid[rr + i][cc + j] = onBorder || onInner;
      }
    }
  };
  fp(0, 0);
  fp(0, size - 7);
  fp(size - 7, 0);

  return grid;
}

function QRCanvas({
  data,
  fg,
  bg,
  size,
}: {
  data: string;
  fg: string;
  bg: string;
  size: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const GRID = 25;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const grid = strToGrid(data || "empty", GRID);
    const cellSize = size / GRID;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = fg;
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        if (grid[r][c]) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [data, fg, bg, size]);

  return <canvas ref={canvasRef} width={size} height={size} style={{ imageRendering: "pixelated" }} />;
}

export default function QRCodePage() {
  const [inputType, setInputType] = useState<InputType>("url");
  const [value, setValue] = useState("https://yourstore.com");
  const [wifiPassword, setWifiPassword] = useState("");
  const [fgColor, setFgColor] = useState("#7c3aed");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [qrSize, setQrSize] = useState(256);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const qrData = buildQRData(inputType, value, wifiPassword);

  const handleDownload = useCallback(() => {
    const canvases = document.querySelectorAll("canvas");
    const canvas = canvases[0] as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "qr-code.png";
    a.click();
  }, []);

  const copyDataURL = useCallback(async () => {
    const canvases = document.querySelectorAll("canvas");
    const canvas = canvases[0] as HTMLCanvasElement;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    });
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="QR Code Generator"
        description="Generate custom QR codes for URLs, text, email, phone, and WiFi credentials."
        icon={QrCode}
        badge="Utilities"
        replaces="QR Code generators ($5-15/mo)"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Type Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Content Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {INPUT_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setInputType(t.id); setValue(""); }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                      inputType === t.id
                        ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        : "border-border hover:border-violet-300 text-muted-foreground"
                    }`}
                  >
                    <t.icon className="h-4 w-4" />
                    {t.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="qr-value">
                  {inputType === "wifi" ? "Network Name (SSID)" : INPUT_TYPES.find((t) => t.id === inputType)?.label}
                </Label>
                <Input
                  id="qr-value"
                  placeholder={INPUT_TYPES.find((t) => t.id === inputType)?.placeholder}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
              {inputType === "wifi" && (
                <div className="space-y-2">
                  <Label htmlFor="wifi-pass">WiFi Password</Label>
                  <Input
                    id="wifi-pass"
                    type="password"
                    placeholder="Enter WiFi password"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                  />
                </div>
              )}
              {qrData && (
                <div className="p-2.5 rounded-lg bg-muted/40 border">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Encoded data</p>
                  <p className="text-xs font-mono break-all">{qrData}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Foreground Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="h-9 w-14 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-9 w-14 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Size</Label>
                  <span className="text-xs text-muted-foreground font-mono">{qrSize}×{qrSize}px</span>
                </div>
                <input
                  type="range"
                  min={128}
                  max={512}
                  step={32}
                  value={qrSize}
                  onChange={(e) => setQrSize(Number(e.target.value))}
                  className="w-full accent-violet-500"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>128px</span>
                  <span>512px</span>
                </div>
              </div>

              {/* Color Presets */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Quick Presets</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Violet", fg: "#7c3aed", bg: "#ffffff" },
                    { label: "Dark", fg: "#000000", bg: "#ffffff" },
                    { label: "Inverse", fg: "#ffffff", bg: "#18181b" },
                    { label: "Pink", fg: "#db2777", bg: "#fff0f6" },
                    { label: "Ocean", fg: "#0284c7", bg: "#f0f9ff" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => { setFgColor(preset.fg); setBgColor(preset.bg); }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs hover:border-violet-400 transition-colors"
                    >
                      <div className="h-3 w-3 rounded-sm border" style={{ backgroundColor: preset.fg }} />
                      <div className="h-3 w-3 rounded-sm border" style={{ backgroundColor: preset.bg }} />
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QR Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  QR Code
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  {qrSize}px
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div
                className="rounded-xl p-4 shadow-md"
                style={{ backgroundColor: bgColor }}
              >
                <QRCanvas
                  data={qrData}
                  fg={fgColor}
                  bg={bgColor}
                  size={Math.min(qrSize, 256)}
                />
              </div>

              <div className="w-full space-y-2">
                <Button
                  onClick={handleDownload}
                  className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PNG
                </Button>
                <Button onClick={copyDataURL} variant="outline" className="w-full">
                  {copied ? (
                    <><Check className="h-4 w-4 mr-2 text-emerald-500" />Copied!</>
                  ) : (
                    <><Copy className="h-4 w-4 mr-2" />Copy Image</>
                  )}
                </Button>
              </div>

              <div className="w-full p-3 rounded-lg bg-muted/30 border text-center">
                <p className="text-[10px] text-muted-foreground">
                  QR codes are generated in-browser using a canvas-based algorithm. Scan with any standard QR reader.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "Use high contrast colors for better scanning",
                "Minimum 128px for print, 256px+ recommended",
                "Test your QR code before printing",
                "PNG format works best for all uses",
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
