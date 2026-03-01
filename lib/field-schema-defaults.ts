import type { IFormField } from "@betterinternship/core/forms";

export type FieldSchemaDefaults = Partial<
  Pick<IFormField, "w" | "h" | "wrap" | "size" | "align_h" | "align_v" | "font">
>;

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

export const sanitizeFieldSchemaDefaults = (value: unknown): FieldSchemaDefaults | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Record<string, unknown>;
  const defaults: FieldSchemaDefaults = {};

  if (typeof candidate.wrap === "boolean") defaults.wrap = candidate.wrap;
  const w = toFiniteNumber(candidate.w);
  if (w !== null && w > 0) {
    defaults.w = w;
  }
  const h = toFiniteNumber(candidate.h);
  if (h !== null && h > 0) {
    defaults.h = h;
  }
  const size = toFiniteNumber(candidate.size);
  if (size !== null) {
    defaults.size = size;
  }

  if (
    candidate.align_h === "left" ||
    candidate.align_h === "center" ||
    candidate.align_h === "right"
  ) {
    defaults.align_h = candidate.align_h;
  }

  if (
    candidate.align_v === "top" ||
    candidate.align_v === "middle" ||
    candidate.align_v === "bottom"
  ) {
    defaults.align_v = candidate.align_v;
  }

  if (typeof candidate.font === "string" && candidate.font.trim().length > 0) {
    defaults.font = candidate.font as IFormField["font"];
  }

  return Object.keys(defaults).length > 0 ? defaults : undefined;
};
