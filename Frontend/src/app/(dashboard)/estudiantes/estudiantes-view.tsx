"use client";

import { useState } from "react";
import { toast } from "sonner";
import { StudentsTable } from "@/components/students/students-table";
import { EditStudentDialog } from "@/components/students/edit-student-dialog";
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
import { api } from "@/lib/api";
import type { StudentWithTicket } from "@/types";

interface EstudiantesViewProps {
  initialSearch?: string;
}

export function EstudiantesView({ initialSearch = "" }: EstudiantesViewProps) {
  const { data, loading, error, refresh } = useStudents();
  const [editing, setEditing] = useState<StudentWithTicket | null>(null);
  const [deleting, setDeleting] = useState<StudentWithTicket | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      toast.success("Ticket reenviado");
      refresh();
    } catch (err) {
      toast.error("Error al reenviar", {
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Estudiantes</h1>

      {loading && data.length === 0 ? (
        <Skeleton className="h-96 w-full rounded-2xl" />
      ) : (
        <StudentsTable
          data={data}
          loading={loading}
          initialSearch={initialSearch}
          onEdit={setEditing}
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
