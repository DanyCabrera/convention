# UMG 2026 — Registro de eventos

Plataforma para registrar estudiantes, generar tickets con QR, controlar asistencia y enviar correos del evento.

```
convention/
├── Backend/    → API REST (Express + Supabase)
└── Frontend/   → Panel admin (Next.js 15)
```

---

## Requisitos

| Herramienta | Versión |
|-------------|---------|
| Node.js     | 20+     |
| npm         | 9+      |
| Supabase    | Proyecto creado en [supabase.com](https://supabase.com) |
| Correo *(opcional)* | [Resend](https://resend.com) o SMTP para enviar tickets |

---

## 1. Base de datos (Supabase)

1. Crea un proyecto en Supabase.
2. En **SQL Editor**, ejecuta las migraciones en orden:
   - `Backend/supabase/migrations/001_initial_schema.sql`
   - `002_add_checked_in_at.sql`
   - `003_unique_phone_name.sql`
   - `004_drop_full_name_unique.sql`
3. Copia de **Settings → API**:
   - `SUPABASE_URL`
   - `service_role` key → `SUPABASE_SECRET_KEY` (o `SUPABASE_SERVICE_ROLE_KEY`)

---

## 2. Backend

```bash
cd Backend
npm install
cp .env.example .env
```

Edita `Backend/.env`:

```env
PORT=4000
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...

CORS_ORIGIN=http://localhost:3000
EVENT_NAME=UMG 2026
EVENT_DATE=2026-08-15
EVENT_LOCATION=Auditorio Central, Campus Universitario

# Correo (opcional — sin esto no se envían tickets por email)
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=UMG 2026 <onboarding@resend.dev>
```

Levantar en desarrollo:

```bash
npm run dev
```

| URL | Descripción |
|-----|-------------|
| http://localhost:4000/api/health | Estado del servidor |
| http://localhost:4000/api/event | Datos del evento |

Al iniciar deberías ver: `✅ Supabase conectado` y, si configuraste correo, `✅ Correo configurado`.

---

## 3. Frontend

Abre **otra terminal**:

```bash
cd Frontend
npm install
cp .env.example .env.local
npm run dev
```

`.env.local` (por defecto apunta al backend local):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

| URL | Descripción |
|-----|-------------|
| http://localhost:3000 | Panel administrativo |

> Si el puerto 3000 está ocupado, Next.js usará 3001. Actualiza `CORS_ORIGIN` en el backend si cambias de puerto.

---

## Levantar todo (resumen)

**Terminal 1 — Backend**
```bash
cd Backend && npm run dev
```

**Terminal 2 — Frontend**
```bash
cd Frontend && npm run dev
```

Abre **http://localhost:3000**.

---

## Producción

```bash
# Backend
cd Backend
npm run build
npm start

# Frontend
cd Frontend
npm run build
npm start
```

Define las mismas variables de entorno en el servidor de producción.

---

## Acceso desde el celular (misma WiFi)

1. Anota la IP de tu PC (la que muestra Next.js en `Network`, ej. `192.168.1.100`).
2. En `Frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://192.168.1.100:4000/api
   ```
3. Abre `http://192.168.1.100:3000` desde el teléfono.

---

## Problemas comunes

| Error | Solución |
|-------|----------|
| `EADDRINUSE :4000` | Cierra el proceso que usa el puerto o cambia `PORT` en `.env`. |
| `EADDRINUSE :3000` | Cierra otras apps en 3000; Next.js puede usar 3001. |
| `Supabase no configurado` | Revisa `SUPABASE_URL` y `SUPABASE_SECRET_KEY` en `Backend/.env`. |
| CORS bloqueado | Agrega la URL del frontend en `CORS_ORIGIN` (separar con coma si hay varias). |
| Tickets no llegan por email | Configura `RESEND_API_KEY` o SMTP en `Backend/.env`. |

---

## Módulos del panel

- **Dashboard** — estadísticas generales
- **Registrar estudiante** — alta con ticket automático
- **Estudiantes / Tickets** — consulta y reenvío
- **Asistencia** — escaneo de QR
- **Ciclos / Reportes** — métricas por ciclo académico
