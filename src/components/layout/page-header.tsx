"use client";

import { Badge } from "@/components/ui/badge";
import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  replaces?: string;
  className?: string;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  badge,
  replaces,
  className,
  actions,
}: PageHeaderProps) {
  return (
    <div className={`mb-6 ${className ?? ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 flex items-center justify-center shrink-0 shadow-sm">
            <Icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {badge && (
                <Badge
                  variant="secondary"
                  className="bg-gradient-to-r from-violet-500/10 to-pink-500/10 text-violet-600 dark:text-violet-400 border-0 text-[10px]"
                >
                  {badge}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
            {replaces && (
              <p className="text-xs text-muted-foreground mt-1">
                Replaces:{" "}
                <span className="font-medium text-foreground/70">
                  {replaces}
                </span>
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
