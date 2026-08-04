import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

function getSupabaseKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY
  );
}

export function getSupabaseConfigStatus(): {
  configured: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  if (!process.env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!getSupabaseKey()) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY");
  }
  return { configured: missing.length === 0, missing };
}

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = getSupabaseKey();
    const { missing } = getSupabaseConfigStatus();

    if (!url || !key) {
      throw new Error(
        `Supabase no configurado. Faltan: ${missing.join(", ")}. ` +
          "Crea un archivo Backend/.env (copia desde .env.example)."
      );
    }

    supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return supabase;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigStatus().configured;
}
