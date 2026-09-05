import { CICLOS, type Ciclo } from "@/lib/constants";
import type { Plan } from "@/lib/plans";

export type StudentStatus = "pending" | "confirmed" | "cancelled";
export type TicketStatus = "generated" | "sent" | "delivered" | "failed";
export type ParticipantType = "estudiante" | "docente";

export interface Student {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  carnet: string | null;
  ciclo: Ciclo | null;
  plan: Plan | null;
  participant_type: ParticipantType;
  has_document?: boolean;
  status: StudentStatus;
  registered_at: string;
  updated_at: string;
  checked_in_at?: string | null;
}

export interface Ticket {
  id: string;
  student_id: string;
  ticket_number: string;
  correlative: number;
  qr_code: string;
  status: TicketStatus;
  sent_at: string | null;
  created_at: string;
}

export interface StudentWithTicket extends Student {
  ticket?: Ticket;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  ticketsSent: number;
  ticketsGenerated: number;
  lastTicketCorrelative: number;
  cyclesRegistered: number;
  emailsSent: number;
  confirmedParticipants: number;
  growth: {
    students: number;
    tickets: number;
    cycles: number;
    emails: number;
    confirmed: number;
  };
}

export interface CycleStats {
  plan: Plan;
  ciclo: Ciclo;
  studentCount: number;
  ticketsSent: number;
  attendees: number;
}

export interface PlanStats {
  plan: Plan;
  studentCount: number;
  ticketsSent: number;
  attendees: number;
}

export interface DocenteStats {
  teacherCount: number;
  ticketsSent: number;
  attendees: number;
}

export interface CreateStudentInput {
  full_name: string;
  email: string;
  phone: string;
  carnet: string;
  ciclo: Ciclo;
  plan?: Plan;
}

export interface CreateDocenteInput {
  participant_type: "docente";
  full_name: string;
  email: string;
}

export interface ScanResult {
  student: StudentWithTicket;
  alreadyConfirmed: boolean;
  totalConfirmed: number;
}

export interface AttendanceResponse {
  totalConfirmed: number;
  totalRegistered: number;
  students: StudentWithTicket[];
}

export interface EventInfo {
  name: string;
  date: string;
  location: string;
  university?: string;
}

export { CICLOS, type Ciclo, type Plan };
