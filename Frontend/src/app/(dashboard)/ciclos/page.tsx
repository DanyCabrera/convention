"use client";

import { useCallback, useEffect, useState } from "react";
import { PlanCard } from "@/components/cycles/plan-card";
import { DocentesCard } from "@/components/cycles/docentes-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { PLANS } from "@/lib/plans";
import type { DocenteStats, PlanStats } from "@/types";

export default function CiclosPage() {
  const [data, setData] = useState<PlanStats[]>(
    PLANS.map((plan) => ({
      plan,
      studentCount: 0,
      ticketsSent: 0,
      attendees: 0,
    }))
  );
  const [docenteStats, setDocenteStats] = useState<DocenteStats>({
    teacherCount: 0,
    ticketsSent: 0,
    attendees: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [plans, docentes] = await Promise.all([
        api.getPlanStats(),
        api.getDocenteStats(),
      ]);
      setData(plans);
      setDocenteStats(docentes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar planes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planes y ciclos</h1>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={refresh}>
            Reintentar
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-2xl" />
            ))
          : (
            <>
              {data.map((stats, index) => (
                <PlanCard key={stats.plan} stats={stats} index={index} />
              ))}
              <DocentesCard stats={docenteStats} index={data.length} />
            </>
          )}
      </div>
    </div>
  );
}
