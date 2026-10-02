import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { Student, Ticket } from "../types/student.types.js";
import { composeTicketImage } from "./ticket-image.service.js";
import { composeTicketPdf } from "./ticket-pdf.service.js";
import { getEventConfig } from "../lib/event-config.js";

export interface TicketEmailPayload {
  student: Student;
  ticket: Ticket;
}

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

const EMAIL_EVENT_COPY = {
  title:
    "XIV Convención de <Nombre de la Convención> de la Facultad de Ingeniería en Sistemas - Centro Universitario de Retalhuleu",
  location: "Salón municipal San Felipe",
  startTime: "08:00 AM",
};

function formatEventDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("es-GT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function buildTicketEmailHtml(name: string, eventDate: string): string {
  const safeName = escapeHtml(name);
  const safeTitle = escapeHtml(EMAIL_EVENT_COPY.title);
  const safeDate = escapeHtml(formatEventDate(eventDate));
  const safeLocation = escapeHtml(EMAIL_EVENT_COPY.location);
  const safeTime = escapeHtml(EMAIL_EVENT_COPY.startTime);
  const text = "margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;";
  const detail = "margin:0 0 6px;color:#334155;font-size:15px;line-height:1.5;";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tu ticket</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;">
          <tr>
            <td style="padding:32px 28px;">
              <h1 style="margin:0 0 20px;color:#0f172a;font-size:22px;line-height:1.3;">
                ¡Gracias por tu compra ${safeName}!
              </h1>
              <p style="${text}">
                Tu acceso para la <strong>${safeTitle}</strong>, ya está confirmado.
              </p>
              <div style="margin:0 0 20px;padding:16px 18px;background:#eff6ff;border-radius:12px;">
                <p style="${detail}"><strong>Fecha:</strong> ${safeDate}</p>
                <p style="${detail}"><strong>Lugar:</strong> ${safeLocation}</p>
                <p style="margin:0;color:#334155;font-size:15px;line-height:1.5;"><strong>Hora de inicio:</strong> ${safeTime}</p>
              </div>
              <p style="${text}">
                Adjunto encontrarás tu ticket digital. Preséntalo el día del evento
                (impreso o desde tu celular) para el acceso.
              </p>
              <p style="margin:0 0 6px;color:#0f172a;font-size:15px;font-weight:bold;">Importante:</p>
              <ul style="margin:0 0 20px;padding-left:20px;color:#334155;font-size:15px;line-height:1.6;">
                <li>Guarda este correo y el ticket digital.</li>
                <li>No compartas el código QR o número de ticket con otras personas.</li>
              </ul>
              <p style="margin:0 0 4px;color:#334155;font-size:15px;line-height:1.6;">
                Prepárate para un día lleno de innovación, tecnología y networking.
              </p>
              <p style="margin:0;color:#2563EB;font-size:16px;font-weight:bold;">
                ¡Nos vemos en la convención!
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">
          Este correo fue generado automáticamente. No respondas a este mensaje.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

interface TicketAttachment {
  filename: string;
  content: Buffer;
}

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
  attachment: TicketAttachment
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
        filename: attachment.filename,
        content: attachment.content,
        contentType: "application/pdf",
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
  attachment: TicketAttachment
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
        filename: attachment.filename,
        content: attachment.content,
        contentType: "application/pdf",
      },
    ],
  });
}

export async function sendTicketEmail(
  payload: TicketEmailPayload
): Promise<void> {
  const to = payload.student.email;
  if (
    !to ||
    to.toLowerCase().endsWith("@sin-correo.local") ||
    payload.student.participant_type === "docente"
  ) {
    throw new Error("Este registro no tiene correo para enviar el ticket");
  }

  if (!isEmailConfigured()) {
    throw new Error(
      "No se pudo enviar el correo. Contacta al administrador del sistema."
    );
  }

  const event = getEmailEventConfig();
  const participantType = payload.student.participant_type ?? "estudiante";
  const subject = `Tu ticket — ${event.name}`;
  const ticketImage = await composeTicketImage(payload.ticket.qr_code, {
    correlative: payload.ticket.correlative,
    participantType,
    holderName: payload.student.full_name,
  });
  const attachment: TicketAttachment = {
    filename: `ticket-${payload.ticket.correlative}.pdf`,
    content: await composeTicketPdf(
      ticketImage,
      `Ticket #${payload.ticket.correlative} — ${event.name}`
    ),
  };
  const html = buildTicketEmailHtml(payload.student.full_name, event.date);

  const { provider } = getEmailConfigStatus();

  if (provider === "resend") {
    await sendViaResend(to, subject, html, attachment);
  } else {
    await sendViaSmtp(to, subject, html, attachment);
  }
}
