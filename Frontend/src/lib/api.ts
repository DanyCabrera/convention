import type {
  AttendanceResponse,
  CreateStudentInput,
  CreateDocenteInput,
  CycleStats,
  DashboardStats,
  EventInfo,
  ParticipantType,
  PlanStats,
  DocenteStats,
  ScanResult,
  StudentStatus,
  StudentWithTicket,
} from "@/types";
import type { Plan } from "@/lib/plans";
import { getApiBaseUrl, getApiKey } from "./api-config";

function sanitizeUserFacingError(message: string): string {
  const technical =
    /\.env|RESEND_API_KEY|SMTP_|localhost|process\.env/i.test(message);
  if (technical) {
    return "No se pudo completar la acción. Contacta al administrador del sistema.";
  }
  return message;
}

function parseApiError(body: unknown): string {
  if (!body || typeof body !== "object") return "Error en la solicitud";
  const record = body as { error?: unknown; details?: unknown };
  if (typeof record.details === "string" && record.details.trim()) {
    return sanitizeUserFacingError(record.details);
  }
  if (typeof record.error === "string") {
    return sanitizeUserFacingError(record.error);
  }
  if (record.error && typeof record.error === "object") {
    const flat = record.error as {
      fieldErrors?: Record<string, string[]>;
      formErrors?: string[];
    };
    const fieldMsg = Object.values(flat.fieldErrors ?? {})[0]?.[0];
    if (fieldMsg) return sanitizeUserFacingError(fieldMsg);
    if (flat.formErrors?.[0]) return sanitizeUserFacingError(flat.formErrors[0]);
  }
  return "Error en la solicitud";
}

function buildHeaders(options?: RequestInit): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };
  const apiKey = getApiKey();
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }
  return headers;
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    ...options,
    headers: buildHeaders(options),
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
    plan?: Plan;
    status?: string;
    search?: string;
    tipo?: ParticipantType;
  }) => {
    const query = new URLSearchParams();
    if (params?.ciclo) query.set("ciclo", String(params.ciclo));
    if (params?.plan) query.set("plan", params.plan);
    if (params?.status && params.status !== "all")
      query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    if (params?.tipo) query.set("tipo", params.tipo);
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

  createDocente: (data: CreateDocenteInput) =>
    fetchApi<StudentWithTicket>("/students", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  downloadDocument: async (id: string, filename?: string) => {
    const res = await fetch(`${getApiBaseUrl()}/students/${id}/document`, {
      headers: buildHeaders(),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(parseApiError(body));
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename ?? "documento.pdf";
    link.click();
    URL.revokeObjectURL(url);
  },

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

  issueTicket: (id: string) =>
    fetchApi<StudentWithTicket>(`/students/${id}/issue-ticket`, {
      method: "POST",
    }),

  getPlanStats: () => fetchApi<PlanStats[]>("/students/plans"),

  getDocenteStats: () => fetchApi<DocenteStats>("/students/docentes/stats"),

  getCycleStats: (plan?: Plan) => {
    const qs = plan ? `?plan=${plan}` : "";
    return fetchApi<CycleStats[]>(`/students/cycles${qs}`);
  },

  getCycleStudents: (ciclo: number, plan?: Plan) => {
    const qs = plan ? `?plan=${plan}` : "";
    return fetchApi<{ students: StudentWithTicket[]; stats: CycleStats }>(
      `/students/cycles/${ciclo}${qs}`
    );
  },

  scanTicket: (ticket_number: string) =>
    fetchApi<ScanResult>("/students/scan", {
      method: "POST",
      body: JSON.stringify({ ticket_number }),
    }),

  getAttendance: () => fetchApi<AttendanceResponse>("/students/attendance"),
};
