"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/types";

const emptyStats: DashboardStats = {
  totalStudents: 0,
  ticketsSent: 0,
  cyclesRegistered: 0,
  emailsSent: 0,
  confirmedParticipants: 0,
  growth: { students: 0, tickets: 0, cycles: 0, emails: 0, confirmed: 0 },
};

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar estadísticas");
      setStats(emptyStats);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, error, refresh };
}
