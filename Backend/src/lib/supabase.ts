import { createClient, SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";

let supabase: SupabaseClient | null = null;

function isUsableKey(key: string | undefined): key is string {
  if (!key) return false;
  return key.startsWith("eyJ") || key.startsWith("sb_secret_");
}

function getSupabaseKey(): string | undefined {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();

  if (isUsableKey(serviceRole)) return serviceRole;
  if (isUsableKey(secret)) return secret;
  return serviceRole || secret;
}

function normalizeSupabaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, "");

  if (
    trimmed.startsWith("postgresql://") ||
    trimmed.startsWith("postgres://")
  ) {
    throw new Error(
      "SUPABASE_URL debe ser https://xxxxx.supabase.co (Settings → API), no la cadena de Postgres."
    );
  }

  if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i.test(trimmed)) {
    throw new Error(
      "SUPABASE_URL inválida. Usa la Project URL de Supabase → Settings → API."
    );
  }

  return trimmed;
}

export function getSupabaseConfigStatus(): {
  configured: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  if (!process.env.SUPABASE_URL?.trim()) missing.push("SUPABASE_URL");
  if (!getSupabaseKey()) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY");
  }
  return { configured: missing.length === 0, missing };
}

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    const rawUrl = process.env.SUPABASE_URL;
    const key = getSupabaseKey();
    const { missing } = getSupabaseConfigStatus();

    if (!rawUrl?.trim() || !key) {
      throw new Error(
        `Supabase no configurado. Faltan: ${missing.join(", ")}. ` +
          "En Railway define SUPABASE_URL y SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY."
      );
    }

    const url = normalizeSupabaseUrl(rawUrl);

    if (!isUsableKey(key)) {
      throw new Error(
        "La clave de Supabase no es válida. Usa sb_secret_… o el JWT service_role (eyJ…), no la anon/publishable."
      );
    }

    supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { transport: ws as never },
    });
  }

  return supabase;
}

export async function probeSupabase(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const client = getSupabase();
    const { error } = await client.from("students").select("id").limit(1);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigStatus().configured;
}
