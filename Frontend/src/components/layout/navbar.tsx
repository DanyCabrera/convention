"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Menu, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchSuggestionsInput } from "@/components/search/search-suggestions-input";
import { useEvent } from "@/hooks/use-event";
import { useParticipantIndex } from "@/hooks/use-participant-index";
import { formatShortDate } from "@/lib/utils";
import { AppLogo } from "@/components/layout/app-logo";

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const router = useRouter();
  const { event } = useEvent();
  const { students, loading } = useParticipantIndex();
  const [query, setQuery] = useState("");

  function goSearch(value: string) {
    const q = value.trim();
    if (!q) return;
    router.push(`/estudiantes?search=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-30 flex h-[var(--navbar-height)] items-center gap-2 border-b border-border bg-card/80 px-3 backdrop-blur-md sm:gap-4 sm:px-4 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <AppLogo size={32} className="shrink-0 md:hidden" />

      <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
        <AppLogo size={32} className="lg:hidden" />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold">{event.name}</h1>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formatShortDate(event.date)}</span>
          </div>
        </div>
      </div>

      <SearchSuggestionsInput
        value={query}
        onValueChange={setQuery}
        students={students}
        loading={loading}
        placeholder="Buscar nombre o ticket..."
        ariaLabel="Buscar participantes"
        className="min-w-0 flex-1 md:max-w-sm lg:max-w-md"
        clearOnSelect
        onSelect={(student) => router.push(`/tickets/${student.id}`)}
        onSubmitQuery={goSearch}
      />

      <Link
        href="/configuracion"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Información del evento"
      >
        <Settings className="h-5 w-5" />
      </Link>
    </header>
  );
}
