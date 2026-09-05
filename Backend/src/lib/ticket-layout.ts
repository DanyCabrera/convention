/**
 * Zona blanca del ticket: QR centrado + correlativo abajo ("TICKET" va en la imagen).
 * Sincronizar con Frontend/src/lib/constants.ts
 */
export const TICKET_LAYOUT = {
  contentLeftPct: 0.03,
  contentTopPct: 0.21,
  contentWidthPct: 0.246,
  contentHeightPct: 0.68,
  innerPaddingPct: 0.02,
  docenteHeaderPct: 0.12,
  correlativeHeightPct: 0.2,
  gapPct: 0.008,
  correlativeFontPct: 0.22,
  docenteNameFontPct: 0.055,
  qrFillPct: 0.98,
} as const;
