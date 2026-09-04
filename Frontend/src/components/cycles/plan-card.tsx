"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, Eye, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PLAN_META, planToSlug, type Plan } from "@/lib/plans";
import type { PlanStats } from "@/types";

interface PlanCardProps {
  stats: PlanStats;
  index?: number;
}

const PLAN_ICON: Record<Plan, typeof Sun> = {
  diario: Sun,
  fin_de_semana: CalendarDays,
};

export function PlanCard({ stats, index = 0 }: PlanCardProps) {
  const meta = PLAN_META[stats.plan];
  const Icon = PLAN_ICON[stats.plan];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Card className="glass-card overflow-hidden transition-all hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-semibold">{meta.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Prefijo carnet {meta.prefix} · 5 ciclos
              </p>
              <p className="mt-3 text-3xl font-bold">{stats.studentCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Tickets</p>
              <p className="font-semibold">{stats.ticketsSent}</p>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Asistentes</p>
              <p className="font-semibold">{stats.attendees}</p>
            </div>
          </div>

          <div className="mt-4">
            <Button size="sm" variant="outline" asChild className="w-full">
              <Link href={`/ciclos/${planToSlug(stats.plan)}`}>
                <Eye className="h-3.5 w-3.5" />
                Ver ciclos
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
