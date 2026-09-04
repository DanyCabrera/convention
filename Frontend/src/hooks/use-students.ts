"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Plan } from "@/lib/plans";
import type { ParticipantType, StudentWithTicket } from "@/types";

interface UseStudentsOptions {
  ciclo?: number;
  plan?: Plan;
  status?: string;
  search?: string;
  tipo?: ParticipantType;
  enabled?: boolean;
}

export function useStudents(options: UseStudentsOptions = {}) {
  const { ciclo, plan, status, search, tipo, enabled = true } = options;
  const [data, setData] = useState<StudentWithTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const students = await api.getStudents({ ciclo, plan, status, search, tipo });
      setData(students);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar registros");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [ciclo, plan, status, search, tipo, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh, setData };
}
