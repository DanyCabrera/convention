import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function getCicloLabel(ciclo: number | null | undefined): string {
  if (!ciclo) return "—";
  const labels: Record<number, string> = {
    2: "Segundo Ciclo",
    4: "Cuarto Ciclo",
    6: "Sexto Ciclo",
    8: "Octavo Ciclo",
    10: "Décimo Ciclo",
  };
  return labels[ciclo] ?? `Ciclo ${ciclo}`;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Sin confirmar entrada",
    confirmed: "Entrada confirmada",
    cancelled: "Registro cancelado",
    generated: "Generado",
    sent: "Correo enviado",
    delivered: "Correo entregado",
    failed: "Correo no enviado",
  };
  return labels[status] ?? status;
}

export function getParticipantTypeLabel(
  type: "estudiante" | "docente" | undefined
): string {
  if (type === "docente") return "Docente";
  return "Estudiante";
}
