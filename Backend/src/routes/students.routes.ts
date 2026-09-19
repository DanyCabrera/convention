import { Router } from "express";
import { CICLOS, type Ciclo, type Plan } from "../types/student.types.js";
import {
  createDocenteSchema,
  createStudentSchema,
  updateStudentSchema,
  scanTicketSchema,
  studentIdSchema,
  studentStatusFilterSchema,
  participantTypeFilterSchema,
  planFilterSchema,
  formatZodError,
} from "../lib/validation.js";
import { scanRateLimit } from "../middleware/rate-limit.js";
import * as studentService from "../services/student.service.js";

const router = Router();

function sendRouteError(
  res: import("express").Response,
  fallback: string,
  error: unknown
) {
  console.error(error);
  const details = error instanceof Error ? error.message : fallback;
  res.status(500).json({ error: fallback, details });
}

function parsePlanQuery(value: unknown): Plan | undefined {
  if (typeof value !== "string" || !value || value === "all") return undefined;
  const parsed = planFilterSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

router.get("/stats", async (_req, res) => {
  try {
    const stats = await studentService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error(error);
    sendRouteError(res, "Error al obtener estadísticas", error);
  }
});

router.get("/plans", async (_req, res) => {
  try {
    const plans = await studentService.getPlanStats();
    res.json(plans);
  } catch (error) {
    console.error(error);
    sendRouteError(res, "Error al obtener planes", error);
  }
});

router.get("/docentes/stats", async (_req, res) => {
  try {
    const stats = await studentService.getDocenteStats();
    res.json(stats);
  } catch (error) {
    console.error(error);
    sendRouteError(res, "Error al obtener estadísticas de docentes", error);
  }
});

router.get("/cycles", async (req, res) => {
  try {
    const plan = parsePlanQuery(req.query.plan);
    if (req.query.plan && !plan) {
      return res.status(400).json({ error: "Plan inválido" });
    }
    const cycles = await studentService.getCycleStats(plan);
    res.json(cycles);
  } catch (error) {
    console.error(error);
    sendRouteError(res, "Error al obtener ciclos", error);
  }
});

router.get("/cycles/:ciclo", async (req, res) => {
  try {
    const ciclo = Number(req.params.ciclo);
    if (!CICLOS.includes(ciclo as Ciclo)) {
      return res.status(400).json({ error: "Ciclo inválido" });
    }
    const plan = parsePlanQuery(req.query.plan);
    if (req.query.plan && !plan) {
      return res.status(400).json({ error: "Plan inválido" });
    }
    const students = await studentService.getStudentsByCycle(ciclo, plan);
    const stats = (await studentService.getCycleStats(plan)).find(
      (c) => c.ciclo === ciclo && (!plan || c.plan === plan)
    );
    res.json({ students, stats });
  } catch (error) {
    console.error(error);
    sendRouteError(res, "Error al obtener estudiantes del ciclo", error);
  }
});

router.get("/", async (req, res) => {
  try {
    const { ciclo, status, search, plan, tipo } = req.query;
    const parsedCiclo = ciclo ? Number(ciclo) : undefined;
    const parsedPlan = parsePlanQuery(plan);

    if (plan && !parsedPlan) {
      return res.status(400).json({ error: "Plan inválido" });
    }

    let participantType: "estudiante" | "docente" | undefined;
    if (tipo && typeof tipo === "string" && tipo !== "all") {
      const tipoParsed = participantTypeFilterSchema.safeParse(tipo);
      if (!tipoParsed.success) {
        return res.status(400).json({ error: "Tipo de participante inválido" });
      }
      participantType = tipoParsed.data;
    }

    if (status && typeof status === "string" && status !== "all") {
      const statusParsed = studentStatusFilterSchema.safeParse(status);
      if (!statusParsed.success) {
        return res.status(400).json({ error: "Estado de filtro inválido" });
      }
    }

    const students = await studentService.getAllStudents({
      ciclo:
        parsedCiclo && !Number.isNaN(parsedCiclo) ? parsedCiclo : undefined,
      plan: parsedPlan,
      status:
        typeof status === "string" && status !== "all" ? status : undefined,
      search: typeof search === "string" ? search : undefined,
      participant_type: participantType,
    });
    res.json(students);
  } catch (error) {
    console.error(error);
    sendRouteError(res, "Error al obtener estudiantes", error);
  }
});

router.get("/attendance", async (_req, res) => {
  try {
    const attendance = await studentService.getAttendance();
    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener asistencia" });
  }
});

router.post("/scan", scanRateLimit, async (req, res) => {
  try {
    const parsed = scanTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: formatZodError(parsed.error) });
    }
    const result = await studentService.confirmByTicketNumber(
      parsed.data.ticket_number
    );
    res.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al escanear ticket";
    res.status(400).json({ error: message });
  }
});

router.get("/:id/document", async (req, res) => {
  try {
    const idParsed = studentIdSchema.safeParse(req.params.id);
    if (!idParsed.success) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const document = await studentService.getStudentDocument(idParsed.data);
    if (!document) {
      return res.status(404).json({ error: "Documento no encontrado" });
    }
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${document.filename}"`
    );
    res.send(document.pdf);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener documento" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const idParsed = studentIdSchema.safeParse(req.params.id);
    if (!idParsed.success) {
      return res.status(400).json({ error: "ID de estudiante inválido" });
    }
    const student = await studentService.getStudentById(idParsed.data);
    if (!student) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }
    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener estudiante" });
  }
});

router.post("/", async (req, res) => {
  try {
    if (req.body?.participant_type === "docente") {
      const parsed = createDocenteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: formatZodError(parsed.error) });
      }
      const docente = await studentService.createDocente({
        full_name: parsed.data.full_name,
      });
      return res.status(201).json(docente);
    }

    const parsed = createStudentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: formatZodError(parsed.error) });
    }

    const student = await studentService.createStudent({
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      carnet: parsed.data.carnet,
      ciclo: parsed.data.ciclo as Ciclo,
      plan: parsed.data.plan,
    });
    res.status(201).json(student);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al registrar participante";
    const status =
      message.includes("ya está registrado") ||
      message.includes("duplicados")
        ? 409
        : 400;
    res.status(status).json({ error: message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const idParsed = studentIdSchema.safeParse(req.params.id);
    if (!idParsed.success) {
      return res.status(400).json({ error: "ID de estudiante inválido" });
    }
    const parsed = updateStudentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: formatZodError(parsed.error) });
    }
    const { ciclo, plan, ...rest } = parsed.data;
    const student = await studentService.updateStudent(idParsed.data, {
      ...rest,
      ...(ciclo !== undefined ? { ciclo: ciclo as Ciclo } : {}),
      ...(plan !== undefined ? { plan } : {}),
    });
    if (!student) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }
    res.json(student);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al actualizar estudiante";
    const status =
      message.includes("ya está registrado") ||
      message.includes("duplicados")
        ? 409
        : message.includes("escaneando el QR")
          ? 403
          : 500;
    res.status(status).json({ error: message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const idParsed = studentIdSchema.safeParse(req.params.id);
    if (!idParsed.success) {
      return res.status(400).json({ error: "ID de estudiante inválido" });
    }
    const deleted = await studentService.deleteStudent(idParsed.data);
    if (!deleted) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar estudiante" });
  }
});

router.post("/:id/issue-ticket", async (req, res) => {
  try {
    const idParsed = studentIdSchema.safeParse(req.params.id);
    if (!idParsed.success) {
      return res.status(400).json({ error: "ID inválido" });
    }
    const student = await studentService.ensureParticipantTicket(idParsed.data);
    res.json(student);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al generar ticket";
    const status = message.includes("no encontrado") ? 404 : 400;
    res.status(status).json({ error: message });
  }
});

router.post("/:id/resend-ticket", async (req, res) => {
  try {
    const idParsed = studentIdSchema.safeParse(req.params.id);
    if (!idParsed.success) {
      return res.status(400).json({ error: "ID de estudiante inválido" });
    }
    const ticket = await studentService.resendTicket(idParsed.data);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket no encontrado" });
    }
    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al reenviar ticket" });
  }
});

export default router;
