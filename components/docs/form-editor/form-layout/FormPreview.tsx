"use client";

import { useState } from "react";
import {
  type IFormBlock,
  type IFormSigningParty,
  type IFormMetadata,
} from "@betterinternship/core/forms";
import { validateFieldWithZod } from "@/lib/form-validation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormFillerRenderer } from "@/components/docs/forms/FormFillerRenderer";
import { FormPreviewPdfDisplay } from "./FormPreviewPdfDisplay";

interface FormPreviewProps {
  formName: string;
  blocks: IFormBlock[];
  signingParties: IFormSigningParty[];
  documentUrl?: string;
  metadata?: IFormMetadata;
}

/**
 * Non-editable form preview that shows how the form looks for each signing party
 * Split layout: document preview on left, form on right
 */
export const FormPreview = ({
  formName,
  blocks,
  signingParties,
  documentUrl,
  metadata,
}: FormPreviewProps) => {
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(
    signingParties.length > 0 ? signingParties[0]._id : null
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter blocks for the selected signing party
  const filteredBlocks = selectedPartyId
    ? blocks.filter((block) => block.signing_party_id === selectedPartyId)
    : [];

  const selectedParty = signingParties.find((p) => p._id === selectedPartyId);

  // Handle blur validation using centralized validator
  const handleBlurValidate = (fieldKey: string) => {
    if (!metadata) return;

    const value = values[fieldKey];
    const error = validateFieldWithZod(fieldKey, value, metadata);

    if (error) {
      setErrors((prev) => ({
        ...prev,
        [fieldKey]: error,
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col gap-5 overflow-hidden">
      {/* Party Filter - Top */}
      <Card className="border border-slate-200 bg-white p-4">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Preview by Signing Party</h3>
          <div className="flex flex-wrap gap-2">
            {signingParties.map((party) => (
              <Button
                key={party._id}
                onClick={() => setSelectedPartyId(party._id)}
                variant={selectedPartyId === party._id ? "default" : "outline"}
                size="sm"
              >
                <span className="text-sm font-medium">{party._id}</span>
                <span className="ml-2 text-xs opacity-75">({party.order})</span>
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main content with split layout - Form on left, PDF on right */}
      <div className="flex flex-1 gap-5 overflow-hidden">
        {/* Left side - Form */}
        <div className="relative flex-1 overflow-y-auto bg-white">
          <div className="">
            {filteredBlocks.length > 0 ? (
              <FormFillerRenderer
                formName={formName}
                signingPartyId={selectedPartyId || ""}
                fields={[]}
                blocks={filteredBlocks}
                values={values}
                setValues={setValues}
                autofillValues={{}}
                onChange={(key, value) => {
                  setValues((prev) => ({
                    ...prev,
                    [key]: value,
                  }));
                }}
                errors={errors}
                pendingUrl={documentUrl || ""}
                onBlurValidate={handleBlurValidate}
              />
            ) : (
              <div className="rounded bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-500">
                  No blocks assigned to this signing party yet.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right side - PDF Preview */}
        <div className="relative flex-1 overflow-hidden bg-slate-100">
          {documentUrl ? (
            <FormPreviewPdfDisplay
              documentUrl={documentUrl}
              blocks={filteredBlocks}
              values={values}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-slate-500">No document to preview</p>
                <p className="mt-2 text-xs text-slate-400">PDF will appear here when available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
