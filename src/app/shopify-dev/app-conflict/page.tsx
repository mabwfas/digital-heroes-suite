"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ShieldAlert,
  Plus,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit2,
  Save,
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

type AppAssetType = "js" | "css" | "both";
type ConflictPriority = "high" | "medium" | "low";

interface InstalledApp {
  id: string;
  name: string;
  assetType: AppAssetType;
  loadOrder: number;
  knownConflicts: string;
  loadsJquery: boolean;
  modifiesCart: boolean;
  modifiesCheckout: boolean;
  usesAjax: boolean;
  customEvents: boolean;
}

interface DetectedConflict {
  id: string;
  app1: string;
  app2: string;
  type: string;
  description: string;
  priority: ConflictPriority;
  resolution: string;
}

const PRIORITY_COLORS: Record<ConflictPriority, string> = {
  high: "bg-red-500/10 text-red-600",
  medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  low: "bg-blue-500/10 text-blue-600",
};

function detectConflicts(apps: InstalledApp[]): DetectedConflict[] {
  const conflicts: DetectedConflict[] = [];

  // jQuery conflict: multiple apps loading jQuery
  const jqueryApps = apps.filter((a) => a.loadsJquery);
  if (jqueryApps.length > 1) {
    for (let i = 0; i < jqueryApps.length; i++) {
      for (let j = i + 1; j < jqueryApps.length; j++) {
        conflicts.push({
          id: generateId(),
          app1: jqueryApps[i].name,
          app2: jqueryApps[j].name,
          type: "jQuery Conflict",
          description: `Both "${jqueryApps[i].name}" and "${jqueryApps[j].name}" load their own jQuery version, which can cause version conflicts and break functionality.`,
          priority: "high",
          resolution: "Configure one app to use the existing jQuery instance or load jQuery once in theme.liquid and set both apps to use the global instance.",
        });
      }
    }
  }

  // Cart modification conflict
  const cartApps = apps.filter((a) => a.modifiesCart);
  if (cartApps.length > 1) {
    for (let i = 0; i < cartApps.length; i++) {
      for (let j = i + 1; j < cartApps.length; j++) {
        conflicts.push({
          id: generateId(),
          app1: cartApps[i].name,
          app2: cartApps[j].name,
          type: "Cart Modification Conflict",
          description: `Both "${cartApps[i].name}" and "${cartApps[j].name}" modify the cart, which may cause race conditions or overwrite each other's changes.`,
          priority: "high",
          resolution: "Ensure apps use Shopify's Cart API sequentially. Set explicit load order and verify cart state after each app's modifications.",
        });
      }
    }
  }

  // CSS conflict: multiple apps with CSS
  const cssApps = apps.filter((a) => a.assetType === "css" || a.assetType === "both");
  if (cssApps.length > 1) {
    for (let i = 0; i < cssApps.length; i++) {
      for (let j = i + 1; j < cssApps.length; j++) {
        conflicts.push({
          id: generateId(),
          app1: cssApps[i].name,
          app2: cssApps[j].name,
          type: "CSS Override Risk",
          description: `"${cssApps[i].name}" and "${cssApps[j].name}" both inject CSS. Styles may conflict depending on load order and specificity.`,
          priority: "medium",
          resolution: "Inspect elements to find conflicting selectors. Use more specific selectors or adjust load order. Consider namespacing CSS with unique prefixes.",
        });
      }
    }
  }

  // Event listener conflict
  const eventApps = apps.filter((a) => a.customEvents);
  if (eventApps.length > 1) {
    for (let i = 0; i < eventApps.length; i++) {
      for (let j = i + 1; j < eventApps.length; j++) {
        conflicts.push({
          id: generateId(),
          app1: eventApps[i].name,
          app2: eventApps[j].name,
          type: "Event Listener Conflict",
          description: `Both "${eventApps[i].name}" and "${eventApps[j].name}" register custom event listeners which may interfere with each other.`,
          priority: "medium",
          resolution: "Check browser DevTools for duplicate event listeners on the same elements. Consider using event delegation and namespaced events.",
        });
      }
    }
  }

  // AJAX conflict
  const ajaxApps = apps.filter((a) => a.usesAjax);
  if (ajaxApps.length > 2) {
    conflicts.push({
      id: generateId(),
      app1: ajaxApps.map((a) => a.name).join(", "),
      app2: "",
      type: "Excessive AJAX Requests",
      description: `${ajaxApps.length} apps make AJAX requests, which can slow page load and cause rate limiting issues.`,
      priority: "low",
      resolution: "Audit network requests in DevTools. Disable unnecessary API calls. Consider lazy loading app scripts below the fold.",
    });
  }

  // Checkout conflict
  const checkoutApps = apps.filter((a) => a.modifiesCheckout);
  if (checkoutApps.length > 1) {
    for (let i = 0; i < checkoutApps.length; i++) {
      for (let j = i + 1; j < checkoutApps.length; j++) {
        conflicts.push({
          id: generateId(),
          app1: checkoutApps[i].name,
          app2: checkoutApps[j].name,
          type: "Checkout Conflict",
          description: `Both "${checkoutApps[i].name}" and "${checkoutApps[j].name}" modify the checkout flow.`,
          priority: "high",
          resolution: "Test checkout thoroughly. Only one app should modify checkout at a time. Contact app developers for compatibility guidance.",
        });
      }
    }
  }

  return conflicts;
}

export default function AppConflictDetectorPage() {
  const [apps, setApps] = useLocalStorage<InstalledApp[]>("shopify-app-conflict-apps", []);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<InstalledApp>>({
    name: "",
    assetType: "both",
    loadOrder: 1,
    knownConflicts: "",
    loadsJquery: false,
    modifiesCart: false,
    modifiesCheckout: false,
    usesAjax: false,
    customEvents: false,
  });

  const conflicts = useMemo(() => detectConflicts(apps), [apps]);

  const handleAdd = useCallback(() => {
    if (!form.name) return;
    const newApp: InstalledApp = {
      id: generateId(),
      name: form.name || "",
      assetType: (form.assetType as AppAssetType) || "both",
      loadOrder: form.loadOrder || apps.length + 1,
      knownConflicts: form.knownConflicts || "",
      loadsJquery: form.loadsJquery || false,
      modifiesCart: form.modifiesCart || false,
      modifiesCheckout: form.modifiesCheckout || false,
      usesAjax: form.usesAjax || false,
      customEvents: form.customEvents || false,
    };
    setApps((prev) => [...prev, newApp]);
    resetForm();
  }, [form, apps.length, setApps]);

  const handleUpdate = useCallback(
    (id: string) => {
      setApps((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                name: form.name || a.name,
                assetType: (form.assetType as AppAssetType) || a.assetType,
                loadOrder: form.loadOrder ?? a.loadOrder,
                knownConflicts: form.knownConflicts ?? a.knownConflicts,
                loadsJquery: form.loadsJquery ?? a.loadsJquery,
                modifiesCart: form.modifiesCart ?? a.modifiesCart,
                modifiesCheckout: form.modifiesCheckout ?? a.modifiesCheckout,
                usesAjax: form.usesAjax ?? a.usesAjax,
                customEvents: form.customEvents ?? a.customEvents,
              }
            : a
        )
      );
      resetForm();
    },
    [form, setApps]
  );

  const resetForm = () => {
    setForm({
      name: "",
      assetType: "both",
      loadOrder: apps.length + 1,
      knownConflicts: "",
      loadsJquery: false,
      modifiesCart: false,
      modifiesCheckout: false,
      usesAjax: false,
      customEvents: false,
    });
    setShowAdd(false);
    setEditingId(null);
  };

  const exportReport = useCallback(() => {
    const lines = [
      "APP CONFLICT DETECTION REPORT",
      `Generated: ${new Date().toLocaleString()}`,
      `Apps Analyzed: ${apps.length}`,
      `Conflicts Detected: ${conflicts.length}`,
      "",
      "=== INSTALLED APPS ===",
      "",
    ];
    apps
      .sort((a, b) => a.loadOrder - b.loadOrder)
      .forEach((app) => {
        lines.push(`${app.loadOrder}. ${app.name} (${app.assetType.toUpperCase()})`);
        const features = [];
        if (app.loadsJquery) features.push("jQuery");
        if (app.modifiesCart) features.push("Modifies Cart");
        if (app.modifiesCheckout) features.push("Modifies Checkout");
        if (app.usesAjax) features.push("AJAX");
        if (app.customEvents) features.push("Custom Events");
        if (features.length) lines.push(`   Features: ${features.join(", ")}`);
        if (app.knownConflicts) lines.push(`   Known Issues: ${app.knownConflicts}`);
      });
    lines.push("", "=== DETECTED CONFLICTS ===", "");
    conflicts.forEach((c) => {
      lines.push(`[${c.priority.toUpperCase()}] ${c.type}`);
      lines.push(`  Apps: ${c.app1}${c.app2 ? ` & ${c.app2}` : ""}`);
      lines.push(`  Issue: ${c.description}`);
      lines.push(`  Fix: ${c.resolution}`);
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `app-conflict-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [apps, conflicts]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="App Conflict Detector"
        description="Analyze installed Shopify apps for potential JavaScript, CSS, and functionality conflicts."
        icon={ShieldAlert}
        badge="Shopify Dev"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportReport} disabled={apps.length === 0}>
              <Download className="h-4 w-4 mr-1" /> Export Report
            </Button>
            <Button
              size="sm"
              onClick={() => { setShowAdd(!showAdd); setEditingId(null); }}
              className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
            >
              <Plus className="h-4 w-4 mr-1" /> Add App
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold font-mono">{apps.length}</p>
            <p className="text-xs text-muted-foreground">Installed Apps</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold font-mono text-red-500">
              {conflicts.filter((c) => c.priority === "high").length}
            </p>
            <p className="text-xs text-muted-foreground">High Priority</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold font-mono text-yellow-600">
              {conflicts.filter((c) => c.priority === "medium").length}
            </p>
            <p className="text-xs text-muted-foreground">Medium Priority</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold font-mono text-blue-500">
              {conflicts.filter((c) => c.priority === "low").length}
            </p>
            <p className="text-xs text-muted-foreground">Low Priority</p>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {showAdd && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {editingId ? "Edit App" : "Add Installed App"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">App Name</Label>
                <Input
                  value={form.name || ""}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Klaviyo"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Asset Type</Label>
                <select
                  value={form.assetType || "both"}
                  onChange={(e) => setForm((p) => ({ ...p, assetType: e.target.value as AppAssetType }))}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="js">JavaScript Only</option>
                  <option value="css">CSS Only</option>
                  <option value="both">JS + CSS</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Load Order</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.loadOrder || 1}
                  onChange={(e) => setForm((p) => ({ ...p, loadOrder: parseInt(e.target.value) || 1 }))}
                  className="text-sm"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              {([
                ["loadsJquery", "Loads jQuery"],
                ["modifiesCart", "Modifies Cart"],
                ["modifiesCheckout", "Modifies Checkout"],
                ["usesAjax", "Uses AJAX"],
                ["customEvents", "Custom Events"],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form[key]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
                    className="rounded"
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Known Conflicts / Notes</Label>
              <Input
                value={form.knownConflicts || ""}
                onChange={(e) => setForm((p) => ({ ...p, knownConflicts: e.target.value }))}
                placeholder="Any known issues..."
                className="text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={editingId ? () => handleUpdate(editingId) : handleAdd} disabled={!form.name} size="sm">
                <Save className="h-4 w-4 mr-1" /> {editingId ? "Update" : "Add App"}
              </Button>
              <Button variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Detected Conflicts ({conflicts.length})
          </h3>
          {conflicts.map((conflict) => (
            <Card key={conflict.id} className="border-l-4" style={{
              borderLeftColor: conflict.priority === "high" ? "#ef4444" : conflict.priority === "medium" ? "#eab308" : "#3b82f6"
            }}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {conflict.priority === "high" ? (
                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      ) : conflict.priority === "medium" ? (
                        <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                      )}
                      <span className="font-medium text-sm">{conflict.type}</span>
                      <Badge className={`text-[10px] ${PRIORITY_COLORS[conflict.priority]}`}>
                        {conflict.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-6">{conflict.description}</p>
                    <div className="mt-2 ml-6 p-2 rounded bg-muted/50 border">
                      <p className="text-xs"><span className="font-medium">Resolution:</span> {conflict.resolution}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* App List */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Installed Apps ({apps.length})
        </h3>
        {apps.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No apps logged yet. Add your installed apps to detect conflicts.
            </CardContent>
          </Card>
        )}
        {apps
          .sort((a, b) => a.loadOrder - b.loadOrder)
          .map((app) => (
            <Card key={app.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        #{app.loadOrder}
                      </Badge>
                      <span className="font-medium text-sm">{app.name}</span>
                      <Badge className={`text-[10px] ${
                        app.assetType === "js" ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" :
                        app.assetType === "css" ? "bg-blue-500/10 text-blue-600" :
                        "bg-purple-500/10 text-purple-600"
                      }`}>
                        {app.assetType.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5 ml-8">
                      {app.loadsJquery && <Badge variant="secondary" className="text-[9px]">jQuery</Badge>}
                      {app.modifiesCart && <Badge variant="secondary" className="text-[9px]">Cart</Badge>}
                      {app.modifiesCheckout && <Badge variant="secondary" className="text-[9px]">Checkout</Badge>}
                      {app.usesAjax && <Badge variant="secondary" className="text-[9px]">AJAX</Badge>}
                      {app.customEvents && <Badge variant="secondary" className="text-[9px]">Events</Badge>}
                    </div>
                    {app.knownConflicts && (
                      <p className="text-xs text-muted-foreground mt-1 ml-8 italic">{app.knownConflicts}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => {
                        setForm({ ...app });
                        setEditingId(app.id);
                        setShowAdd(true);
                      }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-red-500"
                      onClick={() => setApps((prev) => prev.filter((a) => a.id !== app.id))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
