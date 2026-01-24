"use client";

import { useFormEditor } from "@/app/contexts/form-editor.context";

import { FormPreview } from "@/components/docs/form-editor/form-layout/FormPreview";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function FormPreviewTab() {
  const { formMetadata } = useFormEditor();
  const [mode, setMode] = useState<"preview" | "sort">("preview");

  if (!formMetadata) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center">
        No form loaded
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="bg-background flex items-center justify-end gap-2 border-b px-4 py-2">
        <Button
          variant={mode === "preview" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("preview")}
        >
          Preview
        </Button>
        <Button
          variant={mode === "sort" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("sort")}
        >
          Sort
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        <FormPreview metadata={formMetadata} mode={mode} />
      </div>
    </div>
  );
}
