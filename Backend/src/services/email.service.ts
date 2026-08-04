import { Resend } from "resend";
import nodemailer from "nodemailer";
import { formatCarnet } from "../lib/carnet.js";
import type { Student, Ticket } from "../types/student.types.js";

export interface TicketEmailPayload {
  student: Student;
  ticket: Ticket;
}

const QR_CID = "qr-ticket";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getCicloLabel(ciclo: number): string {
  const labels: Record<number, string> = {
    2: "Primer Ciclo",
    4: "Segundo Ciclo",
    6: "Tercer Ciclo",
    8: "Cuarto Ciclo",
    10: "Quinto Ciclo",
  };
  return labels[ciclo] ?? `Ciclo ${ciclo}`;
}

function parseDataUrl(dataUrl: string): { content: Buffer; contentType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("QR inválido: se esperaba un data URL en base64");
  }

  return {
    contentType: match[1],
    content: Buffer.from(match[2], "base64"),
  };
}

function getEventConfig() {
  return {
    name: process.env.EVENT_NAME || "UMG 2026",
    date: process.env.EVENT_DATE || "2026-08-15",
    location:
      process.env.EVENT_LOCATION ||
      "Auditorio Central, Campus Universitario",
    university: process.env.EVENT_UNIVERSITY || "Universidad Nacional",
  };
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

function buildTicketEmailHtml({ student, ticket }: TicketEmailPayload): string {
  const event = getEventConfig();
  const name = escapeHtml(student.full_name);
  const carnet = escapeHtml(formatCarnet(student.carnet));
  const ticketNumber = escapeHtml(ticket.ticket_number);
  const cicloLabel = escapeHtml(getCicloLabel(student.ciclo));
  const eventName = escapeHtml(event.name);
  const university = escapeHtml(event.university);
  const eventDate = escapeHtml(event.date);
  const location = escapeHtml(event.location);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ticket — ${event.name}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:28px 32px;color:#ffffff;">
              <p style="margin:0 0 4px;font-size:12px;opacity:0.85;text-transform:uppercase;letter-spacing:1px;">${university}</p>
              <h1 style="margin:0;font-size:22px;font-weight:700;">${eventName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Hola <strong style="color:#0f172a;">${name}</strong>,</p>
              <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
                Tu registro fue exitoso. Presenta este ticket con el código QR en la entrada del evento.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:12px;padding:16px;margin-bottom:24px;">
                <tr>
                  <td style="padding:8px 16px;">
                    <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;">Número de ticket</p>
                    <p style="margin:0;font-size:18px;font-weight:700;color:#2563eb;font-family:monospace;">${ticketNumber}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 16px;">
                    <p style="margin:0;font-size:13px;color:#475569;"><strong>Carnet:</strong> ${carnet}</p>
                    <p style="margin:4px 0 0;font-size:13px;color:#475569;"><strong>Ciclo:</strong> ${cicloLabel}</p>
                    <p style="margin:4px 0 0;font-size:13px;color:#475569;"><strong>Fecha:</strong> ${eventDate}</p>
                    <p style="margin:4px 0 0;font-size:13px;color:#475569;"><strong>Lugar:</strong> ${location}</p>
                  </td>
                </tr>
              </table>

              <div style="text-align:center;margin-bottom:24px;">
                <img src="cid:${QR_CID}" alt="Código QR del ticket" width="200" height="200" style="border-radius:12px;border:1px solid #e2e8f0;" />
                <p style="margin:12px 0 0;font-size:12px;color:#64748b;">Presenta este código QR en la entrada</p>
              </div>

              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
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
  qrDataUrl: string
): Promise<void> {
  const { content, contentType } = parseDataUrl(qrDataUrl);
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
        filename: "qrcode.png",
        content,
        contentType,
        contentId: QR_CID,
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
  qrDataUrl: string
): Promise<void> {
  const { content, contentType } = parseDataUrl(qrDataUrl);
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
        filename: "qrcode.png",
        content,
        contentType,
        cid: QR_CID,
      },
    ],
  });
}

export async function sendTicketEmail(
  payload: TicketEmailPayload
): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error(
      "Servicio de correo no configurado. Agrega RESEND_API_KEY o credenciales SMTP en Backend/.env"
    );
  }

  const event = getEventConfig();
  const subject = `Tu ticket — ${event.name}`;
  const html = buildTicketEmailHtml(payload);

  const { provider } = getEmailConfigStatus();

  if (provider === "resend") {
    await sendViaResend(
      payload.student.email,
      subject,
      html,
      payload.ticket.qr_code
    );
  } else {
    await sendViaSmtp(
      payload.student.email,
      subject,
      html,
      payload.ticket.qr_code
    );
  }
}
