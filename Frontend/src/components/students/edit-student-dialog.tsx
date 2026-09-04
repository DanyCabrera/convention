"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { api } from "@/lib/api";
import { CICLOS } from "@/lib/constants";
import { CarnetInput } from "@/components/students/carnet-input";
import { displayCarnet } from "@/lib/carnet";
import { getPlanFromCarnet, getPlanLabel } from "@/lib/plans";
import { getCicloLabel } from "@/lib/utils";
import {
  studentFormSchema,
  sanitizePersonName,
  type StudentFormValues,
} from "@/lib/validation";
import type { StudentWithTicket } from "@/types";

const editDocenteSchema = studentFormSchema.pick({
  full_name: true,
  email: true,
});

interface EditStudentDialogProps {
  student: StudentWithTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditStudentDialog({
  student,
  open,
  onOpenChange,
  onSuccess,
}: EditStudentDialogProps) {
  const isDocente = student?.participant_type === "docente";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(
      isDocente ? editDocenteSchema : studentFormSchema
    ) as unknown as Resolver<StudentFormValues>,
    mode: "onTouched",
  });

  useEffect(() => {
    if (student && open) {
      if (student.participant_type === "docente") {
        reset({
          full_name: student.full_name,
          email: student.email,
          phone: "",
          carnet: "",
          ciclo: "2",
        });
        return;
      }
      reset({
        full_name: student.full_name,
        email: student.email,
        phone: student.phone ?? "",
        carnet: displayCarnet(student.carnet),
        ciclo: String(student.ciclo) as StudentFormValues["ciclo"],
      });
    }
  }, [student, open, reset]);

  async function onSubmit(data: StudentFormValues) {
    if (!student) return;
    try {
      if (student.participant_type === "docente") {
        await api.updateStudent(student.id, {
          full_name: data.full_name,
          email: data.email,
          phone: data.phone,
        });
        toast.success("Docente actualizado");
        onOpenChange(false);
        onSuccess();
        return;
      }

      const plan = getPlanFromCarnet(data.carnet);
      if (!plan) {
        toast.error("Prefijo de carnet inválido");
        return;
      }
      await api.updateStudent(student.id, {
        ...data,
        ciclo: Number(data.ciclo) as 2 | 4 | 6 | 8 | 10,
        plan,
      });
      toast.success("Estudiante actualizado");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error("Error al actualizar", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  const currentPlan = getPlanFromCarnet(watch("carnet") ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar {isDocente ? "docente" : "estudiante"}</DialogTitle>
        </DialogHeader>
        <form
          key={`${student?.id ?? "new"}-${isDocente ? "docente" : "estudiante"}`}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="edit-full_name">Nombre completo</Label>
            <Input
              id="edit-full_name"
              autoComplete="name"
              {...register("full_name", {
                onChange: (e) => {
                  const sanitized = sanitizePersonName(e.target.value);
                  if (sanitized !== e.target.value) {
                    e.target.value = sanitized;
                  }
                  setValue("full_name", sanitized, { shouldValidate: true });
                },
              })}
            />
            {errors.full_name && (
              <p className="text-xs text-destructive">
                {errors.full_name.message}
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Correo</Label>
              <Input
                id="edit-email"
                type="email"
                {...register("email", {
                  onChange: (e) =>
                    setValue("email", e.target.value.replace(/\s/g, ""), {
                      shouldValidate: true,
                    }),
                })}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input
                id="edit-phone"
                inputMode="numeric"
                maxLength={8}
                {...register("phone", {
                  onChange: (e) =>
                    setValue(
                      "phone",
                      e.target.value.replace(/\D/g, "").slice(0, 8),
                      { shouldValidate: true }
                    ),
                })}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>
          {!isDocente && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-carnet-prefix">Carnet</Label>
              <CarnetInput
                id="edit-carnet"
                value={watch("carnet") ?? ""}
                onChange={(v) =>
                  setValue("carnet", v, { shouldValidate: true })
                }
                aria-invalid={!!errors.carnet}
              />
              {currentPlan && (
                <p className="text-xs text-muted-foreground">
                  Se guardará en {getPlanLabel(currentPlan)}
                </p>
              )}
              {errors.carnet && (
                <p className="text-xs text-destructive">{errors.carnet.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-ciclo">Ciclo</Label>
              <Select
                value={watch("ciclo")}
                onValueChange={(v) =>
                  setValue("ciclo", v as StudentFormValues["ciclo"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="edit-ciclo">
                  <SelectValue />
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
                <p className="text-xs text-destructive">{errors.ciclo.message}</p>
              )}
            </div>
          </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting ? <Spinner size="sm" /> : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
