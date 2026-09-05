import { randomUUID } from "crypto";
import QRCode from "qrcode";
import { getSupabase } from "../lib/supabase.js";
import { sendTicketEmail } from "./email.service.js";
import type {
  CreateStudentInput,
  CreateDocenteInput,
  DashboardStats,
  CycleStats,
  DocenteStats,
  PlanStats,
  Student,
  StudentWithTicket,
  Ticket,
  UpdateStudentInput,
  ScanResult,
  AttendanceResponse,
  Plan,
  ParticipantType,
} from "../types/student.types.js";
import { CICLOS } from "../types/student.types.js";
import { PLANS, getPlanFromCarnet } from "../lib/plan.js";

type DbStudent = Student & { document_pdf?: string | null };
type DbTicket = Ticket;

function mapStudent(row: DbStudent, ticket?: DbTicket | null): StudentWithTicket {
  const { document_pdf, ...rest } = row;
  return {
    ...rest,
    participant_type: rest.participant_type ?? "estudiante",
    has_document: !!document_pdf,
    ticket: ticket ?? undefined,
  };
}

async function generateTicketNumber(): Promise<string> {
  return `TKT-${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

function sanitizeSearchTerm(term: string): string {
  return term.trim().replace(/[%_,().*\\,]/g, "");
}

async function generateQRCode(data: string): Promise<string> {
  return QRCode.toDataURL(data, { width: 300, margin: 2 });
}

async function insertTicketForStudent(studentId: string): Promise<DbTicket> {
  const supabase = getSupabase();
  const ticketNumber = await generateTicketNumber();
  const qrCode = await generateQRCode(ticketNumber);

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      student_id: studentId,
      ticket_number: ticketNumber,
      qr_code: qrCode,
      status: "generated",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return ticket as DbTicket;
}

async function deliverTicketEmail(
  student: DbStudent,
  ticket: DbTicket
): Promise<StudentWithTicket> {
  const supabase = getSupabase();

  try {
    await sendTicketEmail({ student, ticket });

    const sentAt = new Date().toISOString();
    const { data: updatedTicket } = await supabase
      .from("tickets")
      .update({ status: "sent", sent_at: sentAt })
      .eq("id", ticket.id)
      .select("*")
      .single();

    return mapStudent(
      student,
      (updatedTicket as DbTicket) ?? { ...ticket, status: "sent", sent_at: sentAt }
    );
  } catch {
    await supabase
      .from("tickets")
      .update({ status: "failed" })
      .eq("id", ticket.id);

    return mapStudent(student, {
      ...ticket,
      status: "failed",
      sent_at: null,
    });
  }
}

export async function ensureParticipantTicket(
  id: string
): Promise<StudentWithTicket> {
  const current = await getStudentById(id);
  if (!current) {
    throw new Error("Participante no encontrado");
  }
  if (current.ticket?.qr_code) {
    return current;
  }

  await insertTicketForStudent(id);
  const updated = await getStudentById(id);
  if (!updated?.ticket?.qr_code) {
    throw new Error("No se pudo generar el ticket");
  }
  return updated;
}

type DuplicateField = "email" | "carnet" | "phone";

const DUPLICATE_MESSAGES: Record<DuplicateField, string> = {
  email: "Este correo electrónico ya está registrado",
  carnet: "Este número de carnet ya está registrado",
  phone: "Este número de teléfono ya está registrado",
};

function mapUniqueViolation(error: { message?: string; details?: string }): string {
  const text = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  if (text.includes("email") || text.includes("students_email")) {
    return DUPLICATE_MESSAGES.email;
  }
  if (text.includes("carnet") || text.includes("students_carnet")) {
    return DUPLICATE_MESSAGES.carnet;
  }
  if (text.includes("phone") || text.includes("students_phone")) {
    return DUPLICATE_MESSAGES.phone;
  }
  return "Ya existe un registro con datos duplicados";
}

async function findDuplicate(
  fields: { email: string; phone?: string | null; carnet?: string | null },
  excludeId?: string
): Promise<DuplicateField | null> {
  const supabase = getSupabase();

  let emailQuery = supabase
    .from("students")
    .select("id")
    .eq("email", fields.email.toLowerCase())
    .limit(1);
  let phoneQuery = supabase
    .from("students")
    .select("id")
    .eq("phone", fields.phone)
    .limit(1);

  if (excludeId) {
    emailQuery = emailQuery.neq("id", excludeId);
    phoneQuery = phoneQuery.neq("id", excludeId);
  }

  const [{ data: byEmail }, { data: byPhone }] = await Promise.all([
    emailQuery.maybeSingle(),
    fields.phone ? phoneQuery.maybeSingle() : Promise.resolve({ data: null }),
  ]);

  if (byEmail) return "email";

  if (fields.carnet) {
    let carnetQuery = supabase
      .from("students")
      .select("id")
      .eq("carnet", fields.carnet)
      .limit(1);
    if (excludeId) {
      carnetQuery = carnetQuery.neq("id", excludeId);
    }
    const { data: byCarnet } = await carnetQuery.maybeSingle();
    if (byCarnet) return "carnet";
  }

  if (byPhone) return "phone";
  return null;
}

function duplicateErrorMessage(field: DuplicateField): string {
  return DUPLICATE_MESSAGES[field];
}

function attachTicket(
  students: DbStudent[],
  tickets: DbTicket[]
): StudentWithTicket[] {
  const ticketByStudent = new Map(tickets.map((t) => [t.student_id, t]));
  return students.map((s) => mapStudent(s, ticketByStudent.get(s.id)));
}

export async function getAllStudents(filters?: {
  ciclo?: number;
  plan?: Plan;
  status?: string;
  search?: string;
  participant_type?: ParticipantType;
}): Promise<StudentWithTicket[]> {
  const supabase = getSupabase();

  let query = supabase
    .from("students")
    .select("*")
    .order("registered_at", { ascending: false });

  if (filters?.participant_type) {
    query = query.eq("participant_type", filters.participant_type);
  }
  if (filters?.ciclo && !Number.isNaN(filters.ciclo)) {
    query = query.eq("ciclo", filters.ciclo);
  }
  if (filters?.plan) {
    query = query.eq("plan", filters.plan);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    const term = sanitizeSearchTerm(filters.search);
    if (term) {
      query = query.or(
        `full_name.ilike.%${term}%,email.ilike.%${term}%,carnet.ilike.%${term}%,phone.ilike.%${term}%`
      );
    }
  }

  const { data: students, error } = await query;
  if (error) throw new Error(error.message);
  if (!students?.length) return [];

  const ids = students.map((s) => s.id);
  const { data: tickets, error: ticketError } = await supabase
    .from("tickets")
    .select("*")
    .in("student_id", ids);

  if (ticketError) throw new Error(ticketError.message);

  return attachTicket(students as DbStudent[], (tickets ?? []) as DbTicket[]);
}

export async function getStudentById(
  id: string
): Promise<StudentWithTicket | null> {
  const supabase = getSupabase();

  const { data: student, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!student) return null;

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("student_id", id)
    .maybeSingle();

  return mapStudent(student as DbStudent, ticket as DbTicket | null);
}

export async function createStudent(
  input: CreateStudentInput
): Promise<StudentWithTicket> {
  const supabase = getSupabase();

  const duplicate = await findDuplicate({
    email: input.email,
    carnet: input.carnet,
    phone: input.phone,
  });
  if (duplicate) {
    throw new Error(duplicateErrorMessage(duplicate));
  }

  const plan = input.plan ?? getPlanFromCarnet(input.carnet);
  if (!plan) {
    throw new Error(
      "Los primeros 4 dígitos del carnet deben ser 2790 (diario) o 2890 (fin de semana)"
    );
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert({
      full_name: input.full_name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      carnet: input.carnet,
      ciclo: input.ciclo,
      plan,
      participant_type: "estudiante",
      status: "pending",
    })
    .select("*")
    .single();

  if (studentError) {
    if (studentError.code === "23505") {
      throw new Error(mapUniqueViolation(studentError));
    }
    throw new Error(studentError.message);
  }

  let ticket: DbTicket;
  try {
    ticket = await insertTicketForStudent(student.id);
  } catch (ticketError) {
    await supabase.from("students").delete().eq("id", student.id);
    throw ticketError instanceof Error
      ? ticketError
      : new Error("Error al crear ticket");
  }

  return deliverTicketEmail(student as DbStudent, ticket);
}

export async function createDocente(
  input: CreateDocenteInput
): Promise<StudentWithTicket> {
  const supabase = getSupabase();

  const duplicate = await findDuplicate({
    email: input.email,
  });
  if (duplicate) {
    throw new Error(duplicateErrorMessage(duplicate));
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert({
      full_name: input.full_name,
      email: input.email.toLowerCase(),
      phone: null,
      carnet: null,
      ciclo: null,
      plan: null,
      participant_type: "docente",
      status: "pending",
    })
    .select("*")
    .single();

  if (studentError) {
    if (studentError.code === "23505") {
      throw new Error(mapUniqueViolation(studentError));
    }
    throw new Error(studentError.message);
  }

  let ticket: DbTicket;
  try {
    ticket = await insertTicketForStudent(student.id);
  } catch (ticketError) {
    await supabase.from("students").delete().eq("id", student.id);
    throw ticketError instanceof Error
      ? ticketError
      : new Error("Error al crear ticket");
  }

  return deliverTicketEmail(student as DbStudent, ticket);
}

export async function getStudentDocument(
  id: string
): Promise<{ pdf: Buffer; filename: string } | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("students")
    .select("full_name, document_pdf")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.document_pdf) return null;

  const base64 = data.document_pdf.split(",")[1] ?? "";
  const pdf = Buffer.from(base64, "base64");
  const slug = data.full_name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return { pdf, filename: `docente-${slug || "registro"}.pdf` };
}

export async function updateStudent(
  id: string,
  input: UpdateStudentInput
): Promise<StudentWithTicket | null> {
  const supabase = getSupabase();

  const existing = await getStudentById(id);
  if (!existing) return null;

  if (input.status === "confirmed") {
    throw new Error(
      "La confirmación de asistencia solo puede hacerse escaneando el QR"
    );
  }

  const isDocente = existing.participant_type === "docente";

  const duplicate = await findDuplicate(
    {
      email: input.email ?? existing.email,
      carnet: isDocente ? null : (input.carnet ?? existing.carnet),
      phone: isDocente ? null : (input.phone ?? existing.phone),
    },
    id
  );
  if (duplicate) {
    throw new Error(duplicateErrorMessage(duplicate));
  }

  const payload: Record<string, unknown> = { ...input };
  if (input.email) payload.email = input.email.toLowerCase();

  if (!isDocente) {
    const nextCarnet = input.carnet ?? existing.carnet;
    const derivedPlan = nextCarnet ? getPlanFromCarnet(nextCarnet) : null;
    if (input.carnet || input.plan) {
      if (!derivedPlan) {
        throw new Error(
          "Los primeros 4 dígitos del carnet deben ser 2790 (diario) o 2890 (fin de semana)"
        );
      }
      payload.plan = derivedPlan;
    }
  } else {
    delete payload.carnet;
    delete payload.ciclo;
    delete payload.plan;
  }

  const { data: student, error } = await supabase
    .from("students")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(mapUniqueViolation(error));
    }
    throw new Error(error.message);
  }

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("student_id", id)
    .maybeSingle();

  return mapStudent(student as DbStudent, ticket as DbTicket | null);
}

export async function deleteStudent(id: string): Promise<boolean> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("students")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

export async function resendTicket(id: string): Promise<Ticket | null> {
  const supabase = getSupabase();

  const studentWithTicket = await ensureParticipantTicket(id);

  await sendTicketEmail({
    student: studentWithTicket,
    ticket: studentWithTicket.ticket!,
  });

  const sentAt = new Date().toISOString();
  const { data: ticket, error } = await supabase
    .from("tickets")
    .update({
      status: "sent",
      sent_at: sentAt,
    })
    .eq("student_id", id)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (ticket as DbTicket) ?? null;
}

function calcGrowth(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function countInDateWindow(
  items: { sent_at?: string | null }[],
  start: Date,
  end: Date
): number {
  return items.filter((item) => {
    if (!item.sent_at) return false;
    const t = new Date(item.sent_at).getTime();
    return t >= start.getTime() && t < end.getTime();
  }).length;
}

function countConfirmedInWindow(
  students: { status: string; checked_in_at?: string | null }[],
  start: Date,
  end: Date
): number {
  return students.filter((s) => {
    if (s.status !== "confirmed" || !s.checked_in_at) return false;
    const t = new Date(s.checked_in_at).getTime();
    return t >= start.getTime() && t < end.getTime();
  }).length;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabase();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const results = await Promise.all([
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("participant_type", "estudiante"),
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("participant_type", "docente"),
    supabase.from("tickets").select("status, sent_at, correlative"),
    supabase
      .from("students")
      .select("ciclo, status, checked_in_at, participant_type"),
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("participant_type", "estudiante")
      .gte("registered_at", thirtyDaysAgo.toISOString()),
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("participant_type", "estudiante")
      .gte("registered_at", sixtyDaysAgo.toISOString())
      .lt("registered_at", thirtyDaysAgo.toISOString()),
  ]);

  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);

  const [
    { count: totalStudents },
    { count: totalTeachers },
    { data: tickets },
    { data: participants },
    { count: recentStudents },
    { count: prevStudents },
  ] = results;

  const allTickets = tickets ?? [];
  const allParticipants = participants ?? [];
  const cyclesWithStudents = new Set(
    allParticipants.map((s) => s.ciclo).filter(Boolean)
  );

  const ticketsGenerated = allTickets.length;
  const lastTicketCorrelative = allTickets.reduce((max, ticket) => {
    const value =
      typeof ticket.correlative === "number" ? ticket.correlative : 0;
    return Math.max(max, value);
  }, 0);
  const ticketsSent = allTickets.filter(
    (t) => t.status === "sent" || t.status === "delivered"
  ).length;
  const emailsSent = allTickets.filter((t) => t.sent_at).length;
  const confirmed = allParticipants.filter((s) => s.status === "confirmed").length;

  const recentTickets = countInDateWindow(allTickets, thirtyDaysAgo, now);
  const prevTickets = countInDateWindow(allTickets, sixtyDaysAgo, thirtyDaysAgo);
  const recentEmails = recentTickets;
  const prevEmails = prevTickets;
  const recentConfirmed = countConfirmedInWindow(
    allParticipants,
    thirtyDaysAgo,
    now
  );
  const prevConfirmed = countConfirmedInWindow(
    allParticipants,
    sixtyDaysAgo,
    thirtyDaysAgo
  );

  return {
    totalStudents: totalStudents ?? 0,
    totalTeachers: totalTeachers ?? 0,
    ticketsSent,
    ticketsGenerated,
    lastTicketCorrelative,
    cyclesRegistered: cyclesWithStudents.size,
    emailsSent,
    confirmedParticipants: confirmed,
    growth: {
      students: calcGrowth(recentStudents ?? 0, prevStudents ?? 0),
      tickets: calcGrowth(recentTickets, prevTickets),
      cycles: 0,
      emails: calcGrowth(recentEmails, prevEmails),
      confirmed: calcGrowth(recentConfirmed, prevConfirmed),
    },
  };
}

export async function getCycleStats(plan?: Plan): Promise<CycleStats[]> {
  const supabase = getSupabase();

  let query = supabase
    .from("students")
    .select("id, ciclo, plan, status")
    .eq("participant_type", "estudiante");
  if (plan) query = query.eq("plan", plan);

  const { data: students, error } = await query;

  if (error) throw new Error(error.message);

  const { data: tickets, error: ticketError } = await supabase
    .from("tickets")
    .select("student_id, status");

  if (ticketError) throw new Error(ticketError.message);

  const ticketMap = new Map(
    (tickets ?? []).map((t) => [t.student_id, t.status])
  );

  const plans = plan ? [plan] : [...PLANS];

  return plans.flatMap((planValue) =>
    CICLOS.map((ciclo) => {
      const cycleStudents = (students ?? []).filter(
        (s) => s.ciclo === ciclo && s.plan === planValue
      );
      const ticketsSent = cycleStudents.filter((s) => {
        const status = ticketMap.get(s.id);
        return status === "sent" || status === "delivered";
      }).length;

      return {
        plan: planValue,
        ciclo,
        studentCount: cycleStudents.length,
        ticketsSent,
        attendees: cycleStudents.filter((s) => s.status === "confirmed").length,
      };
    })
  );
}

export async function getPlanStats(): Promise<PlanStats[]> {
  const cycleStats = await getCycleStats();

  return PLANS.map((plan) => {
    const planCycles = cycleStats.filter((c) => c.plan === plan);
    return {
      plan,
      studentCount: planCycles.reduce((sum, c) => sum + c.studentCount, 0),
      ticketsSent: planCycles.reduce((sum, c) => sum + c.ticketsSent, 0),
      attendees: planCycles.reduce((sum, c) => sum + c.attendees, 0),
    };
  });
}

export async function getDocenteStats(): Promise<DocenteStats> {
  const docentes = await getAllStudents({ participant_type: "docente" });
  const ticketsSent = docentes.filter((d) => {
    const status = d.ticket?.status;
    return status === "sent" || status === "delivered";
  }).length;
  const attendees = docentes.filter((d) => d.status === "confirmed").length;

  return {
    teacherCount: docentes.length,
    ticketsSent,
    attendees,
  };
}

export async function getStudentsByCycle(
  ciclo: number,
  plan?: Plan
): Promise<StudentWithTicket[]> {
  return getAllStudents({ ciclo, plan });
}

function normalizeTicketNumber(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/TKT-[A-Z0-9]+/i);
  return match ? match[0].toUpperCase() : trimmed.toUpperCase();
}

function parseCorrelativeLookup(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d{1,6}$/.test(trimmed)) return null;
  const value = Number.parseInt(trimmed, 10);
  return value > 0 ? value : null;
}

async function findTicketByLookup(raw: string): Promise<DbTicket | null> {
  const supabase = getSupabase();
  const correlative = parseCorrelativeLookup(raw);

  if (correlative !== null) {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("correlative", correlative)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return data as DbTicket;
  }

  const ticketNumber = normalizeTicketNumber(raw);
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("ticket_number", ticketNumber)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as DbTicket | null) ?? null;
}

export async function confirmByTicketNumber(
  rawTicketNumber: string
): Promise<ScanResult> {
  const supabase = getSupabase();
  const ticket = await findTicketByLookup(rawTicketNumber);
  if (!ticket) {
    throw new Error("Ticket no válido o no encontrado");
  }

  const studentWithTicket = await getStudentById(ticket.student_id);
  if (!studentWithTicket) {
    throw new Error("Participante no encontrado");
  }

  if (studentWithTicket.status === "cancelled") {
    throw new Error("Este registro está cancelado");
  }

  const alreadyConfirmed = studentWithTicket.status === "confirmed";
  const now = new Date().toISOString();

  if (!alreadyConfirmed) {
    const { error: updateError } = await supabase
      .from("students")
      .update({ status: "confirmed", checked_in_at: now })
      .eq("id", studentWithTicket.id);

    if (updateError) {
      if (updateError.message.includes("checked_in_at")) {
        await supabase
          .from("students")
          .update({ status: "confirmed" })
          .eq("id", studentWithTicket.id);
      } else {
        throw new Error(updateError.message);
      }
    }

    await supabase
      .from("tickets")
      .update({ status: "delivered" })
      .eq("id", ticket.id);
  }

  const updated = await getStudentById(studentWithTicket.id);
  const { count } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("status", "confirmed");

  return {
    student: updated!,
    alreadyConfirmed,
    totalConfirmed: count ?? 0,
  };
}

export async function getAttendance(): Promise<AttendanceResponse> {
  const supabase = getSupabase();

  const [{ count: totalConfirmed }, { count: totalRegistered }, confirmedParticipants] =
    await Promise.all([
      supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("status", "confirmed"),
      supabase.from("students").select("*", { count: "exact", head: true }),
      getAllStudents({ status: "confirmed" }),
    ]);

  const sorted = confirmedParticipants.sort((a, b) => {
    const aTime = a.checked_in_at ?? a.updated_at;
    const bTime = b.checked_in_at ?? b.updated_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return {
    totalConfirmed: totalConfirmed ?? 0,
    totalRegistered: totalRegistered ?? 0,
    students: sorted,
  };
}
