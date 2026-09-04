"use client";

import { useRouter } from "next/navigation";
import { FormEvent, KeyboardEvent } from "react";
import { Calendar, Menu, Search, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEvent } from "@/hooks/use-event";
import { formatShortDate } from "@/lib/utils";
import { AppLogo } from "@/components/layout/app-logo";

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const router = useRouter();
  const { event } = useEvent();

  function goSearch(value: string) {
    const q = value.trim();
    if (!q) return;
    router.push(`/estudiantes?search=${encodeURIComponent(q)}`);
  }

  function onSearchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("search") as HTMLInputElement;
    goSearch(input.value);
  }

  function onSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      goSearch(e.currentTarget.value);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-[var(--navbar-height)] items-center gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-md lg:px-6">
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

      <form
        onSubmit={onSearchSubmit}
        className="relative flex-1 md:max-w-sm lg:max-w-md"
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="search"
          placeholder="Buscar por nombre, correo o ticket..."
          onKeyDown={onSearchKeyDown}
          className="pl-9 bg-muted/50 border-transparent focus-visible:bg-card"
          aria-label="Buscar participantes"
        />
      </form>

      <Link
        href="/configuracion"
        className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Información del evento"
      >
        <Settings className="h-5 w-5" />
      </Link>
    </header>
  );
}
