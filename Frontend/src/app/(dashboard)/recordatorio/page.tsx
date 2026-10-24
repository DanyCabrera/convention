"use client";

import { BulkStudentEmail } from "@/components/email/bulk-student-email";
import { api } from "@/lib/api";

export default function RecordatorioPage() {
  return <BulkStudentEmail title="Recordatorio" sendEmail={api.sendReminder} />;
}
