import { z } from "zod";
import { formatCarnet, isValidCarnet } from "./carnet";
import { VALID_CARNET_PREFIXES } from "./plans";

export function capitalizeWords(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/** Solo letras (incl. acentos) y espacios — bloquea números y símbolos al escribir */
export function sanitizePersonName(value: string): string {
  return value
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "")
    .replace(/^\s+/, "");
}

export const studentFormSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .refine((val) => !/^\s/.test(val), "No puede iniciar con espacios")
    .refine((val) => !/\s{2,}/.test(val), "No se permiten espacios dobles")
    .refine(
      (val) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(val),
      "Solo se permiten letras y espacios"
    )
    .transform(capitalizeWords),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((val) => !/\s/.test(val), "El correo no puede contener espacios")
    .refine(
      (val) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val),
      "Ingresa un correo electrónico válido"
    ),
  phone: z
    .string()
    .trim()
    .regex(/^\d{8}$/, "El teléfono debe tener exactamente 8 dígitos numéricos"),
  carnet: z
    .string()
    .trim()
    .refine(isValidCarnet, {
      message: `Formato: 4-2-4/5/6 dígitos. Prefijo ${VALID_CARNET_PREFIXES.join(" o ")}`,
    })
    .transform(formatCarnet),
  ciclo: z.enum(["2", "4", "6", "8", "10"], {
    required_error: "Selecciona un ciclo académico",
  }),
});

export const ticketNumberSchema = z
  .string()
  .trim()
  .min(1, "Ingresa el correlativo o código de ticket")
  .max(64, "Código demasiado largo")
  .refine(
    (val) =>
      /TKT-[A-Z0-9]{6,12}/i.test(val) || /^\d{1,6}$/.test(val),
    "Usa el correlativo (ej. 42) o TKT-ABC1234567"
  );

export type StudentFormValues = z.infer<typeof studentFormSchema>;

export const teacherFormSchema = z.object({
  full_name: studentFormSchema.shape.full_name,
});

export type TeacherFormValues = z.infer<typeof teacherFormSchema>;

export const FIELD_ORDER: (keyof StudentFormValues)[] = [
  "full_name",
  "email",
  "phone",
  "carnet",
  "ciclo",
];

export function canAccessField(
  field: keyof StudentFormValues,
  values: Partial<StudentFormValues>,
  errors: Partial<Record<keyof StudentFormValues, { message?: string }>>
): boolean {
  const index = FIELD_ORDER.indexOf(field);
  for (let i = 0; i < index; i++) {
    const key = FIELD_ORDER[i];
    if (errors[key]) return false;
    const fieldSchema = studentFormSchema.shape[key];
    const result = fieldSchema.safeParse(values[key]);
    if (!result.success) return false;
  }
  return true;
}
