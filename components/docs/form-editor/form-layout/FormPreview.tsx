"use client";

import { useState } from "react";
import { type IFormBlock, type IFormSigningParty } from "@betterinternship/core/forms";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormRenderer } from "@/components/docs/forms/FormRenderer";
import { FormPreviewPdfDisplay } from "./FormPreviewPdfDisplay";

interface FormPreviewProps {
  formName: string;
  blocks: IFormBlock[];
  signingParties: IFormSigningParty[];
  documentUrl?: string;
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

  // Handle blur validation
  const handleBlurValidate = (fieldKey: string) => {
    // Find the field in blocks to get its validator
    const fieldBlock = filteredBlocks.find((block) => {
      if (block.block_type === "form_field" && block.field_schema) {
        return block.field_schema.field === fieldKey;
      }
      if (block.block_type === "form_phantom_field" && block.phantom_field_schema) {
        return block.phantom_field_schema.field === fieldKey;
      }
      return false;
    });

    if (!fieldBlock) return;

    // Get the validator string from the field schema
    let validatorString = "";
    if (fieldBlock.block_type === "form_field" && fieldBlock.field_schema) {
      validatorString = fieldBlock.field_schema.validator || "";
    } else if (fieldBlock.block_type === "form_phantom_field" && fieldBlock.phantom_field_schema) {
      validatorString = fieldBlock.phantom_field_schema.validator || "";
    }

    // If no validator, clear any existing error
    if (!validatorString) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
      return;
    }

    // Try to validate
    try {
      const value = values[fieldKey];
      let error = "";

      if (validatorString.includes("min(1)") || validatorString.includes("required")) {
        if (!value || value.trim() === "") {
          error = "This field is required";
        }
      }

      if (validatorString.includes("email")) {
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = "Invalid email address";
        }
      }

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
    } catch (err) {
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
                <span className="text-sm font-medium">
                  {party.signatory_account?.name || party.signatory_source}
                </span>
                <span className="ml-2 text-xs opacity-75">({party.order})</span>
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main content with split layout - Form on left, PDF on right */}
      <div className="flex min-h-[72dvh] flex-1 gap-5 overflow-hidden">
        {/* Left side - Form */}
        <div className="relative flex-1">
          <div className="">
            {filteredBlocks.length > 0 ? (
              <FormRenderer
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
