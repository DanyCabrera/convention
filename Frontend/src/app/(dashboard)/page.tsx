"use client";

import { motion } from "framer-motion";
import {
  Users,
  Ticket,
  GraduationCap,
  Mail,
  UserCheck,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentsTable } from "@/components/students/students-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useStudents } from "@/hooks/use-students";

export default function DashboardPage() {
  const { stats, loading: statsLoading, error: statsError } = useDashboardStats();
  const { data: students, loading: studentsLoading } = useStudents();
  const recentStudents = students.slice(0, 5);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4"
      >
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Button asChild>
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
            <Skeleton key={i} className="h-28 rounded-2xl" />
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
              title="Tickets"
              value={stats.ticketsSent}
              icon={Ticket}
              index={1}
            />
            <StatCard
              title="Ciclos"
              value={stats.cyclesRegistered}
              icon={GraduationCap}
              index={2}
            />
            <StatCard
              title="Correos"
              value={stats.emailsSent}
              icon={Mail}
              index={3}
            />
            <StatCard
              title="Confirmados"
              value={stats.confirmedParticipants}
              icon={UserCheck}
              index={4}
            />
          </>
        )}
      </div>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-base">Recientes</CardTitle>
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
