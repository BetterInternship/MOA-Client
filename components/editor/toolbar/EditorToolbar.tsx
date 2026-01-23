"use client";

import { useFormEditor } from "@/app/contexts/form-editor.context";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { toastPresets } from "@/components/sonner-toaster";

interface EditorToolbarProps {
  onSave?: () => Promise<void> | void;
  isSaving?: boolean;
}

export function EditorToolbar({ onSave, isSaving = false }: EditorToolbarProps) {
  const { formMetadata, formDocument } = useFormEditor();

  const handleSave = async () => {
    try {
      if (onSave) {
        await onSave();
      }
      toast.success("Form saved successfully!", toastPresets.success);
    } catch (error) {
      toast.error("Failed to save form", toastPresets.destructive);
      console.error("Save error:", error);
    }
  };

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

      <Button onClick={handleSave} disabled={isSaving} size="sm" className="gap-2">
        <Save className="h-4 w-4" />
        {isSaving ? "Saving..." : "Save Form"}
      </Button>
    </div>
  );
}
