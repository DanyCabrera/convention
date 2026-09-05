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
  correlative: number;
  participantType?: "estudiante" | "docente";
  holderName?: string;
}

export async function composeTicketImage(
  qrDataUrl: string,
  options: ComposeTicketImageOptions
): Promise<Buffer> {
  const isDocente = options.participantType === "docente";
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

  const docenteHeaderHeight = isDocente
    ? Math.round(innerHeight * TICKET_LAYOUT.docenteHeaderPct)
    : 0;
  const correlativeHeight = Math.round(
    innerHeight * TICKET_LAYOUT.correlativeHeightPct
  );
  const gap = Math.max(2, Math.round(innerHeight * TICKET_LAYOUT.gapPct));
  const qrAreaHeight =
    innerHeight - docenteHeaderHeight - correlativeHeight - gap * 2;

  const qrSize = Math.min(
    Math.round(innerWidth * TICKET_LAYOUT.qrFillPct),
    qrAreaHeight
  );

  const qrBuffer = parseQrBuffer(qrDataUrl);
  const resizedQr = await sharp(qrBuffer)
    .resize(qrSize, qrSize)
    .png()
    .toBuffer();

  const contentTop = boxTop + pad;
  const textCenterX = boxLeft + boxWidth / 2;

  let cursorY = contentTop;
  let svgExtra = "";

  if (isDocente && options.holderName) {
    const nameFont = Math.min(
      Math.round(innerWidth * TICKET_LAYOUT.docenteNameFontPct),
      Math.round(docenteHeaderHeight * 0.55)
    );
    const nameY = cursorY + Math.round(docenteHeaderHeight * 0.62);
    svgExtra += `
      <text
        x="${textCenterX}"
        y="${nameY}"
        text-anchor="middle"
        font-family="Inter, Arial, sans-serif"
        font-weight="700"
        font-size="${nameFont}"
        fill="#0f172a"
      >${escapeSvgText(truncateLabel(options.holderName, 22))}</text>`;
    cursorY += docenteHeaderHeight;
  }

  const qrTop = cursorY + Math.round((qrAreaHeight - qrSize) / 2);
  const qrLeft = boxLeft + pad + Math.round((innerWidth - qrSize) / 2);
  cursorY += qrAreaHeight + gap;

  const correlativeFont = Math.min(
    Math.round(innerWidth * TICKET_LAYOUT.correlativeFontPct),
    Math.round(correlativeHeight * 0.72)
  );
  const correlativeY = cursorY + Math.round(correlativeHeight * 0.72);

  const textSvg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${svgExtra}
      <text
        x="${textCenterX}"
        y="${correlativeY}"
        text-anchor="middle"
        font-family="Inter, Arial, sans-serif"
        font-weight="800"
        font-size="${correlativeFont}"
        fill="#0f172a"
      >${escapeSvgText(String(options.correlative))}</text>
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
