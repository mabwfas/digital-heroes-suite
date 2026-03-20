"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Moon,
  Sun,
  Zap,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toolCategories, dashboardLink } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    toolCategories.map((c) => c.name)
  );
  const [dark, setDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  // Persist dark mode
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Auto-expand category containing active route
  useEffect(() => {
    const activeCategory = toolCategories.find((c) =>
      c.tools.some((t) => pathname === t.href)
    );
    if (activeCategory && !expandedCategories.includes(activeCategory.name)) {
      setExpandedCategories((prev) => [...prev, activeCategory.name]);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcut: Cmd/Ctrl+K to open search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        setCollapsed(false);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleCategory = useCallback((name: string) => {
    setExpandedCategories((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }, []);

  const toggleDark = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  // Filter tools by search
  const filteredCategories = searchQuery.trim()
    ? toolCategories
        .map((cat) => ({
          ...cat,
          tools: cat.tools.filter(
            (t) =>
              t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              cat.name.toLowerCase().includes(searchQuery.toLowerCase())
          ),
        }))
        .filter((cat) => cat.tools.length > 0)
    : toolCategories;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-border">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shrink-0 shadow-sm">
          <Zap className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="font-bold text-sm truncate">Digital Heroes</h1>
            <p className="text-[10px] text-muted-foreground truncate">
              All-in-One Tool Suite
            </p>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (searchOpen || searchQuery) && (
        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              autoFocus
              type="text"
              placeholder="Search tools... (⌘K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setSearchOpen(false); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 px-2 py-2">
        {/* Dashboard Link */}
        <Link
          href={dashboardLink.href}
          onClick={() => setMobileOpen(false)}
          aria-current={pathname === "/" ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 mb-1",
            pathname === "/"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <dashboardLink.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </Link>

        {!collapsed && !searchOpen && !searchQuery && (
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mb-1"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search tools...</span>
            <kbd className="ml-auto text-[10px] bg-muted px-1 py-0.5 rounded font-mono">⌘K</kbd>
          </button>
        )}

        <Separator className="my-2" />

        {/* Tool Categories */}
        <nav role="navigation" aria-label="Tool categories">
          {filteredCategories.map((category) => {
            const isExpanded = expandedCategories.includes(category.name);
            const isActive = category.tools.some((t) => pathname === t.href);

            return (
              <div key={category.name} className="mb-1">
                <button
                  onClick={() => toggleCategory(category.name)}
                  aria-expanded={isExpanded}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <category.icon
                    className={cn("h-4 w-4 shrink-0", category.color)}
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">
                        {category.name}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 transition-transform duration-200",
                          isExpanded ? "rotate-0" : "-rotate-90"
                        )}
                      />
                    </>
                  )}
                </button>

                {!collapsed && isExpanded && (
                  <div
                    className="ml-4 pl-3 border-l border-border space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200"
                    role="list"
                  >
                    {category.tools.map((tool) => (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        role="listitem"
                        onClick={() => { setMobileOpen(false); setSearchQuery(""); setSearchOpen(false); }}
                        aria-current={pathname === tool.href ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all duration-200",
                          pathname === tool.href
                            ? "bg-accent text-foreground font-medium shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        )}
                      >
                        <tool.icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate flex-1">{tool.name}</span>
                        {tool.badge && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1 py-0 h-4 bg-gradient-to-r from-violet-500/10 to-pink-500/10 text-violet-600 dark:text-violet-400 border-0"
                          >
                            {tool.badge}
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {searchQuery && filteredCategories.length === 0 && (
            <p className="text-xs text-muted-foreground px-3 py-4 text-center">
              No tools match &ldquo;{searchQuery}&rdquo;
            </p>
          )}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleDark}
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        {!collapsed && (
          <span className="text-[10px] text-muted-foreground">
            {dark ? "Dark" : "Light"}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 ml-auto"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
      >
        {mobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen bg-card border-r border-border transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
