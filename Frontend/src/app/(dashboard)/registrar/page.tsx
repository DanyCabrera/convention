import { RegisterPanel } from "@/components/students/register-panel";

export default function RegistrarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registrar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Agrega un estudiante o un docente. Al guardar se genera el ticket.
        </p>
      </div>
      <RegisterPanel />
    </div>
  );
}
