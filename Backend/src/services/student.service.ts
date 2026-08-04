import { randomUUID } from "crypto";
import QRCode from "qrcode";
import { getSupabase } from "../lib/supabase.js";
import { sendTicketEmail } from "./email.service.js";
import type {
  CreateStudentInput,
  DashboardStats,
  CycleStats,
  Student,
  StudentWithTicket,
  Ticket,
  UpdateStudentInput,
  ScanResult,
  AttendanceResponse,
} from "../types/student.types.js";
import { CICLOS } from "../types/student.types.js";

type DbStudent = Student;
type DbTicket = Ticket;

function mapStudent(row: DbStudent, ticket?: DbTicket | null): StudentWithTicket {
  return {
    ...row,
    ticket: ticket ?? undefined,
  };
}

async function generateTicketNumber(): Promise<string> {
  return `TKT-${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

function sanitizeSearchTerm(term: string): string {
  return term.trim().replace(/[%_,().*\\]/g, "");
}

async function generateQRCode(data: string): Promise<string> {
  return QRCode.toDataURL(data, { width: 300, margin: 2 });
}

type DuplicateField = "email" | "carnet";

const DUPLICATE_MESSAGES: Record<DuplicateField, string> = {
  email: "Este correo electrónico ya está registrado",
  carnet: "Este número de carnet ya está registrado",
};

async function findDuplicate(
  fields: { email: string; carnet: string },
  excludeId?: string
): Promise<DuplicateField | null> {
  const supabase = getSupabase();

  let emailQuery = supabase
    .from("students")
    .select("id")
    .eq("email", fields.email.toLowerCase())
    .limit(1);
  let carnetQuery = supabase
    .from("students")
    .select("id")
    .eq("carnet", fields.carnet)
    .limit(1);

  if (excludeId) {
    emailQuery = emailQuery.neq("id", excludeId);
    carnetQuery = carnetQuery.neq("id", excludeId);
  }

  const [{ data: byEmail }, { data: byCarnet }] = await Promise.all([
    emailQuery.maybeSingle(),
    carnetQuery.maybeSingle(),
  ]);

  if (byEmail) return "email";
  if (byCarnet) return "carnet";
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
  status?: string;
  search?: string;
}): Promise<StudentWithTicket[]> {
  const supabase = getSupabase();

  let query = supabase
    .from("students")
    .select("*")
    .order("registered_at", { ascending: false });

  if (filters?.ciclo && !Number.isNaN(filters.ciclo)) {
    query = query.eq("ciclo", filters.ciclo);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    const term = sanitizeSearchTerm(filters.search);
    if (term) {
      query = query.or(
        `full_name.ilike.%${term}%,email.ilike.%${term}%,carnet.ilike.%${term}%`
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
  });
  if (duplicate) {
    throw new Error(duplicateErrorMessage(duplicate));
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .insert({
      full_name: input.full_name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      carnet: input.carnet,
      ciclo: input.ciclo,
      status: "pending",
    })
    .select("*")
    .single();

  if (studentError) {
    if (studentError.code === "23505") {
      throw new Error(
        "Ya existe un registro con el mismo correo o carnet"
      );
    }
    throw new Error(studentError.message);
  }

  const ticketNumber = await generateTicketNumber();
  const qrCode = await generateQRCode(ticketNumber);

  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert({
      student_id: student.id,
      ticket_number: ticketNumber,
      qr_code: qrCode,
      status: "generated",
    })
    .select("*")
    .single();

  if (ticketError) {
    await supabase.from("students").delete().eq("id", student.id);
    throw new Error(ticketError.message);
  }

  const mappedStudent = student as DbStudent;
  const mappedTicket = ticket as DbTicket;

  try {
    await sendTicketEmail({ student: mappedStudent, ticket: mappedTicket });

    const sentAt = new Date().toISOString();
    const { data: updatedTicket } = await supabase
      .from("tickets")
      .update({ status: "sent", sent_at: sentAt })
      .eq("id", mappedTicket.id)
      .select("*")
      .single();

    return mapStudent(
      mappedStudent,
      (updatedTicket as DbTicket) ?? { ...mappedTicket, status: "sent", sent_at: sentAt }
    );
  } catch {
    await supabase
      .from("tickets")
      .update({ status: "failed" })
      .eq("id", mappedTicket.id);

    return mapStudent(mappedStudent, {
      ...mappedTicket,
      status: "failed",
      sent_at: null,
    });
  }
}

export async function updateStudent(
  id: string,
  input: UpdateStudentInput
): Promise<StudentWithTicket | null> {
  const supabase = getSupabase();

  const existing = await getStudentById(id);
  if (!existing) return null;

  const duplicate = await findDuplicate(
    {
      email: input.email ?? existing.email,
      carnet: input.carnet ?? existing.carnet,
    },
    id
  );
  if (duplicate) {
    throw new Error(duplicateErrorMessage(duplicate));
  }

  const payload: Record<string, unknown> = { ...input };
  if (input.email) payload.email = input.email.toLowerCase();

  const { data: student, error } = await supabase
    .from("students")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        "Ya existe un registro con el mismo correo o carnet"
      );
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

  const studentWithTicket = await getStudentById(id);
  if (!studentWithTicket?.ticket) return null;

  await sendTicketEmail({
    student: studentWithTicket,
    ticket: studentWithTicket.ticket,
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
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = getSupabase();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    { count: totalStudents },
    { data: tickets },
    { data: students },
    { count: recentStudents },
    { count: prevStudents },
  ] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("tickets").select("status, sent_at"),
    supabase.from("students").select("ciclo, status"),
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .gte("registered_at", thirtyDaysAgo.toISOString()),
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .gte("registered_at", sixtyDaysAgo.toISOString())
      .lt("registered_at", thirtyDaysAgo.toISOString()),
  ]);

  const allTickets = tickets ?? [];
  const allStudents = students ?? [];
  const cyclesWithStudents = new Set(allStudents.map((s) => s.ciclo));

  const ticketsSent = allTickets.filter(
    (t) => t.status === "sent" || t.status === "delivered"
  ).length;
  const emailsSent = allTickets.filter((t) => t.sent_at).length;
  const confirmed = allStudents.filter((s) => s.status === "confirmed").length;

  return {
    totalStudents: totalStudents ?? 0,
    ticketsSent,
    cyclesRegistered: cyclesWithStudents.size,
    emailsSent,
    confirmedParticipants: confirmed,
    growth: {
      students: calcGrowth(recentStudents ?? 0, prevStudents ?? 0),
      tickets: 0,
      cycles: 0,
      emails: 0,
      confirmed: 0,
    },
  };
}

export async function getCycleStats(): Promise<CycleStats[]> {
  const supabase = getSupabase();

  const { data: students, error } = await supabase
    .from("students")
    .select("id, ciclo, status");

  if (error) throw new Error(error.message);

  const { data: tickets, error: ticketError } = await supabase
    .from("tickets")
    .select("student_id, status");

  if (ticketError) throw new Error(ticketError.message);

  const ticketMap = new Map(
    (tickets ?? []).map((t) => [t.student_id, t.status])
  );

  return CICLOS.map((ciclo) => {
    const cycleStudents = (students ?? []).filter((s) => s.ciclo === ciclo);
    const ticketsSent = cycleStudents.filter((s) => {
      const status = ticketMap.get(s.id);
      return status === "sent" || status === "delivered";
    }).length;

    return {
      ciclo,
      studentCount: cycleStudents.length,
      ticketsSent,
      attendees: cycleStudents.filter((s) => s.status === "confirmed").length,
    };
  });
}

export async function getStudentsByCycle(
  ciclo: number
): Promise<StudentWithTicket[]> {
  return getAllStudents({ ciclo });
}

function normalizeTicketNumber(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/TKT-[A-Z0-9]+/i);
  return match ? match[0].toUpperCase() : trimmed.toUpperCase();
}

export async function confirmByTicketNumber(
  rawTicketNumber: string
): Promise<ScanResult> {
  const supabase = getSupabase();
  const ticketNumber = normalizeTicketNumber(rawTicketNumber);

  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("*")
    .eq("ticket_number", ticketNumber)
    .maybeSingle();

  if (ticketError) throw new Error(ticketError.message);
  if (!ticket) {
    throw new Error("Ticket no válido o no encontrado");
  }

  const studentWithTicket = await getStudentById(ticket.student_id);
  if (!studentWithTicket) {
    throw new Error("Estudiante no encontrado");
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

  const [{ count: totalConfirmed }, { count: totalRegistered }, confirmedStudents] =
    await Promise.all([
      supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("status", "confirmed"),
      supabase.from("students").select("*", { count: "exact", head: true }),
      getAllStudents({ status: "confirmed" }),
    ]);

  const sorted = confirmedStudents.sort((a, b) => {
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
