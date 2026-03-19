"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Zap,
  ArrowRight,
  TrendingUp,
  Users,
  DollarSign,
  ClipboardList,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toolCategories } from "@/lib/navigation";
import { getStore } from "@/lib/store";

function useDynamicStats() {
  const [stats, setStats] = useState({
    clients: 0,
    revenue: 0,
    orders: 0,
  });

  useEffect(() => {
    // Pull real data from localStorage stores
    const clients = getStore<Array<{ status: string; totalSpent?: number }>>(
      "clients-crm",
      []
    );
    const orders = getStore<Array<{ status: string; price?: number }>>(
      "fiverr-orders",
      []
    );
    const invoices = getStore<Array<{ total?: number; status?: string }>>(
      "client-invoices",
      []
    );

    const activeClients = clients.filter(
      (c) => c.status === "active"
    ).length;
    const revenue =
      clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0) +
      invoices
        .filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + (i.total || 0), 0);
    const pendingOrders = orders.filter(
      (o) => o.status === "in-progress" || o.status === "pending"
    ).length;

    setStats({ clients: activeClients, revenue, orders: pendingOrders });
  }, []);

  return stats;
}

const categoryGradients: Record<string, string> = {
  "Shopify Design": "from-pink-500/10 to-rose-500/10",
  "Clients & Projects": "from-blue-500/10 to-cyan-500/10",
  "HR & Team": "from-violet-500/10 to-purple-500/10",
  Marketing: "from-emerald-500/10 to-green-500/10",
  "AI Studio": "from-amber-500/10 to-orange-500/10",
  Utilities: "from-slate-500/10 to-gray-500/10",
};

export default function DashboardPage() {
  const { clients, revenue, orders } = useDynamicStats();

  const statCards = [
    {
      label: "Active Clients",
      value: clients.toString(),
      icon: Users,
      change: `${clients > 0 ? "+" : ""}${clients} total`,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Revenue",
      value: `$${revenue.toLocaleString()}`,
      icon: DollarSign,
      change: revenue > 0 ? "From invoices & clients" : "Start tracking",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Pending Orders",
      value: orders.toString(),
      icon: ClipboardList,
      change: orders > 0 ? `${orders} need attention` : "All clear",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Tools Available",
      value: "54",
      icon: Zap,
      change: "10 categories",
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 p-8 md:p-10 text-white">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(255,255,255,0.08)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E\")",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <Badge className="bg-white/20 text-white border-0 hover:bg-white/30 backdrop-blur-sm">
              54+ Premium Tools
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
            Welcome to Digital Heroes Suite
          </h1>
          <p className="text-white/80 max-w-xl text-sm md:text-base leading-relaxed">
            Your all-in-one toolkit for Shopify design, client management, HR,
            marketing, and AI-powered creation. Tools that replace{" "}
            <span className="font-semibold text-white">$500+/mo</span> in
            subscriptions.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.label}
            className="group hover:shadow-md transition-all duration-300 hover:border-violet-500/30"
          >
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center`}
                >
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl md:text-3xl font-bold tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stat.label}
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1.5 font-medium">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tool Categories Grid */}
      {toolCategories.map((category) => (
        <section key={category.name}>
          <div className="flex items-center gap-2 mb-4">
            <div
              className={`h-7 w-7 rounded-md bg-gradient-to-br ${
                categoryGradients[category.name] ?? "from-gray-500/10 to-gray-500/10"
              } flex items-center justify-center`}
            >
              <category.icon className={`h-4 w-4 ${category.color}`} />
            </div>
            <h2 className="text-lg font-semibold tracking-tight">
              {category.name}
            </h2>
            <Badge variant="secondary" className="text-[10px] font-normal">
              {category.tools.length} tools
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {category.tools.map((tool) => (
              <Link key={tool.href} href={tool.href}>
                <Card className="group hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300 cursor-pointer h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center group-hover:from-violet-500/20 group-hover:to-pink-500/20 transition-all duration-300">
                        <tool.icon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <h3 className="font-medium text-sm group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                        {tool.name}
                      </h3>
                      {tool.badge && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1 py-0 h-4 bg-gradient-to-r from-violet-500/10 to-pink-500/10 text-violet-600 dark:text-violet-400 border-0"
                        >
                          {tool.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {tool.description}
                    </p>
                    {tool.replaces && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <ArrowRight className="h-2.5 w-2.5" />
                        Replaces {tool.replaces}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
