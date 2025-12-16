/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 15:37:57
 * @ Modified by: Your name
 * @ Modified time: 2025-12-16 19:42:27
 * @ Description: pdfjs-based form editor page
 */

"use client";

import { useState } from "react";
import { Suspense } from "react";
import { Loader } from "@/components/ui/loader";
import { PdfViewer } from "../../../../../components/docs/form-editor/pdf-viewer";
import type { FormField } from "../../../../../components/docs/form-editor/_components/field-box";

const PdfJsEditorPage = () => {
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");

  // Sample fields for testing field rendering
  const sampleFields: FormField[] = [
    { field: "signature", page: 1, x: 72.3, y: 9.7, w: 466, h: 60 },
  ];

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
        <PdfViewer
          fields={sampleFields}
          selectedFieldId={selectedFieldId}
          onFieldSelect={setSelectedFieldId}
        />
      </Suspense>
    </div>
  );
};

export default PdfJsEditorPage;
