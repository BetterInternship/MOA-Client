import { IFormBlock, IFormField } from "@betterinternship/core/forms";
import { buildFieldRefPrefiller } from "@/lib/default-value-builder";
import {
  sanitizeFieldSchemaDefaults,
  type FieldSchemaDefaults,
} from "@/lib/field-schema-defaults";
import type { ValidatorIRv0 } from "@/lib/validator-ir";
import { SIGNATURE_PRINTED_NAME_TEMPLATE } from "@/lib/composite-field-templates";

type PresetLike = {
  label?: string;
  type?: "text" | "signature" | "image";
  source?: string;
  shared?: boolean;
  tooltip_label?: string;
  prefiller?: string;
  validator?: string;
  validator_ir?: ValidatorIRv0 | null;
  field_schema_defaults?: FieldSchemaDefaults | null;
};

type CreateSignaturePrintedNameBlocksInput = {
  partyId: string;
  page: number;
  x: number;
  y: number;
  signaturePreset?: PresetLike | null;
  shortTextPreset?: PresetLike | null;
};

const createUniqueFieldKey = (base: string) =>
  `${base}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const createBlockId = (prefix: string) =>
  `block_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

const DEFAULT_SIGNATURE_TEXT_SIZE = 25;

export type SignaturePrintedNameDimensions = {
  signatureWidth: number;
  signatureHeight: number;
  printedNameWidth: number;
  printedNameHeight: number;
  gap: number;
  totalHeight: number;
};

export const resolveSignaturePrintedNameDimensions = ({
  signaturePreset,
  shortTextPreset,
}: Pick<CreateSignaturePrintedNameBlocksInput, "signaturePreset" | "shortTextPreset">): SignaturePrintedNameDimensions => {
  const signatureDefaults = sanitizeFieldSchemaDefaults(signaturePreset?.field_schema_defaults);
  const shortTextDefaults = sanitizeFieldSchemaDefaults(shortTextPreset?.field_schema_defaults);

  const signatureWidth = signatureDefaults?.w ?? SIGNATURE_PRINTED_NAME_TEMPLATE.signature.width;
  const signatureHeight = signatureDefaults?.h ?? SIGNATURE_PRINTED_NAME_TEMPLATE.signature.height;
  const printedNameWidth = shortTextDefaults?.w ?? signatureWidth;
  const printedNameHeight = shortTextDefaults?.h ?? SIGNATURE_PRINTED_NAME_TEMPLATE.printedName.height;
  const gap = SIGNATURE_PRINTED_NAME_TEMPLATE.printedName.gap;

  return {
    signatureWidth,
    signatureHeight,
    printedNameWidth,
    printedNameHeight,
    gap,
    totalHeight: signatureHeight + gap + printedNameHeight,
  };
};

export function createSignaturePrintedNameBlocks({
  partyId,
  page,
  x,
  y,
  signaturePreset,
  shortTextPreset,
}: CreateSignaturePrintedNameBlocksInput): IFormBlock[] {
  const signatureDefaults = sanitizeFieldSchemaDefaults(signaturePreset?.field_schema_defaults);
  const shortTextDefaults = sanitizeFieldSchemaDefaults(shortTextPreset?.field_schema_defaults);
  const dimensions = resolveSignaturePrintedNameDimensions({ signaturePreset, shortTextPreset });

  const signatureFieldKey = createUniqueFieldKey("signature");
  const printedNameFieldKey = `${signatureFieldKey}${SIGNATURE_PRINTED_NAME_TEMPLATE.printedName.fieldSuffix}`;
  const printedNameY = y + dimensions.signatureHeight + dimensions.gap;

  const signatureBlock: IFormBlock = {
    _id: createBlockId("signature"),
    block_type: "form_field",
    signing_party_id: partyId,
    order: 0,
    field_schema: {
      field: signatureFieldKey,
      type: signaturePreset?.type || "signature",
      page,
      x,
      y,
      w: dimensions.signatureWidth,
      h: dimensions.signatureHeight,
      align_h: signatureDefaults?.align_h ?? "center",
      align_v: signatureDefaults?.align_v ?? "bottom",
      label: signaturePreset?.label || "Signature",
      tooltip_label: signaturePreset?.tooltip_label || "",
      shared: signaturePreset?.shared ?? true,
      source: signaturePreset?.source || "manual",
      prefiller: signaturePreset?.prefiller || "",
      validator: signaturePreset?.validator || "",
      validator_ir: signaturePreset?.validator_ir ?? null,
      size: signatureDefaults?.size ?? DEFAULT_SIGNATURE_TEXT_SIZE,
      wrap: signatureDefaults?.wrap ?? true,
      font: signatureDefaults?.font,
    } as IFormField,
  };

  const printedNameBlock: IFormBlock = {
    _id: createBlockId("printed_name"),
    block_type: "form_field",
    signing_party_id: partyId,
    order: 0,
    field_schema: {
      field: printedNameFieldKey,
      type: shortTextPreset?.type || "text",
      page,
      x,
      y: printedNameY,
      w: dimensions.printedNameWidth,
      h: dimensions.printedNameHeight,
      align_h: shortTextDefaults?.align_h ?? "center",
      align_v: shortTextDefaults?.align_v ?? "bottom",
      label: SIGNATURE_PRINTED_NAME_TEMPLATE.printedName.label,
      tooltip_label: shortTextPreset?.tooltip_label || "",
      shared: shortTextPreset?.shared ?? true,
      source: "derived",
      prefiller: buildFieldRefPrefiller(signatureFieldKey),
      validator: shortTextPreset?.validator || "",
      validator_ir: shortTextPreset?.validator_ir ?? null,
      size: shortTextDefaults?.size,
      wrap: shortTextDefaults?.wrap ?? true,
      font: shortTextDefaults?.font,
    } as IFormField,
  };

  return [signatureBlock, printedNameBlock];
}
