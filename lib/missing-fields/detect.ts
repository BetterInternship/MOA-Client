import { OPS } from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist/types/src/display/api";
import type { DetectionResult, DetectedBlankRegion, PdfTextToken } from "@/lib/missing-fields/types";

const MIN_LINE_LENGTH = 48;
const MAX_LINE_THICKNESS = 3.5;
const MIN_RECT_WIDTH = 12;
const MAX_RECT_WIDTH = 280;
const MIN_RECT_HEIGHT = 8;
const MAX_RECT_HEIGHT = 48;
const DEFAULT_LINE_FIELD_HEIGHT = 12;
const DEFAULT_TEXT_BASELINE_FROM_TOP = 9.8;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const identityMatrix = (): number[] => [1, 0, 0, 1, 0, 0];

const multiplyMatrix = (a: number[], b: number[]) => {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
};

const applyMatrix = (m: number[], x: number, y: number) => {
  return {
    x: m[0] * x + m[2] * y + m[4],
    y: m[1] * x + m[3] * y + m[5],
  };
};

const stableRegionId = (region: Omit<DetectedBlankRegion, "id">) => {
  const rx = Math.round(region.x);
  const ry = Math.round(region.y);
  const rw = Math.round(region.w);
  const rh = Math.round(region.h);
  return `p${region.page}:${region.patternType}:${rx}:${ry}:${rw}:${rh}`;
};

const normalizeCandidate = (
  candidate: Omit<DetectedBlankRegion, "id">,
  pageWidth: number,
  pageHeight: number
): DetectedBlankRegion | null => {
  const x = clamp(candidate.x, 0, Math.max(0, pageWidth - 1));
  const y = clamp(candidate.y, 0, Math.max(0, pageHeight - 1));
  const w = clamp(candidate.w, 0, Math.max(0, pageWidth - x));
  const h = clamp(candidate.h, 0, Math.max(0, pageHeight - y));

  if (w < 8 || h < 6) return null;

  return {
    ...candidate,
    id: stableRegionId({ ...candidate, x, y, w, h }),
    x,
    y,
    w,
    h,
  };
};

const rectIou = (a: DetectedBlankRegion, b: DetectedBlankRegion) => {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);

  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  if (intersection <= 0) return 0;

  const areaA = a.w * a.h;
  const areaB = b.w * b.h;
  return intersection / Math.max(1, areaA + areaB - intersection);
};

const rectOverlapOverSmaller = (a: DetectedBlankRegion, b: DetectedBlankRegion) => {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);

  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  if (intersection <= 0) return 0;
  const smallerArea = Math.max(1, Math.min(a.w * a.h, b.w * b.h));
  return intersection / smallerArea;
};

const horizontalOverlapRatio = (a: DetectedBlankRegion, b: DetectedBlankRegion) => {
  const x1 = Math.max(a.x, b.x);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const overlap = Math.max(0, x2 - x1);
  const minWidth = Math.max(1, Math.min(a.w, b.w));
  return overlap / minWidth;
};

const dedupeRegions = (regions: DetectedBlankRegion[]) => {
  const sorted = [...regions].sort((a, b) => b.confidence - a.confidence);
  const kept: DetectedBlankRegion[] = [];

  for (const region of sorted) {
    const duplicate = kept.some((existing) => {
      if (existing.page !== region.page) return false;

      // Strong geometric overlap (handles same-region multi-pass detections).
      if (rectIou(existing, region) >= 0.58) return true;
      if (rectOverlapOverSmaller(existing, region) >= 0.72) return true;

      // Merge stacked near-identical horizontal suggestions (common in table lines).
      const yCenterDistance = Math.abs(
        existing.y + existing.h / 2 - (region.y + region.h / 2)
      );
      const widthRatio = Math.min(existing.w, region.w) / Math.max(existing.w, region.w);
      const similarBand = yCenterDistance <= 10 && widthRatio >= 0.72;
      if (!similarBand) return false;
      return horizontalOverlapRatio(existing, region) >= 0.8;
    });
    if (!duplicate) kept.push(region);
  }

  return kept;
};

const extractTextTokensForPage = async (
  pdfPage: PDFPageProxy,
  page: number,
  pageWidth: number,
  pageHeight: number
): Promise<PdfTextToken[]> => {
  const text = await pdfPage.getTextContent();
  const tokens: PdfTextToken[] = [];

  const isTextItemLike = (
    candidate: unknown
  ): candidate is { str: string; transform: number[]; width: number; height: number } => {
    if (!candidate || typeof candidate !== "object") return false;
    const item = candidate as Record<string, unknown>;
    return (
      typeof item.str === "string" &&
      Array.isArray(item.transform) &&
      typeof item.width === "number" &&
      typeof item.height === "number"
    );
  };

  for (const item of text.items || []) {
    if (!isTextItemLike(item)) continue;
    const raw = item.str.replace(/\s+/g, " ").trim();
    if (!raw) continue;

    const transform = Array.isArray(item.transform) ? item.transform : [1, 0, 0, 1, 0, 0];
    const tx = Number(transform[4]) || 0;
    const ty = Number(transform[5]) || 0;
    const width = Math.max(4, Number(item.width) || 0);
    const height = Math.max(8, Math.abs(Number(item.height) || Number(transform[3]) || 0));

    // Most docs expose bottom-left oriented y for content operations. Convert to top-left space.
    const topY = clamp(pageHeight - ty - height, 0, Math.max(0, pageHeight - height));

    const x = clamp(tx, 0, Math.max(0, pageWidth - width));
    const y = topY;
    const w = Math.min(width, Math.max(4, pageWidth - x));
    const h = Math.min(height, Math.max(8, pageHeight - y));

    tokens.push({
      page,
      text: raw,
      x,
      y,
      w,
      h,
      cx: x + w / 2,
      cy: y + h / 2,
    });
  }

  return tokens;
};

const detectUnderscoreRegions = (
  page: number,
  tokens: PdfTextToken[],
  pageWidth: number,
  pageHeight: number
): DetectedBlankRegion[] => {
  const candidates: DetectedBlankRegion[] = [];

  for (const token of tokens) {
    const matches = [...token.text.matchAll(/_{4,}/g)];
    if (!matches.length) continue;

    for (const match of matches) {
      const start = match.index || 0;
      const length = match[0].length;
      const ratioStart = start / Math.max(1, token.text.length);
      const ratioLength = length / Math.max(1, token.text.length);

      const baseRegion = normalizeCandidate(
        {
          page,
          x: token.x + token.w * ratioStart,
          // Align detected underline with the inferred text baseline inside the suggestion box.
          y: token.y + token.h - DEFAULT_TEXT_BASELINE_FROM_TOP,
          w: Math.max(36, token.w * ratioLength),
          h: Math.max(DEFAULT_LINE_FIELD_HEIGHT, token.h + 2),
          patternType: "underscore",
          confidence: 0.92,
        },
        pageWidth,
        pageHeight
      );

      if (baseRegion) {
        candidates.push(baseRegion);
      }
    }
  }

  return candidates;
};

const bboxFromPoints = (points: Array<{ x: number; y: number }>) => {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
};

const detectVectorRegions = async (
  pdfPage: PDFPageProxy,
  page: number,
  pageHeight: number,
  pageWidth: number
): Promise<DetectedBlankRegion[]> => {
  const operatorList = await pdfPage.getOperatorList();

  const candidates: DetectedBlankRegion[] = [];
  const matrixStack: number[][] = [];
  let ctm = identityMatrix();
  let lineWidth = 1;

  for (let index = 0; index < operatorList.fnArray.length; index += 1) {
    const fn = operatorList.fnArray[index];
    const args = operatorList.argsArray[index] as unknown[];

    if (fn === OPS.save) {
      matrixStack.push([...ctm]);
      continue;
    }

    if (fn === OPS.restore) {
      ctm = matrixStack.pop() || identityMatrix();
      continue;
    }

    if (fn === OPS.transform) {
      const transform = (args?.[0] || args) as number[];
      if (Array.isArray(transform) && transform.length >= 6) {
        ctm = multiplyMatrix(ctm, transform.slice(0, 6));
      }
      continue;
    }

    if (fn === OPS.setLineWidth) {
      const width = Number(args?.[0]);
      if (Number.isFinite(width) && width > 0) {
        lineWidth = width;
      }
      continue;
    }

    if (fn !== OPS.constructPath) continue;

    const pathOps = (args?.[0] || []) as number[];
    const pathCoords = (args?.[1] || []) as number[];

    if (!Array.isArray(pathOps) || !Array.isArray(pathCoords)) continue;

    let cursor = { x: 0, y: 0 };
    let coordIndex = 0;

    for (const pathOp of pathOps) {
      if (pathOp === OPS.moveTo) {
        const x = Number(pathCoords[coordIndex]);
        const y = Number(pathCoords[coordIndex + 1]);
        coordIndex += 2;
        if (Number.isFinite(x) && Number.isFinite(y)) {
          cursor = { x, y };
        }
        continue;
      }

      if (pathOp === OPS.lineTo) {
        const x = Number(pathCoords[coordIndex]);
        const y = Number(pathCoords[coordIndex + 1]);
        coordIndex += 2;
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

        const start = applyMatrix(ctm, cursor.x, cursor.y);
        const end = applyMatrix(ctm, x, y);
        cursor = { x, y };

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.hypot(dx, dy);

        if (length < MIN_LINE_LENGTH) continue;
        if (Math.abs(dy) > MAX_LINE_THICKNESS) continue;

        const yTop = pageHeight - (start.y + end.y) / 2;
        const region = normalizeCandidate(
          {
            page,
            x: Math.min(start.x, end.x),
            // Place the suggestion so its text baseline sits on the detected line.
            y: yTop - DEFAULT_TEXT_BASELINE_FROM_TOP,
            w: Math.abs(dx),
            h: DEFAULT_LINE_FIELD_HEIGHT,
            patternType: "horizontal-line",
            confidence: length > 100 ? 0.84 : 0.77,
          },
          pageWidth,
          pageHeight
        );

        if (region) candidates.push(region);
        continue;
      }

      if (pathOp === OPS.rectangle) {
        const x = Number(pathCoords[coordIndex]);
        const y = Number(pathCoords[coordIndex + 1]);
        const w = Number(pathCoords[coordIndex + 2]);
        const h = Number(pathCoords[coordIndex + 3]);
        coordIndex += 4;

        if (![x, y, w, h].every((value) => Number.isFinite(value))) continue;

        const points = [
          applyMatrix(ctm, x, y),
          applyMatrix(ctm, x + w, y),
          applyMatrix(ctm, x + w, y + h),
          applyMatrix(ctm, x, y + h),
        ];
        const bbox = bboxFromPoints(points);
        const width = Math.abs(bbox.maxX - bbox.minX);
        const height = Math.abs(bbox.maxY - bbox.minY);

        if (
          width < MIN_RECT_WIDTH ||
          width > MAX_RECT_WIDTH ||
          height < MIN_RECT_HEIGHT ||
          height > MAX_RECT_HEIGHT
        ) {
          continue;
        }

        const region = normalizeCandidate(
          {
            page,
            x: bbox.minX,
            y: pageHeight - bbox.maxY,
            w: width,
            h: height,
            patternType: "rectangle",
            confidence: lineWidth <= 2 ? 0.8 : 0.73,
          },
          pageWidth,
          pageHeight
        );

        if (region) candidates.push(region);
        continue;
      }

      if (pathOp === OPS.curveTo) {
        coordIndex += 6;
      } else if (pathOp === OPS.curveTo2 || pathOp === OPS.curveTo3) {
        coordIndex += 4;
      } else if (pathOp === OPS.closePath) {
        // no-op
      }
    }
  }

  return candidates;
};

const suppressDenseTextRegions = (regions: DetectedBlankRegion[], tokensByPage: Map<number, PdfTextToken[]>) => {
  return regions.filter((region) => {
    const pageTokens = tokensByPage.get(region.page) || [];
    const expanded = {
      x1: region.x - 8,
      y1: region.y - 6,
      x2: region.x + region.w + 8,
      y2: region.y + region.h + 6,
    };

    const nearbyTextCount = pageTokens.filter((token) => {
      const overlapsX = token.x < expanded.x2 && token.x + token.w > expanded.x1;
      const overlapsY = token.y < expanded.y2 && token.y + token.h > expanded.y1;
      return overlapsX && overlapsY;
    }).length;

    if (region.patternType === "underscore") return true;

    // Rectangles that contain explicit visible words are usually table/header cells,
    // not fillable blank fields.
    if (region.patternType === "rectangle") {
      const hasVisibleTextInside = pageTokens.some((token) => {
        if (!/[a-z0-9]/i.test(token.text)) return false;
        const tokenCenterX = token.x + token.w / 2;
        const tokenCenterY = token.y + token.h / 2;
        return (
          tokenCenterX >= region.x + 2 &&
          tokenCenterX <= region.x + region.w - 2 &&
          tokenCenterY >= region.y + 2 &&
          tokenCenterY <= region.y + region.h - 2
        );
      });
      if (hasVisibleTextInside) return false;
    }

    return nearbyTextCount <= 4;
  });
};

const keepHighConfidenceOnly = (regions: DetectedBlankRegion[]) => {
  return regions.filter((region) => region.confidence >= 0.72);
};

export async function detectPdfBlankRegions(pdfDoc: PDFDocumentProxy): Promise<DetectionResult> {
  const regions: DetectedBlankRegion[] = [];
  const tokensByPage = new Map<number, PdfTextToken[]>();

  for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber += 1) {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const pageWidth = viewport.width;
    const pageHeight = viewport.height;

    const tokens = await extractTextTokensForPage(page, pageNumber, pageWidth, pageHeight);
    tokensByPage.set(pageNumber, tokens);

    regions.push(...detectUnderscoreRegions(pageNumber, tokens, pageWidth, pageHeight));
    regions.push(...(await detectVectorRegions(page, pageNumber, pageHeight, pageWidth)));
  }

  const highConfidence = keepHighConfidenceOnly(regions);
  const deduped = dedupeRegions(highConfidence);
  const noiseSuppressed = suppressDenseTextRegions(deduped, tokensByPage);

  return {
    regions: noiseSuppressed,
    tokensByPage,
  };
}
