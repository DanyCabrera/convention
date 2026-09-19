"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import {
  sanitizePersonName,
  teacherFormSchema,
  type TeacherFormValues,
} from "@/lib/validation";

export function RegisterTeacherForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors, isSubmitting, isValid },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    mode: "onTouched",
    defaultValues: {
      full_name: "",
    },
  });

  async function onSubmit(data: TeacherFormValues) {
    try {
      await api.createDocente({
        participant_type: "docente",
        full_name: data.full_name,
      });
      toast.success("Docente registrado");
      router.push("/estudiantes?tipo=docente");
    } catch (err) {
      toast.error("No se pudo registrar", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="teacher_full_name">Nombre completo</Label>
          <Input
            id="teacher_full_name"
            placeholder="Ej.: Juan Pérez"
            aria-invalid={!!errors.full_name}
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
            <p className="text-xs text-destructive" role="alert">
              {errors.full_name.message}
            </p>
          )}
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
