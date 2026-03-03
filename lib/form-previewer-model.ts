import { type IFormBlock, type IFormSigningParty } from "@betterinternship/core/forms";
import { getPartyColorByIndex } from "@/lib/party-colors";

export type PreviewFieldType = "text" | "signature" | "image";

type ValidatorRuleLike = { kind?: string };
type ValidatorIrLike = { rules?: ValidatorRuleLike[] } | null;

export interface PreviewField {
  id: string;
  field: string;
  label: string;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  size?: number;
  wrap?: boolean;
  align_h?: "left" | "center" | "right";
  align_v?: "top" | "middle" | "bottom";
  font?: string;
  type?: PreviewFieldType;
  signing_party_id?: string;
  validator_ir?: ValidatorIrLike;
  required?: boolean;
}

export interface OwnerMeta {
  ownerRoleId: string;
  ownerGroupId: "company" | "university" | "student" | "witness" | "other";
  ownerLabel: string;
  ownerColorHex: string;
  isMine: boolean;
  isKnownOwner: boolean;
}

export type PreviewFieldLike =
  | PreviewField
  | IFormBlock
  | {
      field?: string;
      label?: string;
      page?: number;
      x?: number;
      y?: number;
      w?: number;
      h?: number;
      size?: number;
      wrap?: boolean;
      align_h?: "left" | "center" | "right";
      align_v?: "top" | "middle" | "bottom";
      font?: string;
      type?: PreviewFieldType;
      signing_party_id?: string;
      validator_ir?: ValidatorIrLike;
      required?: boolean;
      _id?: string;
      field_schema?: {
        field?: string;
        label?: string;
        page?: number;
        x?: number;
        y?: number;
        w?: number;
        h?: number;
        size?: number;
        wrap?: boolean;
        align_h?: "left" | "center" | "right";
        align_v?: "top" | "middle" | "bottom";
        font?: string;
        type?: PreviewFieldType;
        validator_ir?: ValidatorIrLike;
        required?: boolean;
      };
      phantom_field_schema?: {
        field?: string;
        label?: string;
        page?: number;
        x?: number;
        y?: number;
        w?: number;
        h?: number;
        size?: number;
        wrap?: boolean;
        align_h?: "left" | "center" | "right";
        align_v?: "top" | "middle" | "bottom";
        font?: string;
        type?: PreviewFieldType;
        validator_ir?: ValidatorIrLike;
        required?: boolean;
      };
    };

function asFieldLike(input: PreviewFieldLike) {
  return input as {
    _id?: string;
    field?: string;
    label?: string;
    page?: number;
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    size?: number;
    wrap?: boolean;
    align_h?: "left" | "center" | "right";
    align_v?: "top" | "middle" | "bottom";
    font?: string;
    type?: PreviewFieldType;
    signing_party_id?: string;
    validator_ir?: ValidatorIrLike;
    required?: boolean;
    field_schema?: {
      field?: string;
      label?: string;
      page?: number;
      x?: number;
      y?: number;
      w?: number;
      h?: number;
      size?: number;
      wrap?: boolean;
      align_h?: "left" | "center" | "right";
      align_v?: "top" | "middle" | "bottom";
      font?: string;
      type?: PreviewFieldType;
      validator_ir?: ValidatorIrLike;
      required?: boolean;
    };
    phantom_field_schema?: {
      field?: string;
      label?: string;
      page?: number;
      x?: number;
      y?: number;
      w?: number;
      h?: number;
      size?: number;
      wrap?: boolean;
      align_h?: "left" | "center" | "right";
      align_v?: "top" | "middle" | "bottom";
      font?: string;
      type?: PreviewFieldType;
      validator_ir?: ValidatorIrLike;
      required?: boolean;
    };
  };
}

export function normalizePreviewFields(inputs: PreviewFieldLike[]): PreviewField[] {
  const normalized: PreviewField[] = [];

  for (const input of inputs) {
    const source = asFieldLike(input);
    const schema = source.field_schema ?? source.phantom_field_schema;

    const field = schema?.field ?? source.field;
    if (!field) continue;

    const type = schema?.type ?? source.type;
    if (type === "image") continue;

    const page = schema?.page ?? source.page ?? 1;
    const x = schema?.x ?? source.x ?? 0;
    const y = schema?.y ?? source.y ?? 0;
    const w = schema?.w ?? source.w ?? 0;
    const h = schema?.h ?? source.h ?? 0;

    normalized.push({
      id: source._id || `${field}:${page}:${x}:${y}:${normalized.length}`,
      field,
      label: schema?.label ?? source.label ?? field,
      page,
      x,
      y,
      w,
      h,
      size: schema?.size ?? source.size,
      wrap: schema?.wrap ?? source.wrap,
      align_h: schema?.align_h ?? source.align_h,
      align_v: schema?.align_v ?? source.align_v,
      font: schema?.font ?? source.font,
      type,
      signing_party_id: source.signing_party_id,
      validator_ir: schema?.validator_ir ?? source.validator_ir,
      required: schema?.required ?? source.required,
    });
  }

  return normalized;
}

export function groupFieldsByPage(fields: PreviewField[]) {
  const byPage = new Map<number, PreviewField[]>();

  for (const field of fields) {
    const list = byPage.get(field.page) || [];
    list.push(field);
    byPage.set(field.page, list);
  }

  return byPage;
}

export function isFieldRequired(field: PreviewField): boolean {
  if (typeof field.required === "boolean") return field.required;
  const rules = field.validator_ir?.rules || [];
  return rules.some((rule) => rule?.kind === "required");
}

function inferOwnerGroupId(title: string): OwnerMeta["ownerGroupId"] {
  const normalized = title.toLowerCase();
  if (/(company|entity|employer|industry)/.test(normalized)) return "company";
  if (/(university|school|college|faculty)/.test(normalized)) return "university";
  if (/(student|intern|trainee)/.test(normalized)) return "student";
  if (/witness/.test(normalized)) return "witness";
  return "other";
}

function groupColorHex(groupId: OwnerMeta["ownerGroupId"]): string {
  switch (groupId) {
    case "company":
      return "#2563eb";
    case "university":
      return "#0f766e";
    case "student":
      return "#ca8a04";
    case "witness":
      return "#dc2626";
    case "other":
    default:
      return "#64748b";
  }
}

export function resolveOwnerMeta(
  field: PreviewField,
  signingParties: IFormSigningParty[],
  currentSigningPartyId?: string,
  useGroupColors = false
): OwnerMeta {
  const ownerRoleId = field.signing_party_id || "unknown";
  const party = signingParties.find((candidate) => candidate._id === ownerRoleId);

  if (!party) {
    return {
      ownerRoleId,
      ownerGroupId: "other",
      ownerLabel: "Unassigned",
      ownerColorHex: "#94a3b8",
      isMine: false,
      isKnownOwner: false,
    };
  }

  const isMine = !!currentSigningPartyId && party._id === currentSigningPartyId;
  const ownerGroupId = inferOwnerGroupId(party.signatory_title || party._id);
  const ownerColorHex = useGroupColors
    ? groupColorHex(ownerGroupId)
    : getPartyColorByIndex(Math.max(0, party.order - 1)).hex;

  return {
    ownerRoleId,
    ownerGroupId,
    ownerLabel: isMine ? "You" : party.signatory_title || party._id,
    ownerColorHex,
    isMine,
    isKnownOwner: true,
  };
}
