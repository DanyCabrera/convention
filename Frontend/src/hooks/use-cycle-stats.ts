"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CICLOS } from "@/lib/constants";
import { PLANS, type Plan } from "@/lib/plans";
import type { CycleStats } from "@/types";

function emptyStats(plan?: Plan): CycleStats[] {
  const plans = plan ? [plan] : [...PLANS];
  return plans.flatMap((planValue) =>
    CICLOS.map((ciclo) => ({
      plan: planValue,
      ciclo,
      studentCount: 0,
      ticketsSent: 0,
      attendees: 0,
    }))
  );
}

export function useCycleStats(plan?: Plan) {
  const [data, setData] = useState<CycleStats[]>(emptyStats(plan));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cycles = await api.getCycleStats(plan);
      setData(cycles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar ciclos");
    } finally {
      setLoading(false);
    }
  }, [plan]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

/** Agrupa stats de ambos planes por ciclo (para charts del dashboard/reportes). */
export function aggregateCycleStatsByCiclo(stats: CycleStats[]): CycleStats[] {
  return CICLOS.map((ciclo) => {
    const rows = stats.filter((s) => s.ciclo === ciclo);
    return {
      plan: "diario" as Plan,
      ciclo,
      studentCount: rows.reduce((sum, r) => sum + r.studentCount, 0),
      ticketsSent: rows.reduce((sum, r) => sum + r.ticketsSent, 0),
      attendees: rows.reduce((sum, r) => sum + r.attendees, 0),
    };
  });
}
