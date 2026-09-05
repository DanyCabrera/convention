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
   - `005_add_student_plan.sql`
   - `006_add_participant_type.sql`
   - `007_add_ticket_correlative.sql`
   - `008_renumber_correlative_on_delete.sql`
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
API_KEY=
EVENT_NAME=UMG 2026
EVENT_DATE=2026-10-24
EVENT_LOCATION=SALON CAMPO DE LA FERIA, SAN FELIPE, RETALHULEU
EVENT_UNIVERSITY=Universidad Mariano Galvez

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

## Producción (Railway + Vercel)

El repo es un monorepo: **Backend** → Railway, **Frontend** → Vercel.

Antes de desplegar, confirma que en Supabase ya corriste las migraciones **001 a 006**.

### 1. Backend en Railway

1. En [railway.app](https://railway.app) → **New project** → **GitHub repo**.
2. En el servicio: **Settings → Root Directory** = `Backend`.
3. Railway usa `Backend/railway.json` (`npm run build` + `npm start` + healthcheck `/api/health`).
4. En **Variables** agrega:

| Variable | Valor |
|----------|--------|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (Settings → API) |
| `API_KEY` | Clave larga aleatoria (obligatoria en producción) |
| `CORS_ORIGIN` | URL de Vercel, ej. `https://tu-app.vercel.app` (sin `/` final) |
| `EVENT_NAME` | `UMG 2026` |
| `EVENT_DATE` | `2026-10-24` |
| `EVENT_LOCATION` | `SALON CAMPO DE LA FERIA, SAN FELIPE, RETALHULEU` |
| `EVENT_UNIVERSITY` | `Universidad Mariano Galvez` |
| `RESEND_API_KEY` | *(opcional)* para enviar tickets |
| `EMAIL_FROM` | *(opcional)* `UMG 2026 <noreply@tu-dominio.com>` |

`PORT` lo asigna Railway; no lo definas a mano.

5. Genera un dominio: **Settings → Networking → Generate domain**. Copia la URL, ej. `https://umg-backend.up.railway.app`.
6. Prueba: `https://TU-BACKEND.up.railway.app/api/health` debe responder `{ "status": "ok", ... }`.

Si aún no tienes la URL de Vercel, deja `CORS_ORIGIN=http://localhost:3000` y actualízalo en el paso 3.

### 2. Frontend en Vercel

1. En [vercel.com](https://vercel.com) → **Add New → Project** → el mismo repo.
2. **Root Directory** = `Frontend` (Framework: Next.js).
3. En **Environment Variables** (Production y Preview):

| Variable | Valor |
|----------|--------|
| `NEXT_PUBLIC_API_URL` | `https://TU-BACKEND.up.railway.app/api` (sin `/` final) |
| `NEXT_PUBLIC_API_KEY` | La misma `API_KEY` del backend |

4. Deploy. Copia la URL, ej. `https://tu-app.vercel.app`.

`NEXT_PUBLIC_*` se incrusta en el build: si cambias la URL del backend, vuelve a desplegar el frontend.

### 3. Cerrar el círculo (CORS)

En Railway, actualiza:

```
CORS_ORIGIN=https://tu-app.vercel.app
```

Si usas previews de Vercel (`*.vercel.app`), con esa URL ya se aceptan. Redeploy del backend no es necesario: las variables se recargan al reiniciar el servicio.

### 4. Orden recomendado

1. Migraciones Supabase 001–006  
2. Railway (backend) + dominio + `API_KEY`  
3. Vercel (frontend) con `NEXT_PUBLIC_API_URL` y `NEXT_PUBLIC_API_KEY`  
4. `CORS_ORIGIN` en Railway = URL de Vercel  
5. Abrir el panel y probar registro + health  

### Correo en producción

Resend con `onboarding@resend.dev` solo entrega a tu propia cuenta. Para el evento, verifica un dominio en Resend y usa `EMAIL_FROM=UMG 2026 <noreply@tu-dominio.com>`.

El QR funciona aunque el correo no se envíe.

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

- **Inicio** — estadísticas de estudiantes y docentes
- **Registrar** — alta de estudiante o docente con ticket QR
- **Participantes** — listados, filtros y exportación
- **Tickets / Asistencia** — consulta y escaneo de QR
- **Planes y ciclos / Reportes** — métricas y exportaciones
