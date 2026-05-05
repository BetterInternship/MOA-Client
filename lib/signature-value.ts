export type SignatureImageSource = "draw" | "upload";

export type SignatureImageValue = {
  kind: "signature-image";
  source: SignatureImageSource;
  dataUrl: string;
  mimeType: "image/png" | "image/jpeg";
};

const SIGNATURE_IMAGE_KIND = "signature-image";
const SIGNATURE_IMAGE_FIELD_PREFIX = "__signatureImage:";

export const getSignatureImageFieldKey = (fieldKey: string): string =>
  `${SIGNATURE_IMAGE_FIELD_PREFIX}${fieldKey}`;

export const createSignatureImageValue = (
  input: Omit<SignatureImageValue, "kind">
): SignatureImageValue => ({
  kind: SIGNATURE_IMAGE_KIND,
  ...input,
});

export const serializeSignatureImageValue = (value: SignatureImageValue): string =>
  JSON.stringify(value);

export const parseSignatureImageValue = (value: unknown): SignatureImageValue | null => {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const parsed = JSON.parse(value) as Partial<SignatureImageValue> | null;
    if (!parsed || parsed.kind !== SIGNATURE_IMAGE_KIND) return null;
    if (parsed.source !== "draw" && parsed.source !== "upload") return null;
    if (parsed.mimeType !== "image/png" && parsed.mimeType !== "image/jpeg") return null;
    if (typeof parsed.dataUrl !== "string") return null;
    if (!parsed.dataUrl.startsWith(`data:${parsed.mimeType};base64,`)) return null;

    return {
      kind: SIGNATURE_IMAGE_KIND,
      source: parsed.source,
      dataUrl: parsed.dataUrl,
      mimeType: parsed.mimeType,
    };
  } catch {
    return null;
  }
};
