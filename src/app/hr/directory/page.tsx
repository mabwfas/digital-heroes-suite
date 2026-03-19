"use client";

import { useState, useMemo } from "react";
import {
  Users,
  Plus,
  Search,
  LayoutGrid,
  LayoutList,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Building2,
  X,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useLocalStorage } from "@/lib/hooks";
import { generateId } from "@/lib/store";

type EmployeeStatus = "active" | "on-leave" | "terminated";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  startDate: string;
  status: EmployeeStatus;
}

const DEPARTMENTS = [
  "Engineering",
  "Design",
  "Marketing",
  "Sales",
  "HR",
  "Finance",
  "Operations",
  "Legal",
];

const STATUS_CONFIG: Record<
  EmployeeStatus,
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0",
  },
  "on-leave": {
    label: "On Leave",
    className:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0",
  },
  terminated: {
    label: "Terminated",
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-0",
  },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function avatarColor(name: string) {
  const colors = [
    "from-violet-500 to-purple-600",
    "from-pink-500 to-rose-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-indigo-500 to-violet-600",
  ];
  const idx =
    name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}

const EMPTY_EMPLOYEE: Omit<Employee, "id"> = {
  name: "",
  email: "",
  phone: "",
  role: "",
  department: DEPARTMENTS[0],
  startDate: new Date().toISOString().split("T")[0],
  status: "active",
};

export default function EmployeeDirectoryPage() {
  const [employees, setEmployees] = useLocalStorage<Employee[]>(
    "hr-employees",
    []
  );
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<Omit<Employee, "id">>(EMPTY_EMPLOYEE);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchSearch =
        !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.role.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === "all" || e.department === deptFilter;
      const matchStatus = statusFilter === "all" || e.status === statusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, search, deptFilter, statusFilter]);

  const deptStats = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach((e) => {
      if (e.status !== "terminated") {
        map[e.department] = (map[e.department] || 0) + 1;
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [employees]);

  function openAdd() {
    setEditingEmployee(null);
    setForm(EMPTY_EMPLOYEE);
    setDialogOpen(true);
  }

  function openEdit(emp: Employee) {
    setEditingEmployee(emp);
    setForm({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      role: emp.role,
      department: emp.department,
      startDate: emp.startDate,
      status: emp.status,
    });
    setDialogOpen(true);
  }

  function saveEmployee() {
    if (!form.name.trim() || !form.email.trim() || !form.role.trim()) return;
    if (editingEmployee) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === editingEmployee.id ? { ...form, id: e.id } : e
        )
      );
    } else {
      setEmployees((prev) => [...prev, { ...form, id: generateId() }]);
    }
    setDialogOpen(false);
  }

  function deleteEmployee(id: string) {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setDeleteConfirm(null);
  }

  const activeCount = employees.filter((e) => e.status === "active").length;
  const leaveCount = employees.filter((e) => e.status === "on-leave").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Directory"
        description="Manage your team — add, edit, and organize employee profiles"
        icon={Users}
        badge="HR"
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Employees",
            value: employees.length,
            color: "text-violet-600 dark:text-violet-400",
            bg: "from-violet-500/10 to-purple-500/10",
          },
          {
            label: "Active",
            value: activeCount,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "from-emerald-500/10 to-teal-500/10",
          },
          {
            label: "On Leave",
            value: leaveCount,
            color: "text-amber-600 dark:text-amber-400",
            bg: "from-amber-500/10 to-orange-500/10",
          },
          {
            label: "Departments",
            value: deptStats.length,
            color: "text-blue-600 dark:text-blue-400",
            bg: "from-blue-500/10 to-cyan-500/10",
          },
        ].map((s) => (
          <Card key={s.label} className={`bg-gradient-to-br ${s.bg}`}>
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={deptFilter} onValueChange={(v) => setDeptFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on-leave">On Leave</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1 border rounded-lg p-1 h-10">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode("list")}
          >
            <LayoutList className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Button
          onClick={openAdd}
          className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Employee list */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground text-sm">
              {employees.length === 0
                ? "No employees yet. Add your first team member."
                : "No employees match your filters."}
            </p>
            {employees.length === 0 && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={openAdd}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((emp) => (
            <Card
              key={emp.id}
              className="group hover:border-violet-500/50 hover:shadow-md transition-all"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`h-12 w-12 rounded-xl bg-gradient-to-br ${avatarColor(emp.name)} flex items-center justify-center text-white font-bold text-sm shadow-sm`}
                  >
                    {getInitials(emp.name)}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(emp)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-600"
                      onClick={() => setDeleteConfirm(emp.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="font-semibold text-sm leading-tight">{emp.name}</p>
                <p className="text-xs text-muted-foreground mb-2">{emp.role}</p>
                <Badge
                  className={`text-[10px] mb-3 ${STATUS_CONFIG[emp.status].className}`}
                >
                  {STATUS_CONFIG[emp.status].label}
                </Badge>
                <Separator className="mb-3" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3 shrink-0" />
                    <span className="truncate">{emp.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  {emp.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span>{emp.phone}</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-3">
                  Since {new Date(emp.startDate).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filtered.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors group"
                >
                  <div
                    className={`h-9 w-9 rounded-lg bg-gradient-to-br ${avatarColor(emp.name)} flex items-center justify-center text-white font-bold text-xs shrink-0`}
                  >
                    {getInitials(emp.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.role}</p>
                  </div>
                  <div className="hidden sm:block w-28">
                    <p className="text-xs text-muted-foreground">
                      {emp.department}
                    </p>
                  </div>
                  <div className="hidden md:block w-44">
                    <p className="text-xs text-muted-foreground truncate">
                      {emp.email}
                    </p>
                  </div>
                  <Badge
                    className={`text-[10px] shrink-0 ${STATUS_CONFIG[emp.status].className}`}
                  >
                    {STATUS_CONFIG[emp.status].label}
                  </Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(emp)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500"
                      onClick={() => setDeleteConfirm(emp.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department stats */}
      {deptStats.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Department Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {deptStats.map(([dept, count]) => (
                <div
                  key={dept}
                  className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-violet-500" />
                    <span className="text-xs font-medium">{dept}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Edit Employee" : "Add Employee"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-2">
              <Label>Full Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Jane Smith"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="jane@company.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                placeholder="+1 555 000 0000"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Role / Job Title *</Label>
              <Input
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value }))
                }
                placeholder="Frontend Engineer"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Department</Label>
              <Select
                value={form.department}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, department: v ?? f.department }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as EmployeeStatus }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-leave">On Leave</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={saveEmployee}
              disabled={!form.name.trim() || !form.email.trim() || !form.role.trim()}
              className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white"
            >
              {editingEmployee ? "Save Changes" : "Add Employee"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Employee?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. The employee record will be permanently
            removed.
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteEmployee(deleteConfirm)}
            >
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
