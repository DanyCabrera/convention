"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Mail, MailCheck, MailX } from "lucide-react";
import { toast } from "sonner";
import { MatchText } from "@/components/search/match-text";
import { TableSearch } from "@/components/search/table-search";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { compareByQuery, studentMatchesQuery } from "@/lib/search-suggestions";
import { hasRealEmail } from "@/lib/utils";
import type { StudentWithTicket } from "@/types";

type SendState = "idle" | "sending" | "sent" | "error";

interface BulkStudentEmailProps {
  title: string;
  sendEmail: (id: string) => Promise<unknown>;
  children?: ReactNode;
}

export function BulkStudentEmail({ title, sendEmail, children }: BulkStudentEmailProps) {
  const [students, setStudents] = useState<StudentWithTicket[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rowState, setRowState] = useState<Record<string, SendState>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const [confirming, setConfirming] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    api
      .getStudents({ tipo: "estudiante" })
      .then((data) => {
        if (!active) return;
        const withEmail = data.filter(
          (student) => hasRealEmail(student.email) && student.status !== "cancelled"
        );
        setStudents(withEmail);
        setSelected(new Set(withEmail.map((student) => student.id)));
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(
          error instanceof Error ? error.message : "No se pudo cargar el listado"
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleStudents = useMemo(() => {
    const term = query.trim();
    const matches = term
      ? students.filter((student) => studentMatchesQuery(student, term))
      : students;
    if (!term) return matches;
    return [...matches].sort((a, b) => compareByQuery(a, b, term));
  }, [students, query]);

  const selectedCount = useMemo(
    () => students.filter((student) => selected.has(student.id)).length,
    [students, selected]
  );
  const allVisibleSelected =
    visibleStudents.length > 0 &&
    visibleStudents.every((student) => selected.has(student.id));
  const sentCount = Object.values(rowState).filter((state) => state === "sent").length;
  const failedCount = Object.values(rowState).filter((state) => state === "error").length;

  function toggleAll() {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        for (const student of visibleStudents) next.delete(student.id);
      } else {
        for (const student of visibleStudents) next.add(student.id);
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function sendSelected() {
    if (sendingRef.current) return;
    const queue = students.filter((student) => selected.has(student.id));
    if (queue.length === 0) return;
    sendingRef.current = true;
    setConfirming(false);
    setSending(true);
    let sent = 0;
    let failed = 0;

    for (const student of queue) {
      setRowState((current) => ({ ...current, [student.id]: "sending" }));
      try {
        await sendEmail(student.id);
        sent += 1;
        setRowState((current) => ({ ...current, [student.id]: "sent" }));
      } catch (error) {
        failed += 1;
        setRowState((current) => ({ ...current, [student.id]: "error" }));
        setRowError((current) => ({
          ...current,
          [student.id]:
            error instanceof Error ? error.message : "No se pudo enviar",
        }));
      }
    }

    sendingRef.current = false;
    setSending(false);
    if (failed === 0) {
      toast.success(`Se enviaron ${sent} correos`);
    } else {
      toast.error(`Enviados: ${sent}. Fallaron: ${failed}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {confirming ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted-foreground">
                ¿Enviar {selectedCount} correo{selectedCount === 1 ? "" : "s"}?
              </p>
              <Button
                variant="outline"
                onClick={() => setConfirming(false)}
                disabled={sending}
              >
                Cancelar
              </Button>
              <Button onClick={sendSelected} disabled={sending || selectedCount === 0}>
                <Mail className="h-4 w-4" />
                Confirmar envío
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setConfirming(true)}
              disabled={sending || loading || selectedCount === 0}
            >
              <Mail className="h-4 w-4" />
              {sending
                ? "Enviando..."
                : `Enviar a ${selectedCount} seleccionado${selectedCount === 1 ? "" : "s"}`}
            </Button>
          )}
        </div>
      </div>

      {children}

      <div className="grid grid-cols-3 gap-3">
        <Summary label="Con correo" value={students.length} />
        <Summary label="Enviados" value={sentCount} />
        <Summary label="Fallaron" value={failedCount} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="space-y-3 border-b border-border bg-muted/20 p-3 sm:p-4">
          <TableSearch
            value={query}
            onChange={setQuery}
            placeholder="Buscar nombre, correo, carnet o ticket"
            resultCount={visibleStudents.length}
          />
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 accent-foreground"
              checked={allVisibleSelected}
              disabled={sending || visibleStudents.length === 0}
              onChange={toggleAll}
            />
            Seleccionar todos
          </label>
        </div>

        {loading ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            Cargando estudiantes...
          </p>
        ) : loadError ? (
          <p className="px-4 py-12 text-center text-sm text-destructive">{loadError}</p>
        ) : students.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            No hay estudiantes con correo.
          </p>
        ) : visibleStudents.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            Sin coincidencias
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {visibleStudents.map((student) => {
              const state = rowState[student.id] ?? "idle";
              return (
                <li key={student.id}>
                  <label className="flex items-center gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-foreground"
                      checked={selected.has(student.id)}
                      disabled={sending}
                      onChange={() => toggleOne(student.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        <MatchText text={student.full_name} query={query} />
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        <MatchText text={student.email ?? ""} query={query} />
                      </span>
                    </span>
                    <RowStatus state={state} error={rowError[student.id]} />
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function RowStatus({ state, error }: { state: SendState; error?: string }) {
  if (state === "sending") {
    return <span className="shrink-0 text-xs text-muted-foreground">Enviando...</span>;
  }
  if (state === "sent") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-success">
        <MailCheck className="h-3.5 w-3.5" />
        Enviado
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="inline-flex max-w-[12rem] shrink-0 items-center gap-1 text-xs text-destructive">
        <MailX className="h-3.5 w-3.5" />
        <span className="truncate">{error || "Falló"}</span>
      </span>
    );
  }
  return null;
}
