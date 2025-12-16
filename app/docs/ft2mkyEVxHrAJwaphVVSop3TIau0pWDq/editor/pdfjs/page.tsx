/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 15:37:57
 * @ Modified by: Your name
 * @ Modified time: 2025-12-16 20:46:36
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
  const [fields, setFields] = useState<FormField[]>([
    { field: "signature", page: 1, x: 72.3, y: 9.7, w: 466, h: 60 },
  ]);

  const handleFieldUpdate = (fieldId: string, updates: Partial<FormField>) => {
    setFields((prev) =>
      prev.map((f, idx) => {
        const currentId = `${f.field}:${idx}`;
        return currentId === fieldId ? { ...f, ...updates } : f;
      })
    );
  };

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
          fields={fields}
          selectedFieldId={selectedFieldId}
          onFieldSelect={setSelectedFieldId}
          onFieldUpdate={handleFieldUpdate}
        />
      </Suspense>
    </div>
  );
};

export default PdfJsEditorPage;
