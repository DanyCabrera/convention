import { EstudiantesView } from "./estudiantes-view";

interface PageProps {
  searchParams: Promise<{ search?: string; plan?: string; tipo?: string }>;
}

export default async function EstudiantesPage({ searchParams }: PageProps) {
  const { search, plan, tipo } = await searchParams;
  return (
    <EstudiantesView
      initialSearch={search ?? ""}
      initialPlan={plan ?? "all"}
      initialTipo={tipo ?? "estudiante"}
    />
  );
}
