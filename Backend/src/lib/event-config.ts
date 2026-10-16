export function getEventConfig() {
  return {
    name: process.env.EVENT_NAME || "UMG 2026",
    date: process.env.EVENT_DATE || "2026-10-24",
    location:
      process.env.EVENT_LOCATION ||
      "Hotel Astor, Salón Villa Colonial, 5ta. Calle 4-60 Zona 1, Retalhuleu",
    university:
      process.env.EVENT_UNIVERSITY || "Universidad Mariano Galvez",
  };
}
