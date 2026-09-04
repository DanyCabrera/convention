"use client";

import { useMemo } from "react";
import { ReportsCharts } from "@/components/reports/reports-charts";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import {
  aggregateCycleStatsByCiclo,
  useCycleStats,
} from "@/hooks/use-cycle-stats";

export default function ReportesPage() {
  const { stats, loading: statsLoading, error: statsError } = useDashboardStats();
  const { data: cycleStats, loading: cyclesLoading, error: cyclesError } =
    useCycleStats();

  const aggregated = useMemo(
    () => aggregateCycleStatsByCiclo(cycleStats),
    [cycleStats]
  );

  if (statsLoading || cyclesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (statsError || cyclesError) {
    return (
      <p className="text-destructive text-sm">
        {statsError ?? cyclesError}
      </p>
    );
  }

  return <ReportsCharts stats={stats} cycleStats={aggregated} />;
}
