"use client";

import { useState, useMemo, useCallback } from "react";
import {
  HardDrive,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
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

type BackupType = "full" | "theme" | "content" | "settings";
type BackupStatus = "complete" | "in-progress" | "scheduled";
type ScheduleFreq = "daily" | "weekly" | "monthly";

interface BackupEntry {
  id: string;
  storeName: string;
  backupDate: string;
  type: BackupType;
  status: BackupStatus;
  notes: string;
}

interface StoreConfig {
  id: string;
  name: string;
  schedule: ScheduleFreq;
  lastBackup: string;
  backupCount: number;
}

interface RestorationLog {
  id: string;
  storeName: string;
  restoredDate: string;
  backupDate: string;
  type: BackupType;
  notes: string;
}

const TYPE_COLORS: Record<BackupType, string> = {
  full: "bg-violet-500/10 text-violet-600",
  theme: "bg-blue-500/10 text-blue-600",
  content: "bg-emerald-500/10 text-emerald-600",
  settings: "bg-orange-500/10 text-orange-600",
};

const STATUS_COLORS: Record<BackupStatus, string> = {
  complete: "bg-emerald-500/10 text-emerald-600",
  "in-progress": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  scheduled: "bg-blue-500/10 text-blue-600",
};

function isOverdue(lastBackup: string, schedule: ScheduleFreq): boolean {
  if (!lastBackup) return true;
  const last = new Date(lastBackup).getTime();
  const now = Date.now();
  const day = 86400000;
  switch (schedule) {
    case "daily": return now - last > day * 1.5;
    case "weekly": return now - last > day * 8;
    case "monthly": return now - last > day * 35;
    default: return false;
  }
}

export default function BackupManagerPage() {
  const [backups, setBackups] = useLocalStorage<BackupEntry[]>("shopify-backup-entries", []);
  const [stores, setStores] = useLocalStorage<StoreConfig[]>("shopify-backup-stores", []);
  const [restorations, setRestorations] = useLocalStorage<RestorationLog[]>("shopify-backup-restorations", []);
  const [showAddBackup, setShowAddBackup] = useState(false);
  const [showAddStore, setShowAddStore] = useState(false);
  const [showAddRestore, setShowAddRestore] = useState(false);
  const [backupForm, setBackupForm] = useState<Partial<BackupEntry>>({
    storeName: "",
    backupDate: new Date().toISOString().split("T")[0],
    type: "full",
    status: "complete",
    notes: "",
  });
  const [storeForm, setStoreForm] = useState<Partial<StoreConfig>>({
    name: "",
    schedule: "weekly",
    lastBackup: "",
  });
  const [restoreForm, setRestoreForm] = useState<Partial<RestorationLog>>({
    storeName: "",
    restoredDate: new Date().toISOString().split("T")[0],
    backupDate: "",
    type: "full",
    notes: "",
  });

  const overdueStores = useMemo(() => {
    return stores.filter((s) => isOverdue(s.lastBackup, s.schedule));
  }, [stores]);

  const handleAddBackup = useCallback(() => {
    if (!backupForm.storeName) return;
    const entry: BackupEntry = {
      id: generateId(),
      storeName: backupForm.storeName || "",
      backupDate: backupForm.backupDate || new Date().toISOString().split("T")[0],
      type: (backupForm.type as BackupType) || "full",
      status: (backupForm.status as BackupStatus) || "complete",
      notes: backupForm.notes || "",
    };
    setBackups((prev) => [entry, ...prev]);

    // Update store last backup
    setStores((prev) =>
      prev.map((s) =>
        s.name === entry.storeName
          ? { ...s, lastBackup: entry.backupDate, backupCount: s.backupCount + 1 }
          : s
      )
    );

    setBackupForm({ storeName: "", backupDate: new Date().toISOString().split("T")[0], type: "full", status: "complete", notes: "" });
    setShowAddBackup(false);
  }, [backupForm, setBackups, setStores]);

  const handleAddStore = useCallback(() => {
    if (!storeForm.name) return;
    const store: StoreConfig = {
      id: generateId(),
      name: storeForm.name || "",
      schedule: (storeForm.schedule as ScheduleFreq) || "weekly",
      lastBackup: storeForm.lastBackup || "",
      backupCount: 0,
    };
    setStores((prev) => [...prev, store]);
    setStoreForm({ name: "", schedule: "weekly", lastBackup: "" });
    setShowAddStore(false);
  }, [storeForm, setStores]);

  const handleAddRestore = useCallback(() => {
    if (!restoreForm.storeName) return;
    const entry: RestorationLog = {
      id: generateId(),
      storeName: restoreForm.storeName || "",
      restoredDate: restoreForm.restoredDate || new Date().toISOString().split("T")[0],
      backupDate: restoreForm.backupDate || "",
      type: (restoreForm.type as BackupType) || "full",
      notes: restoreForm.notes || "",
    };
    setRestorations((prev) => [entry, ...prev]);
    setRestoreForm({ storeName: "", restoredDate: new Date().toISOString().split("T")[0], backupDate: "", type: "full", notes: "" });
    setShowAddRestore(false);
  }, [restoreForm, setRestorations]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store Backup Manager"
        description="Track backups, schedules, and restoration logs across Shopify stores."
        icon={HardDrive}
        badge="Shopify Dev"
        actions={
          <Button
            size="sm"
            onClick={() => { setShowAddBackup(!showAddBackup); setShowAddStore(false); setShowAddRestore(false); }}
            className="bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white border-0"
          >
            <Plus className="h-4 w-4 mr-1" /> Log Backup
          </Button>
        }
      />

      {/* Overdue Alerts */}
      {overdueStores.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardContent className="py-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Overdue Backups</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {overdueStores.map((s) => s.name).join(", ")} {overdueStores.length === 1 ? "has" : "have"} overdue backups based on schedule.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold font-mono">{stores.length}</p>
            <p className="text-xs text-muted-foreground">Stores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold font-mono">{backups.length}</p>
            <p className="text-xs text-muted-foreground">Total Backups</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold font-mono text-yellow-600">{overdueStores.length}</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold font-mono">{restorations.length}</p>
            <p className="text-xs text-muted-foreground">Restorations</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Backup Form */}
      {showAddBackup && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">Log New Backup</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Store</Label>
                {stores.length > 0 ? (
                  <select
                    value={backupForm.storeName || ""}
                    onChange={(e) => setBackupForm((p) => ({ ...p, storeName: e.target.value }))}
                    className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="">Select store...</option>
                    {stores.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                ) : (
                  <Input value={backupForm.storeName || ""} onChange={(e) => setBackupForm((p) => ({ ...p, storeName: e.target.value }))} placeholder="Store name" className="text-sm" />
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input type="date" value={backupForm.backupDate || ""} onChange={(e) => setBackupForm((p) => ({ ...p, backupDate: e.target.value }))} className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Type</Label>
                <select value={backupForm.type || "full"} onChange={(e) => setBackupForm((p) => ({ ...p, type: e.target.value as BackupType }))} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                  <option value="full">Full</option>
                  <option value="theme">Theme</option>
                  <option value="content">Content</option>
                  <option value="settings">Settings</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <select value={backupForm.status || "complete"} onChange={(e) => setBackupForm((p) => ({ ...p, status: e.target.value as BackupStatus }))} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                  <option value="complete">Complete</option>
                  <option value="in-progress">In Progress</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Input value={backupForm.notes || ""} onChange={(e) => setBackupForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" className="text-sm" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddBackup} disabled={!backupForm.storeName} size="sm">Save</Button>
              <Button variant="outline" size="sm" onClick={() => setShowAddBackup(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stores Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Stores</h3>
          <Button variant="outline" size="sm" onClick={() => { setShowAddStore(!showAddStore); setShowAddBackup(false); setShowAddRestore(false); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Store
          </Button>
        </div>

        {showAddStore && (
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Store Name</Label>
                  <Input value={storeForm.name || ""} onChange={(e) => setStoreForm((p) => ({ ...p, name: e.target.value }))} placeholder="my-store.myshopify.com" className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Schedule</Label>
                  <select value={storeForm.schedule || "weekly"} onChange={(e) => setStoreForm((p) => ({ ...p, schedule: e.target.value as ScheduleFreq }))} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Last Backup Date</Label>
                  <Input type="date" value={storeForm.lastBackup || ""} onChange={(e) => setStoreForm((p) => ({ ...p, lastBackup: e.target.value }))} className="text-sm" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddStore} disabled={!storeForm.name} size="sm">Add Store</Button>
                <Button variant="outline" size="sm" onClick={() => setShowAddStore(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {stores.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No stores added yet.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stores.map((store) => {
              const overdue = isOverdue(store.lastBackup, store.schedule);
              return (
                <Card key={store.id} className={overdue ? "border-yellow-500/50" : ""}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          {overdue ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          )}
                          <span className="font-medium text-sm">{store.name}</span>
                        </div>
                        <div className="ml-6 mt-1 space-y-0.5">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Schedule: {store.schedule}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Last: {store.lastBackup || "Never"}
                          </p>
                          <p className="text-xs text-muted-foreground">Backups: {store.backupCount}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-red-500" onClick={() => setStores((prev) => prev.filter((s) => s.id !== store.id))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Backup History */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Backup History</h3>
        {backups.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No backups logged yet.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {backups.slice(0, 20).map((b) => (
              <Card key={b.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{b.storeName}</span>
                      <Badge className={`text-[10px] ${TYPE_COLORS[b.type]}`}>{b.type}</Badge>
                      <Badge className={`text-[10px] ${STATUS_COLORS[b.status]}`}>{b.status}</Badge>
                      <span className="text-xs text-muted-foreground">{b.backupDate}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-red-500" onClick={() => setBackups((prev) => prev.filter((x) => x.id !== b.id))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {b.notes && <p className="text-xs text-muted-foreground mt-1 italic">{b.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Restoration Log */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Restoration Log</h3>
          <Button variant="outline" size="sm" onClick={() => { setShowAddRestore(!showAddRestore); setShowAddBackup(false); setShowAddStore(false); }}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Log Restoration
          </Button>
        </div>

        {showAddRestore && (
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Store</Label>
                  <Input value={restoreForm.storeName || ""} onChange={(e) => setRestoreForm((p) => ({ ...p, storeName: e.target.value }))} placeholder="Store name" className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Restored Date</Label>
                  <Input type="date" value={restoreForm.restoredDate || ""} onChange={(e) => setRestoreForm((p) => ({ ...p, restoredDate: e.target.value }))} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Backup From Date</Label>
                  <Input type="date" value={restoreForm.backupDate || ""} onChange={(e) => setRestoreForm((p) => ({ ...p, backupDate: e.target.value }))} className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <select value={restoreForm.type || "full"} onChange={(e) => setRestoreForm((p) => ({ ...p, type: e.target.value as BackupType }))} className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                    <option value="full">Full</option><option value="theme">Theme</option><option value="content">Content</option><option value="settings">Settings</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <Input value={restoreForm.notes || ""} onChange={(e) => setRestoreForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Reason for restoration..." className="text-sm" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddRestore} disabled={!restoreForm.storeName} size="sm">Log Restoration</Button>
                <Button variant="outline" size="sm" onClick={() => setShowAddRestore(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {restorations.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No restorations logged.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {restorations.map((r) => (
              <Card key={r.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{r.storeName}</span>
                      <Badge className={`text-[10px] ${TYPE_COLORS[r.type]}`}>{r.type}</Badge>
                      <span className="text-xs text-muted-foreground">Restored: {r.restoredDate}</span>
                      {r.backupDate && <span className="text-xs text-muted-foreground">From: {r.backupDate}</span>}
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-red-500" onClick={() => setRestorations((prev) => prev.filter((x) => x.id !== r.id))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {r.notes && <p className="text-xs text-muted-foreground mt-1 italic">{r.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
