"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import {
  exportCycleToExcel,
  exportCycleToPdf,
  shareCycleList,
  shareCyclePdf,
  type CycleExportOptions,
} from "@/lib/cycle-export";
import type { Plan } from "@/lib/plans";
import type { CycleStats, EventInfo, StudentWithTicket } from "@/types";

interface CycleActionsProps {
  ciclo: number;
  students: StudentWithTicket[];
  stats?: CycleStats | null;
  event: EventInfo;
  plan?: Plan | null;
  title?: string;
  disabled?: boolean;
  layout?: "inline" | "compact";
}

export function CycleActions({
  ciclo,
  students,
  stats,
  event,
  plan,
  title,
  disabled,
  layout = "inline",
}: CycleActionsProps) {
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const [sharing, setSharing] = useState(false);

  const exportOptions: CycleExportOptions = {
    event,
    ciclo,
    students,
    stats,
    plan,
    title,
  };

  async function handleExportPdf() {
    setExporting("pdf");
    try {
      await exportCycleToPdf(exportOptions);
      toast.success("PDF descargado");
    } catch (err) {
      toast.error("No se pudo exportar el PDF", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setExporting(null);
    }
  }

  async function handleExportExcel() {
    setExporting("excel");
    try {
      await exportCycleToExcel(exportOptions);
      toast.success("Excel descargado");
    } catch (err) {
      toast.error("No se pudo exportar el Excel", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setExporting(null);
    }
  }

  async function handleShareLink() {
    setSharing(true);
    try {
      const result = await shareCycleList(exportOptions);
      toast.success(
        result === "shared" ? "Compartido" : "Enlace copiado al portapapeles"
      );
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("No se pudo compartir", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSharing(false);
    }
  }

  async function handleSharePdf() {
    setSharing(true);
    try {
      const result = await shareCyclePdf(exportOptions);
      toast.success(
        result === "shared"
          ? "PDF compartido"
          : "PDF descargado (compartir no disponible en este dispositivo)"
      );
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("No se pudo compartir el PDF", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSharing(false);
    }
  }

  const isBusy = exporting !== null || sharing;

  if (layout === "compact") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || isBusy}
            aria-label="Exportar o compartir ciclo"
          >
            {isBusy ? <Spinner size="sm" /> : <Share2 className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExportPdf} disabled={exporting === "pdf"}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar PDF
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleExportExcel}
            disabled={exporting === "excel"}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Exportar Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShareLink} disabled={sharing}>
            <Share2 className="mr-2 h-4 w-4" />
            Compartir enlace
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSharePdf} disabled={sharing}>
            <Share2 className="mr-2 h-4 w-4" />
            Compartir PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPdf}
        disabled={disabled || isBusy}
      >
        {exporting === "pdf" ? (
          <Spinner size="sm" />
        ) : (
          <FileDown className="h-4 w-4" />
        )}
        PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportExcel}
        disabled={disabled || isBusy}
      >
        {exporting === "excel" ? (
          <Spinner size="sm" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        Excel
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled || isBusy}>
            {sharing ? <Spinner size="sm" /> : <Share2 className="h-4 w-4" />}
            Compartir
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleShareLink}>
            Compartir enlace al listado
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSharePdf}>
            Compartir PDF del listado
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
