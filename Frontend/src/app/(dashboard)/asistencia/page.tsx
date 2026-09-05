"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ScanLine, RefreshCw, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { QrScanner } from "@/components/attendance/qr-scanner";
import {
  AttendanceCounter,
  AttendanceList,
} from "@/components/attendance/attendance-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { ticketNumberSchema } from "@/lib/validation";
import type { AttendanceResponse } from "@/types";

export default function AsistenciaPage() {
  const [attendance, setAttendance] = useState<AttendanceResponse>({
    totalConfirmed: 0,
    totalRegistered: 0,
    students: [],
  });
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false);
  const [manualTicket, setManualTicket] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getAttendance();
      setAttendance(data);
    } catch (err) {
      toast.error("Error al cargar", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const confirmTicket = useCallback(
    async (ticketNumber: string) => {
      if (processingRef.current || !ticketNumber.trim()) return;
      processingRef.current = true;
      setProcessing(true);

      try {
        const result = await api.scanTicket(ticketNumber.trim());

        if (result.alreadyConfirmed) {
          toast.info("Ya confirmado", {
            description: `${result.student.full_name} · ${
              result.student.participant_type === "docente" ? "Docente" : "Estudiante"
            }`,
          });
        } else {
          toast.success("Entrada confirmada", {
            description: `${result.student.full_name} · ${
              result.student.participant_type === "docente" ? "Docente" : "Estudiante"
            }`,
          });
        }

        setManualTicket("");
        await refresh();
      } catch (err) {
        toast.error("Ticket inválido", {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setTimeout(() => {
          processingRef.current = false;
          setProcessing(false);
        }, 1500);
      }
    },
    [refresh]
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4"
      >
        <h1 className="text-2xl font-bold tracking-tight">Asistencia</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
          aria-label="Actualizar asistencia"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </motion.div>

      <AttendanceCounter
        totalConfirmed={attendance.totalConfirmed}
        totalRegistered={attendance.totalRegistered}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="glass-card overflow-hidden">
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <ScanLine className="h-4 w-4 text-primary" />
                Escanear QR
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Válido con cualquier ticket generado; el envío por correo es opcional.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {scanning ? (
                <QrScanner onScan={confirmTicket} paused={processing} />
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-2xl bg-muted/50">
                  <p className="text-sm text-muted-foreground">Cámara desactivada</p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setScanning(!scanning)}
              >
                {scanning ? "Detener" : "Activar cámara"}
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="py-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Keyboard className="h-4 w-4 text-primary" />
                Manual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="manual-ticket">Correlativo o código</Label>
                <Input
                  id="manual-ticket"
                  placeholder="42 o TKT-XXXXXXXX"
                  value={manualTicket}
                  onChange={(e) => {
                    setManualTicket(e.target.value.toUpperCase());
                    setManualError(null);
                  }}
                  disabled={processing}
                  aria-invalid={!!manualError}
                  aria-describedby={manualError ? "manual-ticket-error" : undefined}
                />
                {manualError && (
                  <p
                    id="manual-ticket-error"
                    className="text-xs text-destructive"
                    role="alert"
                  >
                    {manualError}
                  </p>
                )}
              </div>
              <Button
                className="w-full"
                disabled={processing || !manualTicket.trim()}
                onClick={() => {
                  const parsed = ticketNumberSchema.safeParse(manualTicket);
                  if (!parsed.success) {
                    setManualError(parsed.error.errors[0]?.message ?? "Ticket inválido");
                    return;
                  }
                  confirmTicket(parsed.data);
                }}
              >
                Confirmar
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-base">En vivo</CardTitle>
            <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
              {attendance.totalConfirmed}
            </span>
          </CardHeader>
          <CardContent className="max-h-[560px] overflow-y-auto">
            <AttendanceList students={attendance.students} loading={loading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
