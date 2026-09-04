import { getCicloLabel } from "./utils";
import { PLAN_META, PLANS, type Plan } from "./plans";

export const CICLOS = [2, 4, 6, 8, 10] as const;
export type Ciclo = (typeof CICLOS)[number];
export type { Plan };
export { PLANS, PLAN_META };

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export const EVENT = {
  name: "UMG 2026",
  date: "2026-10-24",
  location: "SALON CAMPO DE LA FERIA, SAN FELIPE, RETALHULEU",
  university: "Universidad Mariano Galvez",
};

export const TICKET_TEMPLATE_SRC = "/tickets.jpeg";
export const APP_LOGO_SRC = "/logoumg.jpeg";

/** Zona de contenido del ticket (debajo de "TICKET"). Sincronizar con Backend/src/lib/ticket-layout.ts */
export const TICKET_OVERLAY = {
  left: "2.9%",
  top: "21%",
  width: "24.6%",
  height: "68%",
} as const;

export const NAV_ITEMS = [
  { href: "/", label: "Inicio", icon: "LayoutDashboard" },
  { href: "/registrar", label: "Registrar", icon: "UserPlus" },
  { href: "/estudiantes", label: "Participantes", icon: "Users" },
  { href: "/tickets", label: "Tickets", icon: "Ticket" },
  { href: "/asistencia", label: "Asistencia", icon: "ScanLine" },
  { href: "/ciclos", label: "Planes y ciclos", icon: "GraduationCap" },
  { href: "/reportes", label: "Reportes", icon: "BarChart3" },
  { href: "/configuracion", label: "Evento", icon: "Settings" },
] as const;

export const STATUS_OPTIONS = [
  { value: "all", label: "Todos los estados" },
  { value: "pending", label: "Sin confirmar entrada" },
  { value: "confirmed", label: "Entrada confirmada" },
  { value: "cancelled", label: "Registro cancelado" },
] as const;

export const CICLO_OPTIONS = [
  { value: "all", label: "Todos los ciclos" },
  ...CICLOS.map((c) => ({ value: String(c), label: getCicloLabel(c) })),
] as const;

export const PLAN_OPTIONS = [
  { value: "all", label: "Todos los planes" },
  ...PLANS.map((plan) => ({
    value: plan,
    label: PLAN_META[plan].label,
  })),
] as const;

export const CARNET_PREFIX_OPTIONS = [
  {
    value: "2790",
    label: "2790 — Plan diario",
    plan: "diario" as Plan,
  },
  {
    value: "2890",
    label: "2890 — Plan fin de semana",
    plan: "fin_de_semana" as Plan,
  },
] as const;
