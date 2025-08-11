"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type SerialInputProps = {
  value: string; // combined value, e.g. "1111111111-2222222222-3333333333"
  onChange: (val: string) => void;
  disabled?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
};

const MAX = 10;

export function SerialInput({ value, onChange, disabled, className, ...rest }: SerialInputProps) {
  const [a, b, c] = React.useMemo(() => splitIntoSegments(value), [value]);

  const r1 = React.useRef<HTMLInputElement>(null);
  const r2 = React.useRef<HTMLInputElement>(null);
  const r3 = React.useRef<HTMLInputElement>(null);

  function setSegments(next: [string, string, string]) {
    onChange(joinSegments(next));
  }

  function onPartChange(idx: 0 | 1 | 2) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = onlyDigits(e.target.value);
      const trimmed = raw.slice(0, MAX);

      const next: [string, string, string] = [a, b, c];
      next[idx] = trimmed;
      setSegments(next);

      // Auto-advance when filled
      if (trimmed.length === MAX) {
        if (idx === 0) r2.current?.focus();
        if (idx === 1) r3.current?.focus();
      }
    };
  }

  function onKeyDown(idx: 0 | 1 | 2) {
    return (e: React.KeyboardEvent<HTMLInputElement>) => {
      const el = e.currentTarget;
      if (e.key === "Backspace" && el.selectionStart === 0 && el.selectionEnd === 0) {
        if (idx === 1 && a.length > 0 && b.length === 0) {
          r1.current?.focus();
        } else if (idx === 2 && b.length > 0 && c.length === 0) {
          r2.current?.focus();
        }
      }
      // Left/Right arrow cross-field navigation (nice-to-have)
      if (e.key === "ArrowLeft" && el.selectionStart === 0) {
        if (idx === 1) r1.current?.focus();
        if (idx === 2) r2.current?.focus();
      }
      if (e.key === "ArrowRight" && el.selectionStart === el.value.length) {
        if (idx === 0) r2.current?.focus();
        if (idx === 1) r3.current?.focus();
      }
    };
  }

  function onPaste(idx: 0 | 1 | 2) {
    return (e: React.ClipboardEvent<HTMLInputElement>) => {
      const data = e.clipboardData.getData("text");
      const digits = onlyDigits(data);
      if (!digits) return;

      e.preventDefault();

      const parts: [string, string, string] = [a, b, c];
      // Fill from current index onward
      let cursor = 0;

      for (let i = idx; i < 3; i++) {
        const remaining = digits.slice(cursor, cursor + MAX);
        parts[i] = remaining;
        cursor += remaining.length;
        if (cursor >= digits.length) break;
      }

      setSegments(parts);

      // Focus the first unfilled field
      if (parts[0].length < MAX) r1.current?.focus();
      else if (parts[1].length < MAX) r2.current?.focus();
      else r3.current?.focus();
    };
  }

  return (
    <div className={cn("flex w-full items-center gap-2", className)}>
      <SegmentInput
        ref={r1}
        value={a}
        onChange={onPartChange(0)}
        onKeyDown={onKeyDown(0)}
        onPaste={onPaste(0)}
        disabled={disabled}
        aria-label="Serial number part 1 of 3"
        {...rest}
      />
      <Dash />
      <SegmentInput
        ref={r2}
        value={b}
        onChange={onPartChange(1)}
        onKeyDown={onKeyDown(1)}
        onPaste={onPaste(1)}
        disabled={disabled}
        aria-label="Serial number part 2 of 3"
        {...rest}
      />
      <Dash />
      <SegmentInput
        ref={r3}
        value={c}
        onChange={onPartChange(2)}
        onKeyDown={onKeyDown(2)}
        onPaste={onPaste(2)}
        disabled={disabled}
        aria-label="Serial number part 3 of 3"
        {...rest}
      />
    </div>
  );
}

const SegmentInput = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof Input>>(
  function SegmentInput(props, ref) {
    return (
      <Input
        ref={ref}
        inputMode="numeric"
        pattern="\d*"
        maxLength={MAX}
        className={cn(
          "h-11 text-center font-mono tracking-widest",
          // ensure equal widths without growing too large
          "w-full"
        )}
        {...props}
      />
    );
  }
);

function Dash() {
  return (
    <span aria-hidden className="text-muted-foreground select-none">
      -
    </span>
  );
}

// --- helpers ---
function onlyDigits(v: string) {
  return v.replace(/\D+/g, "");
}

function splitIntoSegments(v: string): [string, string, string] {
  // Accept both dashed and raw digits; distribute left-to-right
  const digits = onlyDigits(v).slice(0, MAX * 3);
  const a = digits.slice(0, MAX);
  const b = digits.slice(MAX, MAX * 2);
  const c = digits.slice(MAX * 2, MAX * 3);
  return [a, b, c];
}

function joinSegments([a, b, c]: [string, string, string]) {
  let out = a;
  if (b.length > 0 || c.length > 0) out += "-" + b;
  if (c.length > 0) out += "-" + c;
  return out;
}
