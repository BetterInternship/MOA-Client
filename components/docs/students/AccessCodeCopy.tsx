"use client";

import { Clipboard } from "lucide-react";
import { cn } from "@/lib/utils";

export function AccessCodeCopy({
  code,
  onCopy,
  stopPropagation = false,
  className,
}: {
  code: string;
  onCopy: (code: string) => void | Promise<void>;
  stopPropagation?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      title="Copy access code"
      className={cn(
        "group/code text-primary bg-primary/20 hover:bg-primary/30 inline-flex cursor-pointer items-center gap-1.5 rounded-[0.33em] px-2 py-1 font-mono text-sm font-bold tracking-wide transition-colors",
        className
      )}
      onClick={(event) => {
        if (stopPropagation) event.stopPropagation();
        void onCopy(code);
      }}
    >
      <span>{code}</span>
      <Clipboard className="h-3.5 w-3.5 transition-transform duration-200 group-hover/code:scale-110 group-hover/code:-rotate-6" />
    </button>
  );
}
