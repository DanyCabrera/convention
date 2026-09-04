"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, FileDown, FileSpreadsheet, Share2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import {
  exportCycleToExcel,
  exportCycleToPdf,
  shareCycleList,
} from "@/lib/cycle-export";
import { planToSlug } from "@/lib/plans";
import { getCicloLabel } from "@/lib/utils";
import { useEvent } from "@/hooks/use-event";
import type { CycleStats } from "@/types";

interface CycleCardProps {
  stats: CycleStats;
  index?: number;
}

export function CycleCard({ stats, index = 0 }: CycleCardProps) {
  const { event } = useEvent();
  const [busy, setBusy] = useState<"pdf" | "excel" | "share" | null>(null);
  const href = `/ciclos/${planToSlug(stats.plan)}/${stats.ciclo}`;

  async function loadCycleData() {
    const data = await api.getCycleStudents(stats.ciclo, stats.plan);
    return {
      students: data.students,
      stats: data.stats ?? stats,
    };
  }

  async function handleExportPdf() {
    setBusy("pdf");
    try {
      const { students, stats: cycleStats } = await loadCycleData();
      await exportCycleToPdf({
        event,
        ciclo: stats.ciclo,
        plan: stats.plan,
        students,
        stats: cycleStats,
      });
      toast.success("PDF descargado");
    } catch (err) {
      toast.error("No se pudo exportar", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleExportExcel() {
    setBusy("excel");
    try {
      const { students, stats: cycleStats } = await loadCycleData();
      await exportCycleToExcel({
        event,
        ciclo: stats.ciclo,
        plan: stats.plan,
        students,
        stats: cycleStats,
      });
      toast.success("Excel descargado");
    } catch (err) {
      toast.error("No se pudo exportar", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    setBusy("share");
    try {
      const { students, stats: cycleStats } = await loadCycleData();
      const result = await shareCycleList({
        event,
        ciclo: stats.ciclo,
        plan: stats.plan,
        students,
        stats: cycleStats,
        pageUrl: typeof window !== "undefined" ? `${window.location.origin}${href}` : href,
      });
      toast.success(
        result === "shared" ? "Compartido" : "Enlace copiado al portapapeles"
      );
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("No se pudo compartir", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Card className="glass-card overflow-hidden transition-all hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-semibold">{getCicloLabel(stats.ciclo)}</p>
              <p className="text-3xl font-bold mt-3">{stats.studentCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Tickets</p>
              <p className="font-semibold">{stats.ticketsSent}</p>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Asistentes</p>
              <p className="font-semibold">{stats.attendees}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Button size="sm" variant="outline" asChild>
              <Link href={href}>
                <Eye className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:ml-1">Ver</span>
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={handleExportPdf}
              aria-label={`Exportar PDF de ${getCicloLabel(stats.ciclo)}`}
            >
              {busy === "pdf" ? (
                <Spinner size="sm" />
              ) : (
                <FileDown className="h-3.5 w-3.5" />
              )}
              <span className="sr-only sm:not-sr-only sm:ml-1">PDF</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={handleExportExcel}
              aria-label={`Exportar Excel de ${getCicloLabel(stats.ciclo)}`}
            >
              {busy === "excel" ? (
                <Spinner size="sm" />
              ) : (
                <FileSpreadsheet className="h-3.5 w-3.5" />
              )}
              <span className="sr-only sm:not-sr-only sm:ml-1">Excel</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy !== null}
              onClick={handleShare}
              aria-label={`Compartir ${getCicloLabel(stats.ciclo)}`}
            >
              {busy === "share" ? (
                <Spinner size="sm" />
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )}
              <span className="sr-only sm:not-sr-only sm:ml-1">Compartir</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
