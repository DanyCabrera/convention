import dns from "node:dns";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import studentsRoutes from "./routes/students.routes.js";
import { getSupabaseConfigStatus, probeSupabase } from "./lib/supabase.js";
import { getEmailConfigStatus } from "./services/email.service.js";
import { getEventConfig } from "./lib/event-config.js";
import { requireApiKey } from "./middleware/auth.js";

dns.setDefaultResultOrder("ipv4first");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || "0.0.0.0";
const isDev = process.env.NODE_ENV !== "production";

app.set("trust proxy", 1);

const supabaseStatus = getSupabaseConfigStatus();
const emailStatus = getEmailConfigStatus();
if (!supabaseStatus.configured) {
  console.error("Supabase no configurado.");
  console.error(`Variables faltantes: ${supabaseStatus.missing.join(", ")}`);
}
if (!emailStatus.configured) {
  console.warn("Correo no configurado — los tickets no se enviarán por email.");
}

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/$/, "");
}

function isAllowedOrigin(origin: string): boolean {
  const incoming = normalizeOrigin(origin);
  const allowed = (process.env.CORS_ORIGIN || "http://localhost:3000")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

  if (allowed.includes("*") || allowed.includes(incoming)) return true;

  const allowVercelPreviews =
    process.env.CORS_ALLOW_VERCEL_PREVIEWS === "true" ||
    allowed.some((item) => item.endsWith(".vercel.app"));

  if (
    allowVercelPreviews &&
    /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(incoming)
  ) {
    return true;
  }

  if (isDev) {
    return (
      /^https?:\/\/localhost(:\d+)?$/.test(incoming) ||
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(incoming) ||
      /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(incoming) ||
      /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(incoming) ||
      /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(
        incoming
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

app.get("/api/health", async (_req, res) => {
  const event = getEventConfig();
  const database = supabaseStatus.configured
    ? await probeSupabase()
    : { ok: false, error: `Faltan: ${supabaseStatus.missing.join(", ")}` };

  res.json({
    status: "ok",
    supabase: supabaseStatus.configured,
    database: database.ok ? "ok" : "error",
    databaseError: database.ok ? undefined : database.error,
    email: emailStatus.configured,
    event: event.name,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/event", (_req, res) => {
  res.json(getEventConfig());
});

app.use("/api/students", requireApiKey, studentsRoutes);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    const message =
      process.env.NODE_ENV === "production"
        ? "Error interno del servidor"
        : err.message || "Error interno del servidor";
    res.status(500).json({ error: message });
  }
);

app.listen(PORT, HOST, () => {
  console.log(`Backend escuchando en puerto ${PORT}`);
  if (supabaseStatus.configured) console.log("Supabase conectado");
  if (emailStatus.configured) {
    console.log(`Correo configurado (${emailStatus.provider})`);
  }
});
