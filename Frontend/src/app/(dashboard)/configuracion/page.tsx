"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEvent } from "@/hooks/use-event";
import { formatShortDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConfiguracionPage() {
  const { event } = useEvent();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Información del evento</h1>
      </div>

      <Card className="glass-card max-w-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Datos del evento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {!event.name ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <>
              <div>
                <p className="text-muted-foreground">Universidad</p>
                <p className="font-medium">{event.university}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Nombre</p>
                <p className="font-medium">{event.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fecha</p>
                <p className="font-medium">{formatShortDate(event.date)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Lugar</p>
                <p className="font-medium">{event.location}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
