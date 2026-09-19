import { z } from "zod";
import {
  carnetPrefixErrorMessage,
  formatCarnet,
  isValidCarnet,
} from "./carnet.js";
import { getPlanFromCarnet, PLANS } from "./plan.js";

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
    message: `Carnet inválido: formato 4-2-4/5/6 dígitos. ${carnetPrefixErrorMessage()}`,
  })
  .transform(formatCarnet);

const cicloSchema = z.coerce
  .number()
  .refine((val) => [2, 4, 6, 8, 10].includes(val), {
    message: "Selecciona un ciclo válido (2, 4, 6, 8 o 10)",
  });

const planSchema = z.enum(PLANS, {
  errorMap: () => ({ message: "Selecciona un plan válido" }),
});

const studentFieldsSchema = z.object({
  full_name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  carnet: carnetSchema,
  ciclo: cicloSchema,
  plan: planSchema.optional(),
});

export const createStudentSchema = studentFieldsSchema.transform((data) => {
  const plan = getPlanFromCarnet(data.carnet)!;
  if (data.plan && data.plan !== plan) {
    throw new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        path: ["carnet"],
        message: "El carnet no corresponde al plan seleccionado",
      },
    ]);
  }
  return { ...data, plan, participant_type: "estudiante" as const };
});

export const createDocenteSchema = z.object({
  participant_type: z.literal("docente"),
  full_name: nameSchema,
});

export const createParticipantSchema = z.union([
  createDocenteSchema,
  studentFieldsSchema.transform((data) => {
    const plan = getPlanFromCarnet(data.carnet)!;
    if (data.plan && data.plan !== plan) {
      throw new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          path: ["carnet"],
          message: "El carnet no corresponde al plan seleccionado",
        },
      ]);
    }
    return { ...data, plan, participant_type: "estudiante" as const };
  }),
]);

export const participantTypeFilterSchema = z
  .enum(["estudiante", "docente"])
  .optional();

export const planFilterSchema = planSchema;

export const updateStudentSchema = studentFieldsSchema
  .partial()
  .extend({
    status: z.enum(["pending", "cancelled"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.carnet) return;
    const plan = getPlanFromCarnet(data.carnet);
    if (!plan) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["carnet"],
        message: carnetPrefixErrorMessage(),
      });
      return;
    }
    if (data.plan && data.plan !== plan) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["carnet"],
        message: "El carnet no corresponde al plan seleccionado",
      });
    }
  })
  .transform((data) => {
    if (!data.carnet) return data;
    const plan = getPlanFromCarnet(data.carnet)!;
    return { ...data, plan };
  });

export const scanTicketSchema = z.object({
  ticket_number: z
    .string()
    .trim()
    .min(1, "Ingresa un número de ticket o correlativo")
    .max(64, "Código demasiado largo")
    .refine(
      (val) =>
        /TKT-[A-Z0-9]{6,12}/i.test(val) || /^\d{1,6}$/.test(val),
      "Usa el correlativo (ej. 42) o el código TKT-XXXXXXXXXX"
    ),
});

export const studentIdSchema = z.string().uuid("ID de estudiante inválido");

export const studentStatusFilterSchema = z
  .enum(["pending", "confirmed", "cancelled"])
  .optional();

export type CreateStudentSchemaInput = z.infer<typeof createStudentSchema>;
export type CreateDocenteSchemaInput = z.infer<typeof createDocenteSchema>;
export type CreateParticipantSchemaInput = z.infer<typeof createParticipantSchema>;
export type UpdateStudentSchemaInput = z.infer<typeof updateStudentSchema>;

export function formatZodError(error: z.ZodError): string {
  const first = error.errors[0];
  return first?.message ?? "Datos inválidos";
}
