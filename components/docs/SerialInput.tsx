// components/docs/UnifiedSerialInput.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: string; // "1111111111-2222222222-3333333333"
  onChange: (val: string) => void;
  disabled?: boolean;
  className?: string;
};

const MAX = 10;

export function SerialInput({ value, onChange, disabled, className }: Props) {
  const [a, b, c] = split(value);
  const r1 = React.useRef<HTMLInputElement>(null);
  const r2 = React.useRef<HTMLInputElement>(null);
  const r3 = React.useRef<HTMLInputElement>(null);

  const set = (A: string, B: string, C: string) => onChange(join(A, B, C));

  const onPart = (idx: 0 | 1 | 2) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = digits(e.target.value).slice(0, MAX);
    if (idx === 0) set(v, b, c);
    if (idx === 1) set(a, v, c);
    if (idx === 2) set(a, b, v);
    if (v.length === MAX) (idx === 0 ? r2 : idx === 1 ? r3 : null)?.current?.focus();
  };

  const back = (idx: 0 | 1 | 2) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    if (e.key === "Backspace" && el.selectionStart === 0 && el.selectionEnd === 0) {
      if (idx === 1 && !b) r1.current?.focus();
      if (idx === 2 && !c) r2.current?.focus();
    }
  };

  const pasteFirst = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const d = digits(e.clipboardData.getData("text")).slice(0, 30);
    if (!d) return;
    e.preventDefault();
    set(d.slice(0, 10), d.slice(10, 20), d.slice(20, 30));
    if (d.length <= 10) r1.current?.focus();
    else if (d.length <= 20) r2.current?.focus();
    else r3.current?.focus();
  };

  return (
    <div
      className={cn(
        "flex items-center gap-0 rounded-md border bg-white",
        "font-mono tabular-nums",
        className
      )}
    >
      <Segment
        ref={r1}
        value={a}
        onChange={onPart(0)}
        onKeyDown={back(0)}
        onPaste={pasteFirst}
        disabled={disabled}
        placeholder="0123456789"
        aria-label="Serial number part 1 of 3"
      />
      <Dash />
      <Segment
        ref={r2}
        value={b}
        onChange={onPart(1)}
        onKeyDown={back(1)}
        disabled={disabled}
        placeholder="aabbccdd"
        aria-label="Serial number part 2 of 3"
      />
      <Dash />
      <Segment
        ref={r3}
        value={c}
        onChange={onPart(2)}
        onKeyDown={back(2)}
        disabled={disabled}
        placeholder="ff001122"
        aria-label="Serial number part 3 of 3"
      />
    </div>
  );
}

const Segment = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Segment(props, ref) {
    return (
      <input
        ref={ref}
        inputMode="numeric"
        pattern="\d*"
        maxLength={MAX}
        className={cn(
          "w-[11ch] shrink-0",
          "placeholder:text-muted-foreground/40 text-center tracking-[0.01em]",
          "border-none bg-transparent outline-none focus:ring-0"
        )}
        {...props}
      />
    );
  }
);

function Dash() {
  return (
    <span aria-hidden className="text-muted-foreground/60 leading-none select-none">
      –
    </span>
  );
}

function digits(v: string) {
  return v.replace(/\D+/g, "");
}
function split(v: string): [string, string, string] {
  const d = digits(v).slice(0, 30);
  return [d.slice(0, 10), d.slice(10, 20), d.slice(20, 30)];
}
function join(a: string, b: string, c: string) {
  return [a, b, c].filter(Boolean).join("-");
}
