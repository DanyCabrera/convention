import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { Student, Ticket } from "../types/student.types.js";
import { getEventConfig } from "../lib/event-config.js";
import { composeTicketImage } from "./ticket-image.service.js";
import { composeTicketPdf } from "./ticket-pdf.service.js";

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

interface EmailAttachment {
  filename: string;
  content: Buffer;
}

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
  attachments: EmailAttachment[] = [],
  text?: string,
): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const from =
    process.env.EMAIL_FROM || "UMG REU 2026 <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text,
    attachments: attachments.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content.toString("base64"),
    })),
  });
  if (error) {
    throw new Error(error.message);
  }
}

async function sendViaSmtp(
  to: string,
  subject: string,
  html: string,
  attachments: EmailAttachment[] = [],
  text?: string,
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
    text,
    attachments,
  });
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments: EmailAttachment[] = [],
  text?: string,
): Promise<void> {
  if (process.env.RESEND_API_KEY) {
    await sendViaResend(to, subject, html, attachments, text);
  } else {
    await sendViaSmtp(to, subject, html, attachments, text);
  }
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
  const image = await composeTicketImage(payload.ticket.qr_code, {
    correlative: payload.ticket.correlative,
    participantType,
    holderName: payload.student.full_name,
  });
  const pdf = await composeTicketPdf(image, `Ticket ${payload.ticket.ticket_number}`);
  const filename = `ticket-${payload.ticket.ticket_number.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;

  await sendEmail(to, subject, html, [{ filename, content: pdf }]);
}

const REMINDER_SUBJECT = "Información importante  XIV Convención Tecnológica";

const REMINDER_BODY = `Estimados alumnos:

Reciban un cordial saludo.

Estamos cada vez más cerca de nuestra Convención Tecnológica, un espacio diseñado para compartir conocimientos, explorar nuevas tendencias y fortalecer nuestra experiencia a través de la innovación y la tecnología.

Con el propósito de garantizar una experiencia organizada y agradable para todos, compartimos algunas indicaciones importantes para el desarrollo del evento.

🕒 Registro y puntualidad

Para una mejor organización, les confirmamos los horarios oficiales de ingreso e inicio de actividades:

Registro de participantes: de 07:00 a 07:45 a. m.

Inicio del programa: 08:00 a. m.

Les solicitamos tomar en cuenta que el proceso de registro se realizará dentro del horario indicado, por lo que recomendamos presentarse a partir de las 07:00 a. m. para completar su acreditación y ubicarse oportunamente.

Agradecemos su puntualidad para dar inicio a las actividades según lo programado.

👔 Código de vestimenta

Para esta ocasión, el código de vestimenta será formal y/o casual, acorde con el carácter profesional de nuestra convención.

Agradecemos su colaboración para mantener una presentación apropiada durante el evento. (No gorras, no pantalonetas, no sandalias, no pantalones o playeras estilo "rotas")

📱 Participación en quizzes y actividades interactivas

Durante la convención tendremos dinámicas y quizzes diseñados para poner a prueba sus conocimientos y fomentar la participación.

Para garantizar una experiencia justa, organizada y entretenida, les compartimos los siguientes lineamientos:

Dispositivo: cada participante deberá contar con un teléfono móvil con acceso a internet y suficiente batería.

Acceso: los códigos o enlaces para ingresar a los quizzes se compartirán durante el evento.

Identificación: deberán registrarse utilizando su nombre y apellido reales para facilitar su identificación.

Participación individual: las respuestas deberán realizarse de manera individual, salvo que se indique una dinámica grupal.

Tiempo de respuesta: cada pregunta contará con un tiempo límite, por lo que deberán responder dentro del período establecido.

Puntuación: los resultados se determinarán de acuerdo con los criterios de cada dinámica, considerando la exactitud de las respuestas y, cuando aplique, la rapidez.

Resultados: las decisiones de los organizadores respecto a la validación de resultados y ganadores serán definitivas.

Los invitamos a participar con entusiasmo, respeto y espíritu de sana competencia.

Agradecemos su atención a estas indicaciones y esperamos contar con su participación activa en esta jornada de aprendizaje, conexión e innovación.

¡Nos vemos en la Convención Tecnológica!

Comité Organizador — XIV Convención de Ciencia y Tecnología
Ingeniería en Sistemas, Centro Universitario de Retalhuleu
convecionretalhuleu2026@appconvention.com`;

function buildReminderEmailHtml(): string {
  const paragraphs = REMINDER_BODY.split("\n\n").map((paragraph) => {
    const isHeading = /^(🕒|👔|📱)/u.test(paragraph);
    const tag = isHeading ? "h2" : "p";
    const style = isHeading
      ? "margin:24px 0 12px;color:#0f172a;font-size:18px;line-height:1.5;"
      : "margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;";
    return `<${tag} style="${style}">${escapeHtml(paragraph).replace(/\n/g, "<br />")}</${tag}>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(REMINDER_SUBJECT)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;">
        <tr><td style="padding:28px 24px;">${paragraphs}</td></tr>
      </table>
    </td></tr>
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

  const html = buildReminderEmailHtml();
  await sendEmail(to, REMINDER_SUBJECT, html, [], REMINDER_BODY);
}
