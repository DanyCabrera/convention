"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { getCicloLabel } from "@/lib/utils";
import { studentFormSchema, type StudentFormValues } from "@/lib/validation";
import type { StudentWithTicket } from "@/types";

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
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    mode: "onTouched",
  });

  useEffect(() => {
    if (student && open) {
      reset({
        full_name: student.full_name,
        email: student.email,
        phone: student.phone,
        carnet: displayCarnet(student.carnet),
        ciclo: String(student.ciclo) as StudentFormValues["ciclo"],
      });
    }
  }, [student, open, reset]);

  async function onSubmit(data: StudentFormValues) {
    if (!student) return;
    try {
      await api.updateStudent(student.id, {
        ...data,
        ciclo: Number(data.ciclo) as 2 | 4 | 6 | 8 | 10,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-full_name">Nombre completo</Label>
            <Input id="edit-full_name" {...register("full_name")} />
            {errors.full_name && (
              <p className="text-xs text-destructive">{errors.full_name.message}</p>
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
                    setValue("phone", e.target.value.replace(/\D/g, "").slice(0, 8), {
                      shouldValidate: true,
                    }),
                })}
              />
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-carnet-seg-0">Carnet</Label>
              <CarnetInput
                id="edit-carnet"
                value={watch("carnet") ?? ""}
                onChange={(v) =>
                  setValue("carnet", v, { shouldValidate: true })
                }
                aria-invalid={!!errors.carnet}
              />
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
