import { EstudiantesView } from "./estudiantes-view";

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function EstudiantesPage({ searchParams }: PageProps) {
  const { search } = await searchParams;
  return <EstudiantesView initialSearch={search ?? ""} />;
}
