"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Ticket,
  Mail,
  UserCheck,
  UserPlus,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardInsights } from "@/components/dashboard/dashboard-insights";
import {
  DashboardCycleGrid,
  DashboardQuickActions,
} from "@/components/dashboard/dashboard-cycle-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentsTable } from "@/components/students/students-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import {
  aggregateCycleStatsByCiclo,
  useCycleStats,
} from "@/hooks/use-cycle-stats";
import { useStudents } from "@/hooks/use-students";
import { useEvent } from "@/hooks/use-event";

export default function DashboardPage() {
  const { event } = useEvent();
  const { stats, loading: statsLoading, error: statsError } = useDashboardStats();
  const { data: cycleStats, loading: cyclesLoading } = useCycleStats();
  const { data: students, loading: studentsLoading } = useStudents();

  const recentStudents = students.slice(0, 5);
  const pendingCount = useMemo(
    () => students.filter((s) => s.status === "pending").length,
    [students]
  );
  const aggregatedCycleStats = useMemo(
    () => aggregateCycleStatsByCiclo(cycleStats),
    [cycleStats]
  );

  const insightsLoading = statsLoading || cyclesLoading;

  return (
    <div className="space-y-6">
      <DashboardHeader event={event} stats={stats} loading={statsLoading} />

      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-end gap-3"
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/asistencia">Ir a asistencia</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/registrar">
            <UserPlus className="h-4 w-4" />
            Registrar
          </Link>
        </Button>
      </motion.div>

      {statsError && <p className="text-sm text-destructive">{statsError}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              title="Estudiantes"
              value={stats.totalStudents}
              growth={stats.growth.students}
              icon={Users}
              index={0}
            />
            <StatCard
              title="Docentes"
              value={stats.totalTeachers}
              icon={UserRound}
              index={1}
            />
            <StatCard
              title="Tickets"
              value={stats.ticketsGenerated}
              description="Generados"
              icon={Ticket}
              index={2}
            />
            <StatCard
              title="Correos"
              value={stats.emailsSent}
              description="Tickets enviados"
              icon={Mail}
              index={3}
            />
            <StatCard
              title="Entradas confirmadas"
              value={stats.confirmedParticipants}
              description={
                stats.totalStudents + stats.totalTeachers > 0
                  ? `${Math.round((stats.confirmedParticipants / (stats.totalStudents + stats.totalTeachers)) * 100)}% de asistencia`
                  : "Sin registros aún"
              }
              icon={UserCheck}
              index={4}
            />
          </>
        )}
      </div>

      <DashboardInsights
        stats={stats}
        cycleStats={aggregatedCycleStats}
        pendingCount={pendingCount}
        loading={insightsLoading}
      />

      <DashboardCycleGrid cycleStats={cycleStats} loading={cyclesLoading} />

      <DashboardQuickActions />

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <div>
            <CardTitle className="text-base">Registros recientes</CardTitle>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/estudiantes">Ver todos</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {studentsLoading ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : (
            <StudentsTable data={recentStudents} compact />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
