import type { IFormField } from "@betterinternship/core/forms";

export type FieldSchemaDefaults = Partial<
  Pick<IFormField, "wrap" | "size" | "align_h" | "align_v" | "font">
>;

export const sanitizeFieldSchemaDefaults = (value: unknown): FieldSchemaDefaults | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Record<string, unknown>;
  const defaults: FieldSchemaDefaults = {};

  if (typeof candidate.wrap === "boolean") defaults.wrap = candidate.wrap;
  if (typeof candidate.size === "number" && Number.isFinite(candidate.size)) {
    defaults.size = candidate.size;
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
