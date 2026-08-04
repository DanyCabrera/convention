export const CICLOS = [2, 4, 6, 8, 10] as const;
export type Ciclo = (typeof CICLOS)[number];

export type StudentStatus = "pending" | "confirmed" | "cancelled";
export type TicketStatus = "generated" | "sent" | "delivered" | "failed";

export interface Student {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  carnet: string;
  ciclo: Ciclo;
  status: StudentStatus;
  registered_at: string;
  updated_at: string;
  checked_in_at?: string | null;
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

export interface Ticket {
  id: string;
  student_id: string;
  ticket_number: string;
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
  ticketsSent: number;
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
  ciclo: Ciclo;
  studentCount: number;
  ticketsSent: number;
  attendees: number;
}

export interface CreateStudentInput {
  full_name: string;
  email: string;
  phone: string;
  carnet: string;
  ciclo: Ciclo;
}

export interface UpdateStudentInput {
  full_name?: string;
  email?: string;
  phone?: string;
  carnet?: string;
  ciclo?: Ciclo;
  status?: StudentStatus;
}
