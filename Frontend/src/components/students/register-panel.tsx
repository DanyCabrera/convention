"use client";

import { useState } from "react";
import { GraduationCap, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { RegisterStudentForm } from "@/components/students/register-form";
import { RegisterTeacherForm } from "@/components/students/register-teacher-form";

type RegisterType = "estudiante" | "docente";

export function RegisterPanel() {
  const [type, setType] = useState<RegisterType>("estudiante");

  return (
    <Card className="mx-auto max-w-2xl glass-card">
      <CardContent className="pt-5">
        <div className="mb-5 flex gap-1 rounded-xl bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => setType("estudiante")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              type === "estudiante"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={type === "estudiante"}
          >
            <GraduationCap className="h-4 w-4" />
            Estudiante
          </button>
          <button
            type="button"
            onClick={() => setType("docente")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              type === "docente"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={type === "docente"}
          >
            <UserRound className="h-4 w-4" />
            Docente
          </button>
        </div>

        {type === "estudiante" ? <RegisterStudentForm /> : <RegisterTeacherForm />}
      </CardContent>
    </Card>
  );
}
