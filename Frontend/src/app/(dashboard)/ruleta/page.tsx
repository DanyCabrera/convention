"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dices, RefreshCw, RotateCcw, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { displayCarnet } from "@/lib/carnet";
import { CICLO_OPTIONS, PLAN_OPTIONS } from "@/lib/constants";
import { getPlanLabel } from "@/lib/plans";
import { formatTicketCorrelative, getCicloLabel } from "@/lib/utils";
import type { StudentWithTicket } from "@/types";

const WHEEL_COLORS = ["#1D4ED8", "#0369A1", "#2563EB", "#1E3A8A", "#0284C7", "#1E40AF"];
const SPIN_MS = 6500;
const FULL_TURNS = 8;
const POLL_MS = 10_000;
const WINNERS_STORAGE_KEY = "umg-ruleta-ganadores";

interface Winner {
  id: string;
  full_name: string;
  carnet: string | null;
  ciclo: number | null;
  plan: string | null;
  correlative: number | null;
  wonAt: string;
}

function toWinner(student: StudentWithTicket): Winner {
  return {
    id: student.id,
    full_name: student.full_name,
    carnet: student.carnet,
    ciclo: student.ciclo,
    plan: student.plan,
    correlative: student.ticket?.correlative ?? null,
    wonAt: new Date().toISOString(),
  };
}

function randomIndex(max: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % max;
}

function wheelLabel(fullName: string): string {
  const words = fullName.trim().split(/\s+/);
  if (words.length >= 4) return `${words[0]} ${words[words.length - 2]}`;
  if (words.length === 3) return `${words[0]} ${words[1]}`;
  return words.join(" ");
}

function drawWheel(canvas: HTMLCanvasElement, names: string[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const size = canvas.width;
  const r = size / 2;
  ctx.clearRect(0, 0, size, size);

  if (names.length === 0) {
    ctx.beginPath();
    ctx.arc(r, r, r - 4, 0, Math.PI * 2);
    ctx.fillStyle = "#e2e8f0";
    ctx.fill();
    return;
  }

  const seg = (Math.PI * 2) / names.length;
  const labelOuter = r - 30;
  const labelInner = names.length > 60 ? r * 0.72 : r * 0.2;
  const sliceThickness = labelInner * seg;
  const baseFont = Math.max(9, Math.min(48, sliceThickness * 0.82));
  const maxLabelLength = labelOuter - labelInner;

  names.forEach((name, i) => {
    const start = -Math.PI / 2 + i * seg;
    ctx.beginPath();
    ctx.moveTo(r, r);
    ctx.arc(r, r, r - 4, start, start + seg);
    ctx.closePath();
    ctx.fillStyle =
      names.length % WHEEL_COLORS.length === 1 && i === names.length - 1
        ? WHEEL_COLORS[2]
        : WHEEL_COLORS[i % WHEEL_COLORS.length];
    ctx.fill();
    if (names.length <= 200) {
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const label = wheelLabel(name);
    ctx.save();
    ctx.translate(r, r);
    ctx.rotate(start + seg / 2);
    ctx.fillStyle = "#ffffff";
    ctx.font = `700 ${baseFont}px Inter, system-ui, sans-serif`;
    const width = ctx.measureText(label).width;
    if (width > maxLabelLength) {
      ctx.font = `700 ${(baseFont * maxLabelLength) / width}px Inter, system-ui, sans-serif`;
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(label, labelOuter, 0);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(r, r, r - 4, 0, Math.PI * 2);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 8;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(r, r, r * 0.11, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(r, r, r * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = "#2563EB";
  ctx.fill();
}

function currentRotationDeg(el: HTMLElement): number {
  const transform = getComputedStyle(el).transform;
  if (!transform || transform === "none") return 0;
  const matrix = new DOMMatrixReadOnly(transform);
  return (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("es-GT", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export default function RuletaPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spinningRef = useRef(false);
  const pendingDataRef = useRef<StudentWithTicket[] | null>(null);
  const initialCountRef = useRef<number | null>(null);
  const spinTimeoutRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  const [students, setStudents] = useState<StudentWithTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [newSinceOpen, setNewSinceOpen] = useState(0);

  const [plan, setPlan] = useState("all");
  const [ciclo, setCiclo] = useState("all");
  const [onlyConfirmed, setOnlyConfirmed] = useState(false);
  const [excludeWinners, setExcludeWinners] = useState(true);
  const [excludeTenthCycle, setExcludeTenthCycle] = useState(false);

  const [winners, setWinners] = useState<Winner[]>([]);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [pointerName, setPointerName] = useState("");

  const applyStudents = useCallback((data: StudentWithTicket[]) => {
    setStudents(data);
    setLastUpdated(new Date());
    if (initialCountRef.current === null) {
      initialCountRef.current = data.length;
    }
    setNewSinceOpen(Math.max(0, data.length - initialCountRef.current));
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await api.getStudents({ tipo: "estudiante" });
      setError(null);
      if (spinningRef.current) {
        pendingDataRef.current = data;
      } else {
        applyStudents(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar estudiantes");
    } finally {
      setLoading(false);
    }
  }, [applyStudents]);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(WINNERS_STORAGE_KEY);
      if (stored) setWinners(JSON.parse(stored) as Winner[]);
    } catch {
      localStorage.removeItem(WINNERS_STORAGE_KEY);
    }
  }, []);

  const updateWinners = useCallback((updater: (prev: Winner[]) => Winner[]) => {
    setWinners((prev) => {
      const next = updater(prev);
      localStorage.setItem(WINNERS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const activeStudents = useMemo(
    () => students.filter((s) => s.status !== "cancelled"),
    [students]
  );

  const participants = useMemo(() => {
    const winnerIds = new Set(winners.map((w) => w.id));
    return activeStudents.filter(
      (s) =>
        (plan === "all" || s.plan === plan) &&
        (ciclo === "all" || s.ciclo === Number(ciclo)) &&
        (!onlyConfirmed || s.status === "confirmed") &&
        (!excludeTenthCycle || s.ciclo !== 10) &&
        (!excludeWinners || !winnerIds.has(s.id))
    );
  }, [
    activeStudents,
    plan,
    ciclo,
    onlyConfirmed,
    excludeTenthCycle,
    excludeWinners,
    winners,
  ]);

  useEffect(() => {
    if (canvasRef.current) {
      drawWheel(
        canvasRef.current,
        participants.map((p) => p.full_name)
      );
    }
  }, [participants, loading]);

  function spin() {
    if (spinning || participants.length === 0) return;
    const pool = participants;
    const count = pool.length;
    const seg = 360 / count;
    const index = randomIndex(count);
    const jitter = (Math.random() - 0.5) * seg * 0.6;
    const targetAngle = (index + 0.5) * seg + jitter;
    const base = Math.ceil(rotation / 360) * 360;
    const next = base + 360 * FULL_TURNS + (360 - targetAngle);

    spinningRef.current = true;
    setSpinning(true);
    setRotation(next);

    const startedAt = performance.now();
    const tick = () => {
      const el = canvasRef.current;
      if (el) {
        const deg = currentRotationDeg(el);
        const angle = (((360 - deg) % 360) + 360) % 360;
        setPointerName(pool[Math.floor(angle / seg) % count]?.full_name ?? "");
      }
      if (performance.now() - startedAt < SPIN_MS) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };
    frameRef.current = requestAnimationFrame(tick);

    spinTimeoutRef.current = window.setTimeout(() => {
      const picked = toWinner(pool[index]);
      setPointerName(picked.full_name);
      setWinner(picked);
      updateWinners((prev) => [picked, ...prev]);
      finishSpin();
    }, SPIN_MS + 150);
  }

  function finishSpin() {
    spinTimeoutRef.current = null;
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    spinningRef.current = false;
    setSpinning(false);
    if (pendingDataRef.current) {
      applyStudents(pendingDataRef.current);
      pendingDataRef.current = null;
    }
  }

  function resetWheel() {
    if (spinTimeoutRef.current !== null) {
      clearTimeout(spinTimeoutRef.current);
      finishSpin();
    }
    setRotation(0);
    setPointerName("");
  }

  function undoLastSpin() {
    if (!winner) return;
    const undone = winner;
    updateWinners((prev) => prev.filter((w) => w.wonAt !== undone.wonAt));
    setWinner(null);
    setRotation(0);
    setPointerName("");
  }

  function resetWinners() {
    updateWinners(() => []);
    setPointerName("");
  }

  useEffect(
    () => () => {
      if (spinTimeoutRef.current !== null) clearTimeout(spinTimeoutRef.current);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ruleta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sorteo entre los estudiantes registrados. La lista se actualiza sola cada{" "}
            {POLL_MS / 1000} segundos.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={spinning}
          className="self-start"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <Card className="glass-card col-span-2 lg:col-span-1">
          <CardContent className="flex items-center justify-between gap-3 p-4 sm:p-5">
            <div>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
                </span>
                Estudiantes registrados
              </p>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.p
                  key={activeStudents.length}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -12, opacity: 0 }}
                  className="mt-1 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl"
                >
                  {loading ? "—" : activeStudents.length}
                </motion.p>
              </AnimatePresence>
              <p className="mt-1 text-xs text-muted-foreground">
                {newSinceOpen > 0 ? (
                  <span className="font-semibold text-success">
                    +{newSinceOpen} nuevo{newSinceOpen === 1 ? "" : "s"} desde que abriste la ruleta
                  </span>
                ) : lastUpdated ? (
                  `Actualizado a las ${formatTime(lastUpdated)}`
                ) : (
                  "Cargando..."
                )}
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">En la ruleta</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-primary sm:text-4xl">
              {loading ? "—" : participants.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Con los filtros actuales</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">Ganadores</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-warning sm:text-4xl">
              {winners.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Sorteados hasta ahora</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center gap-5 p-4 sm:p-8">
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center">
              <Select value={plan} onValueChange={setPlan} disabled={spinning}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ciclo} onValueChange={setCiclo} disabled={spinning}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CICLO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-blue-600"
                  checked={onlyConfirmed}
                  onChange={(e) => setOnlyConfirmed(e.target.checked)}
                  disabled={spinning}
                />
                Solo con entrada confirmada
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-blue-600"
                  checked={excludeWinners}
                  onChange={(e) => setExcludeWinners(e.target.checked)}
                  disabled={spinning}
                />
                Quitar ganadores de la ruleta
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-blue-600"
                  checked={excludeTenthCycle}
                  onChange={(e) => setExcludeTenthCycle(e.target.checked)}
                  disabled={spinning}
                />
                Quitar décimo ciclo
              </label>
            </div>

            <div className="flex min-h-[3.5rem] w-full items-center justify-center rounded-2xl bg-muted/40 px-4 py-2">
              <p className="truncate text-center text-xl font-bold text-primary sm:text-3xl">
                {pointerName || (participants.length > 0 ? "¡Gira la ruleta!" : "Sin participantes")}
              </p>
            </div>

            {loading ? (
              <Skeleton className="aspect-square w-full max-w-[760px] rounded-full" />
            ) : (
              <div className="relative w-full max-w-[760px]">
                <svg
                  viewBox="0 0 48 64"
                  className="absolute left-1/2 top-0 z-10 h-14 w-11 -translate-x-1/2 -translate-y-5 drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)] sm:h-16 sm:w-12"
                  aria-hidden="true"
                >
                  <path
                    d="M24 62 L4 22 A20 20 0 1 1 44 22 Z"
                    fill="#EF4444"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  <circle cx="24" cy="22" r="7" fill="#ffffff" />
                </svg>
                <canvas
                  ref={canvasRef}
                  width={2000}
                  height={2000}
                  className="aspect-square w-full rounded-full shadow-2xl"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning
                      ? `transform ${SPIN_MS}ms cubic-bezier(0.15, 0.85, 0.15, 1)`
                      : "none",
                  }}
                  aria-label={`Ruleta con ${participants.length} participantes`}
                  role="img"
                />
              </div>
            )}

            <div className="grid w-full max-w-md grid-cols-[1fr_auto] gap-3">
              <Button
                size="lg"
                className="h-12 text-base"
                onClick={spin}
                disabled={spinning || loading || participants.length === 0}
              >
                <Dices className="h-5 w-5" />
                {spinning ? "Girando..." : "Girar ruleta"}
              </Button>
              <Button
                size="lg"
                variant={spinning ? "destructive" : "outline"}
                className="h-12"
                onClick={resetWheel}
                disabled={!spinning && rotation === 0}
              >
                <RotateCcw className="h-5 w-5" />
                {spinning ? "Cancelar giro" : "Reiniciar"}
              </Button>
            </div>
            {spinning && (
              <p className="text-center text-xs text-muted-foreground">
                Si giraste por error, presiona “Cancelar giro”: no se guarda ningún ganador.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card h-fit">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-warning" />
              Ganadores
            </CardTitle>
            {winners.length > 0 && (
              <Button variant="ghost" size="sm" onClick={resetWinners} disabled={spinning}>
                <RotateCcw className="h-4 w-4" />
                Reiniciar
              </Button>
            )}
          </CardHeader>
          <CardContent className="max-h-[560px] overflow-y-auto">
            {winners.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aún no hay ganadores
              </p>
            ) : (
              <ol className="space-y-2">
                {winners.map((w, i) => (
                  <li key={`${w.id}-${w.wonAt}`} className="rounded-xl bg-muted/40 px-3 py-2.5">
                    <p className="font-medium leading-snug">
                      <span className="mr-1.5 text-muted-foreground">{winners.length - i}.</span>
                      {w.full_name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {displayCarnet(w.carnet)} · {getCicloLabel(w.ciclo)} · Ticket{" "}
                      {formatTicketCorrelative(w.correlative)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!winner} onOpenChange={(open) => !open && setWinner(null)}>
        <DialogContent className="max-w-2xl text-center">
          <DialogTitle className="sr-only">Ganador del sorteo</DialogTitle>
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.45, duration: 0.6 }}
            className="space-y-4 py-2"
          >
            <Trophy className="mx-auto h-14 w-14 text-warning sm:h-16 sm:w-16" />
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              ¡Ganador!
            </p>
            <p className="break-words text-4xl font-extrabold leading-tight text-primary sm:text-6xl">
              {winner?.full_name}
            </p>
            <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-3 text-left">
              <WinnerInfo label="Carnet" value={displayCarnet(winner?.carnet)} />
              <WinnerInfo label="Ciclo" value={getCicloLabel(winner?.ciclo)} />
              <WinnerInfo label="Plan" value={getPlanLabel(winner?.plan)} />
              <WinnerInfo
                label="Ticket"
                value={formatTicketCorrelative(winner?.correlative)}
              />
            </div>
            <div className="mx-auto flex w-full max-w-md flex-col-reverse gap-2 sm:flex-row">
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={undoLastSpin}
              >
                <RotateCcw className="h-4 w-4" />
                Anular este giro
              </Button>
              <Button size="lg" className="flex-1" onClick={() => setWinner(null)}>
                Continuar
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WinnerInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
