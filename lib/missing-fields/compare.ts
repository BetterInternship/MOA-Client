import type { ExistingFieldRect, MissingFieldSuggestion } from "@/lib/missing-fields/types";

const getIntersectionArea = (
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
) => {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  return Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
};

const iou = (
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
) => {
  const intersection = getIntersectionArea(a, b);
  if (intersection <= 0) return 0;
  const union = a.w * a.h + b.w * b.h - intersection;
  return intersection / Math.max(1, union);
};

const centerInside = (
  inner: { x: number; y: number; w: number; h: number },
  outer: { x: number; y: number; w: number; h: number },
  padding = 0
) => {
  const cx = inner.x + inner.w / 2;
  const cy = inner.y + inner.h / 2;
  return (
    cx >= outer.x - padding &&
    cx <= outer.x + outer.w + padding &&
    cy >= outer.y - padding &&
    cy <= outer.y + outer.h + padding
  );
};

export function classifyBlankRegionsAgainstBlocks(
  suggestions: MissingFieldSuggestion[],
  mappedFields: ExistingFieldRect[]
): MissingFieldSuggestion[] {
  return suggestions.map((suggestion) => {
    const samePage = mappedFields.filter((field) => field.page === suggestion.page);

    let coveredByFieldId: string | undefined;
    for (const field of samePage) {
      const overlap = iou(suggestion, field);
      const suggestionCenterInField = centerInside(suggestion, field, 8);
      const fieldCenterInSuggestion = centerInside(field, suggestion, 12);

      if (overlap >= 0.22 || suggestionCenterInField || fieldCenterInSuggestion) {
        coveredByFieldId = field.blockId;
        break;
      }
    }

    if (!coveredByFieldId) {
      return {
        ...suggestion,
        classification: "missing",
      };
    }

    return {
      ...suggestion,
      classification: "covered",
      coveredByFieldId,
    };
  });
}
