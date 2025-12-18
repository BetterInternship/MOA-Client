/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-12-18
 * @ Description: Modal for displaying field registration metadata
 */

"use client";

import { useEffect, useState } from "react";
import { Check, Copy, AlertCircle } from "lucide-react";
import type { IFormMetadata } from "@betterinternship/core/forms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FieldRegistrationModalProps {
  isOpen: boolean;
  metadata: IFormMetadata | null;
  errors?: string[];
  onClose: () => void;
  onConfirm?: () => void;
  isLoading?: boolean;
}

/**
 * Modal that displays the field metadata JSON for registration
 * Allows user to review and confirm the registration
 */
export const FieldRegistrationModal = ({
  isOpen,
  metadata,
  errors = [],
  onClose,
  onConfirm,
  isLoading = false,
}: FieldRegistrationModalProps) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const metadataJson = metadata ? JSON.stringify(metadata, null, 2) : "";

  const handleCopy = () => {
    void navigator.clipboard.writeText(metadataJson);
    setCopied(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle>Field Registration</DialogTitle>
          <DialogDescription>Review the field metadata before registering</DialogDescription>
        </DialogHeader>

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

        {/* Metadata JSON Display */}
        {metadata && !errors.length && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="mb-2 text-sm font-semibold text-slate-700">Metadata JSON</div>
            <pre className="flex-1 overflow-auto rounded border border-slate-700 bg-slate-900 p-3 font-mono text-xs text-slate-100">
              <code>{metadataJson}</code>
            </pre>
          </div>
        )}

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>

          {metadata && !errors.length && (
            <>
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

              <Button onClick={onConfirm} disabled={isLoading}>
                {isLoading ? "Registering..." : "Register Field"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
