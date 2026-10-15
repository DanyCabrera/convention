"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { rankSuggestions, suggestionDetail } from "@/lib/search-suggestions";
import type { StudentWithTicket } from "@/types";

interface SearchSuggestionsInputProps {
  value: string;
  onValueChange: (value: string) => void;
  students: StudentWithTicket[];
  placeholder: string;
  ariaLabel: string;
  className?: string;
  loading?: boolean;
  onSelect?: (student: StudentWithTicket) => void;
  onSubmitQuery?: (query: string) => void;
  clearOnSelect?: boolean;
}

function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  const index = text.toLowerCase().indexOf(needle.toLowerCase());
  if (!needle || index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-transparent font-semibold text-primary">
        {text.slice(index, index + needle.length)}
      </mark>
      {text.slice(index + needle.length)}
    </>
  );
}

export function SearchSuggestionsInput({
  value,
  onValueChange,
  students,
  placeholder,
  ariaLabel,
  className,
  loading,
  onSelect,
  onSubmitQuery,
  clearOnSelect,
}: SearchSuggestionsInputProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const suggestions = useMemo(
    () => (open ? rankSuggestions(students, value) : []),
    [open, students, value]
  );

  useEffect(() => {
    setActiveIndex(-1);
  }, [value]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function choose(student: StudentWithTicket) {
    onValueChange(clearOnSelect ? "" : student.full_name);
    onSelect?.(student);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (current + 1) % suggestions.length);
      return;
    }
    if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1
      );
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const selected = suggestions[activeIndex];
      if (selected) {
        choose(selected);
        return;
      }
      setOpen(false);
      onSubmitQuery?.(value);
    }
  }

  const showList = open && value.trim().length > 0;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
        }
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        enterKeyHint="search"
        onChange={(event) => {
          onValueChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="bg-muted/50 pl-9 focus-visible:bg-card"
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-80 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-xl"
        >
          {loading && students.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-muted-foreground">Buscando...</li>
          ) : suggestions.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-muted-foreground">
              Sin coincidencias
            </li>
          ) : (
            suggestions.map((student, index) => (
              <li
                key={student.id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
              >
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(student)}
                  className={cn(
                    "flex w-full flex-col rounded-lg px-3 py-2 text-left",
                    index === activeIndex ? "bg-primary/10" : "hover:bg-muted"
                  )}
                >
                  <span className="truncate text-sm font-medium">
                    <Highlight text={student.full_name} query={value} />
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {suggestionDetail(student)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
