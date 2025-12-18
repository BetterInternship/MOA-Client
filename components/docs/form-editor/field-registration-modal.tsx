/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-12-18
 * @ Modified time: 2025-12-18 15:30:01
 * @ Modified time: 2025-12-18 15:58:33
 * **/

"use client";

import { useEffect, useState } from "react";
import { Check, Copy, AlertCircle } from "lucide-react";
import type { IFormMetadata, IFormField } from "@betterinternship/core/forms";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FieldRegistrationModalContentProps {
  metadata: IFormMetadata | null;
  errors?: string[];
  onClose: () => void;
  onConfirm?: (editedMetadata: IFormMetadata) => void;
  onFieldsUpdate?: (fields: IFormField[]) => void;
  isLoading?: boolean;
}

/**
 * Modal content that displays the field metadata JSON for registration
 * Allows user to review, edit, and confirm the registration
 * Updates fields in real-time as JSON is edited
 */
export const FieldRegistrationModalContent = ({
  metadata,
  errors = [],
  onClose,
  onConfirm,
  onFieldsUpdate,
  isLoading = false,
}: FieldRegistrationModalContentProps) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Initialize or update JSON text when metadata changes
  useEffect(() => {
    if (metadata) {
      setJsonText(JSON.stringify(metadata, null, 2));
      setJsonError(null);
      setIsEditing(false);
    }
  }, [metadata]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = () => {
    void navigator.clipboard.writeText(jsonText);
    setCopied(true);
  };

  const handleJsonChange = (newJson: string) => {
    setJsonText(newJson);
    if (jsonError) {
      setJsonError(null);
    }

    // Try to parse and update fields in real-time
    try {
      const parsed = JSON.parse(newJson) as IFormMetadata;
      if (parsed.schema && onFieldsUpdate) {
        onFieldsUpdate(parsed.schema);
      }
    } catch {
      // Silently fail during typing - error will show in UI
    }
  };

  const handleConfirmEdit = () => {
    try {
      const parsedMetadata = JSON.parse(jsonText) as IFormMetadata;
      setJsonError(null);
      setIsEditing(false);
      onConfirm?.(parsedMetadata);
    } catch (e) {
      const message =
        e instanceof SyntaxError ? `Invalid JSON: ${e.message}` : "Failed to parse JSON";
      setJsonError(message);
    }
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      if (metadata) {
        setJsonText(JSON.stringify(metadata, null, 2));
      }
      setJsonError(null);
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      {/* Scrollable Content Area */}
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="flex flex-col gap-4">
          {/* Errors Section */}
          {errors.length > 0 && (
            <div className="flex gap-2 rounded-md bg-red-50 p-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">Validation Errors</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-red-700">
                  {errors.map((error: string, idx: number) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* JSON Parse Error */}
          {jsonError && (
            <div className="flex gap-2 rounded-md bg-amber-50 p-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">JSON Error</p>
                <p className="mt-1 text-sm text-amber-700">{jsonError}</p>
              </div>
            </div>
          )}

          {/* Metadata JSON Editor */}
          {metadata && !errors.length && (
            <div className="flex min-h-96 flex-col overflow-hidden">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-700">
                  {isEditing ? "Edit Metadata JSON" : "Metadata JSON"}
                </div>
                <Button onClick={handleToggleEdit} variant="link" className="!p-0">
                  {isEditing ? "Cancel Edit" : "Edit JSON"}
                </Button>
              </div>
              {isEditing ? (
                <textarea
                  value={jsonText}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  className="min-h-0 flex-1 resize-none rounded border border-slate-700 bg-slate-900 p-3 font-mono text-xs text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  spellCheck="false"
                />
              ) : (
                <pre className="min-h-0 flex-1 overflow-auto rounded border border-slate-700 bg-slate-900 p-3 font-mono text-xs text-slate-100">
                  <code>{jsonText}</code>
                </pre>
              )}
              {isEditing && (
                <div className="mt-2 text-xs text-slate-500">
                  Changes are reflected in the form editor in real-time
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - Fixed at Bottom */}
      <div className={cn("flex", !isEditing ? "justify-between" : "justify-end")}>
        {!isEditing && (
          <Button variant="outline" onClick={handleCopy} disabled={isLoading} className="gap-2">
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy JSON
              </>
            )}
          </Button>
        )}

        <div className="space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>

          {metadata && !errors.length && (
            <>
              {isEditing ? (
                <Button onClick={handleConfirmEdit} disabled={isLoading || !!jsonError}>
                  Confirm Changes
                </Button>
              ) : (
                <Button onClick={() => onConfirm?.(metadata)} disabled={isLoading}>
                  {isLoading ? "Registering..." : "Register Field"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
