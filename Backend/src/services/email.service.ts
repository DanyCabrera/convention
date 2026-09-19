import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { Student, Ticket } from "../types/student.types.js";
import { composeTicketImage } from "./ticket-image.service.js";
import { getEventConfig } from "../lib/event-config.js";

export interface TicketEmailPayload {
  student: Student;
  ticket: Ticket;
}

const TICKET_CID = "ticket-image";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getEmailEventConfig() {
  return getEventConfig();
}

export function isEmailConfigured(): boolean {
  if (process.env.RESEND_API_KEY) return true;
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.EMAIL_FROM
  );
}

export function getEmailConfigStatus(): {
  configured: boolean;
  provider: "resend" | "smtp" | null;
} {
  if (process.env.RESEND_API_KEY) {
    return { configured: true, provider: "resend" };
  }
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.EMAIL_FROM
  ) {
    return { configured: true, provider: "smtp" };
  }
  return { configured: false, provider: null };
}

function buildTicketEmailHtml(
  name: string,
  eventName: string,
  participantType: "estudiante" | "docente" = "estudiante"
): string {
  const safeName = escapeHtml(name);
  const safeEvent = escapeHtml(eventName);
  const intro =
    participantType === "docente"
      ? "Tu registro como <strong style=\"color:#2563EB;\">docente</strong> fue exitoso. Presenta este ticket con el código QR en la entrada del evento."
      : "Tu registro fue exitoso. Presenta este ticket con el código QR en la entrada del evento.";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ticket — ${safeEvent}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;">
          <tr>
            <td style="padding:0 0 20px;text-align:center;">
              <p style="margin:0 0 8px;color:#475569;font-size:15px;">
                Hola <strong style="color:#0f172a;">${safeName}</strong>,
              </p>
              <p style="margin:0;color:#64748b;font-size:14px;line-height:1.6;">
                ${intro}
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0;">
              <img
                src="cid:${TICKET_CID}"
                alt="Ticket ${safeEvent}"
                width="600"
                style="display:block;max-width:100%;height:auto;border-radius:12px;"
              />
            </td>
          </tr>
          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                Este correo fue generado automáticamente. No respondas a este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
  ticketImage: Buffer
): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const from =
    process.env.EMAIL_FROM || "UMG 2026 <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    attachments: [
      {
        filename: "ticket.jpeg",
        content: ticketImage,
        contentType: "image/jpeg",
        contentId: TICKET_CID,
      },
    ],
  });
  if (error) {
    throw new Error(error.message);
  }
}

async function sendViaSmtp(
  to: string,
  subject: string,
  html: string,
  ticketImage: Buffer
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
    attachments: [
      {
        filename: "ticket.jpeg",
        content: ticketImage,
        contentType: "image/jpeg",
        cid: TICKET_CID,
      },
    ],
  });
}

export async function sendTicketEmail(
  payload: TicketEmailPayload
): Promise<void> {
  const to = payload.student.email;
  if (!to) {
    throw new Error("Este registro no tiene correo para enviar el ticket");
  }

  if (!isEmailConfigured()) {
    throw new Error(
      "No se pudo enviar el correo. Contacta al administrador del sistema."
    );
  }

  const event = getEmailEventConfig();
  const participantType = payload.student.participant_type ?? "estudiante";
  const subject =
    participantType === "docente"
      ? `Tu ticket de docente — ${event.name}`
      : `Tu ticket — ${event.name}`;
  const ticketImage = await composeTicketImage(payload.ticket.qr_code, {
    correlative: payload.ticket.correlative,
    participantType,
    holderName: payload.student.full_name,
  });
  const html = buildTicketEmailHtml(
    payload.student.full_name,
    event.name,
    participantType
  );

  const { provider } = getEmailConfigStatus();

  if (provider === "resend") {
    await sendViaResend(to, subject, html, ticketImage);
  } else {
    await sendViaSmtp(to, subject, html, ticketImage);
  }
}
