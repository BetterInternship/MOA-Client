/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 16:03:54
 * @ Modified by: Your name
 * @ Modified time: 2025-12-26 01:41:33
 * @ Description: pdf viewer component using pdfjs
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { GlobalWorkerOptions, getDocument, version as pdfjsVersion } from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist/types/src/display/api";
import type { PageViewport } from "pdfjs-dist/types/src/display/display_utils";
import { ZoomIn, ZoomOut, FileUp } from "lucide-react";
import { FieldBox, type FormField } from "./FieldBox";
import { GhostField } from "./GhostField";
import {
  getFieldLabel,
  getFieldName,
} from "@/app/docs/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/field-template.ctx";
import type { FieldRegistryEntry } from "@/app/api";
import { Button } from "@/components/ui/button";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export type { FormField };

export type PointerLocation = {
  page: number;
  pdfX: number;
  pdfY: number;
  displayX: number;
  displayY: number;
  viewportWidth: number;
  viewportHeight: number;
};

type PdfViewerProps = {
  initialUrl?: string;
  fields?: FormField[];
  selectedFieldId?: string;
  onFieldSelect?: (fieldId: string) => void;
  onFieldChange?: (fieldId: string, updates: Partial<FormField>) => void;
  onFieldCreate?: (field: FormField) => void;
  onFieldDelete?: (fieldId: string) => void;
  onFieldDuplicate?: (fieldId: string) => void;
  isPlacingField?: boolean;
  placementFieldType?: string;
  onPlacementFieldTypeChange?: (type: string) => void;
  onStartPlacing?: () => void;
  onCancelPlacing?: () => void;
  onFileSelect?: (file: File) => void;
  registry?: FieldRegistryEntry[];
};

export function PdfViewer({
  initialUrl,
  fields = [],
  selectedFieldId,
  onFieldSelect,
  onFieldChange,
  onFieldCreate,
  isPlacingField = false,
  placementFieldType = "signature",
  onFileSelect,
  registry = [],
}: PdfViewerProps) {
  const searchParams = useSearchParams();
  const [pendingUrl, setPendingUrl] = useState<string>(initialUrl ?? "");
  const [sourceUrl, setSourceUrl] = useState<string | null>(pendingUrl);
  const [fileName, setFileName] = useState<string>("");
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.1);
  const [visiblePage, setVisiblePage] = useState<number>(1);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [hoverPoint, setHoverPoint] = useState<PointerLocation | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hoverPointDuringPlacement, setHoverPointDuringPlacement] =
    useState<PointerLocation | null>(null);

  const pageRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const urlFromQuery = searchParams.get("url");
    if (urlFromQuery) {
      setPendingUrl(urlFromQuery);
      setSourceUrl(urlFromQuery);
    }
  }, [searchParams]);

  // Update URL when initialUrl prop changes
  useEffect(() => {
    if (initialUrl) {
      setPendingUrl(initialUrl);
      setSourceUrl(initialUrl);
    }
  }, [initialUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const workerFile = pdfjsVersion.startsWith("4") ? "pdf.worker.min.mjs" : "pdf.worker.min.js";
    GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/${workerFile}`;
  }, []);

  useEffect(() => {
    if (!sourceUrl) return;

    setIsLoadingDoc(true);
    let cancelled = false;
    const loadingTask = getDocument({ url: sourceUrl });

    loadingTask.promise
      .then((doc) => {
        if (cancelled) return;
        setPdfDoc(doc);
        setPageCount(doc.numPages);
        setSelectedPage(1);
        setVisiblePage(1);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load PDF", err);
        setError(err?.message ?? "Failed to load PDF document");
        setPdfDoc(null);
        setPageCount(0);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDoc(false);
      });

    return () => {
      cancelled = true;
      loadingTask.destroy();
    };
  }, [sourceUrl]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const registerPageRef = useCallback((page: number, node: HTMLDivElement | null) => {
    pageRefs.current.set(page, node);
  }, []);

  const handleZoom = (direction: "in" | "out") => {
    const delta = direction === "in" ? 0.1 : -0.1;
    setScale((prev) => clamp(parseFloat((prev + delta).toFixed(2)), 0.5, 3));
  };

  const handleJumpToPage = (page: number) => {
    if (!page || page < 1 || page > pageCount) return;
    setSelectedPage(page);
    const node = pageRefs.current.get(page);
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = url;

    setFileName(file.name);
    setPendingUrl(url);
    setSourceUrl(url);

    // Call the callback to notify parent about file selection
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const pagesArray = useMemo(
    () => Array.from({ length: pageCount }, (_, idx) => idx + 1),
    [pageCount]
  );

  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    // Get the first PDF file
    const file = Array.from(files).find((f) => f.type === "application/pdf") || files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = url;

    setFileName(file.name);
    setPendingUrl(url);
    setSourceUrl(url);

    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50">
      {/* Header with zoom controls */}
      <div className="flex-shrink-0 border-b bg-white px-4 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1"></div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleZoom("out")}
              disabled={scale <= 0.5}
              title="Zoom Out"
              className="rounded p-2 text-sm transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-muted-foreground min-w-12 text-center text-xs">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => handleZoom("in")}
              disabled={scale >= 3}
              title="Zoom In"
              className="rounded p-2 text-sm transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
          <label className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 text-sm transition-colors hover:bg-slate-100">
            <FileUp className="h-4 w-4" />
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
      </div>

      {/* PDF Viewer Canvas */}
      <div className="relative flex-1 overflow-hidden bg-white">
        {isLoadingDoc && (
          <div className="bg-background/70 absolute inset-0 z-10 flex items-center justify-center">
            <Loader>Loading PDF…</Loader>
          </div>
        )}

        {error && (
          <div className="text-destructive flex h-full items-center justify-center text-sm">
            {error}
          </div>
        )}

        {!error && !pdfDoc && !isLoadingDoc && (
          <div className="flex h-full flex-col items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-base font-medium text-slate-900">Drop your PDF here</p>
              <p className="mt-1 text-sm text-slate-500">or click the button below to browse</p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "flex h-80 w-120 cursor-pointer flex-col items-center justify-center rounded-[0.33em] border-2 border-dashed transition-colors",
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-300 bg-slate-50 hover:border-slate-400"
              )}
            >
              <FileUp className="h-16 w-16 text-slate-400" />
            </div>

            <label className="cursor-pointer">
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button asChild>
                <span>
                  <FileUp className="h-5 w-5" />
                  Upload PDF
                </span>
              </Button>
            </label>
          </div>
        )}

        {pdfDoc && (
          <div className="h-full overflow-y-auto p-4" aria-live="polite">
            <div className="flex flex-col items-center gap-4">
              {pagesArray.map((page) => (
                <PdfPageCanvas
                  key={page}
                  pdf={pdfDoc}
                  pageNumber={page}
                  scale={scale}
                  isSelected={page === selectedPage}
                  isVisible={page === visiblePage}
                  onVisible={setVisiblePage}
                  onHover={setHoverPoint}
                  onClick={() => {}}
                  registerPageRef={registerPageRef}
                  fields={fields}
                  selectedFieldId={selectedFieldId}
                  onFieldSelect={onFieldSelect}
                  onFieldChange={onFieldChange}
                  isPlacingField={isPlacingField}
                  placementFieldType={placementFieldType}
                  hoverPointDuringPlacement={hoverPointDuringPlacement}
                  onHoverPlacement={setHoverPointDuringPlacement}
                  onPlaceField={onFieldCreate}
                  registry={registry}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type PdfPageCanvasProps = {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  isSelected: boolean;
  isVisible: boolean;
  onVisible: (page: number) => void;
  onHover: (loc: PointerLocation | null) => void;
  onClick: (loc: PointerLocation) => void;
  registerPageRef: (page: number, node: HTMLDivElement | null) => void;
  fields?: FormField[];
  selectedFieldId?: string;
  onFieldSelect?: (fieldId: string) => void;
  onFieldChange?: (fieldId: string, updates: Partial<FormField>) => void;
  isPlacingField?: boolean;
  placementFieldType?: string;
  onHoverPlacement?: (loc: PointerLocation | null) => void;
  hoverPointDuringPlacement?: PointerLocation | null;
  onPlaceField?: (field: FormField) => void;
  registry?: FieldRegistryEntry[];
};

const PdfPageCanvas = ({
  pdf,
  pageNumber,
  scale,
  isSelected,
  isVisible,
  onVisible,
  onHover,
  onClick,
  registerPageRef,
  fields = [],
  selectedFieldId,
  onFieldSelect,
  onFieldChange,
  isPlacingField = false,
  placementFieldType = "signature",
  onHoverPlacement,
  onPlaceField,
  hoverPointDuringPlacement,
  registry = [],
}: PdfPageCanvasProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportRef = useRef<PageViewport | null>(null);
  const [rendering, setRendering] = useState<boolean>(false);
  const [localHover, setLocalHover] = useState<PointerLocation | null>(null);
  const [forceRender, setForceRender] = useState<number>(0);

  useEffect(() => registerPageRef(pageNumber, containerRef.current), [pageNumber, registerPageRef]);

  // Force re-render of field positions when scale changes
  useEffect(() => {
    setForceRender((prev) => prev + 1);
  }, [scale]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) onVisible(pageNumber);
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [onVisible, pageNumber]);

  useEffect(() => {
    let renderTask: RenderTask | null = null;
    let cancelled = false;
    setRendering(true);

    pdf
      .getPage(pageNumber)
      .then((page: PDFPageProxy) => {
        if (cancelled) return;
        const viewport = page.getViewport({ scale });
        viewportRef.current = viewport;

        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) return;

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = viewport.width * outputScale;
        canvas.height = viewport.height * outputScale;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const renderContext = {
          canvasContext: context,
          viewport,
          transform: [outputScale, 0, 0, outputScale, 0, 0],
        } as const;

        renderTask = page.render(renderContext);
        return renderTask.promise;
      })
      .catch((err) => {
        if (err?.name === "RenderingCancelledException") return;
        console.error("Failed to render page", err);
      })
      .finally(() => {
        if (!cancelled) setRendering(false);
      });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdf, pageNumber, scale]);

  const extractLocation = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ): PointerLocation | null => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !viewport) return null;

    const rect = canvas.getBoundingClientRect();
    const containerRect = canvas.parentElement?.getBoundingClientRect();
    if (!containerRect) return null;

    // Coordinates relative to canvas for PDF calculation
    const cssX = event.clientX - rect.left;
    const cssY = event.clientY - rect.top;

    // Coordinates relative to container for crosshair overlay
    const displayX = event.clientX - containerRect.left;
    const displayY = event.clientY - containerRect.top;

    const outputScale = window.devicePixelRatio || 1;
    const scaledX = (cssX * canvas.width) / rect.width;
    const scaledY = (cssY * canvas.height) / rect.height;
    const [pdfX, pdfYBottom] = viewport.convertToPdfPoint(
      scaledX / outputScale,
      scaledY / outputScale
    ) as [number, number];

    // Convert from PDF bottom-left origin to top-left origin -- this is for the PDF generator
    // Use original (unzoomed) PDF height for the flip calculation
    const actualPdfHeight = viewport.height / scale;
    const pdfY = actualPdfHeight - pdfYBottom;

    return {
      page: pageNumber,
      pdfX,
      pdfY,
      displayX,
      displayY,
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
    };
  };

  // Inverse of extractLocation: convert PDF coords to display position
  const pdfToDisplay = (pdfX: number, pdfY: number) => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !viewport) return null;

    const rect = canvas.getBoundingClientRect();
    const containerRect = canvas.parentElement?.getBoundingClientRect();
    if (!containerRect) return null;

    const outputScale = window.devicePixelRatio || 1;
    const actualPdfHeight = viewport.height / scale;
    const pdfYBottom = actualPdfHeight - pdfY;

    const viewportPoint = viewport.convertToViewportPoint(pdfX, pdfYBottom);
    if (!viewportPoint) return null;
    const [viewportX, viewportY] = viewportPoint;

    // Convert viewport coordinates to CSS pixels
    // Multiply by outputScale to account for device pixel ratio (same as extractLocation does in reverse)
    const cssX = (viewportX * outputScale * rect.width) / canvas.width;
    const cssY = (viewportY * outputScale * rect.height) / canvas.height;

    return {
      displayX: rect.left - containerRect.left + cssX,
      displayY: rect.top - containerRect.top + cssY,
    };
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const location = extractLocation(event);
    setLocalHover(location);
    onHover(location);

    // Update placement hover preview
    if (isPlacingField && onHoverPlacement) {
      onHoverPlacement(location);
    }
  };

  const handleMouseLeave = () => {
    setLocalHover(null);
    onHover(null);
    if (isPlacingField && onHoverPlacement) {
      onHoverPlacement(null);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const location = extractLocation(event);
    if (!location) return;

    // Handle field placement mode
    if (isPlacingField && onPlaceField) {
      const defaultSize = { w: 100, h: 40 };
      const fieldName = getFieldName(placementFieldType, registry);
      const fieldLabel = getFieldLabel(placementFieldType, registry);
      const newField: FormField = {
        id: placementFieldType,
        field: fieldName,
        label: fieldLabel,
        page: pageNumber,
        x: location.pdfX,
        y: location.pdfY,
        ...defaultSize,
      };
      onPlaceField(newField);
      return;
    }

    // Normal click behavior
    onClick(location);
  };

  // Convert display pixel deltas to PDF coordinate deltas
  const displayDeltaToPdfDelta = (displayDeltaX: number, displayDeltaY: number) => {
    const canvas = canvasRef.current;
    const viewport = viewportRef.current;
    if (!canvas || !viewport) return { pdfDeltaX: 0, pdfDeltaY: 0 };

    const rect = canvas.getBoundingClientRect();
    const outputScale = window.devicePixelRatio || 1;

    // Convert display pixels to canvas internal pixels, then to viewport space
    const canvasDeltaX = (displayDeltaX * canvas.width) / rect.width;
    const canvasDeltaY = (displayDeltaY * canvas.height) / rect.height;

    // Convert to viewport space
    const viewportDeltaX = canvasDeltaX / outputScale;
    const viewportDeltaY = canvasDeltaY / outputScale;

    // Viewport space maps directly to PDF space (after zoom adjustment)
    const pdfDeltaX = viewportDeltaX / scale;
    const pdfDeltaY = viewportDeltaY / scale;

    return { pdfDeltaX, pdfDeltaY };
  };

  const handleFieldDrag = (fieldId: string, displayDeltaX: number, displayDeltaY: number) => {
    if (!onFieldChange) return;

    const { pdfDeltaX, pdfDeltaY } = displayDeltaToPdfDelta(displayDeltaX, displayDeltaY);
    // Find field by stable _id or fallback to old format for legacy fields
    const field = fields.find((f) => f._id === fieldId || `${f.field}:${f.page}` === fieldId);
    if (!field) return;

    const newX = Math.max(0, field.x + pdfDeltaX);
    const newY = Math.max(0, field.y + pdfDeltaY);

    onFieldChange(fieldId, { x: newX, y: newY });
  };

  const handleFieldResize = (
    fieldId: string,
    handle: "nw" | "ne" | "sw" | "se",
    displayDeltaX: number,
    displayDeltaY: number
  ) => {
    if (!onFieldChange) return;

    const { pdfDeltaX, pdfDeltaY } = displayDeltaToPdfDelta(displayDeltaX, displayDeltaY);
    // Find field by stable _id or fallback to old format for legacy fields
    const field = fields.find((f) => f._id === fieldId || `${f.field}:${f.page}` === fieldId);
    if (!field) return;

    const updates: Partial<FormField> = {};
    const minSize = 10; // Minimum width/height in PDF units

    // Handle corner resizes: adjust position and size based on which corner is dragged
    if (handle === "nw") {
      // Top-left: move position and shrink size
      updates.x = Math.max(0, field.x + pdfDeltaX);
      updates.y = Math.max(0, field.y + pdfDeltaY);
      updates.w = Math.max(minSize, field.w - pdfDeltaX);
      updates.h = Math.max(minSize, field.h - pdfDeltaY);
    } else if (handle === "ne") {
      // Top-right: move top, grow/shrink width and height
      updates.y = Math.max(0, field.y + pdfDeltaY);
      updates.w = Math.max(minSize, field.w + pdfDeltaX);
      updates.h = Math.max(minSize, field.h - pdfDeltaY);
    } else if (handle === "sw") {
      // Bottom-left: move left, grow/shrink width and height
      updates.x = Math.max(0, field.x + pdfDeltaX);
      updates.w = Math.max(minSize, field.w - pdfDeltaX);
      updates.h = Math.max(minSize, field.h + pdfDeltaY);
    } else if (handle === "se") {
      // Bottom-right: grow/shrink both dimensions
      updates.w = Math.max(minSize, field.w + pdfDeltaX);
      updates.h = Math.max(minSize, field.h + pdfDeltaY);
    }

    onFieldChange?.(fieldId, updates);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full max-w-4xl overflow-hidden rounded-[0.33em] border bg-white shadow-sm transition-colors",
        isSelected ? "border-primary/80 ring-primary/50 ring-1" : "border-border"
      )}
    >
      <div className="text-muted-foreground flex items-center justify-between border-b px-3 py-2 text-xs">
        <span>Page {pageNumber}</span>
      </div>
      <div className="relative flex justify-center bg-slate-50">
        <canvas
          ref={canvasRef}
          className="block"
          style={{ cursor: isPlacingField ? "crosshair" : "default" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />
        {rendering && (
          <div className="text-muted-foreground absolute inset-0 flex items-center justify-center bg-white/70 text-xs">
            Rendering…
          </div>
        )}

        {/* Render form fields */}
        <div className="pointer-events-none absolute inset-0" key={forceRender}>
          {fields.map((field) => {
            if (field.page !== pageNumber) return null;

            // Use stable _id if available, fallback to field name and page
            const fieldId = field._id || `${field.field}:${field.page}`;
            const pos = pdfToDisplay(field.x, field.y);
            if (!pos) return null;

            return (
              <div
                key={fieldId}
                className="pointer-events-auto"
                style={{
                  position: "absolute",
                  left: `${pos.displayX}px`,
                  top: `${pos.displayY}px`,
                  width: `${field.w * scale}px`,
                  height: `${field.h * scale}px`,
                }}
                title={`PDF: (${field.x.toFixed(1)}, ${field.y.toFixed(1)}) → Display: (${pos.displayX.toFixed(1)}, ${pos.displayY.toFixed(1)})`}
              >
                <FieldBox
                  field={field}
                  isSelected={selectedFieldId === fieldId}
                  onSelect={() => onFieldSelect?.(fieldId)}
                  onDrag={(deltaX, deltaY) => handleFieldDrag(fieldId, deltaX, deltaY)}
                  onDragEnd={() => {}}
                  onResize={(handle, deltaX, deltaY) =>
                    handleFieldResize(fieldId, handle, deltaX, deltaY)
                  }
                  onResizeEnd={() => {}}
                />
              </div>
            );
          })}
        </div>

        {/* Ghost field preview during placement mode */}
        {isPlacingField &&
          hoverPointDuringPlacement &&
          (() => {
            const hoverLoc = hoverPointDuringPlacement;
            if (!hoverLoc || hoverLoc.page !== pageNumber) return null;

            const defaultSize = { w: 100, h: 12 };
            const pos = pdfToDisplay(hoverLoc.pdfX, hoverLoc.pdfY);
            if (!pos) return null;

            // Look up the label from registry
            const label = getFieldLabel(placementFieldType, registry);

            return (
              <GhostField
                displayX={pos.displayX}
                displayY={pos.displayY}
                width={defaultSize.w * scale}
                height={defaultSize.h * scale}
                label={label}
              />
            );
          })()}

        {/* Crosshair overlay */}
        {localHover && (
          <div className="pointer-events-none absolute inset-0">
            <div
              className="bg-primary/50 absolute h-full w-px"
              style={{ left: `${localHover.displayX}px` }}
            />
            <div
              className="border-primary/50 absolute w-full border-t"
              style={{ top: `${localHover.displayY}px` }}
            />
          </div>
        )}
      </div>
      {localHover && (
        <div className="bg-muted/30 text-muted-foreground border-t px-3 py-2 text-[11px]">
          Hover p{pageNumber}: x={localHover.pdfX.toFixed(2)}, y={localHover.pdfY.toFixed(2)}
        </div>
      )}
    </div>
  );
};
