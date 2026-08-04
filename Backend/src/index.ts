import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import studentsRoutes from "./routes/students.routes.js";
import { getSupabaseConfigStatus } from "./lib/supabase.js";
import { getEmailConfigStatus } from "./services/email.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || "0.0.0.0";
const isDev = process.env.NODE_ENV !== "production";

const supabaseStatus = getSupabaseConfigStatus();
const emailStatus = getEmailConfigStatus();
if (!supabaseStatus.configured) {
  console.error("❌ Supabase no configurado.");
  console.error(`   Variables faltantes: ${supabaseStatus.missing.join(", ")}`);
  console.error("   Crea el archivo Backend/.env con tus credenciales.");
}
if (!emailStatus.configured) {
  console.warn("⚠️  Correo no configurado — los tickets NO se enviarán por email.");
}

function isAllowedOrigin(origin: string): boolean {
  const allowed = (process.env.CORS_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (allowed.includes(origin)) return true;

  if (isDev) {
    return (
      /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
      /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
      /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin) ||
      /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(
        origin
      )
    );
  }

  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS bloqueado para: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    supabase: supabaseStatus.configured,
    email: emailStatus.configured,
    event: process.env.EVENT_NAME || "UMG 2026",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/event", (_req, res) => {
  res.json({
    name: process.env.EVENT_NAME || "UMG 2026",
    date: process.env.EVENT_DATE || "2026-08-15",
    location:
      process.env.EVENT_LOCATION ||
      "Auditorio Central, Campus Universitario",
    university: process.env.EVENT_UNIVERSITY || "Universidad Nacional",
  });
});

app.use("/api/students", studentsRoutes);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: err.message || "Error interno del servidor" });
  }
);

app.listen(PORT, HOST, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`   Red local:      http://0.0.0.0:${PORT}`);
  if (supabaseStatus.configured) console.log("✅ Supabase conectado");
  if (emailStatus.configured) {
    console.log(`✅ Correo configurado (${emailStatus.provider})`);
  }
});
