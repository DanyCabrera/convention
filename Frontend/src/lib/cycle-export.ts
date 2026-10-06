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

function teacherTableRows(teachers: StudentWithTicket[]) {
  return teachers.map((teacher, index) => [
    String(index + 1),
    teacher.full_name,
    teacher.email && !teacher.email.endsWith("@sin-correo.local")
      ? teacher.email
      : "—",
    teacher.ticket?.correlative != null
      ? String(teacher.ticket.correlative)
      : "—",
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

const PDF_COLORS = {
  primary: [37, 99, 235],
  primarySoft: [239, 246, 255],
  heading: [15, 23, 42],
  text: [51, 65, 85],
  muted: [100, 116, 139],
  border: [226, 232, 240],
  zebra: [248, 250, 252],
} as const satisfies Record<string, [number, number, number]>;

function cycleSummary(
  students: StudentWithTicket[],
  stats?: CycleStats | null
): { label: string; value: number }[] {
  return [
    { label: "Estudiantes", value: stats?.studentCount ?? students.length },
    {
      label: "Tickets enviados",
      value:
        stats?.ticketsSent ?? students.filter((s) => s.ticket?.sent_at).length,
    },
    {
      label: "Asistentes",
      value:
        stats?.attendees ?? students.filter((s) => s.status === "confirmed").length,
    },
  ];
}

function studentPdfRows(students: StudentWithTicket[]) {
  return students.map((student, index) => [
    String(index + 1),
    student.full_name,
    displayCarnet(student.carnet),
    getCicloLabel(student.ciclo),
    student.email && !student.email.endsWith("@sin-correo.local")
      ? student.email
      : "—",
  ]);
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
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const centerX = pageWidth / 2;

  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(0, 0, pageWidth, 4, "F");

  let cursorY = 12;
  const logo = await loadLogoDataUrl();
  if (logo) {
    const logoSize = 20;
    doc.addImage(logo, "JPEG", centerX - logoSize / 2, cursorY, logoSize, logoSize);
    cursorY += logoSize + 6;
  } else {
    cursorY += 4;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text(
    (event.university ?? "Universidad Mariano Galvez").toUpperCase(),
    centerX,
    cursorY,
    { align: "center" }
  );

  cursorY += 7;
  doc.setFontSize(18);
  doc.setTextColor(...PDF_COLORS.heading);
  doc.text(event.name, centerX, cursorY, { align: "center" });

  cursorY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...PDF_COLORS.muted);
  const eventLine = doc.splitTextToSize(
    `${formatShortDate(event.date)}  ·  ${event.location}`,
    contentWidth
  );
  doc.text(eventLine, centerX, cursorY, { align: "center" });
  cursorY += eventLine.length * 4.5 + 4;

  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 9;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text("LISTADO DE ESTUDIANTES", centerX, cursorY, { align: "center" });

  cursorY += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(heading, centerX, cursorY, { align: "center" });
  cursorY += 7;

  const summary = cycleSummary(students, stats);
  const boxGap = 6;
  const boxWidth = (contentWidth - boxGap * (summary.length - 1)) / summary.length;
  const boxHeight = 16;
  summary.forEach((item, index) => {
    const boxX = margin + index * (boxWidth + boxGap);
    doc.setFillColor(...PDF_COLORS.primarySoft);
    doc.roundedRect(boxX, cursorY, boxWidth, boxHeight, 2.5, 2.5, "F");
    const boxCenter = boxX + boxWidth / 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.text(String(item.value), boxCenter, cursorY + 7.5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text(item.label, boxCenter, cursorY + 12.5, { align: "center" });
  });
  cursorY += boxHeight + 8;

  autoTable(doc, {
    startY: cursorY,
    head: [["#", "Nombre del estudiante", "Carnet", "Ciclo", "Correo"]],
    body:
      students.length > 0
        ? studentPdfRows(students)
        : [[{ content: "Sin estudiantes registrados", colSpan: 5, styles: { halign: "center" } }]],
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      textColor: [...PDF_COLORS.text],
      valign: "middle",
      overflow: "linebreak",
      lineColor: [...PDF_COLORS.border],
      lineWidth: { bottom: 0.2 },
    },
    headStyles: {
      fillColor: [...PDF_COLORS.primary],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
      lineWidth: 0,
    },
    alternateRowStyles: { fillColor: [...PDF_COLORS.zebra] },
    columnStyles: {
      0: { cellWidth: 10, halign: "center", textColor: [...PDF_COLORS.muted] },
      1: { cellWidth: 58, fontStyle: "bold", textColor: [...PDF_COLORS.heading] },
      2: { cellWidth: 32, halign: "center" },
      3: { cellWidth: 28, halign: "center" },
      4: { cellWidth: contentWidth - 128 },
    },
    margin: { left: margin, right: margin, top: 16, bottom: 18 },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        doc.setFillColor(...PDF_COLORS.primary);
        doc.rect(0, 0, pageWidth, 4, "F");
      }
      const footerY = pageHeight - 10;
      doc.setDrawColor(...PDF_COLORS.border);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...PDF_COLORS.muted);
      doc.text(`${event.name} · Generado: ${generatedAtLabel()}`, margin, footerY);
      doc.text(
        `Página ${data.pageNumber}`,
        pageWidth - margin,
        footerY,
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
    head: [["#", "Nombre", "Correo", "Correlativo", "Código", "Estado", "Registro"]],
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
          Correo: teacher.email ?? "",
          Correlativo:
            teacher.ticket?.correlative != null
              ? teacher.ticket.correlative
              : "",
          Código: teacher.ticket?.ticket_number ?? "",
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
          Correlativo:
            student.ticket?.correlative != null
              ? student.ticket.correlative
              : "",
          Código: student.ticket?.ticket_number ?? "",
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
            Correlativo: "",
            Código: "",
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
