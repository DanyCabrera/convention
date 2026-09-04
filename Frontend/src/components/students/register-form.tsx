"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { CICLOS } from "@/lib/constants";
import { cn, getCicloLabel } from "@/lib/utils";
import { api } from "@/lib/api";
import { getPlanFromCarnet } from "@/lib/plans";
import {
  canAccessField,
  sanitizePersonName,
  studentFormSchema,
  type StudentFormValues,
} from "@/lib/validation";
import { CarnetInput } from "@/components/students/carnet-input";

export function RegisterStudentForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting, isValid },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    mode: "onTouched",
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      carnet: "",
    },
  });

  const values = watch();
  const canEmail = canAccessField("email", values, errors);
  const canPhone = canAccessField("phone", values, errors);
  const canCarnet = canAccessField("carnet", values, errors);
  const canCiclo = canAccessField("ciclo", values, errors);

  async function onSubmit(data: StudentFormValues) {
    try {
      const plan = getPlanFromCarnet(data.carnet);
      if (!plan) {
        toast.error("Prefijo de carnet inválido");
        return;
      }

      const result = await api.createStudent({
        ...data,
        ciclo: Number(data.ciclo) as 2 | 4 | 6 | 8 | 10,
        plan,
      });

      if (result.ticket?.status === "failed") {
        toast.warning("Registrado. El correo no se envió.");
      } else {
        toast.success("Estudiante registrado");
      }
      router.push(`/estudiantes?plan=${plan}`);
    } catch (err) {
      toast.error("No se pudo registrar", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  function fieldErrorId(field: keyof StudentFormValues) {
    return `${field}-error`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                placeholder="Ej.: Ana López"
                aria-invalid={!!errors.full_name}
                aria-describedby={
                  errors.full_name ? fieldErrorId("full_name") : undefined
                }
                autoComplete="name"
                {...register("full_name", {
                  onChange: (e) => {
                    const sanitized = sanitizePersonName(e.target.value);
                    if (sanitized !== e.target.value) {
                      e.target.value = sanitized;
                    }
                    setValue("full_name", sanitized, { shouldValidate: true });
                  },
                  onBlur: async (e) => {
                    const capitalized = sanitizePersonName(e.target.value)
                      .trim()
                      .replace(/\s+/g, " ")
                      .split(" ")
                      .map(
                        (w: string) =>
                          w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
                      )
                      .join(" ");
                    setValue("full_name", capitalized, { shouldValidate: true });
                    await trigger("full_name");
                  },
                })}
              />
              {errors.full_name && (
                <p
                  id={fieldErrorId("full_name")}
                  className="text-xs text-destructive"
                  role="alert"
                >
                  {errors.full_name.message}
                </p>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ej.: correo@umg.edu.gt"
                  disabled={!canEmail}
                  className={cn(!canEmail && "opacity-50")}
                  aria-invalid={!!errors.email}
                  aria-describedby={
                    errors.email ? fieldErrorId("email") : undefined
                  }
                  {...register("email", {
                    onChange: (e) => {
                      setValue("email", e.target.value.replace(/\s/g, ""), {
                        shouldValidate: true,
                      });
                    },
                  })}
                />
                {errors.email && (
                  <p
                    id={fieldErrorId("email")}
                    className="text-xs text-destructive"
                    role="alert"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  inputMode="numeric"
                  placeholder="8 dígitos"
                  maxLength={8}
                  disabled={!canPhone}
                  className={cn(!canPhone && "opacity-50")}
                  aria-invalid={!!errors.phone}
                  aria-describedby={
                    errors.phone ? fieldErrorId("phone") : undefined
                  }
                  {...register("phone", {
                    onChange: (e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
                      setValue("phone", digits, { shouldValidate: true });
                    },
                  })}
                />
                {errors.phone && (
                  <p
                    id={fieldErrorId("phone")}
                    className="text-xs text-destructive"
                    role="alert"
                  >
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="carnet-prefix">Carnet</Label>
                <CarnetInput
                  id="carnet"
                  value={values.carnet ?? ""}
                  disabled={!canCarnet}
                  aria-invalid={!!errors.carnet}
                  aria-describedby={
                    errors.carnet ? fieldErrorId("carnet") : undefined
                  }
                  onChange={(v) =>
                    setValue("carnet", v, { shouldValidate: true })
                  }
                />
                {errors.carnet && (
                  <p
                    id={fieldErrorId("carnet")}
                    className="text-xs text-destructive"
                    role="alert"
                  >
                    {errors.carnet.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="ciclo">Ciclo</Label>
                <Select
                  disabled={!canCiclo}
                  value={values.ciclo}
                  onValueChange={(v) =>
                    setValue("ciclo", v as StudentFormValues["ciclo"], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger
                    id="ciclo"
                    className={cn(!canCiclo && "opacity-50")}
                    aria-invalid={!!errors.ciclo}
                    aria-describedby={
                      errors.ciclo ? fieldErrorId("ciclo") : undefined
                    }
                  >
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {CICLOS.map((c) => (
                      <SelectItem key={c} value={String(c)}>
                        {getCicloLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.ciclo && (
                  <p
                    id={fieldErrorId("ciclo")}
                    className="text-xs text-destructive"
                    role="alert"
                  >
                    {errors.ciclo.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !isValid}>
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" />
                    Registrando...
                  </>
                ) : (
                  "Registrar"
                )}
              </Button>
            </div>
          </form>
    </motion.div>
  );
}
