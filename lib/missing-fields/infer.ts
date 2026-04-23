import type {
  DetectedBlankRegion,
  InferredFieldKind,
  MissingFieldSuggestion,
  PdfTextToken,
} from "@/lib/missing-fields/types";

const normalizeText = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();

const distanceToRegion = (token: PdfTextToken, region: DetectedBlankRegion) => {
  const rx = region.x + region.w / 2;
  const ry = region.y + region.h / 2;
  return Math.hypot(token.cx - rx, token.cy - ry);
};

const getNearbyTokens = (region: DetectedBlankRegion, pageTokens: PdfTextToken[]) => {
  const search = {
    x1: region.x - 180,
    y1: region.y - 26,
    x2: region.x + region.w + 100,
    y2: region.y + region.h + 28,
  };

  return pageTokens
    .filter((token) => {
      const overlapsX = token.x < search.x2 && token.x + token.w > search.x1;
      const overlapsY = token.y < search.y2 && token.y + token.h > search.y1;
      return overlapsX && overlapsY;
    })
    .sort((a, b) => distanceToRegion(a, region) - distanceToRegion(b, region));
};

const inferKind = (region: DetectedBlankRegion, nearbyText: string): InferredFieldKind => {
  const normalized = normalizeText(nearbyText);

  if (region.patternType === "horizontal-line" && /\bsign(ature|ed)?\b/.test(normalized)) {
    return "signature";
  }

  if (/\bsign(ature|ed)?\b/.test(normalized)) return "signature";
  if (/\bdate\b|\bdd\b|\bmm\b|\byyyy\b/.test(normalized)) return "date";
  return "text";
};

const inferLabel = (kind: InferredFieldKind, nearbyText: string): string => {
  const normalized = normalizeText(nearbyText);

  if (kind === "signature") return "Signature";
  if (kind === "date") return "Date";

  if (/\bemail\b/.test(normalized)) return "Email";
  if (/\bphone\b|\bmobile\b|\bcontact\b/.test(normalized)) return "Phone Number";
  if (/\bname\b/.test(normalized)) return "Name";

  const firstMeaningful = nearbyText
    .split(/\s+/)
    .map((chunk) => chunk.replace(/[^a-z0-9]/gi, "").trim())
    .find((chunk) => chunk.length >= 2);

  if (firstMeaningful) {
    return firstMeaningful.charAt(0).toUpperCase() + firstMeaningful.slice(1);
  }

  return "New Field";
};

export function inferSuggestionMetadata(
  regions: DetectedBlankRegion[],
  tokensByPage: Map<number, PdfTextToken[]>
): Array<
  Omit<MissingFieldSuggestion, "classification" | "coveredByFieldId"> & {
    classification: "missing";
  }
> {
  return regions.map((region) => {
    const nearbyTokens = getNearbyTokens(region, tokensByPage.get(region.page) || []);
    const nearbyText = nearbyTokens
      .slice(0, 8)
      .map((token) => token.text)
      .join(" ")
      .trim();

    const inferredKind = inferKind(region, nearbyText);
    const inferredLabel = inferLabel(inferredKind, nearbyText);

    return {
      ...region,
      inferredKind,
      inferredLabel,
      nearbyText,
      classification: "missing",
    };
  });
}
