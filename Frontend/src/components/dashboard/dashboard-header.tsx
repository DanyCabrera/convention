"use client";

import { motion } from "framer-motion";
import { Calendar, MapPin, Users } from "lucide-react";
import { AppLogo } from "@/components/layout/app-logo";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShortDate } from "@/lib/utils";
import type { EventInfo } from "@/types";
import type { DashboardStats } from "@/types";

interface DashboardHeaderProps {
  event: EventInfo;
  stats: DashboardStats;
  loading?: boolean;
}

function getDaysUntilEvent(date: string): number | null {
  const eventDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(eventDate.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function DashboardHeader({ event, stats, loading }: DashboardHeaderProps) {
  const daysUntil = getDaysUntilEvent(event.date);
  const totalRegistered = stats.totalStudents + stats.totalTeachers;
  const attendanceRate =
    totalRegistered > 0
      ? Math.round((stats.confirmedParticipants / totalRegistered) * 100)
      : 0;

  if (loading) {
    return <Skeleton className="h-36 w-full rounded-2xl" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card glass-card"
    >
      <div className="absolute inset-0 bg-linear-to-br from-primary/8 via-transparent to-primary/4" />
      <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-4">
          <AppLogo size={52} className="hidden shadow-md sm:block" />
          <div className="min-w-0 space-y-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {event.university ?? "Universidad Mariano Galvez"}
              </p>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {event.name}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                {formatShortDate(event.date)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {event.location}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
          {daysUntil !== null && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {daysUntil > 0
                ? `Faltan ${daysUntil} día${daysUntil === 1 ? "" : "s"}`
                : daysUntil === 0
                  ? "Evento hoy"
                  : `Evento hace ${Math.abs(daysUntil)} día${Math.abs(daysUntil) === 1 ? "" : "s"}`}
            </span>
          )}
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background/80 px-4 py-2.5">
            <Users className="h-4 w-4 text-success" />
            <div className="text-right">
              <p className="text-lg font-bold leading-none text-success">
                {stats.confirmedParticipants}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / {totalRegistered}
                </span>
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Asistencia confirmada ({attendanceRate}%)
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
