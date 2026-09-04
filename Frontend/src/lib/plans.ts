export const PLANS = ["diario", "fin_de_semana"] as const;
export type Plan = (typeof PLANS)[number];

export const CARNET_PREFIX_BY_PLAN: Record<Plan, string> = {
  diario: "2790",
  fin_de_semana: "2890",
};

export const PLAN_BY_CARNET_PREFIX: Record<string, Plan> = {
  "2790": "diario",
  "2890": "fin_de_semana",
};

export const VALID_CARNET_PREFIXES = ["2790", "2890"] as const;
export type CarnetPrefix = (typeof VALID_CARNET_PREFIXES)[number];

export const PLAN_META: Record<
  Plan,
  { label: string; shortLabel: string; prefix: CarnetPrefix; slug: string; description: string }
> = {
  diario: {
    label: "Plan diario",
    shortLabel: "Diario",
    prefix: "2790",
    slug: "diario",
    description: "Estudiantes con carnet 2790",
  },
  fin_de_semana: {
    label: "Plan fin de semana",
    shortLabel: "Fin de semana",
    prefix: "2890",
    slug: "fin-de-semana",
    description: "Estudiantes con carnet 2890",
  },
};

export function getPlanFromCarnet(carnet: string): Plan | null {
  const digits = carnet.replace(/\D/g, "");
  const prefix = digits.slice(0, 4);
  return PLAN_BY_CARNET_PREFIX[prefix] ?? null;
}

export function getPlanLabel(plan?: Plan | string | null): string {
  if (plan === "diario" || plan === "fin_de_semana") {
    return PLAN_META[plan].label;
  }
  if (!plan) return "Sin plan";
  return String(plan);
}

export function planFromSlug(slug: string): Plan | null {
  const match = PLANS.find((plan) => PLAN_META[plan].slug === slug);
  return match ?? null;
}

export function planToSlug(plan: Plan): string {
  return PLAN_META[plan].slug;
}

export function isValidPlan(value: string): value is Plan {
  return (PLANS as readonly string[]).includes(value);
}
