"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { StudentsTable } from "@/components/students/students-table";
import { CICLOS } from "@/lib/constants";
import { getCicloLabel } from "@/lib/utils";
import { api } from "@/lib/api";
import { Users, Ticket, UserCheck } from "lucide-react";
import type { CycleStats, StudentWithTicket } from "@/types";

export default function CicloDetailPage() {
  const params = useParams();
  const ciclo = Number(params.ciclo);
  const [students, setStudents] = useState<StudentWithTicket[]>([]);
  const [stats, setStats] = useState<CycleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isValidCiclo = CICLOS.includes(ciclo as (typeof CICLOS)[number]);

  useEffect(() => {
    if (!isValidCiclo) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getCycleStudents(ciclo);
        setStudents(data.students);
        setStats(data.stats ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ciclo, isValidCiclo]);

  if (!isValidCiclo) {
    return <p className="text-center py-12 text-destructive">Ciclo inválido</p>;
  }

  if (error) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {getCicloLabel(ciclo)}
      </h1>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Estudiantes" value={stats.studentCount} icon={Users} />
          <StatCard title="Tickets" value={stats.ticketsSent} icon={Ticket} />
          <StatCard title="Asistentes" value={stats.attendees} icon={UserCheck} />
        </div>
      ) : null}

      <Card className="glass-card">
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <StudentsTable data={students} loading={loading} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
