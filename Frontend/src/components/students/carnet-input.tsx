"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CARNET_PREFIX_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  formatCarnet,
  getCarnetSegments,
  isValidCarnetPrefix,
  mergeCarnetSegments,
} from "@/lib/carnet";
import { PLAN_META, getPlanFromCarnet, type Plan } from "@/lib/plans";

interface CarnetInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  onPlanChange?: (plan: Plan | null) => void;
}

const SEGMENT_MAX = [4, 2, 6] as const;

export function CarnetInput({
  id = "carnet",
  value,
  onChange,
  disabled,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  onPlanChange,
}: CarnetInputProps) {
  const [s1, s2, s3] = getCarnetSegments(value);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const prefix = isValidCarnetPrefix(s1) ? s1 : undefined;

  function emitChange(next: string) {
    const formatted = formatCarnet(next);
    onChange(formatted);
    onPlanChange?.(getPlanFromCarnet(formatted));
  }

  function handlePrefixChange(nextPrefix: string) {
    const merged = mergeCarnetSegments(nextPrefix, s2, s3);
    emitChange(merged);
    ref2.current?.focus();
  }

  function handleSegmentChange(index: 1 | 2, raw: string) {
    const clean = raw.replace(/\D/g, "");
    const segments = [s1, s2, s3];
    segments[index] = clean.slice(0, SEGMENT_MAX[index]);

    const merged = mergeCarnetSegments(segments[0], segments[1], segments[2]);
    emitChange(merged);

    if (index === 1 && segments[1].length === 2) ref3.current?.focus();
  }

  function handleKeyDown(
    index: 1 | 2,
    e: KeyboardEvent<HTMLInputElement>
  ) {
    const segments = [s1, s2, s3];
    if (e.key === "Backspace" && segments[index] === "") {
      if (index === 1) {
        e.preventDefault();
        document.getElementById(`${id}-prefix`)?.focus();
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
    emitChange(pasted);
  }

  const inputClass =
    "h-10 text-center font-mono tracking-wider px-2";

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex items-center gap-1.5",
          disabled && "opacity-50 pointer-events-none"
        )}
        onPaste={handlePaste}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      >
        <Select
          value={prefix}
          onValueChange={handlePrefixChange}
          disabled={disabled}
        >
          <SelectTrigger
            id={`${id}-prefix`}
            className={cn(inputClass, "w-[5.5rem] sm:w-24 font-mono")}
            aria-label="Prefijo de carnet (plan)"
          >
            <SelectValue placeholder="----" />
          </SelectTrigger>
          <SelectContent>
            {CARNET_PREFIX_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground font-light select-none">-</span>
        <Input
          ref={ref2}
          id={`${id}-seg-1`}
          inputMode="numeric"
          placeholder="00"
          maxLength={2}
          value={s2}
          disabled={disabled || !prefix}
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
          disabled={disabled || !prefix}
          className={cn(inputClass, "flex-1 min-w-[5rem]")}
          onChange={(e) => handleSegmentChange(2, e.target.value)}
          onKeyDown={(e) => handleKeyDown(2, e)}
          aria-label="Carnet segmento 3, 4 a 6 dígitos"
        />
      </div>
      {prefix && (
        <p className="text-xs text-muted-foreground">
          {PLAN_META[getPlanFromCarnet(prefix)!].label}
        </p>
      )}
    </div>
  );
}
