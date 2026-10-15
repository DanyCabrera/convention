import { displayCarnet, stripCarnetDigits } from "@/lib/carnet";
import {
  formatTicketCorrelative,
  getCicloLabel,
  getParticipantTypeLabel,
  hasRealEmail,
} from "@/lib/utils";
import type { StudentWithTicket } from "@/types";

export const SUGGESTION_LIMIT = 8;

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function findMatchRange(
  text: string,
  query: string
): [number, number] | null {
  const needle = normalizeSearchText(query.trim());
  if (!needle || !text) return null;

  let folded = "";
  const starts: number[] = [];
  for (let index = 0; index < text.length; index++) {
    const piece = normalizeSearchText(text[index]);
    for (let offset = 0; offset < piece.length; offset++) {
      folded += piece[offset];
      starts.push(index);
    }
  }

  const at = folded.indexOf(needle);
  if (at < 0) return null;
  return [starts[at], starts[at + needle.length - 1] + 1];
}

export function studentMatchesQuery(
  student: StudentWithTicket,
  query: string
): boolean {
  const q = normalizeSearchText(query.trim());
  if (!q) return false;
  const digits = stripCarnetDigits(query);
  const name = normalizeSearchText(student.full_name ?? "");
  const email = hasRealEmail(student.email)
    ? normalizeSearchText(student.email ?? "")
    : "";
  const carnet = student.carnet ? normalizeSearchText(displayCarnet(student.carnet)) : "";
  const ticket = normalizeSearchText(student.ticket?.ticket_number ?? "");
  const phone = student.phone ?? "";
  const correlative = String(student.ticket?.correlative ?? "");

  return (
    name.includes(q) ||
    email.includes(q) ||
    carnet.includes(q) ||
    ticket.includes(q) ||
    phone.includes(q) ||
    (digits.length > 0 &&
      !!student.carnet &&
      stripCarnetDigits(student.carnet).includes(digits)) ||
    correlative.includes(q.replace("#", ""))
  );
}

export function compareByQuery(a: StudentWithTicket, b: StudentWithTicket, query: string) {
  const q = normalizeSearchText(query.trim());
  const aName = normalizeSearchText(a.full_name ?? "");
  const bName = normalizeSearchText(b.full_name ?? "");
  const aStarts = aName.startsWith(q) ? 0 : 1;
  const bStarts = bName.startsWith(q) ? 0 : 1;
  if (aStarts !== bStarts) return aStarts - bStarts;
  return aName.localeCompare(bName, "es");
}

export function rankSuggestions(
  students: StudentWithTicket[],
  query: string,
  limit = SUGGESTION_LIMIT
): StudentWithTicket[] {
  const q = query.trim();
  if (!q) return [];

  return students
    .filter((student) => studentMatchesQuery(student, q))
    .sort((a, b) => compareByQuery(a, b, q))
    .slice(0, limit);
}

export function suggestionDetail(student: StudentWithTicket): string {
  const isDocente = student.participant_type === "docente";
  return [
    formatTicketCorrelative(student.ticket?.correlative),
    isDocente ? getParticipantTypeLabel(student.participant_type) : displayCarnet(student.carnet),
    isDocente ? null : getCicloLabel(student.ciclo),
  ]
    .filter(Boolean)
    .join(" · ");
}
