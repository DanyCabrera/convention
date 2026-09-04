"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CycleCard } from "@/components/cycles/cycle-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { PLAN_META, planFromSlug } from "@/lib/plans";
import type { CycleStats } from "@/types";

export default function PlanCiclosPage() {
  const params = useParams();
  const planSlug = String(params.plan ?? "");
  const plan = planFromSlug(planSlug);
  const [data, setData] = useState<CycleStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!plan) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const cycles = await api.getCycleStats(plan!);
        setData(cycles);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar ciclos");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [plan]);

  if (!plan) {
    return <p className="text-center py-12 text-destructive">Plan inválido</p>;
  }

  const meta = PLAN_META[plan];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/ciclos">
            <ArrowLeft className="h-4 w-4" />
            Todos los planes
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{meta.label}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Prefijo {meta.prefix} · Ciclos 2, 4, 6, 8 y 10
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-2xl" />
            ))
          : data.map((stats, index) => (
              <CycleCard key={`${stats.plan}-${stats.ciclo}`} stats={stats} index={index} />
            ))}
      </div>
    </div>
  );
}
