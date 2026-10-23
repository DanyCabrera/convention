import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { Student, Ticket } from "../types/student.types.js";
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
    "XIV Convención de “Más allá del código: construyendo una carrera en tecnología” de la Facultad de Ingeniería en Sistemas - Centro Universitario de Retalhuleu",
  location: "Hotel Astor, Salón Villa Colonial",
  startTime: "08:00 AM",
};

const LANDING_PAGE_URL = "https://convencion-zeta.vercel.app/";
const GUIDE_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../assets/guia-de-concursos.pdf"
);
const OFFICIAL_PAGE_URL = "https://www.facebook.com/share/1LV8f9mVjm/";

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    url: "https://www.instagram.com/decimosistemas.umg?stkn=ZWRrNWs5amZjYjd1",
  },
  {
    label: "TikTok",
    url: "https://www.tiktok.com/@estudiantessistemasreu1?_r=1&amp;_t=ZS-9A9nnBu25HI",
  },
  {
    label: "Facebook",
    url: "https://www.facebook.com/share/1E3Z7c8zT1/",
  },
] as const;

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
                ¡Gracias ${safeName}, tu registro ha sido exitoso!
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
              <p style="margin:0 0 20px;color:#2563EB;font-size:16px;font-weight:bold;">
                ¡Nos vemos en la convención!
              </p>
              <p style="${text}">
                Conoce a los ponentes, el lugar y cómo llegar en la página del evento.
              </p>
              <a href="${LANDING_PAGE_URL}" target="_blank" rel="noopener" style="display:inline-block;padding:11px 24px;background:#0f172a;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;border-radius:999px;">Visitar página del evento</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 28px 28px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 14px;color:#0f172a;font-size:15px;font-weight:bold;">
                Síguenos en nuestra página oficial
              </p>
              <a href="${OFFICIAL_PAGE_URL}" target="_blank" rel="noopener" style="display:inline-block;padding:11px 24px;background:#2563EB;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;border-radius:999px;">Visitar página oficial</a>
              <p style="margin: 20px 0 4px;color:#94a3b8;font-size:11px;letter-spacing:0.04em;">
                Redes sociales de la CONVENCIÓN.
              </p>
              <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
                ${SOCIAL_LINKS.map(
    (link) =>
      `<a href="${link.url}" target="_blank" rel="noopener" style="color:#2563EB;text-decoration:underline;">${link.label}</a>`
  ).join(`<span style="color:#cbd5e1;"> &nbsp;·&nbsp; </span>`)}
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

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const from =
    process.env.EMAIL_FROM || "UMG REU 2026 <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  });
  if (error) {
    throw new Error(error.message);
  }
}

async function sendViaSmtp(
  to: string,
  subject: string,
  html: string,
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
  const html = buildTicketEmailHtml(payload.student.full_name, event.date);

  await sendViaResend(to, subject, html);
}

function replyToAddress(): string {
  const from = process.env.EMAIL_FROM ?? "";
  const match = from.match(/<([^>]+)>/);
  return match?.[1] ?? "convecionretalhuleu2026@appconvention.com";
}

function buildReminderEmailHtml(name: string): string {
  const safeName = escapeHtml(name);
  const contact = escapeHtml(replyToAddress());
  const text = "margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;";
  const heading = "margin:0 0 8px;color:#0f172a;font-size:16px;font-weight:bold;";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recordatorio — UMG REU 2026</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;">
          <tr>
            <td style="padding:32px 28px;">
              <p style="margin:0 0 6px;color:#64748b;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;">UMG REU 2026</p>
              <h1 style="margin:0 0 20px;color:#0f172a;font-size:22px;line-height:1.3;">
                Lineamientos de la convención
              </h1>
              <p style="${text}">Estimada/o ${safeName},</p>
              <p style="${text}">
                Les compartimos los lineamientos de la <strong>XIV Convención de Ciencia y Tecnología</strong>
                — “Más allá del código: construyendo una carrera en tecnología”, que se realizará el
                <strong>sábado 24 de octubre de 2026</strong> en el <strong>Hotel Astor, Salón Villa Colonial</strong>,
                5ta. Calle 4-60 Zona 1, Retalhuleu.
              </p>
              <p style="${heading}">Registro y puntualidad</p>
              <p style="${text}">
                El programa inicia a las <strong>08:00 a. m.</strong> Agradecemos su puntualidad para garantizar el orden y el
                aprovechamiento de las actividades. Llegar con 15 a 20 minutos de anticipación para completar el registro.
              </p>
              <p style="${heading}">Uso de teléfonos</p>
              <p style="${text}">
                Para asegurar la atención y el desarrollo adecuado del programa, no se permitirá el uso de
                teléfonos celulares durante las sesiones. Podrán utilizarlos únicamente cuando el programa
                lo indique (por ejemplo, dinámicas, votaciones o concursos).
              </p>
              <p style="${heading}">Recomendaciones</p>
              <ul style="margin:0 0 20px;padding-left:20px;color:#334155;font-size:15px;line-height:1.6;">
                <li>Llevar el ticket digital que recibieron en su correo, impreso o en el celular.</li>
                <li>Más información en la página del evento: <a href="${LANDING_PAGE_URL}" target="_blank" rel="noopener" style="color:#2563EB;">convencion-zeta.vercel.app</a></li>
                <li>Respetar los tiempos de cada bloque y las indicaciones del equipo organizador.</li>
                <li>Mantener en silencio los dispositivos hasta que se indique su uso.</li>
              </ul>
              <p style="${text}">
                Agradecemos su colaboración para que la convención sea ágil, ordenada y provechosa para todos.
              </p>
              <p style="margin:0 0 4px;color:#334155;font-size:15px;line-height:1.6;">Quedamos atentos a cualquier consulta.</p>
              <p style="margin:16px 0 0;color:#0f172a;font-size:15px;line-height:1.5;">
                <strong>Comité Organizador — XIV Convención de Ciencia y Tecnología</strong><br />
                Ingeniería en Sistemas, Centro Universitario de Retalhuleu<br />
                <a href="mailto:${contact}" style="color:#2563EB;">${contact}</a>
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

export async function sendReminderEmail(student: Student): Promise<void> {
  const to = student.email;
  if (
    !to ||
    to.toLowerCase().endsWith("@sin-correo.local") ||
    student.participant_type === "docente"
  ) {
    throw new Error("Este registro no tiene correo para enviar el recordatorio");
  }

  if (!isEmailConfigured()) {
    throw new Error(
      "No se pudo enviar el correo. Contacta al administrador del sistema."
    );
  }

  const event = getEmailEventConfig();

  const subject = `Recordatorio y lineamientos — ${event.name}`;
  const html = buildReminderEmailHtml(student.full_name);
  await sendViaResend(to, subject, html);
}
