import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { TICKET_LAYOUT } from "../lib/ticket-layout.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.resolve(__dirname, "../../assets/tickets.jpeg");

function parseQrBuffer(qrDataUrl: string): Buffer {
  const match = qrDataUrl.match(/^data:[^;]+;base64,(.+)$/);
  if (!match) {
    throw new Error("QR inválido: se esperaba un data URL en base64");
  }
  return Buffer.from(match[1], "base64");
}

function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncateLabel(value: string, maxLen: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

export interface ComposeTicketImageOptions {
  participantType?: "estudiante" | "docente";
  holderName?: string;
}

export async function composeTicketImage(
  ticketNumber: string,
  qrDataUrl: string,
  options?: ComposeTicketImageOptions
): Promise<Buffer> {
  const isDocente = options?.participantType === "docente";
  const template = sharp(TEMPLATE_PATH);
  const meta = await template.metadata();
  const width = meta.width!;
  const height = meta.height!;

  const boxLeft = Math.round(width * TICKET_LAYOUT.contentLeftPct);
  const boxTop = Math.round(height * TICKET_LAYOUT.contentTopPct);
  const boxWidth = Math.round(width * TICKET_LAYOUT.contentWidthPct);
  const boxHeight = Math.round(height * TICKET_LAYOUT.contentHeightPct);

  const pad = Math.round(
    Math.min(boxWidth, boxHeight) * TICKET_LAYOUT.innerPaddingPct
  );
  const innerWidth = boxWidth - pad * 2;
  const innerHeight = boxHeight - pad * 2;

  const numberHeight = Math.round(
    innerHeight *
      (isDocente ? 0.16 : TICKET_LAYOUT.numberHeightPct)
  );
  const qrAreaHeight = innerHeight - numberHeight;

  const fontSize = Math.min(
    Math.round(innerWidth * (isDocente ? 0.042 : TICKET_LAYOUT.fontSizePct)),
    Math.round(numberHeight * (isDocente ? 0.38 : 0.82))
  );
  const gap = Math.max(2, Math.round(innerHeight * 0.004));
  const qrSize = Math.min(
    Math.round(innerWidth * TICKET_LAYOUT.qrFillPct),
    qrAreaHeight - gap
  );

  const qrBuffer = parseQrBuffer(qrDataUrl);
  const resizedQr = await sharp(qrBuffer)
    .resize(qrSize, qrSize)
    .png()
    .toBuffer();

  const contentTop = boxTop + pad;
  const qrLeft = boxLeft + pad + Math.round((innerWidth - qrSize) / 2);
  const qrTop = contentTop + numberHeight + gap;

  const textCenterX = boxLeft + boxWidth / 2;
  const nameY = contentTop + Math.round(numberHeight * 0.42);
  const badgeY = contentTop + Math.round(numberHeight * 0.78);
  const ticketY = contentTop + Math.round(numberHeight * 0.72);

  const textSvg = Buffer.from(
    isDocente && options?.holderName
      ? `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="${textCenterX}"
        y="${nameY}"
        text-anchor="middle"
        font-family="Inter, Arial, sans-serif"
        font-weight="700"
        font-size="${fontSize}"
        fill="#0f172a"
      >${escapeSvgText(truncateLabel(options.holderName, 24))}</text>
      <text
        x="${textCenterX}"
        y="${badgeY}"
        text-anchor="middle"
        font-family="Inter, Arial, sans-serif"
        font-weight="700"
        font-size="${Math.max(8, Math.round(fontSize * 0.72))}"
        fill="#2563EB"
        letter-spacing="1.2"
      >DOCENTE</text>
    </svg>`
      : `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="${textCenterX}"
        y="${ticketY}"
        text-anchor="middle"
        font-family="Consolas, Monaco, monospace"
        font-weight="700"
        font-size="${fontSize}"
        fill="#0f172a"
      >${escapeSvgText(ticketNumber)}</text>
    </svg>`
  );

  return template
    .composite([
      { input: resizedQr, top: qrTop, left: qrLeft },
      { input: textSvg, top: 0, left: 0 },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();
}
