"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  GraduationCap,
  ScanLine,
  Sun,
  Ticket,
  UserPlus,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PLAN_META, planToSlug, type Plan } from "@/lib/plans";
import { cn, getCicloLabel } from "@/lib/utils";
import type { CycleStats, PlanStats } from "@/types";
import { aggregateCycleStatsByCiclo } from "@/hooks/use-cycle-stats";

interface DashboardCycleGridProps {
  cycleStats: CycleStats[];
  planStats?: PlanStats[];
  loading?: boolean;
}

export function DashboardCycleGrid({
  cycleStats,
  planStats,
  loading,
}: DashboardCycleGridProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const aggregated = aggregateCycleStatsByCiclo(cycleStats);
  const plans =
    planStats ??
    (["diario", "fin_de_semana"] as Plan[]).map((plan) => {
      const rows = cycleStats.filter((c) => c.plan === plan);
      return {
        plan,
        studentCount: rows.reduce((sum, r) => sum + r.studentCount, 0),
        ticketsSent: rows.reduce((sum, r) => sum + r.ticketsSent, 0),
        attendees: rows.reduce((sum, r) => sum + r.attendees, 0),
      };
    });

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4 text-primary" />
            Planes
          </CardTitle>
          <Link
            href="/ciclos"
            className="text-xs font-medium text-primary hover:underline"
          >
            Ver ciclos
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {plans.map((stats, index) => {
              const meta = PLAN_META[stats.plan];
              const Icon = stats.plan === "diario" ? Sun : CalendarDays;
              return (
                <motion.div
                  key={stats.plan}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={`/ciclos/${planToSlug(stats.plan)}`}
                    className="block rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold">{meta.label}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Prefijo {meta.prefix}
                        </p>
                      </div>
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="mt-3 text-2xl font-bold">{stats.studentCount}</p>
                    <div className="mt-3 space-y-1 border-t border-border/60 pt-2 text-[11px]">
                      <Row label="Tickets" value={stats.ticketsSent} />
                      <Row
                        label="Asistentes"
                        value={stats.attendees}
                        highlight={stats.attendees > 0}
                      />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Detalle por ciclo (ambos planes)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {aggregated.map((cycle, index) => (
              <motion.div
                key={cycle.ciclo}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-xl border border-border bg-muted/20 p-3"
              >
                <p className="text-sm font-semibold">{getCicloLabel(cycle.ciclo)}</p>
                <p className="mt-2 text-2xl font-bold">{cycle.studentCount}</p>
                <p className="text-[11px] text-muted-foreground">inscritos</p>
                <div className="mt-3 space-y-1 border-t border-border/60 pt-2 text-[11px]">
                  <Row label="Tickets" value={cycle.ticketsSent} />
                  <Row
                    label="Asistentes"
                    value={cycle.attendees}
                    highlight={cycle.attendees > 0}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", highlight && "text-success")}>
        {value}
      </span>
    </div>
  );
}

const QUICK_ACTIONS = [
  {
    href: "/registrar",
    label: "Registrar",
    description: "Nuevo registro",
    icon: UserPlus,
  },
  {
    href: "/asistencia",
    label: "Asistencia",
    description: "Escanear QR",
    icon: ScanLine,
  },
  {
    href: "/tickets",
    label: "Tickets",
    description: "Ver tickets",
    icon: Ticket,
  },
  {
    href: "/estudiantes",
    label: "Participantes",
    description: "Estudiantes y docentes",
    icon: Users,
  },
] as const;

export function DashboardQuickActions() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {QUICK_ACTIONS.map((action, index) => (
        <motion.div
          key={action.href}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + index * 0.04 }}
        >
          <Link
            href={action.href}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <action.icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{action.label}</p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
