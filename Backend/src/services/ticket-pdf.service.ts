import { PDFDocument } from "pdf-lib";

const PAGE_WIDTH_PT = 842;

export async function composeTicketPdf(
  ticketImage: Buffer,
  title: string
): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(title);

  const image = await pdf.embedJpg(ticketImage);
  const height = (image.height / image.width) * PAGE_WIDTH_PT;
  const page = pdf.addPage([PAGE_WIDTH_PT, height]);
  page.drawImage(image, { x: 0, y: 0, width: PAGE_WIDTH_PT, height });

  return Buffer.from(await pdf.save());
}
