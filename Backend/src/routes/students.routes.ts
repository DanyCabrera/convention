import { Router } from "express";
import { z } from "zod";
import { CICLOS, type Ciclo } from "../types/student.types.js";
import {
  createStudentSchema,
  updateStudentSchema,
  formatZodError,
} from "../lib/validation.js";
import * as studentService from "../services/student.service.js";

const router = Router();

router.get("/stats", async (_req, res) => {
  try {
    const stats = await studentService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

router.get("/cycles", async (_req, res) => {
  try {
    const cycles = await studentService.getCycleStats();
    res.json(cycles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener ciclos" });
  }
});

router.get("/cycles/:ciclo", async (req, res) => {
  try {
    const ciclo = Number(req.params.ciclo);
    if (!CICLOS.includes(ciclo as Ciclo)) {
      return res.status(400).json({ error: "Ciclo inválido" });
    }
    const students = await studentService.getStudentsByCycle(ciclo);
    const stats = (await studentService.getCycleStats()).find(
      (c) => c.ciclo === ciclo
    );
    res.json({ students, stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener estudiantes del ciclo" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { ciclo, status, search } = req.query;
    const parsedCiclo = ciclo ? Number(ciclo) : undefined;
    const students = await studentService.getAllStudents({
      ciclo:
        parsedCiclo && !Number.isNaN(parsedCiclo) ? parsedCiclo : undefined,
      status: status as string | undefined,
      search: search as string | undefined,
    });
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener estudiantes" });
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

router.post("/scan", async (req, res) => {
  try {
    const schema = z.object({
      ticket_number: z.string().min(1, "Código QR inválido"),
    });
    const parsed = schema.safeParse(req.body);
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

router.get("/:id", async (req, res) => {
  try {
    const student = await studentService.getStudentById(req.params.id);
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
    const parsed = createStudentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: formatZodError(parsed.error) });
    }
    const student = await studentService.createStudent({
      ...parsed.data,
      ciclo: parsed.data.ciclo as Ciclo,
    });
    res.status(201).json(student);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al registrar estudiante";
    const status =
      message.includes("ya está registrado") ||
      message.includes("Ya existe un registro")
        ? 409
        : 400;
    res.status(status).json({ error: message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const parsed = updateStudentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: formatZodError(parsed.error) });
    }
    const { ciclo, ...rest } = parsed.data;
    const student = await studentService.updateStudent(req.params.id, {
      ...rest,
      ...(ciclo !== undefined ? { ciclo: ciclo as Ciclo } : {}),
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
      message.includes("Ya existe un registro")
        ? 409
        : 500;
    res.status(status).json({ error: message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await studentService.deleteStudent(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar estudiante" });
  }
});

router.post("/:id/resend-ticket", async (req, res) => {
  try {
    const ticket = await studentService.resendTicket(req.params.id);
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
