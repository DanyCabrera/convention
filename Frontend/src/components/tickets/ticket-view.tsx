"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, Printer, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEvent } from "@/hooks/use-event";
import { api } from "@/lib/api";
import { displayCarnet } from "@/lib/carnet";
import { formatShortDate, getCicloLabel, getStatusLabel } from "@/lib/utils";
import type { StudentWithTicket } from "@/types";
import { toast } from "sonner";

interface TicketViewProps {
  student: StudentWithTicket;
}

function getStatusVariant(status: string): "success" | "warning" | "destructive" {
  switch (status) {
    case "confirmed":
      return "success";
    case "pending":
      return "warning";
    default:
      return "destructive";
  }
}

export function TicketView({ student }: TicketViewProps) {
  const { event } = useEvent();
  const ticket = student.ticket;

  async function handleResend() {
    try {
      await api.resendTicket(student.id);
      toast.success("Ticket reenviado");
    } catch (err) {
      toast.error("Error al reenviar", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 print:max-w-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="print:shadow-none"
      >
        <Card className="relative overflow-hidden border-0 shadow-2xl print:shadow-none">
          <div className="gradient-primary px-6 py-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider opacity-80">
                    {event.university}
                  </p>
                  <h2 className="text-lg font-bold">{event.name}</h2>
                </div>
              </div>
              <Badge className="bg-white/20 text-white border-0">VIP</Badge>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="font-medium">{formatShortDate(event.date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lugar</p>
                <p className="font-medium">{event.location}</p>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3">
              <p className="font-mono text-lg font-bold text-primary">
                {ticket?.ticket_number ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-xl font-semibold">{student.full_name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {displayCarnet(student.carnet)} · {getCicloLabel(student.ciclo)}
              </p>
            </div>

            {ticket?.qr_code && (
              <div className="flex justify-center rounded-2xl bg-white p-4 dark:bg-muted/20">
                <Image
                  src={ticket.qr_code}
                  alt={`QR ${ticket.ticket_number}`}
                  width={200}
                  height={200}
                  className="rounded-lg"
                  unoptimized
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Badge variant={getStatusVariant(student.status)}>
                {getStatusLabel(student.status)}
              </Badge>
            </div>
          </div>

          <div className="h-1 gradient-primary" />
        </Card>
      </motion.div>

      <div className="flex gap-3 print:hidden">
        <Button variant="outline" className="flex-1" onClick={handleResend}>
          <Mail className="h-4 w-4" />
          Reenviar
        </Button>
        <Button variant="outline" className="flex-1" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      </div>
    </div>
  );
}
