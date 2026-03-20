"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Terminal,
  Plus,
  Trash2,
  Copy,
  Check,
  Edit2,
  Save,
  ExternalLink,
  GitBranch,
  ArrowLeftRight,
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

type EnvStatus = "active" | "paused" | "archived";

interface DevEnvironment {
  id: string;
  storeName: string;
  themeId: string;
  devUrl: string;
  cliVersion: string;
  nodeVersion: string;
  status: EnvStatus;
  branch: string;
  notes: string;
  createdAt: string;
}

const STATUS_COLORS: Record<EnvStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  paused: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  archived: "bg-muted text-muted-foreground",
};

interface CLICommand {
  label: string;
  command: (env: DevEnvironment) => string;
}

const CLI_COMMANDS: CLICommand[] = [
  { label: "Dev Server", command: (env) => `shopify theme dev --store=${env.storeName} --theme=${env.themeId}` },
  { label: "Push Theme", command: (env) => `shopify theme push --store=${env.storeName} --theme=${env.themeId}` },
  { label: "Pull Theme", command: (env) => `shopify theme pull --store=${env.storeName} --theme=${env.themeId}` },
  { label: "Theme Info", command: (env) => `shopify theme info --store=${env.storeName} --theme=${env.themeId}` },
  { label: "Check Theme", command: (env) => `shopify theme check` },
  { label: "Open Editor", command: (env) => `shopify theme open --store=${env.storeName} --theme=${env.themeId}` },
];

const DEFAULT_FORM: Partial<DevEnvironment> = {
  storeName: "",
  themeId: "",
  devUrl: "",
  cliVersion: "",
  nodeVersion: "",
  status: "active",
  branch: "main",
  notes: "",
};

export default function DevEnvManagerPage() {
  const [environments, setEnvironments] = useLocalStorage<DevEnvironment[]>(
    "shopify-dev-environments",
    []
  );
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<DevEnvironment>>(DEFAULT_FORM);
  const [copied, setCopied] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<[string, string]>(["", ""]);

  const handleCopy = useCallback(async (id: string, text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  const handleAdd = useCallback(() => {
    if (!form.storeName) return;
    const env: DevEnvironment = {
      id: generateId(),
      storeName: form.storeName || "",
      themeId: form.themeId || "",
      devUrl: form.devUrl || "",
      cliVersion: form.cliVersion || "",
      nodeVersion: form.nodeVersion || "",
      status: (form.status as EnvStatus) || "active",
      branch: form.branch || "main",
      notes: form.notes || "",
      createdAt: new Date().toISOString(),
    };
    setEnvironments((prev) => [env, ...prev]);
    setForm(DEFAULT_FORM);
    setShowAdd(false);
  }, [form, setEnvironments]);

  const handleUpdate = useCallback(
    (id: string) => {
      setEnvironments((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                storeName: form.storeName || e.storeName,
                themeId: form.themeId ?? e.themeId,
                devUrl: form.devUrl ?? e.devUrl,
                cliVersion: form.cliVersion ?? e.cliVersion,
                nodeVersion: form.nodeVersion ?? e.nodeVersion,
                status: (form.status as EnvStatus) || e.status,
                branch: form.branch ?? e.branch,
                notes: form.notes ?? e.notes,
              }
            : e
        )
      );
      setEditingId(null);
      setForm(DEFAULT_FORM);
      setShowAdd(false);
    },
    [form, setEnvironments]
  );

  const handleDelete = useCallback(
    (id: string) => {
      setEnvironments((prev) => prev.filter((e) => e.id !== id));
    },
    [setEnvironments]
  );

  const startEdit = useCallback((env: DevEnvironment) => {
    setForm({ ...env });
    setEditingId(env.id);
    setShowAdd(true);
  }, []);

  const compareEnvs = useMemo(() => {
    if (!compareMode || !compareIds[0] || !compareIds[1]) return null;
    const env1 = environments.find((e) => e.id === compareIds[0]);
    const env2 = environments.find((e) => e.id === compareIds[1]);
    if (!env1 || !env2) return null;
    return { env1, env2 };
  }, [compareMode, compareIds, environments]);

  const activeCount = environments.filter((e) => e.status === "active").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dev Environment Manager"
        description="Track development environments, quick-copy CLI commands, and compare staging vs production."
        icon={Terminal}
        badge="Shopify Dev"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompareMode(!compareMode)}
              className={compareMode ? "border-violet-500 text-violet-600" : ""}
            >
              <ArrowLeftRight className="h-4 w-4 mr-1" /> Compare
            </Button>
            <Button
              size="sm"
              onClick={() => { setShowAdd(!showAdd); setEditingId(null); setForm(DEFAULT_FORM); }}
              className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Environment
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold font-mono">{environments.length}</p>
            <p className="text-xs text-muted-foreground">Total Environments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold font-mono text-emerald-500">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold font-mono text-muted-foreground">{environments.length - activeCount}</p>
            <p className="text-xs text-muted-foreground">Paused / Archived</p>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {showAdd && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {editingId ? "Edit Environment" : "Add Development Environment"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Store Name</Label>
                <Input
                  value={form.storeName || ""}
                  onChange={(e) => setForm((p) => ({ ...p, storeName: e.target.value }))}
                  placeholder="my-store.myshopify.com"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Theme ID</Label>
                <Input
                  value={form.themeId || ""}
                  onChange={(e) => setForm((p) => ({ ...p, themeId: e.target.value }))}
                  placeholder="123456789"
                  className="text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Dev URL</Label>
                <Input
                  value={form.devUrl || ""}
                  onChange={(e) => setForm((p) => ({ ...p, devUrl: e.target.value }))}
                  placeholder="http://127.0.0.1:9292"
                  className="text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Shopify CLI Version</Label>
                <Input
                  value={form.cliVersion || ""}
                  onChange={(e) => setForm((p) => ({ ...p, cliVersion: e.target.value }))}
                  placeholder="3.60.0"
                  className="text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Node Version</Label>
                <Input
                  value={form.nodeVersion || ""}
                  onChange={(e) => setForm((p) => ({ ...p, nodeVersion: e.target.value }))}
                  placeholder="20.11.0"
                  className="text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <select
                  value={form.status || "active"}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as EnvStatus }))}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Git Branch</Label>
                <Input
                  value={form.branch || ""}
                  onChange={(e) => setForm((p) => ({ ...p, branch: e.target.value }))}
                  placeholder="main"
                  className="text-sm font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <Input
                  value={form.notes || ""}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Environment notes..."
                  className="text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={editingId ? () => handleUpdate(editingId) : handleAdd} disabled={!form.storeName} size="sm">
                <Save className="h-4 w-4 mr-1" /> {editingId ? "Update" : "Save"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setShowAdd(false); setEditingId(null); setForm(DEFAULT_FORM); }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compare Mode */}
      {compareMode && environments.length >= 2 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Environment Comparison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Environment A</Label>
                <select
                  value={compareIds[0]}
                  onChange={(e) => setCompareIds([e.target.value, compareIds[1]])}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select...</option>
                  {environments.map((e) => (
                    <option key={e.id} value={e.id}>{e.storeName} ({e.status})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Environment B</Label>
                <select
                  value={compareIds[1]}
                  onChange={(e) => setCompareIds([compareIds[0], e.target.value])}
                  className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Select...</option>
                  {environments.map((e) => (
                    <option key={e.id} value={e.id}>{e.storeName} ({e.status})</option>
                  ))}
                </select>
              </div>
            </div>
            {compareEnvs && (
              <div className="overflow-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium border-b">Property</th>
                      <th className="px-3 py-2 text-left font-medium border-b">{compareEnvs.env1.storeName}</th>
                      <th className="px-3 py-2 text-left font-medium border-b">{compareEnvs.env2.storeName}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {([
                      ["Theme ID", "themeId"],
                      ["Dev URL", "devUrl"],
                      ["CLI Version", "cliVersion"],
                      ["Node Version", "nodeVersion"],
                      ["Status", "status"],
                      ["Branch", "branch"],
                    ] as const).map(([label, key]) => {
                      const v1 = compareEnvs!.env1[key];
                      const v2 = compareEnvs!.env2[key];
                      const diff = v1 !== v2;
                      return (
                        <tr key={key} className={diff ? "bg-yellow-500/5" : ""}>
                          <td className="px-3 py-1.5 border-b font-medium text-muted-foreground">{label}</td>
                          <td className={`px-3 py-1.5 border-b font-mono text-xs ${diff ? "text-yellow-700 dark:text-yellow-400" : ""}`}>{v1 || "-"}</td>
                          <td className={`px-3 py-1.5 border-b font-mono text-xs ${diff ? "text-yellow-700 dark:text-yellow-400" : ""}`}>{v2 || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Environment List */}
      <div className="space-y-4">
        {environments.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No development environments yet. Add your first one above.
            </CardContent>
          </Card>
        )}
        {environments.map((env) => (
          <Card key={env.id} className={env.status === "archived" ? "opacity-60" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-violet-500" />
                    <CardTitle className="text-base">{env.storeName}</CardTitle>
                    <Badge className={`text-[10px] ${STATUS_COLORS[env.status]}`}>{env.status}</Badge>
                    {env.branch && (
                      <Badge variant="secondary" className="text-[10px] font-mono gap-1">
                        <GitBranch className="h-2.5 w-2.5" /> {env.branch}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {env.themeId && <span className="font-mono">Theme: {env.themeId}</span>}
                    {env.cliVersion && <span>CLI: v{env.cliVersion}</span>}
                    {env.nodeVersion && <span>Node: v{env.nodeVersion}</span>}
                    {env.devUrl && <span className="font-mono">{env.devUrl}</span>}
                  </div>
                  {env.notes && <p className="text-xs text-muted-foreground mt-1 italic">{env.notes}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => startEdit(env)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-red-500" onClick={() => handleDelete(env.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* CLI Commands */}
              <div className="mt-2 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Quick Commands</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                  {CLI_COMMANDS.map((cmd) => {
                    const cmdStr = cmd.command(env);
                    const copyKey = `${env.id}-${cmd.label}`;
                    return (
                      <button
                        key={cmd.label}
                        onClick={() => handleCopy(copyKey, cmdStr)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded border bg-muted/30 hover:bg-muted/60 transition-colors text-left group"
                      >
                        <span className="text-[10px] font-medium text-muted-foreground shrink-0 w-16">
                          {cmd.label}
                        </span>
                        <code className="text-[10px] font-mono truncate flex-1 text-foreground/70">
                          {cmdStr}
                        </code>
                        {copied === copyKey ? (
                          <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
