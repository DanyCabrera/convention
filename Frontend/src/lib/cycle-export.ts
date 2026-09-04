import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { displayCarnet } from "@/lib/carnet";
import { getPlanLabel } from "@/lib/plans";
import type { Plan } from "@/lib/plans";
import { formatShortDate, getCicloLabel, getStatusLabel } from "@/lib/utils";
import type { CycleStats, EventInfo, StudentWithTicket } from "@/types";

export interface CycleExportOptions {
  event: EventInfo;
  ciclo: number;
  students: StudentWithTicket[];
  stats?: CycleStats | null;
  plan?: Plan | null;
  title?: string;
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch("/logoumg.jpeg");
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function listTitle(options: CycleExportOptions): string {
  if (options.title) return options.title;
  if (!options.ciclo) {
    return options.plan ? getPlanLabel(options.plan) : "Estudiantes";
  }
  const cicloLabel = getCicloLabel(options.ciclo);
  if (options.plan) {
    return `${getPlanLabel(options.plan)} — ${cicloLabel}`;
  }
  return cicloLabel;
}

function exportFilename(options: CycleExportOptions, ext: "pdf" | "xlsx"): string {
  return `UMG-2026-${slugify(listTitle(options))}.${ext}`;
}

function generatedAtLabel(): string {
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function tableRows(students: StudentWithTicket[]) {
  return students.map((student, index) => [
    String(index + 1),
    student.full_name,
    displayCarnet(student.carnet),
    getPlanLabel(student.plan),
    getCicloLabel(student.ciclo),
    student.email,
    student.phone,
    getStatusLabel(student.status),
  ]);
}

function teacherTableRows(teachers: StudentWithTicket[]) {
  return teachers.map((teacher, index) => [
    String(index + 1),
    teacher.full_name,
    teacher.email,
    teacher.ticket?.ticket_number ?? "—",
    getStatusLabel(teacher.status),
    formatShortDate(teacher.registered_at),
  ]);
}

export interface TeachersExportOptions {
  event: EventInfo;
  teachers: StudentWithTicket[];
  title?: string;
}

export async function buildCyclePdf({
  event,
  ciclo,
  students,
  stats,
  plan,
  title,
}: CycleExportOptions): Promise<jsPDF> {
  const heading = listTitle({ event, ciclo, students, stats, plan, title });
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let cursorY = 16;

  const logo = await loadLogoDataUrl();
  if (logo) {
    doc.addImage(logo, "JPEG", margin, cursorY - 4, 20, 20);
  }

  const textX = logo ? margin + 24 : margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(event.university ?? "Universidad Mariano Galvez", textX, cursorY + 2);

  doc.setFontSize(15);
  doc.text(event.name, textX, cursorY + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Fecha: ${formatShortDate(event.date)}`, textX, cursorY + 17);
  doc.text(`Lugar: ${event.location}`, textX, cursorY + 23);

  cursorY += logo ? 30 : 24;

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`Listado — ${heading}`, margin, cursorY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  cursorY += 6;
  doc.text(`Generado: ${generatedAtLabel()}`, margin, cursorY);

  if (stats) {
    cursorY += 5;
    doc.text(
      `Estudiantes: ${stats.studentCount} · Tickets: ${stats.ticketsSent} · Asistentes: ${stats.attendees}`,
      margin,
      cursorY
    );
  }

  const tableStartY = cursorY + 8;

  autoTable(doc, {
    startY: tableStartY,
    head: [["#", "Nombre", "Carnet", "Plan", "Ciclo", "Correo", "Teléfono", "Estado"]],
    body:
      students.length > 0
        ? tableRows(students)
        : [["—", "Sin estudiantes registrados", "—", "—", "—", "—", "—", "—"]],
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 32 },
      2: { cellWidth: 24 },
      3: { cellWidth: 22 },
      4: { cellWidth: 20 },
      5: { cellWidth: 38 },
      6: { cellWidth: 18 },
      7: { cellWidth: 20, halign: "center" },
    },
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`${event.name} · ${heading}`, margin, pageHeight - 8);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: "right" }
      );
    },
  });

  return doc;
}

export async function exportCycleToPdf(options: CycleExportOptions): Promise<void> {
  const doc = await buildCyclePdf(options);
  doc.save(exportFilename(options, "pdf"));
}

export async function exportTeachersToPdf({
  event,
  teachers,
  title = "Docentes",
}: TeachersExportOptions): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let cursorY = 16;

  const logo = await loadLogoDataUrl();
  if (logo) {
    doc.addImage(logo, "JPEG", margin, cursorY - 4, 20, 20);
  }

  const textX = logo ? margin + 24 : margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(event.university ?? "Universidad Mariano Galvez", textX, cursorY + 2);

  doc.setFontSize(15);
  doc.text(event.name, textX, cursorY + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Fecha: ${formatShortDate(event.date)}`, textX, cursorY + 17);
  doc.text(`Lugar: ${event.location}`, textX, cursorY + 23);

  cursorY += logo ? 30 : 24;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`Listado — ${title}`, margin, cursorY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  cursorY += 6;
  doc.text(`Generado: ${generatedAtLabel()}`, margin, cursorY);
  cursorY += 5;
  doc.text(`Docentes: ${teachers.length}`, margin, cursorY);

  autoTable(doc, {
    startY: cursorY + 8,
    head: [["#", "Nombre", "Correo", "Ticket", "Estado", "Registro"]],
    body:
      teachers.length > 0
        ? teacherTableRows(teachers)
        : [["—", "Sin docentes registrados", "—", "—", "—", "—"]],
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: margin, right: margin },
  });

  doc.save(`UMG-2026-${slugify(title)}.pdf`);
}

export async function exportTeachersToExcel({
  event,
  teachers,
  title = "Docentes",
}: TeachersExportOptions): Promise<void> {
  const rows =
    teachers.length > 0
      ? teachers.map((teacher, index) => ({
          "#": index + 1,
          Nombre: teacher.full_name,
          Correo: teacher.email,
          Ticket: teacher.ticket?.ticket_number ?? "",
          Estado: getStatusLabel(teacher.status),
          Registro: formatShortDate(teacher.registered_at),
        }))
      : [
          {
            "#": "",
            Nombre: "Sin docentes registrados",
            Correo: "",
            Estado: "",
            Registro: "",
          },
        ];

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Docentes");

  const meta = XLSX.utils.aoa_to_sheet([
    ["Evento", event.name],
    ["Universidad", event.university ?? ""],
    ["Listado", title],
    ["Generado", generatedAtLabel()],
    ["Resumen", `${teachers.length} docente(s)`],
  ]);
  XLSX.utils.book_append_sheet(workbook, meta, "Info");

  XLSX.writeFile(workbook, `UMG-2026-${slugify(title)}.xlsx`);
}

export async function shareTeachersList(
  options: TeachersExportOptions & { pageUrl?: string }
): Promise<"shared" | "copied"> {
  const title = options.title ?? "Docentes";
  const pageUrl =
    options.pageUrl ??
    (typeof window !== "undefined"
      ? `${window.location.origin}/estudiantes?tipo=docente`
      : "");

  const summary = [
    options.event.name,
    options.event.university,
    `${title} — ${options.teachers.length} docente(s)`,
    pageUrl,
  ]
    .filter(Boolean)
    .join("\n");

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: `${options.event.name} — ${title}`,
        text: summary,
        url: pageUrl,
      });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(summary);
    return "copied";
  }

  throw new Error("Tu navegador no permite compartir ni copiar el enlace");
}

export async function shareTeachersPdf(
  options: TeachersExportOptions
): Promise<"shared" | "downloaded"> {
  const title = options.title ?? "Docentes";
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let cursorY = 16;

  const logo = await loadLogoDataUrl();
  if (logo) {
    doc.addImage(logo, "JPEG", margin, cursorY - 4, 20, 20);
  }

  const textX = logo ? margin + 24 : margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(options.event.name, textX, cursorY + 10);
  cursorY += logo ? 30 : 24;

  autoTable(doc, {
    startY: cursorY + 8,
    head: [["#", "Nombre", "Correo", "Estado", "Registro"]],
    body:
      options.teachers.length > 0
        ? teacherTableRows(options.teachers)
        : [["—", "Sin docentes registrados", "—", "—", "—"]],
    margin: { left: margin, right: margin },
  });

  const filename = `UMG-2026-${slugify(title)}.pdf`;
  const blob = doc.output("blob");
  const file = new File([blob], filename, { type: "application/pdf" });

  if (
    typeof navigator !== "undefined" &&
    navigator.share &&
    navigator.canShare?.({ files: [file] })
  ) {
    try {
      await navigator.share({
        title: `${options.event.name} — ${title}`,
        text: `Listado de ${title}`,
        files: [file],
      });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
    }
  }

  doc.save(filename);
  return "downloaded";
}

export async function exportCycleToExcel(options: CycleExportOptions): Promise<void> {
  const heading = listTitle(options);
  const rows =
    options.students.length > 0
      ? options.students.map((student, index) => ({
          "#": index + 1,
          Nombre: student.full_name,
          Carnet: displayCarnet(student.carnet),
          Plan: getPlanLabel(student.plan),
          Ciclo: getCicloLabel(student.ciclo),
          Correo: student.email,
          Teléfono: student.phone,
          Estado: getStatusLabel(student.status),
          Ticket: student.ticket?.ticket_number ?? "",
        }))
      : [
          {
            "#": "",
            Nombre: "Sin estudiantes registrados",
            Carnet: "",
            Plan: "",
            Ciclo: "",
            Correo: "",
            Teléfono: "",
            Estado: "",
            Ticket: "",
          },
        ];

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Estudiantes");

  const meta = XLSX.utils.aoa_to_sheet([
    ["Evento", options.event.name],
    ["Universidad", options.event.university ?? ""],
    ["Listado", heading],
    ["Generado", generatedAtLabel()],
    [
      "Resumen",
      options.stats
        ? `Estudiantes: ${options.stats.studentCount} · Tickets: ${options.stats.ticketsSent} · Asistentes: ${options.stats.attendees}`
        : `${options.students.length} estudiante(s)`,
    ],
  ]);
  XLSX.utils.book_append_sheet(workbook, meta, "Info");

  XLSX.writeFile(workbook, exportFilename(options, "xlsx"));
}

export async function shareCycleList(
  options: CycleExportOptions & { pageUrl?: string }
): Promise<"shared" | "copied"> {
  const heading = listTitle(options);
  const pageUrl =
    options.pageUrl ??
    (typeof window !== "undefined"
      ? options.plan
        ? `${window.location.origin}/ciclos/${options.plan === "fin_de_semana" ? "fin-de-semana" : "diario"}/${options.ciclo}`
        : `${window.location.origin}/ciclos/${options.ciclo}`
      : "");

  const summary = [
    `${options.event.name}`,
    `${options.event.university}`,
    `${heading} — ${options.students.length} estudiante(s)`,
    options.stats
      ? `Tickets: ${options.stats.ticketsSent} · Asistentes: ${options.stats.attendees}`
      : null,
    pageUrl,
  ]
    .filter(Boolean)
    .join("\n");

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: `${options.event.name} — ${heading}`,
        text: summary,
        url: pageUrl,
      });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(summary);
    return "copied";
  }

  throw new Error("Tu navegador no permite compartir ni copiar el enlace");
}

export async function shareCyclePdf(
  options: CycleExportOptions
): Promise<"shared" | "downloaded"> {
  const doc = await buildCyclePdf(options);
  const filename = exportFilename(options, "pdf");
  const blob = doc.output("blob");
  const file = new File([blob], filename, { type: "application/pdf" });
  const heading = listTitle(options);

  if (
    typeof navigator !== "undefined" &&
    navigator.share &&
    navigator.canShare?.({ files: [file] })
  ) {
    try {
      await navigator.share({
        title: `${options.event.name} — ${heading}`,
        text: `Listado de ${heading}`,
        files: [file],
      });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
    }
  }

  doc.save(filename);
  return "downloaded";
}
