"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getCicloLabel } from "@/lib/utils";
import type { CycleStats, DashboardStats } from "@/types";

interface DashboardInsightsProps {
  stats: DashboardStats;
  cycleStats: CycleStats[];
  pendingCount: number;
  loading?: boolean;
}

export function DashboardInsights({
  stats,
  cycleStats,
  pendingCount,
  loading,
}: DashboardInsightsProps) {
  const totalRegistered = stats.totalStudents + stats.totalTeachers;
  const attendanceRate =
    totalRegistered > 0
      ? Math.round((stats.confirmedParticipants / totalRegistered) * 100)
      : 0;
  const ticketRate =
    totalRegistered > 0
      ? Math.round((stats.emailsSent / totalRegistered) * 100)
      : 0;

  const barData = cycleStats.map((c) => ({
    name: `C${c.ciclo}`,
    label: getCicloLabel(c.ciclo),
    estudiantes: c.studentCount,
    asistentes: c.attendees,
  }));

  const topCycle = [...cycleStats].sort(
    (a, b) => b.studentCount - a.studentCount
  )[0];

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-2xl lg:col-span-1" />
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="lg:col-span-1"
      >
        <Card className="glass-card h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Resumen del evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ProgressRow
              label="Asistencia confirmada"
              value={stats.confirmedParticipants}
              total={totalRegistered}
              percentage={attendanceRate}
              color="bg-success"
            />
            <ProgressRow
              label="Correos enviados"
              value={stats.emailsSent}
              total={totalRegistered}
              percentage={ticketRate}
              color="bg-primary"
            />
            <div className="grid grid-cols-2 gap-3 pt-1">
              <MiniStat label="Sin confirmar entrada" value={pendingCount} tone="warning" />
              <MiniStat
                label="Ciclos activos"
                value={stats.cyclesRegistered}
                tone="primary"
              />
            </div>
            {topCycle && topCycle.studentCount > 0 && (
              <p className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                Ciclo con más inscripciones:{" "}
                <span className="font-medium text-foreground">
                  {getCicloLabel(topCycle.ciclo)}
                </span>{" "}
                ({topCycle.studentCount} estudiante
                {topCycle.studentCount === 1 ? "" : "s"})
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="lg:col-span-2"
      >
        <Card className="glass-card h-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Inscripciones por ciclo</CardTitle>
            <Link
              href="/ciclos"
              className="text-xs font-medium text-primary hover:underline"
            >
              Ver ciclos
            </Link>
          </CardHeader>
          <CardContent>
            {barData.every((d) => d.estudiantes === 0) ? (
              <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                Aún no hay inscripciones por ciclo
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} barGap={6} barSize={28}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string) => [
                      value,
                      name === "estudiantes" ? "Inscritos" : "Asistentes",
                    ]}
                    labelFormatter={(
                      _,
                      payload: { payload?: { label?: string } }[]
                    ) => payload?.[0]?.payload?.label ?? ""}
                  />
                  <Bar
                    dataKey="estudiantes"
                    fill="#2563EB"
                    radius={[6, 6, 0, 0]}
                    name="estudiantes"
                  />
                  <Bar
                    dataKey="asistentes"
                    fill="#22C55E"
                    radius={[6, 6, 0, 0]}
                    name="asistentes"
                  />
              </BarChart>
              </ResponsiveContainer>
            )}
            <div className="mt-2 flex items-center justify-center gap-5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
                Inscritos
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-success" />
                Asistentes
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
  percentage,
  color,
}: {
  label: string;
  value: number;
  total: number;
  percentage: number;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value}
          <span className="text-muted-foreground"> / {total}</span>
          <span className="ml-1.5 text-xs text-muted-foreground">({percentage}%)</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "warning" | "primary";
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-xl font-bold",
          tone === "warning" ? "text-warning" : "text-primary"
        )}
      >
        {value}
      </p>
    </div>
  );
}
