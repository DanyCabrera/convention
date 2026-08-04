/**
 * Resuelve la URL del API según el entorno.
 * En el teléfono (ej. http://192.168.x.x:3000) usa la misma IP para el backend :4000
 */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    return `${protocol}//${hostname}:4000/api`;
  }
  return "http://localhost:4000/api";
}
