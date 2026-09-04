"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TICKET_OVERLAY, TICKET_TEMPLATE_SRC } from "@/lib/constants";
import { api } from "@/lib/api";
import { displayCarnet } from "@/lib/carnet";
import { formatShortDate, getCicloLabel, getStatusLabel } from "@/lib/utils";
import { useEvent } from "@/hooks/use-event";
import type { StudentWithTicket } from "@/types";
import { toast } from "sonner";

interface TicketViewProps {
  student: StudentWithTicket;
  onUpdated?: (student: StudentWithTicket) => void;
}

function truncateName(value: string, max = 24): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function TicketView({ student, onUpdated }: TicketViewProps) {
  const ticket = student.ticket;
  const { event } = useEvent();
  const isDocente = student.participant_type === "docente";

  async function handleResend() {
    try {
      if (!ticket?.qr_code) {
        const updated = await api.issueTicket(student.id);
        onUpdated?.(updated);
        toast.success("Ticket generado");
        return;
      }
      await api.resendTicket(student.id);
      toast.success("Correo enviado");
    } catch (err) {
      toast.error("No se pudo enviar el correo", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 print:max-w-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="print:shadow-none"
      >
        <div className="relative mx-auto w-full overflow-hidden rounded-xl shadow-2xl print:overflow-visible print:rounded-none print:shadow-none">
          <Image
            src={TICKET_TEMPLATE_SRC}
            alt="Ticket UMG 2026"
            width={3858}
            height={1378}
            className="h-auto w-full print:max-w-full"
            priority
          />

          <div
            className={`absolute grid gap-0 px-[2%] pb-[2%] ${
              isDocente
                ? "grid-rows-[14%_minmax(0,1fr)]"
                : "grid-rows-[9%_minmax(0,1fr)]"
            }`}
            style={{
              left: TICKET_OVERLAY.left,
              top: TICKET_OVERLAY.top,
              width: TICKET_OVERLAY.width,
              height: TICKET_OVERLAY.height,
            }}
          >
            {isDocente ? (
              <div className="flex flex-col items-center justify-end gap-0.5 text-center leading-none">
                <p className="w-full truncate font-sans text-[clamp(6px,min(2.2vw,2.6vh),13px)] font-bold text-slate-900">
                  {truncateName(student.full_name)}
                </p>
                <p className="font-sans text-[clamp(5px,min(1.6vw,1.9vh),10px)] font-bold tracking-[0.12em] text-blue-600">
                  DOCENTE
                </p>
              </div>
            ) : (
              <p className="flex items-end justify-center truncate font-mono text-[clamp(7px,min(2.5vw,3vh),15px)] font-bold leading-none tracking-tight text-slate-900">
                {ticket?.ticket_number ?? "—"}
              </p>
            )}
            {ticket?.qr_code && (
              <div className="flex min-h-0 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ticket.qr_code}
                  alt={`QR ${ticket.ticket_number}`}
                  className="h-full w-full object-contain"
                />
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <div className="rounded-xl border border-border bg-card p-4 print:hidden">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">
              {isDocente ? "Docente" : "Estudiante"}
            </p>
            <p className="font-semibold">{student.full_name}</p>
          </div>
          {isDocente ? (
            <div>
              <p className="text-xs text-muted-foreground">Tipo</p>
              <Badge variant="secondary">Docente</Badge>
            </div>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground">Carnet</p>
              <p className="font-mono text-sm">{displayCarnet(student.carnet)}</p>
            </div>
          )}
          {!isDocente && (
            <div>
              <p className="text-xs text-muted-foreground">Ciclo</p>
              <p className="text-sm">{getCicloLabel(student.ciclo)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Correo</p>
            <p className="text-sm text-muted-foreground">{student.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ticket</p>
            <p className="font-mono text-xs">{ticket?.ticket_number ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Estado</p>
            <Badge variant={student.status === "confirmed" ? "success" : "warning"}>
              {getStatusLabel(student.status)}
            </Badge>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Evento</p>
            <p className="text-sm font-medium">{event.name}</p>
            <p className="text-xs text-muted-foreground">
              {event.university} · {formatShortDate(event.date)} · {event.location}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 print:hidden">
        <Button variant="outline" className="flex-1" onClick={handleResend}>
          <Mail className="h-4 w-4" />
          Enviar por correo
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      </div>
    </div>
  );
}
