"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCicloLabel } from "@/lib/utils";
import type { CycleStats, DashboardStats } from "@/types";

const COLORS = ["#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE"];

interface ReportsChartsProps {
  stats: DashboardStats;
  cycleStats: CycleStats[];
}

export function ReportsCharts({ stats, cycleStats }: ReportsChartsProps) {
  const barData = cycleStats.map((c) => ({
    name: `C${c.ciclo}`,
    estudiantes: c.studentCount,
  }));

  const pieData = cycleStats.map((c) => ({
    name: getCicloLabel(c.ciclo),
    value: c.studentCount,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reportes</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5"
      >
        <Card className="glass-card">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">Estudiantes</p>
            <p className="text-2xl font-bold sm:text-3xl">{stats.totalStudents}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">Docentes</p>
            <p className="text-2xl font-bold sm:text-3xl">{stats.totalTeachers}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">Tickets</p>
            <p className="text-2xl font-bold sm:text-3xl">{stats.ticketsGenerated}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">Correos enviados</p>
            <p className="text-2xl font-bold sm:text-3xl">{stats.emailsSent}</p>
          </CardContent>
        </Card>
        <Card className="glass-card col-span-2 lg:col-span-1">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">Entradas confirmadas</p>
            <p className="text-2xl font-bold sm:text-3xl">{stats.confirmedParticipants}</p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por ciclo (estudiantes)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} barSize={28}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Bar dataKey="estudiantes" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribución</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
