import type {
  AttendanceResponse,
  CreateStudentInput,
  CycleStats,
  DashboardStats,
  EventInfo,
  ScanResult,
  StudentStatus,
  StudentWithTicket,
} from "@/types";
import { getApiBaseUrl } from "./api-config";

function parseApiError(body: unknown): string {
  if (!body || typeof body !== "object") return "Error en la solicitud";
  const record = body as { error?: unknown };
  if (typeof record.error === "string") return record.error;
  if (record.error && typeof record.error === "object") {
    const flat = record.error as {
      fieldErrors?: Record<string, string[]>;
      formErrors?: string[];
    };
    const fieldMsg = Object.values(flat.fieldErrors ?? {})[0]?.[0];
    if (fieldMsg) return fieldMsg;
    if (flat.formErrors?.[0]) return flat.formErrors[0];
  }
  return "Error en la solicitud";
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(parseApiError(body));
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

export const api = {
  getEvent: () => fetchApi<EventInfo>("/event"),

  getStats: () => fetchApi<DashboardStats>("/students/stats"),

  getStudents: (params?: {
    ciclo?: number;
    status?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.ciclo) query.set("ciclo", String(params.ciclo));
    if (params?.status && params.status !== "all")
      query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return fetchApi<StudentWithTicket[]>(
      `/students${qs ? `?${qs}` : ""}`
    );
  },

  getStudent: (id: string) =>
    fetchApi<StudentWithTicket>(`/students/${id}`),

  createStudent: (data: CreateStudentInput) =>
    fetchApi<StudentWithTicket>("/students", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStudent: (
    id: string,
    data: Partial<CreateStudentInput & { status: StudentStatus }>
  ) =>
    fetchApi<StudentWithTicket>(`/students/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteStudent: (id: string) =>
    fetchApi<void>(`/students/${id}`, { method: "DELETE" }),

  resendTicket: (id: string) =>
    fetchApi<{ id: string }>(`/students/${id}/resend-ticket`, {
      method: "POST",
    }),

  getCycleStats: () => fetchApi<CycleStats[]>("/students/cycles"),

  getCycleStudents: (ciclo: number) =>
    fetchApi<{ students: StudentWithTicket[]; stats: CycleStats }>(
      `/students/cycles/${ciclo}`
    ),

  scanTicket: (ticket_number: string) =>
    fetchApi<ScanResult>("/students/scan", {
      method: "POST",
      body: JSON.stringify({ ticket_number }),
    }),

  getAttendance: () => fetchApi<AttendanceResponse>("/students/attendance"),
};
