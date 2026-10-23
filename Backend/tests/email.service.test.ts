import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import nodemailer from "nodemailer";
import QRCode from "qrcode";
import { PDFDocument } from "pdf-lib";
import { sendReminderEmail, sendTicketEmail } from "../src/services/email.service.js";
import type { Student, Ticket } from "../src/types/student.types.js";

const originalEnv = { ...process.env };
const student: Student = {
  id: "11111111-1111-4111-8111-111111111111",
  full_name: "Ana Pérez",
  email: "ana@example.com",
  phone: "12345678",
  carnet: "2790-20-12345",
  ciclo: 10,
  plan: "diario",
  participant_type: "estudiante",
  status: "pending",
  registered_at: "2026-10-23T12:00:00Z",
  updated_at: "2026-10-23T12:00:00Z",
};

async function makeTicket(): Promise<Ticket> {
  return {
    id: "22222222-2222-4222-8222-222222222222",
    student_id: student.id,
    ticket_number: "TKT-ABC12345",
    correlative: 42,
    qr_code: await QRCode.toDataURL("TKT-ABC12345"),
    status: "sent",
    sent_at: "2026-10-22T12:00:00Z",
    created_at: "2026-10-22T12:00:00Z",
  };
}

beforeEach(() => {
  process.env.RESEND_API_KEY = "re_test_only";
  process.env.EMAIL_FROM = "Evento <evento@example.com>";
});

afterEach(() => {
  mock.restoreAll();
  process.env = { ...originalEnv };
});

function captureResend() {
  const messages: Record<string, any>[] = [];
  mock.method(globalThis, "fetch", async (_url: unknown, init: RequestInit) => {
    messages.push(JSON.parse(String(init.body)));
    return new Response(JSON.stringify({ id: "test-message" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  return messages;
}

test("el reenvío por Resend adjunta un PDF válido y conserva el ticket existente", async () => {
  const messages = captureResend();
  const ticket = await makeTicket();
  await sendTicketEmail({ student, ticket });
  await sendTicketEmail({ student, ticket });
  assert.equal(messages.length, 2);
  for (const message of messages) {
    assert.equal(message.to, student.email);
    assert.match(message.subject, /^Tu ticket — /);
    assert.equal(message.attachments.length, 1);
    assert.equal(message.attachments[0].filename, "ticket-TKT-ABC12345.pdf");
    const pdf = Buffer.from(message.attachments[0].content, "base64");
    assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
    const document = await PDFDocument.load(pdf);
    assert.equal(document.getPageCount(), 1);
    assert.equal(document.getTitle(), "Ticket TKT-ABC12345");
  }
});

test("el recordatorio usa el asunto, horarios, lineamientos y firma solicitados", async () => {
  const messages = captureResend();
  await sendReminderEmail(student);
  const message = messages[0];
  assert.equal(message.subject, "Información importante  XIV Convención Tecnológica");
  assert.ok(message.text.startsWith("Estimados alumnos:\n\nReciban un cordial saludo."));
  for (const copy of [
    "Registro de participantes: de 07:00 a 07:45 a. m.",
    "Inicio del programa: 08:00 a. m.",
    "👔 Código de vestimenta",
    "📱 Participación en quizzes y actividades interactivas",
    "Dispositivo:", "Acceso:", "Identificación:", "Participación individual:",
    "Tiempo de respuesta:", "Puntuación:", "Resultados:",
    "Comité Organizador — XIV Convención de Ciencia y Tecnología",
    "convecionretalhuleu2026@appconvention.com",
  ]) {
    assert.ok(message.text.includes(copy), copy);
    assert.ok(message.html.includes(copy), copy);
  }
  assert.ok(!message.html.includes("no se permitirá el uso"));
  assert.deepEqual(message.attachments, []);
});

test("SMTP recibe el PDF como Buffer y también permite enviar recordatorios", async () => {
  delete process.env.RESEND_API_KEY;
  process.env.SMTP_HOST = "smtp.example.com";
  process.env.SMTP_USER = "test";
  process.env.SMTP_PASS = "test";
  const messages: any[] = [];
  mock.method(nodemailer, "createTransport", () => ({
    sendMail: async (message: unknown) => { messages.push(message); },
  }));
  const fetchMock = mock.method(globalThis, "fetch", async () => {
    throw new Error("SMTP no debe llamar a Resend");
  });
  await sendTicketEmail({ student, ticket: await makeTicket() });
  await sendReminderEmail(student);
  assert.equal(fetchMock.mock.callCount(), 0);
  assert.equal(messages.length, 2);
  assert.ok(Buffer.isBuffer(messages[0].attachments[0].content));
  assert.equal((await PDFDocument.load(messages[0].attachments[0].content)).getPageCount(), 1);
  assert.equal(messages[1].subject, "Información importante  XIV Convención Tecnológica");
});

test("si falla la generación del ticket no envía un correo sin adjunto", async () => {
  const messages = captureResend();
  const ticket = await makeTicket();
  ticket.qr_code = "invalid";
  await assert.rejects(sendTicketEmail({ student, ticket }), /QR inválido/);
  assert.equal(messages.length, 0);
});

test("los errores de entrega se propagan al reenvío", async () => {
  mock.method(globalThis, "fetch", async () => new Response(
    JSON.stringify({ name: "validation_error", message: "Entrega rechazada" }),
    { status: 422, headers: { "Content-Type": "application/json" } },
  ));
  await assert.rejects(
    sendTicketEmail({ student, ticket: await makeTicket() }),
    /Entrega rechazada/,
  );
});
