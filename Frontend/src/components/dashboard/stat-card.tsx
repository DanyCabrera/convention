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
}

export function StatCard({
  title,
  value,
  growth,
  description,
  icon: Icon,
  index = 0,
}: StatCardProps) {
  const showGrowth = growth !== undefined && growth !== 0;
  const isPositive = (growth ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="h-full"
    >
      <Card className="glass-card h-full overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="flex h-full flex-col p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold tracking-tight">{value}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mt-auto pt-3">
            {showGrowth ? (
              <div className="flex items-center gap-1.5">
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
