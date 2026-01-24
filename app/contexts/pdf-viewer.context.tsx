"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import { getDocument } from "pdfjs-dist";

export interface PdfViewerContextType {
  // File state
  documentFile: File | null;
  setDocumentFile: (file: File | null) => void;
  lastLoadedFileName: string | null;
  setLastLoadedFileName: (name: string | null) => void;

  // PDF document state
  pdfDoc: PDFDocumentProxy | null;
  setPdfDoc: (doc: PDFDocumentProxy | null) => void;
  pageCount: number;
  setPageCount: (count: number) => void;
  selectedPage: number;
  setSelectedPage: (page: number) => void;
  visiblePage: number;
  setVisiblePage: (page: number) => void;

  // UI state
  scale: number;
  setScale: (scale: number) => void;
  isLoadingDoc: boolean;
  setIsLoadingDoc: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Hover state during field placement
  hoverPoint: { x: number; y: number } | null;
  setHoverPoint: (point: { x: number; y: number } | null) => void;
  hoverPointDuringPlacement: { x: number; y: number } | null;
  setHoverPointDuringPlacement: (point: { x: number; y: number } | null) => void;

  // Dragging state
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;

  // File upload handler
  handleFileUpload: (file: File) => void;
}

const PdfViewerContext = createContext<PdfViewerContextType | undefined>(undefined);

export function PdfViewerProvider({
  children,
  documentFile: externalDocumentFile = null,
  setDocumentFile: externalSetDocumentFile,
  lastLoadedFileName: externalLastLoadedFileName = null,
  setLastLoadedFileName: externalSetLastLoadedFileName,
}: {
  children: ReactNode;
  documentFile?: File | null;
  setDocumentFile?: (file: File | null) => void;
  lastLoadedFileName?: string | null;
  setLastLoadedFileName?: (name: string | null) => void;
}) {
  // Use external state if provided (from FormEditorContext), otherwise manage internally
  const documentFile = externalDocumentFile;
  const setDocumentFile = externalSetDocumentFile || (() => {});
  const lastLoadedFileName = externalLastLoadedFileName;
  const setLastLoadedFileName = externalSetLastLoadedFileName || (() => {});

  // PDF document state
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [visiblePage, setVisiblePage] = useState<number>(1);

  // UI state
  const [scale, setScale] = useState<number>(1.1);
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Hover state during field placement
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);
  const [hoverPointDuringPlacement, setHoverPointDuringPlacement] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Ref to track loaded file
  const loadingTaskRef = useRef<any>(null);

  // Handle file upload
  const handleFileUpload = useCallback(
    (file: File) => {
      if (setDocumentFile) {
        setDocumentFile(file);
      }
    },
    [setDocumentFile]
  );

  // Auto-load PDF when documentFile changes
  useEffect(() => {
    if (!documentFile) return;

    // Check if this is the same file as what we've already loaded
    const isSameFile = lastLoadedFileName && lastLoadedFileName === documentFile.name;

    // If pdfDoc is null but we've loaded this file before, re-read quietly
    if (!pdfDoc && isSameFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result;
        if (arrayBuffer && typeof arrayBuffer !== "string") {
          const loadingTask = getDocument({ data: arrayBuffer });
          loadingTaskRef.current = loadingTask;

          loadingTask.promise
            .then((doc) => {
              setPdfDoc(doc);
              setPageCount(doc.numPages);
              setSelectedPage(1);
              setVisiblePage(1);
              setError(null);
            })
            .catch((err) => {
              console.error("Failed to load PDF", err);
              setError(err?.message ?? "Failed to load PDF document");
              setPdfDoc(null);
              setPageCount(0);
            });
        }
      };
      reader.readAsArrayBuffer(documentFile);
      return;
    }

    // Load new file
    if (!isSameFile) {
      setIsLoadingDoc(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result;
        if (arrayBuffer && typeof arrayBuffer !== "string") {
          const loadingTask = getDocument({ data: arrayBuffer });
          loadingTaskRef.current = loadingTask;

          loadingTask.promise
            .then((doc) => {
              setPdfDoc(doc);
              setPageCount(doc.numPages);
              setSelectedPage(1);
              setVisiblePage(1);
              setError(null);
              // Mark this file as loaded
              if (setLastLoadedFileName) {
                setLastLoadedFileName(documentFile.name);
              }
            })
            .catch((err) => {
              console.error("Failed to load PDF", err);
              setError(err?.message ?? "Failed to load PDF document");
              setPdfDoc(null);
              setPageCount(0);
            })
            .finally(() => {
              setIsLoadingDoc(false);
            });
        }
      };
      reader.readAsArrayBuffer(documentFile);
    }
  }, [documentFile, lastLoadedFileName, pdfDoc, setLastLoadedFileName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingTaskRef.current) {
        loadingTaskRef.current.destroy();
      }
    };
  }, []);

  const value: PdfViewerContextType = useMemo(() => {
    return {
      documentFile,
      setDocumentFile,
      lastLoadedFileName,
      setLastLoadedFileName,
      pdfDoc,
      setPdfDoc,
      pageCount,
      setPageCount,
      selectedPage,
      setSelectedPage,
      visiblePage,
      setVisiblePage,
      scale,
      setScale,
      isLoadingDoc,
      setIsLoadingDoc,
      error,
      setError,
      hoverPoint,
      setHoverPoint,
      hoverPointDuringPlacement,
      setHoverPointDuringPlacement,
      isDragging,
      setIsDragging,
      handleFileUpload,
    };
  }, [
    documentFile,
    lastLoadedFileName,
    pdfDoc,
    pageCount,
    selectedPage,
    visiblePage,
    scale,
    isLoadingDoc,
    error,
    hoverPoint,
    hoverPointDuringPlacement,
    isDragging,
    handleFileUpload,
  ]);

  return <PdfViewerContext.Provider value={value}>{children}</PdfViewerContext.Provider>;
}

export function usePdfViewer() {
  const context = useContext(PdfViewerContext);
  if (!context) {
    throw new Error("usePdfViewer must be used within PdfViewerProvider");
  }
  return context;
}
