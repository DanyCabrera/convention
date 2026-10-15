"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface TableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  resultCount: number;
}

export function TableSearch({
  value,
  onChange,
  placeholder,
  resultCount,
}: TableSearchProps) {
  const searching = value.trim().length > 0;
  const label =
    resultCount === 1 ? "1 coincidencia" : `${resultCount} coincidencias`;

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete="off"
        className="h-11 rounded-2xl border-border bg-card pl-10 pr-36 shadow-none [&::-webkit-search-cancel-button]:hidden"
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {searching && (
          <span className="text-xs text-muted-foreground">{label}</span>
        )}
        {searching && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Limpiar búsqueda"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
