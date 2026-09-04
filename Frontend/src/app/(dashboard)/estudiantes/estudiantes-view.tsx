"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { StudentsTable } from "@/components/students/students-table";
import { TeachersTable } from "@/components/students/teachers-table";
import { TeacherActions } from "@/components/students/teacher-actions";
import { EditStudentDialog } from "@/components/students/edit-student-dialog";
import { CycleActions } from "@/components/cycles/cycle-actions";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudents } from "@/hooks/use-students";
import { useEvent } from "@/hooks/use-event";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { isValidPlan, type Plan } from "@/lib/plans";
import type { ParticipantType, StudentWithTicket } from "@/types";

interface EstudiantesViewProps {
  initialSearch?: string;
  initialPlan?: string;
  initialTipo?: string;
}

export function EstudiantesView({
  initialSearch = "",
  initialPlan = "all",
  initialTipo = "estudiante",
}: EstudiantesViewProps) {
  const participantType: ParticipantType =
    initialTipo === "docente" ? "docente" : "estudiante";
  const { event } = useEvent();
  const { data, loading, error, refresh } = useStudents({
    tipo: participantType,
  });
  const [editing, setEditing] = useState<StudentWithTicket | null>(null);
  const [deleting, setDeleting] = useState<StudentWithTicket | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filtered, setFiltered] = useState<StudentWithTicket[]>([]);

  const resolvedPlan: Plan | "all" =
    initialPlan !== "all" && isValidPlan(initialPlan) ? initialPlan : "all";

  const handleFilteredChange = useCallback((students: StudentWithTicket[]) => {
    setFiltered(students);
  }, []);

  async function confirmDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await api.deleteStudent(deleting.id);
      toast.success("Eliminado");
      setDeleting(null);
      refresh();
    } catch (err) {
      toast.error("Error al eliminar", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleResend(id: string) {
    try {
      await api.resendTicket(id);
      toast.success("Correo enviado");
      refresh();
    } catch (err) {
      toast.error("No se pudo enviar el correo", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  async function handleCancel(id: string) {
    try {
      await api.updateStudent(id, { status: "cancelled" });
      toast.success("Registro cancelado");
      refresh();
    } catch (err) {
      toast.error("Error al cancelar", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" className="mt-4" onClick={refresh}>
          Reintentar
        </Button>
      </div>
    );
  }

  const isDocenteView = participantType === "docente";
  const searchQuery = initialSearch
    ? `&search=${encodeURIComponent(initialSearch)}`
    : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isDocenteView ? "Docentes" : "Estudiantes"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isDocenteView
                ? "Listado y exportación PDF o Excel."
                : "Filtra por plan y descarga el listado."}
            </p>
          </div>
          {!loading && isDocenteView && (
            <TeacherActions
              teachers={filtered}
              event={event}
              title="Docentes"
            />
          )}
          {!loading && !isDocenteView && (
            <CycleActions
              ciclo={0}
              plan={resolvedPlan === "all" ? null : resolvedPlan}
              students={filtered}
              event={event}
              title={
                resolvedPlan === "all"
                  ? "Todos los estudiantes"
                  : undefined
              }
            />
          )}
        </div>

        <div className="flex gap-2 rounded-xl border border-border bg-muted/30 p-1 sm:max-w-md">
          <Button
            variant={isDocenteView ? "ghost" : "secondary"}
            size="sm"
            className={cn("flex-1", !isDocenteView && "shadow-sm")}
            asChild
          >
            <a href={`/estudiantes?tipo=estudiante${searchQuery}`}>Estudiantes</a>
          </Button>
          <Button
            variant={isDocenteView ? "secondary" : "ghost"}
            size="sm"
            className={cn("flex-1", isDocenteView && "shadow-sm")}
            asChild
          >
            <a href={`/estudiantes?tipo=docente${searchQuery}`}>Docentes</a>
          </Button>
        </div>
      </div>

      {loading && data.length === 0 ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : isDocenteView ? (
        <TeachersTable
          data={data}
          loading={loading}
          initialSearch={initialSearch}
          onFilteredChange={handleFilteredChange}
          onEdit={setEditing}
          onCancel={handleCancel}
          onResend={handleResend}
          onDelete={(id) => {
            const teacher = data.find((s) => s.id === id);
            if (teacher) setDeleting(teacher);
          }}
        />
      ) : (
        <StudentsTable
          data={data}
          loading={loading}
          initialSearch={initialSearch}
          initialPlan={resolvedPlan}
          onFilteredChange={handleFilteredChange}
          onEdit={setEditing}
          onCancel={handleCancel}
          onDelete={(id) => {
            const student = data.find((s) => s.id === id);
            if (student) setDeleting(student);
          }}
          onResend={handleResend}
        />
      )}

      <EditStudentDialog
        student={editing}
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        onSuccess={refresh}
      />

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar registro?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleting?.full_name}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
