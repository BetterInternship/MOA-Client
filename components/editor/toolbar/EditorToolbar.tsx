"use client";

import { useFormEditor } from "@/app/contexts/form-editor.context";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

export function EditorToolbar() {
  const { formMetadata, formDocument, isSaving, saveForm } = useFormEditor();

  return (
    <div className="bg-card flex items-center justify-between border-b px-6 py-3">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-sm font-semibold">{formMetadata?.label || "New Form"}</h1>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-xs">v{formDocument?.version || 0}</p>
          {formDocument?.time_generated && (
            <>
              <span className="text-muted-foreground/40 text-xs">•</span>
              <p className="text-muted-foreground text-xs">{formDocument?.time_generated || ""}</p>
            </>
          )}
        </div>
      </div>

      <Button onClick={() => void saveForm()} disabled={isSaving} size="sm" className="gap-2">
        <Save className="h-4 w-4" />
        {isSaving ? "Saving..." : "Save Form"}
      </Button>
    </div>
  );
}
