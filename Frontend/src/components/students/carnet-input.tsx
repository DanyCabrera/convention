"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  formatCarnet,
  getCarnetSegments,
  mergeCarnetSegments,
} from "@/lib/carnet";

interface CarnetInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

const SEGMENT_MAX = [4, 2, 6] as const;

export function CarnetInput({
  id = "carnet",
  value,
  onChange,
  disabled,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: CarnetInputProps) {
  const [s1, s2, s3] = getCarnetSegments(value);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);

  function handleSegmentChange(index: 0 | 1 | 2, raw: string) {
    const clean = raw.replace(/\D/g, "");
    const segments = [s1, s2, s3];
    segments[index] = clean.slice(0, SEGMENT_MAX[index]);

    const merged = mergeCarnetSegments(segments[0], segments[1], segments[2]);
    onChange(formatCarnet(merged));

    if (index === 0 && segments[0].length === 4) ref2.current?.focus();
    if (index === 1 && segments[1].length === 2) ref3.current?.focus();
  }

  function handleKeyDown(
    index: 0 | 1 | 2,
    e: KeyboardEvent<HTMLInputElement>
  ) {
    const segments = [s1, s2, s3];
    if (e.key === "Backspace" && segments[index] === "") {
      if (index === 1) {
        e.preventDefault();
        document.getElementById(`${id}-seg-0`)?.focus();
      }
      if (index === 2) {
        e.preventDefault();
        ref2.current?.focus();
      }
    }
  }

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    onChange(formatCarnet(pasted));
  }

  const inputClass =
    "h-10 text-center font-mono tracking-wider px-2";

  return (
    <div
      className={cn(
        "flex items-center gap-1.5",
        disabled && "opacity-50 pointer-events-none"
      )}
      onPaste={handlePaste}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
    >
      <Input
        id={`${id}-seg-0`}
        inputMode="numeric"
        placeholder="0000"
        maxLength={4}
        value={s1}
        disabled={disabled}
        className={cn(inputClass, "w-[4.5rem] sm:w-20")}
        onChange={(e) => handleSegmentChange(0, e.target.value)}
        onKeyDown={(e) => handleKeyDown(0, e)}
        aria-label="Carnet segmento 1, 4 dígitos"
      />
      <span className="text-muted-foreground font-light select-none">-</span>
      <Input
        ref={ref2}
        id={`${id}-seg-1`}
        inputMode="numeric"
        placeholder="00"
        maxLength={2}
        value={s2}
        disabled={disabled}
        className={cn(inputClass, "w-[3rem] sm:w-14")}
        onChange={(e) => handleSegmentChange(1, e.target.value)}
        onKeyDown={(e) => handleKeyDown(1, e)}
        aria-label="Carnet segmento 2, 2 dígitos"
      />
      <span className="text-muted-foreground font-light select-none">-</span>
      <Input
        ref={ref3}
        id={`${id}-seg-2`}
        inputMode="numeric"
        placeholder="0000"
        maxLength={6}
        value={s3}
        disabled={disabled}
        className={cn(inputClass, "flex-1 min-w-[5rem]")}
        onChange={(e) => handleSegmentChange(2, e.target.value)}
        onKeyDown={(e) => handleKeyDown(2, e)}
        aria-label="Carnet segmento 3, 4 a 6 dígitos"
      />
    </div>
  );
}
