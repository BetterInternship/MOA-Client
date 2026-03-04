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
  source?: string;
  prefiller?: unknown;
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
      source?: string;
      prefiller?: unknown;
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
        signing_party_id?: string;
        source?: string;
        prefiller?: unknown;
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
        signing_party_id?: string;
        source?: string;
        prefiller?: unknown;
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
    source?: string;
    prefiller?: unknown;
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
      signing_party_id?: string;
      source?: string;
      prefiller?: unknown;
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
      signing_party_id?: string;
      source?: string;
      prefiller?: unknown;
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
      signing_party_id: schema?.signing_party_id ?? source.signing_party_id,
      source: schema?.source ?? source.source,
      prefiller: schema?.prefiller ?? source.prefiller,
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

export const normalizePreviewFieldKey = (fieldKey: string): string =>
  String(fieldKey ?? "")
    .trim()
    .replace(/:default$/i, "")
    .replace(/:auto$/i, "");

export const resolveAutoPreviewValue = (fieldKey: string, now = new Date()): string => {
  const normalized = normalizePreviewFieldKey(fieldKey).toLowerCase();
  if (normalized === "auto.current-date") return now.getTime().toString();
  if (normalized === "auto.current-day") return now.getDate().toString();
  if (normalized === "auto.current-month") return (now.getMonth() + 1).toString();
  if (normalized === "auto.current-year") return now.getFullYear().toString();
  return "";
};

export const DEFAULT_PREVIEW_DUMMY_STUDENT_USER: Record<string, string> = {
  first_name: "Test",
  middle_name: "",
  last_name: "Student",
  name: "Test Student",
  college: "Test College",
  department: "Test Department",
  university: "Test University",
  phone_number: "+639171234567",
  email: "test.student@example.com",
  id_number: "12345678",
};

type PreviewPrefillMode = "live" | "dummy" | "none";

const toSafeScalarString = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint" ||
    typeof value === "symbol"
  ) {
    return String(value);
  }
  if (value instanceof Date) return String(value.getTime());
  return "";
};

const getUserValueString = (
  user: Record<string, unknown> | null | undefined,
  key: string
): string => {
  const value = user?.[key];
  return toSafeScalarString(value).trim();
};

const inferNameParts = (user: Record<string, unknown> | null | undefined) => {
  const firstName = getUserValueString(user, "first_name");
  const middleName = getUserValueString(user, "middle_name");
  const lastName = getUserValueString(user, "last_name");
  const fullName = [firstName, middleName, lastName]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (firstName || middleName || lastName) {
    return { firstName, middleName, lastName, fullName };
  }

  const singleName = getUserValueString(user, "name");
  if (!singleName) {
    return { firstName: "", middleName: "", lastName: "", fullName: "" };
  }

  const nameTokens = singleName.split(/\s+/).filter(Boolean);
  return {
    firstName: nameTokens[0] || "",
    middleName: nameTokens.length > 2 ? nameTokens.slice(1, -1).join(" ") : "",
    lastName: nameTokens.length > 1 ? nameTokens[nameTokens.length - 1] : "",
    fullName: singleName,
  };
};

const resolvePrefillValue = (
  field: PreviewField,
  user: Record<string, unknown> | null | undefined
): string => {
  if (!user) return "";

  const { firstName, middleName, lastName, fullName } = inferNameParts(user);
  const normalizedField = normalizePreviewFieldKey(field.field).toLowerCase();
  const rawField = String(field.field ?? "").trim();
  const normalizedFieldCaseSensitive = normalizePreviewFieldKey(rawField);
  const directFieldCandidates = [
    rawField,
    normalizedFieldCaseSensitive,
    `${normalizedFieldCaseSensitive}:default`,
    normalizedFieldCaseSensitive.replace(/[.-]/g, "_"),
  ];

  for (const candidate of directFieldCandidates) {
    const candidateValue = getUserValueString(user, candidate);
    if (candidateValue) return candidateValue;
  }

  const directMap: Record<string, string> = {
    "student.school": getUserValueString(user, "college"),
    "student.college": getUserValueString(user, "college"),
    "student.department": getUserValueString(user, "department"),
    "student.university": getUserValueString(user, "university"),
    "student.first-name": firstName,
    "student.middle-name": middleName,
    "student.last-name": lastName,
    "student.full-name": fullName,
    "student-signature": fullName,
    "student.phone-number": getUserValueString(user, "phone_number"),
    "student.id-number": getUserValueString(user, "id_number"),
    "student.email": getUserValueString(user, "email"),
  };
  const mapped = directMap[normalizedField];
  if (mapped) return mapped;

  if (typeof field.prefiller === "function") {
    try {
      const prefiller = field.prefiller as (params: {
        user: Record<string, unknown> | null | undefined;
      }) => unknown;
      const value = prefiller({ user });
      return toSafeScalarString(value).trim();
    } catch {
      return "";
    }
  }

  if (typeof field.prefiller === "string") {
    const match = field.prefiller.match(/user\.([a-zA-Z0-9_]+)/);
    if (match?.[1]) return getUserValueString(user, match[1]);
  }

  return "";
};

const resolveFallbackValue = ({
  field,
  user,
  prefillMode,
  nowFactory,
}: {
  field: PreviewField;
  user: Record<string, unknown> | null | undefined;
  prefillMode: PreviewPrefillMode;
  nowFactory: () => Date;
}) => {
  const source = String(field.source ?? "").toLowerCase();
  const normalizedField = normalizePreviewFieldKey(field.field).toLowerCase();

  if (source === "auto" || normalizedField.startsWith("auto.current-")) {
    return resolveAutoPreviewValue(field.field, nowFactory());
  }

  if (prefillMode === "none") return "";

  const shouldUsePrefill =
    source === "prefill" ||
    normalizedField.startsWith("student.") ||
    normalizedField === "student-signature";
  if (!shouldUsePrefill) return "";

  const effectiveUser = prefillMode === "dummy" ? DEFAULT_PREVIEW_DUMMY_STUDENT_USER : user;
  return resolvePrefillValue(field, effectiveUser);
};

export const createPreviewDisplayValueResolver = ({
  user,
  prefillMode = "live",
  nowFactory = () => new Date(),
}: {
  user?: Record<string, unknown> | null;
  prefillMode?: PreviewPrefillMode;
  nowFactory?: () => Date;
}) => {
  return (field: PreviewField, rawValue: unknown): string => {
    const rawString = Array.isArray(rawValue)
      ? rawValue
          .map((entry) => toSafeScalarString(entry))
          .filter(Boolean)
          .join(", ")
      : rawValue == null
        ? ""
        : toSafeScalarString(rawValue);
    if (rawString.trim()) return rawString;

    return resolveFallbackValue({
      field,
      user,
      prefillMode,
      nowFactory,
    });
  };
};

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
