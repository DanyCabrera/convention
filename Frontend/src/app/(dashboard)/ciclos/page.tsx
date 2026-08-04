"use client";

import { CycleCard } from "@/components/cycles/cycle-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useCycleStats } from "@/hooks/use-cycle-stats";

export default function CiclosPage() {
  const { data, loading, error, refresh } = useCycleStats();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Ciclos</h1>

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
          ? Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-2xl" />
            ))
          : data.map((stats, index) => (
              <CycleCard key={stats.ciclo} stats={stats} index={index} />
            ))}
      </div>
    </div>
  );
}
