export const CICLOS = [2, 4, 6, 8, 10] as const;
export type Ciclo = (typeof CICLOS)[number];

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export const EVENT = {
  name: "UMG 2026",
  date: "2026-08-15",
  location: "Auditorio Central, Campus Universitario",
  university: "Universidad Nacional",
};

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/registrar", label: "Registrar estudiante", icon: "UserPlus" },
  { href: "/estudiantes", label: "Estudiantes", icon: "Users" },
  { href: "/tickets", label: "Tickets", icon: "Ticket" },
  { href: "/asistencia", label: "Asistencia", icon: "ScanLine" },
  { href: "/ciclos", label: "Ciclos", icon: "GraduationCap" },
  { href: "/reportes", label: "Reportes", icon: "BarChart3" },
  { href: "/configuracion", label: "Configuración", icon: "Settings" },
] as const;

export const STATUS_OPTIONS = [
  { value: "all", label: "Todos los estados" },
  { value: "pending", label: "Pendiente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "cancelled", label: "Cancelado" },
] as const;

export const CICLO_OPTIONS = [
  { value: "all", label: "Todos los ciclos" },
  ...CICLOS.map((c) => ({ value: String(c), label: `Ciclo ${c}` })),
] as const;
