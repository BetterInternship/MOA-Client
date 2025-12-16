/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 15:37:57
 * @ Modified by: Your name
 * @ Modified time: 2025-12-16 16:23:00
 * @ Description: pdfjs-based form editor page
 */

"use client";

import { Suspense } from "react";
import { Loader } from "@/components/ui/loader";
import { PdfViewer } from "../../../../../components/docs/form-editor/pdf-viewer";

const PdfJsEditorPage = () => {
  return (
    <div className="flex h-full flex-col gap-4 px-6 py-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl leading-tight font-semibold">Form Editor • pdfjs canvas</h1>
        <p className="text-muted-foreground text-sm">
          Fresh sandbox for the new pdfjs-based canvas. Keeps the current editor intact while we
          iterate.
        </p>
      </div>
      <Suspense fallback={<Loader>Loading PDF sandbox…</Loader>}>
        <PdfViewer />
      </Suspense>
    </div>
  );
};

export default PdfJsEditorPage;
