const PRODUCTION_API_URL =
  "https://convention-production.up.railway.app/api";

/**
 * Resuelve la URL del API según el entorno.
 * En producción usa Railway. En local, NEXT_PUBLIC_API_URL o el host :4000.
 */
export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_API_URL;
  }

  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    return `${protocol}//${hostname}:4000/api`;
  }
  return "http://localhost:4000/api";
}

export function getApiKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_API_KEY?.trim();
  return key || undefined;
}
