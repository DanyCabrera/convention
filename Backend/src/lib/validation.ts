import { z } from "zod";
import { formatCarnet, isValidCarnet } from "./carnet.js";

export function capitalizeWords(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

const nameSchema = z
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
  .transform(capitalizeWords);

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((val) => !/\s/.test(val), "El correo no puede contener espacios")
  .refine(
    (val) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val),
    "Ingresa un correo electrónico válido"
  );

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\d{8}$/, "El teléfono debe tener exactamente 8 dígitos numéricos");

const carnetSchema = z
  .string()
  .trim()
  .refine(isValidCarnet, {
    message: "Carnet inválido: formato 4-2-4/5/6 dígitos",
  })
  .transform(formatCarnet);

const cicloSchema = z.coerce
  .number()
  .refine((val) => [2, 4, 6, 8, 10].includes(val), {
    message: "Selecciona un ciclo válido (2, 4, 6, 8 o 10)",
  });

export const createStudentSchema = z.object({
  full_name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  carnet: carnetSchema,
  ciclo: cicloSchema,
});

export const updateStudentSchema = createStudentSchema.partial().extend({
  status: z.enum(["pending", "confirmed", "cancelled"]).optional(),
});

export type CreateStudentSchemaInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentSchemaInput = z.infer<typeof updateStudentSchema>;

export function formatZodError(error: z.ZodError): string {
  const first = error.errors[0];
  return first?.message ?? "Datos inválidos";
}
