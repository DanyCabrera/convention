"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCicloLabel } from "@/lib/utils";
import type { CycleStats } from "@/types";

interface CycleCardProps {
  stats: CycleStats;
  index?: number;
}

export function CycleCard({ stats, index = 0 }: CycleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Card className="glass-card overflow-hidden transition-all hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-semibold">{getCicloLabel(stats.ciclo)}</p>
              <p className="text-3xl font-bold mt-3">{stats.studentCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Tickets</p>
              <p className="font-semibold">{stats.ticketsSent}</p>
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">Asistentes</p>
              <p className="font-semibold">{stats.attendees}</p>
            </div>
          </div>

          <Button size="sm" className="mt-4 w-full" asChild>
            <Link href={`/ciclos/${stats.ciclo}`}>
              <Eye className="h-3.5 w-3.5" />
              Ver listado
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
