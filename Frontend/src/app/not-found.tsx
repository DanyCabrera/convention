import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-bold text-muted-foreground/30">404</p>
      <h1 className="text-xl font-semibold">Página no encontrada</h1>
      <p className="text-sm text-muted-foreground">
        El recurso que buscas no existe o fue movido.
      </p>
      <Button asChild>
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
