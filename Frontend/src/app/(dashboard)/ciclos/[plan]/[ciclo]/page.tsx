"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { StudentsTable } from "@/components/students/students-table";
import { CycleActions } from "@/components/cycles/cycle-actions";
import { CICLOS } from "@/lib/constants";
import { PLAN_META, planFromSlug, planToSlug } from "@/lib/plans";
import { getCicloLabel } from "@/lib/utils";
import { api } from "@/lib/api";
import { useEvent } from "@/hooks/use-event";
import { Users, Ticket, UserCheck } from "lucide-react";
import type { CycleStats, StudentWithTicket } from "@/types";

export default function CicloDetailPage() {
  const params = useParams();
  const planSlug = String(params.plan ?? "");
  const ciclo = Number(params.ciclo);
  const plan = planFromSlug(planSlug);
  const { event } = useEvent();
  const [students, setStudents] = useState<StudentWithTicket[]>([]);
  const [stats, setStats] = useState<CycleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isValidCiclo = CICLOS.includes(ciclo as (typeof CICLOS)[number]);
  const isValid = !!plan && isValidCiclo;

  useEffect(() => {
    if (!isValid || !plan) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getCycleStudents(ciclo, plan!);
        setStudents(data.students);
        setStats(data.stats ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ciclo, plan, isValid]);

  if (!plan || !isValidCiclo) {
    return <p className="text-center py-12 text-destructive">Ruta inválida</p>;
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

  const meta = PLAN_META[plan];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href={`/ciclos/${planToSlug(plan)}`}>
            <ArrowLeft className="h-4 w-4" />
            {meta.label}
          </Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {getCicloLabel(ciclo)}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{meta.label}</p>
          </div>
          {!loading && (
            <CycleActions
              ciclo={ciclo}
              plan={plan}
              students={students}
              stats={stats}
              event={event}
            />
          )}
        </div>
      </div>

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
            <StudentsTable data={students} loading={loading} hidePlanFilter />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
