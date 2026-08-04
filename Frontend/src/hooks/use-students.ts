"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { StudentWithTicket } from "@/types";

interface UseStudentsOptions {
  ciclo?: number;
  status?: string;
  search?: string;
  enabled?: boolean;
}

export function useStudents(options: UseStudentsOptions = {}) {
  const { ciclo, status, search, enabled = true } = options;
  const [data, setData] = useState<StudentWithTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const students = await api.getStudents({ ciclo, status, search });
      setData(students);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar estudiantes");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [ciclo, status, search, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh, setData };
}
