"use client";

import { BulkStudentEmail } from "@/components/email/bulk-student-email";
import { api } from "@/lib/api";

export default function JuegoPage() {
  return (
    <BulkStudentEmail title="Juego" sendEmail={api.sendGame}>
      <section className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-sm font-semibold">Correo que se enviará</h2>
        <p className="text-sm">
          <span className="font-medium">Asunto:</span> ¡Participa en el juego de la Convención Tecnológica!
        </p>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Estimados alumnos:</p>
          <p>
            Te compartimos el enlace para participar en el juego de la Convención Tecnológica.
            ¡Ingresa y diviértete!
          </p>
          <a
            href="https://72.61.7.158/play"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block break-all text-primary underline underline-offset-4"
          >
            https://72.61.7.158/play
          </a>
          <p>Comité Organizador — XIV Convención de Ciencia y Tecnología</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Todos los estudiantes con correo y registro activo están seleccionados por defecto.
          Puedes ajustar la selección antes de confirmar el envío.
        </p>
      </section>
    </BulkStudentEmail>
  );
}
