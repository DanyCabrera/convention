"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useStudents } from "@/hooks/use-students";
import { formatDate, getParticipantTypeLabel, getStatusLabel } from "@/lib/utils";

export default function TicketsPage() {
  const { data: students, loading, error, refresh } = useStudents();

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={refresh}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estudiantes y docentes
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No hay tickets generados aún
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((student, index) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <Link href={`/tickets/${student.id}`}>
                <Card className="glass-card group cursor-pointer transition-all hover:shadow-md hover:border-primary/30">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Ticket className="h-5 w-5 text-primary" />
                      </div>
                      <Badge
                        variant={
                          student.status === "confirmed"
                            ? "success"
                            : student.status === "pending"
                              ? "warning"
                              : "destructive"
                        }
                      >
                        {getStatusLabel(student.status)}
                      </Badge>
                    </div>
                    <p className="mt-4 font-mono text-sm font-medium text-primary">
                      {student.ticket?.ticket_number}
                    </p>
                    <p className="mt-1 font-semibold">{student.full_name}</p>
                    <Badge
                      variant={
                        student.participant_type === "docente"
                          ? "secondary"
                          : "outline"
                      }
                      className="mt-1 text-[10px]"
                    >
                      {getParticipantTypeLabel(student.participant_type)}
                    </Badge>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(student.registered_at)}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Ver ticket
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
