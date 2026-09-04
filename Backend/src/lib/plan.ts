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

export const VALID_CARNET_PREFIXES = Object.keys(PLAN_BY_CARNET_PREFIX);

export function isValidPlan(value: string): value is Plan {
  return (PLANS as readonly string[]).includes(value);
}

export function getPlanFromCarnet(carnet: string): Plan | null {
  const digits = carnet.replace(/\D/g, "");
  const prefix = digits.slice(0, 4);
  return PLAN_BY_CARNET_PREFIX[prefix] ?? null;
}

export function getPlanLabel(plan: Plan): string {
  return plan === "diario" ? "Plan diario" : "Plan fin de semana";
}
