/**
 * Resuelve la URL del API según el entorno.
 * En producción (Vercel) debe definirse NEXT_PUBLIC_API_URL en el build.
 * En local, si no hay variable, usa el mismo host en el puerto 4000.
 */
export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  if (process.env.NODE_ENV !== "production") {
    if (typeof window !== "undefined") {
      const { hostname, protocol } = window.location;
      return `${protocol}//${hostname}:4000/api`;
    }
    return "http://localhost:4000/api";
  }

  console.error("NEXT_PUBLIC_API_URL no está definida en el build de Vercel.");
  return "";
}

export function getApiKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_API_KEY?.trim();
  return key || undefined;
}
