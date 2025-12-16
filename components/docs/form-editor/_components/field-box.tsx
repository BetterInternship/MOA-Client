"use client";

import { cn } from "@/lib/utils";

export type FormField = {
  field: string;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type FieldBoxProps = {
  field: FormField;
  isSelected?: boolean;
  onSelect?: () => void;
};

export const FieldBox = ({ field, isSelected, onSelect }: FieldBoxProps) => {
  return (
    <div
      className={cn(
        "absolute inset-0 cursor-pointer border-2 transition-colors",
        isSelected ? "border-primary bg-primary/10" : "border-amber-500/50 bg-amber-50/30"
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      title={field.field}
    >
      <div className="text-muted-foreground px-1 py-0.5 text-xs font-semibold">{field.field}</div>
    </div>
  );
};
