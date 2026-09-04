export function getEventConfig() {
  return {
    name: process.env.EVENT_NAME || "UMG 2026",
    date: process.env.EVENT_DATE || "2026-10-24",
    location:
      process.env.EVENT_LOCATION ||
      "SALON CAMPO DE LA FERIA, SAN FELIPE, RETALHULEU",
    university:
      process.env.EVENT_UNIVERSITY || "Universidad Mariano Galvez",
  };
}
