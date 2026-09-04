/**
 * Zona de contenido dentro del recuadro blanco (debajo del texto "TICKET" del JPEG).
 * Medido sobre tickets.jpeg (3858×1378). Sincronizar con Frontend/src/lib/constants.ts
 */
export const TICKET_LAYOUT = {
  contentLeftPct: 0.03,
  contentTopPct: 0.21,
  contentWidthPct: 0.246,
  contentHeightPct: 0.68,
  /** Altura reservada al número de ticket; el QR ocupa el resto */
  numberHeightPct: 0.09,
  innerPaddingPct: 0.02,
  fontSizePct: 0.068,
  qrFillPct: 0.98,
} as const;
