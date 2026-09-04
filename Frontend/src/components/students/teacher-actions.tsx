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
  exportTeachersToExcel,
  exportTeachersToPdf,
  shareTeachersList,
  shareTeachersPdf,
  type TeachersExportOptions,
} from "@/lib/cycle-export";
import type { EventInfo, StudentWithTicket } from "@/types";

interface TeacherActionsProps {
  teachers: StudentWithTicket[];
  event: EventInfo;
  title?: string;
  disabled?: boolean;
}

export function TeacherActions({
  teachers,
  event,
  title = "Docentes",
  disabled,
}: TeacherActionsProps) {
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const [sharing, setSharing] = useState(false);

  const exportOptions: TeachersExportOptions = {
    event,
    teachers,
    title,
  };

  async function handleExportPdf() {
    setExporting("pdf");
    try {
      await exportTeachersToPdf(exportOptions);
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
      await exportTeachersToExcel(exportOptions);
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
      const result = await shareTeachersList(exportOptions);
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
      const result = await shareTeachersPdf(exportOptions);
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

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportPdf}
        disabled={disabled || isBusy || teachers.length === 0}
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
        disabled={disabled || isBusy || teachers.length === 0}
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
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || isBusy || teachers.length === 0}
          >
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
