"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  GraduationCap,
  Mail,
  MapPin,
  Ticket,
  UserRound,
} from "lucide-react";
import { cn, formatShortDate, formatTicketCorrelative } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RegisterStudentForm } from "@/components/students/register-form";
import { RegisterTeacherForm } from "@/components/students/register-teacher-form";
import { useEvent } from "@/hooks/use-event";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { useStudents } from "@/hooks/use-students";

type RegisterType = "estudiante" | "docente";

export function RegisterPanel() {
  const [type, setType] = useState<RegisterType>("estudiante");

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
    <Card className="glass-card">
      <CardContent className="pt-5">
        <div className="mb-5 flex gap-1 rounded-xl bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => setType("estudiante")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              type === "estudiante"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={type === "estudiante"}
          >
            <GraduationCap className="h-4 w-4" />
            Estudiante
          </button>
          <button
            type="button"
            onClick={() => setType("docente")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              type === "docente"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={type === "docente"}
          >
            <UserRound className="h-4 w-4" />
            Docente
          </button>
        </div>

        {type === "estudiante" ? <RegisterStudentForm /> : <RegisterTeacherForm />}
      </CardContent>
    </Card>
    <RegisterAside />
    </div>
  );
}

function RegisterAside() {
  const { event } = useEvent();
  const { stats, loading: statsLoading } = useDashboardStats();
  const { data: recent, loading: recentLoading } = useStudents();
  const latest = recent.slice(0, 4);

  return (
    <aside className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <MiniStat
          label="Estudiantes"
          value={stats.totalStudents}
          loading={statsLoading}
        />
        <MiniStat
          label="Docentes"
          value={stats.totalTeachers}
          loading={statsLoading}
        />
      </div>

      <Card className="glass-card">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Últimos registros
            </p>
            <Link href="/estudiantes" className="text-xs font-medium hover:underline">
              Ver todos
            </Link>
          </div>
          {recentLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : latest.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay registros.</p>
          ) : (
            <ul className="space-y-2">
              {latest.map((person) => (
                <li key={person.id}>
                  <Link
                    href={person.ticket ? `/tickets/${person.id}` : "/estudiantes"}
                    className="flex items-center justify-between gap-3 rounded-lg px-1 py-1.5 hover:bg-muted/60"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {person.full_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {person.participant_type === "docente" ? "Docente" : "Estudiante"}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-medium">
                      {formatTicketCorrelative(person.ticket?.correlative)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}

function MiniStat({
  label,
  value,
  loading,
}: {
  label: string;
  value: number | string;
  loading: boolean;
}) {
  return (
    <Card className="glass-card">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-2 h-7 w-12" />
        ) : (
          <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

function Step({
  icon: Icon,
  text,
}: {
  icon: typeof Ticket;
  text: string;
}) {
  return (
    <p className="flex items-start gap-2 text-sm">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <span>{text}</span>
    </p>
  );
}
