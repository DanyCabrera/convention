"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TicketView } from "@/components/tickets/ticket-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { StudentWithTicket } from "@/types";

export default function TicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [student, setStudent] = useState<StudentWithTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getStudent(id);
        setStudent(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ticket no encontrado");
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-[500px] w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-destructive">{error ?? "Ticket no encontrado"}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-center">Ticket</h1>
      <TicketView student={student} />
    </div>
  );
}
