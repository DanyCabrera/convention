"use client";

import { motion, AnimatePresence } from "framer-motion";
import { UserCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { displayCarnet } from "@/lib/carnet";
import { formatDate, formatTicketCorrelative, getCicloLabel, getParticipantTypeLabel, hasRealEmail } from "@/lib/utils";
import type { StudentWithTicket } from "@/types";

interface AttendanceListProps {
  students: StudentWithTicket[];
  loading?: boolean;
}

export function AttendanceList({ students, loading }: AttendanceListProps) {
  if (loading && students.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Cargando asistencia...
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="py-12 text-center">
        <UserCheck className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm text-muted-foreground">
          Aún no hay asistentes registrados
        </p>
        <p className="text-xs text-muted-foreground">
          Escanea un código QR para confirmar la primera entrada
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      <AnimatePresence initial={false}>
        {students.map((student) => {
          const isDocente = student.participant_type === "docente";
          return (
          <motion.li
            key={student.id}
            layout
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            className="flex items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium">{student.full_name}</p>
                <Badge variant={isDocente ? "secondary" : "outline"} className="text-[10px]">
                  {getParticipantTypeLabel(student.participant_type)}
                </Badge>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {isDocente ? (
                  <>
                    {hasRealEmail(student.email) ? <span>{student.email}</span> : null}
                    {student.ticket?.correlative != null && (
                      <>
                        {hasRealEmail(student.email) ? <span>·</span> : null}
                        <span className="font-semibold tabular-nums">
                          {formatTicketCorrelative(student.ticket.correlative)}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <span>{displayCarnet(student.carnet)}</span>
                    <span>·</span>
                    <span>{getCicloLabel(student.ciclo)}</span>
                  </>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <Badge variant="success">Entrada confirmada</Badge>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {formatDate(student.checked_in_at ?? student.updated_at)}
              </p>
            </div>
          </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

interface AttendanceCounterProps {
  totalConfirmed: number;
  totalRegistered: number;
}

export function AttendanceCounter({
  totalConfirmed,
  totalRegistered,
}: AttendanceCounterProps) {
  const pending = Math.max(0, totalRegistered - totalConfirmed);
  const percentage =
    totalRegistered > 0
      ? Math.round((totalConfirmed / totalRegistered) * 100)
      : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-5 glass-card"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Asistentes</p>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/10">
            <UserCheck className="h-4.5 w-4.5 text-success" />
          </div>
        </div>
        <p className="mt-3 text-4xl font-bold tracking-tight text-success">
          {totalConfirmed}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {percentage}% del total registrado
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-2xl border border-border bg-card p-5 glass-card"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Registrados</p>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-4.5 w-4.5 text-primary" />
          </div>
        </div>
        <p className="mt-3 text-4xl font-bold tracking-tight">{totalRegistered}</p>
        <p className="mt-1 text-xs text-muted-foreground">Total inscritos</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="rounded-2xl border border-border bg-card p-5 glass-card"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Por confirmar entrada</p>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/10">
            <Users className="h-4.5 w-4.5 text-warning" />
          </div>
        </div>
        <p className="mt-3 text-4xl font-bold tracking-tight text-warning">
          {pending}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Por confirmar entrada</p>
      </motion.div>
    </div>
  );
}
