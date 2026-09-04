"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { TeachersTable } from "@/components/students/teachers-table";
import { TeacherActions } from "@/components/students/teacher-actions";
import { api } from "@/lib/api";
import { useEvent } from "@/hooks/use-event";
import { toast } from "sonner";
import { Ticket, UserCheck, UserRound } from "lucide-react";
import type { DocenteStats, StudentWithTicket } from "@/types";

export default function DocentesCiclosPage() {
  const { event } = useEvent();
  const [teachers, setTeachers] = useState<StudentWithTicket[]>([]);
  const [stats, setStats] = useState<DocenteStats | null>(null);
  const [filtered, setFiltered] = useState<StudentWithTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function handleResend(id: string) {
    try {
      await api.resendTicket(id);
      toast.success("Correo enviado");
      const docentes = await api.getStudents({ tipo: "docente" });
      setTeachers(docentes);
    } catch (err) {
      toast.error("No se pudo enviar el correo", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [docenteStats, docentes] = await Promise.all([
          api.getDocenteStats(),
          api.getStudents({ tipo: "docente" }),
        ]);
        setStats(docenteStats);
        setTeachers(docentes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (error) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/ciclos">
            <ArrowLeft className="h-4 w-4" />
            Planes y ciclos
          </Link>
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Docentes</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Listado con ticket QR
            </p>
          </div>
          {!loading && (
            <TeacherActions
              teachers={filtered.length > 0 ? filtered : teachers}
              event={event}
              title="Docentes"
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
          <StatCard title="Docentes" value={stats.teacherCount} icon={UserRound} />
          <StatCard title="Tickets" value={stats.ticketsSent} icon={Ticket} />
          <StatCard title="Asistentes" value={stats.attendees} icon={UserCheck} />
        </div>
      ) : null}

      <Card className="glass-card">
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <TeachersTable
              data={teachers}
              loading={loading}
              onFilteredChange={setFiltered}
              onResend={handleResend}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
