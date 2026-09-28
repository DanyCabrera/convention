"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  growth?: number;
  description?: string;
  icon: LucideIcon;
  index?: number;
  className?: string;
}

export function StatCard({
  title,
  value,
  growth,
  description,
  icon: Icon,
  index = 0,
  className,
}: StatCardProps) {
  const showGrowth = growth !== undefined && growth !== 0;
  const isPositive = (growth ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={cn("h-full min-w-0", className)}
    >
      <Card className="glass-card h-full overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="flex h-full flex-col p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <p className="text-xs text-muted-foreground sm:text-sm">{title}</p>
              <p className="text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-10 sm:w-10">
              <Icon className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-auto pt-3">
            {showGrowth ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    isPositive ? "text-success" : "text-destructive"
                  )}
                >
                  {isPositive ? "+" : ""}
                  {growth}%
                </span>
                <span className="text-xs text-muted-foreground">vs mes anterior</span>
              </div>
            ) : description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : (
              <p className="text-xs text-muted-foreground">&nbsp;</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
