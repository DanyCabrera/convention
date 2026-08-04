/** Formato: 4 dígitos · 2 dígitos · 4–6 dígitos */

export function stripCarnetDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCarnet(value: string): string {
  const digits = stripCarnetDigits(value).slice(0, 12);
  const s1 = digits.slice(0, 4);
  const s2 = digits.slice(4, 6);
  const s3 = digits.slice(6);
  const parts: string[] = [];
  if (s1) parts.push(s1);
  if (s2) parts.push(s2);
  if (s3) parts.push(s3);
  return parts.join("-");
}

export function isValidCarnet(value: string): boolean {
  const digits = stripCarnetDigits(value);
  if (digits.length < 10 || digits.length > 12) return false;
  const thirdLength = digits.length - 6;
  return thirdLength >= 4 && thirdLength <= 6;
}

export function normalizeCarnet(value: string): string {
  return formatCarnet(value);
}
