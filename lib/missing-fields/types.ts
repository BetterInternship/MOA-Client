import type { IFormBlock } from "@betterinternship/core/forms";

export type InferredFieldKind = "text" | "date" | "signature";

export type DetectedPatternType = "underscore" | "horizontal-line" | "rectangle";

export type SuggestionClassification = "covered" | "missing" | "ignored";

export type PdfTextToken = {
  page: number;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
};

export type DetectedBlankRegion = {
  id: string;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  patternType: DetectedPatternType;
  confidence: number;
};

export type MissingFieldSuggestion = DetectedBlankRegion & {
  inferredKind: InferredFieldKind;
  inferredLabel: string;
  nearbyText: string;
  classification: SuggestionClassification;
  coveredByFieldId?: string;
};

export type DetectionResult = {
  regions: DetectedBlankRegion[];
  tokensByPage: Map<number, PdfTextToken[]>;
};

export type ExistingFieldRect = {
  blockId: string;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

export const toExistingFieldRects = (blocks: IFormBlock[]): ExistingFieldRect[] => {
  return blocks
    .filter((block) => block.block_type === "form_field" && block.field_schema)
    .map((block) => ({
      blockId: block._id,
      page: block.field_schema!.page,
      x: block.field_schema!.x,
      y: block.field_schema!.y,
      w: block.field_schema!.w,
      h: block.field_schema!.h,
    }))
    .filter((field) => Number.isFinite(field.page) && field.page > 0);
};
