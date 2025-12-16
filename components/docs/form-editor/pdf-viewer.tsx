/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 16:03:54
 * @ Modified by: Your name
 * @ Modified time: 2025-12-16 16:28:44
 * @ Description: pdf viewer component using pdfjs
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { GlobalWorkerOptions, getDocument, version as pdfjsVersion } from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist/types/src/display/api";
import type { PageViewport } from "pdfjs-dist/types/src/display/display_utils";
import { FileUp, Maximize2, Minimize2, MousePointer2, RefreshCcw, Search } from "lucide-react";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

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
};

export function PdfViewer({ initialUrl }: PdfViewerProps) {
  const searchParams = useSearchParams();
  const [pendingUrl, setPendingUrl] = useState<string>(
    initialUrl ?? "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"
  );
  const [sourceUrl, setSourceUrl] = useState<string | null>(pendingUrl);
  const [fileName, setFileName] = useState<string>("");
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.1);
  const [visiblePage, setVisiblePage] = useState<number>(1);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [hoverPoint, setHoverPoint] = useState<PointerLocation | null>(null);
  const [clickPoint, setClickPoint] = useState<PointerLocation | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const pageRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const urlFromQuery = searchParams.get("url");
    if (urlFromQuery) {
      setPendingUrl(urlFromQuery);
      setSourceUrl(urlFromQuery);
    }
  }, [searchParams]);

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
  };

  const handleApplyUrl = () => {
    if (!pendingUrl?.trim()) return;
    setSourceUrl(pendingUrl.trim());
  };

  const pagesArray = useMemo(
    () => Array.from({ length: pageCount }, (_, idx) => idx + 1),
    [pageCount]
  );

  return (
    <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="border-muted h-fit border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">PDF Canvas (pdfjs)</CardTitle>
          <p className="text-muted-foreground text-sm">
            Fresh pipeline with zoom, coordinates, and page awareness.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="space-y-2">
            <label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Load PDF
            </label>
            <div className="flex flex-col gap-2">
              <Input
                type="url"
                value={pendingUrl}
                placeholder="https://domain.com/document.pdf"
                className="text-sm"
                onChange={(e) => setPendingUrl(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleApplyUrl} disabled={!pendingUrl}>
                  <Search className="mr-2 h-4 w-4" /> Load URL
                </Button>
                <label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-xs">
                  <FileUp className="h-4 w-4" />
                  <span>Select file</span>
                  <Input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              {fileName && <p className="text-muted-foreground text-xs">Loaded: {fileName}</p>}
            </div>
          </div>

          <div className="border-muted-foreground/30 space-y-3 rounded-md border border-dashed p-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MousePointer2 className="h-4 w-4" /> Pointer
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">Visible page {visiblePage || "-"}</Badge>
              <Badge variant="outline">Selected page {selectedPage || "-"}</Badge>
              <Badge variant="outline">Zoom {Math.round(scale * 100)}%</Badge>
              {hoverPoint && (
                <Badge variant="secondary">
                  Hover p{hoverPoint.page}: x={hoverPoint.pdfX.toFixed(1)}, y=
                  {hoverPoint.pdfY.toFixed(1)}
                </Badge>
              )}
              {clickPoint && (
                <Badge variant="secondary">
                  Click p{clickPoint.page}: x={clickPoint.pdfX.toFixed(1)}, y=
                  {clickPoint.pdfY.toFixed(1)}
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Zoom
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom("out")}
                aria-label="Zoom out"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 rounded-md border px-3 py-1 text-sm">
                <Badge variant="outline">{Math.round(scale * 100)}%</Badge>
                <span className="text-muted-foreground">Keeps coordinates stable</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoom("in")}
                aria-label="Zoom in"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Page
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={pageCount || 1}
                value={selectedPage}
                onChange={(e) => setSelectedPage(parseInt(e.target.value) || 1)}
                className="w-24"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleJumpToPage(selectedPage)}
                disabled={!pageCount}
              >
                <RefreshCcw className="mr-2 h-4 w-4" /> Jump
              </Button>
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
              {pagesArray.map((page) => (
                <Button
                  key={page}
                  size="xs"
                  variant={page === selectedPage ? "default" : "ghost"}
                  className="h-7 px-2"
                  onClick={() => handleJumpToPage(page)}
                >
                  {page}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/30 relative h-full overflow-hidden rounded-lg border">
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
          <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
            Provide a PDF URL or upload a file to start.
          </div>
        )}

        {pdfDoc && (
          <div className="relative h-full overflow-y-auto p-6" aria-live="polite">
            <div className="text-muted-foreground mb-4 flex items-center justify-between text-xs">
              <span>
                Pages {pageCount} • Visible {visiblePage} • Selected {selectedPage}
              </span>
              <span>Zoom {Math.round(scale * 100)}%</span>
            </div>
            <div className="flex flex-col items-center gap-6">
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
                  onClick={setClickPoint}
                  registerPageRef={registerPageRef}
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
}: PdfPageCanvasProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportRef = useRef<PageViewport | null>(null);
  const [rendering, setRendering] = useState<boolean>(false);
  const [localHover, setLocalHover] = useState<PointerLocation | null>(null);

  useEffect(() => registerPageRef(pageNumber, containerRef.current), [pageNumber, registerPageRef]);

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

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const location = extractLocation(event);
    setLocalHover(location);
    onHover(location);
  };

  const handleMouseLeave = () => {
    setLocalHover(null);
    onHover(null);
  };

  const handleClick = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const location = extractLocation(event);
    if (location) onClick(location);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full max-w-4xl overflow-hidden rounded-md border bg-white shadow-sm transition-colors",
        isSelected ? "border-primary/80 ring-primary/50 ring-1" : "border-border"
      )}
    >
      <div className="text-muted-foreground flex items-center justify-between border-b px-3 py-2 text-xs">
        <span>
          Page {pageNumber} {isVisible && "• visible"}
        </span>
        <span>Scale {Math.round(scale * 100)}%</span>
      </div>
      <div className="relative flex justify-center bg-slate-50">
        <canvas
          ref={canvasRef}
          className="block"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />
        {rendering && (
          <div className="text-muted-foreground absolute inset-0 flex items-center justify-center bg-white/70 text-xs">
            Rendering…
          </div>
        )}
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
            <div
              className="border-primary bg-primary/10 absolute h-3 w-3 -translate-x-1.5 -translate-y-1.5 rounded-full border"
              style={{ left: `${localHover.displayX}px`, top: `${localHover.displayY}px` }}
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
