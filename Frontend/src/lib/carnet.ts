/** Formato: 4 dígitos · 2 dígitos · 4–6 dígitos (10–12 total) */
import {
  VALID_CARNET_PREFIXES,
  getPlanFromCarnet,
  type CarnetPrefix,
} from "./plans";

export const CARNET_SEGMENT_LENGTHS = [4, 2, 6] as const;

export function stripCarnetDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function getCarnetSegments(value: string): [string, string, string] {
  const digits = stripCarnetDigits(value);
  return [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 12)];
}

export function formatCarnet(value: string): string {
  const [s1, s2, s3] = getCarnetSegments(value);
  const parts: string[] = [];
  if (s1) parts.push(s1);
  if (s2) parts.push(s2);
  if (s3) parts.push(s3);
  return parts.join("-");
}

export function isValidCarnetPrefix(value: string): value is CarnetPrefix {
  return (VALID_CARNET_PREFIXES as readonly string[]).includes(value);
}

export function isValidCarnet(value: string): boolean {
  const digits = stripCarnetDigits(value);
  if (digits.length < 10 || digits.length > 12) return false;
  const thirdLength = digits.length - 6;
  if (thirdLength < 4 || thirdLength > 6) return false;
  return getPlanFromCarnet(digits) !== null;
}

export function carnetValidationMessage(value: string): string | null {
  const digits = stripCarnetDigits(value);
  if (!digits) return "Carnet requerido";
  if (!isValidCarnetPrefix(digits.slice(0, 4)) && digits.length >= 4) {
    return `Los primeros 4 dígitos deben ser ${VALID_CARNET_PREFIXES.join(" o ")}`;
  }
  if (digits.length < 10) return "Formato: 4-2-4/5/6 dígitos";
  if (digits.length > 12) return "Carnet demasiado largo";
  const thirdLength = digits.length - 6;
  if (thirdLength < 4) return "Último segmento: mínimo 4 dígitos";
  if (thirdLength > 6) return "Último segmento: máximo 6 dígitos";
  if (!getPlanFromCarnet(digits)) {
    return `Los primeros 4 dígitos deben ser ${VALID_CARNET_PREFIXES.join(" o ")}`;
  }
  return null;
}

export function displayCarnet(value: string | null | undefined): string {
  if (!value) return "—";
  if (value.includes("-")) return value;
  return formatCarnet(value);
}

export function mergeCarnetSegments(s1: string, s2: string, s3: string): string {
  const digits =
    s1.replace(/\D/g, "").slice(0, 4) +
    s2.replace(/\D/g, "").slice(0, 2) +
    s3.replace(/\D/g, "").slice(0, 6);
  return formatCarnet(digits);
}
