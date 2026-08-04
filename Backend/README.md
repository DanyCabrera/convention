# Convention Backend

API REST para registro de estudiantes, tickets y reportes.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado del servidor |
| GET | `/api/event` | Info del evento |
| GET | `/api/students/stats` | Estadísticas del dashboard |
| GET | `/api/students/cycles` | Stats por ciclo |
| GET | `/api/students/cycles/:ciclo` | Estudiantes de un ciclo |
| GET | `/api/students` | Listar estudiantes |
| POST | `/api/students` | Registrar estudiante |
| GET | `/api/students/:id` | Obtener estudiante |
| PATCH | `/api/students/:id` | Actualizar estudiante |
| DELETE | `/api/students/:id` | Eliminar estudiante |
| POST | `/api/students/:id/resend-ticket` | Reenviar ticket |

## Desarrollo

```bash
npm install
cp .env.example .env
npm run dev
```

El backend incluye datos mock en memoria cuando Supabase no está configurado.
