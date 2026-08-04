"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { CycleStats } from "@/types";
import { CICLOS } from "@/lib/constants";

export function useCycleStats() {
  const [data, setData] = useState<CycleStats[]>(
    CICLOS.map((ciclo) => ({
      ciclo,
      studentCount: 0,
      ticketsSent: 0,
      attendees: 0,
    }))
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cycles = await api.getCycleStats();
      setData(cycles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar ciclos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
