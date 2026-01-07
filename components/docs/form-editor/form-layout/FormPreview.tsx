"use client";

import { useState } from "react";
import {
  type IFormBlock,
  type IFormSigningParty,
  type IFormMetadata,
} from "@betterinternship/core/forms";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormPreviewRenderer } from "./FormPreviewRenderer";
import { FormPreviewPdfDisplay } from "@/components/docs/forms/previewer";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { formsControllerGenerateTestForm } from "@/app/api";

interface FormPreviewProps {
  formName: string;
  blocks: IFormBlock[];
  signingParties: IFormSigningParty[];
  documentUrl?: string;
  metadata?: IFormMetadata;
  showTestPdfButton?: boolean;
}

/**
 * Non-editable form preview that shows how the form looks for each signing party
 * Split layout: document preview on left, form on right
 */
const FormPreviewContent = ({
  formName,
  blocks,
  signingParties,
  documentUrl,
  metadata,
  showTestPdfButton = true,
}: FormPreviewProps) => {
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(
    signingParties.length > 0 ? signingParties[0]._id : null
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<{
    documentUrl: string;
    documentId: string;
  } | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const filteredBlocks = selectedPartyId
    ? blocks.filter(
        (block) => block.signing_party_id === selectedPartyId || !block.signing_party_id
      )
    : [];

  // Extract field blocks with coordinates from metadata for PDF rendering
  const fieldBlocksForPdf = filteredBlocks
    .filter((b) => b.field_schema?.field)
    .map((block) => ({
      field: block.field_schema?.field || "",
      label: block.field_schema?.label || "",
      page: block.field_schema?.page || 1,
      x: block.field_schema?.x || 0,
      y: block.field_schema?.y || 0,
      w: block.field_schema?.w || 0,
      h: block.field_schema?.h || 0,
      size: block.field_schema?.size ?? 11,
      wrap: block.field_schema?.wrap ?? true,
      align_h: block.field_schema?.align_h ?? "left",
      align_v: block.field_schema?.align_v ?? "top",
    }));

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
          {filteredBlocks.length > 0 ? (
            <FormPreviewRenderer
              formName={formName}
              blocks={filteredBlocks}
              values={values}
              onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
              metadata={metadata}
            />
          ) : (
            <div className="rounded bg-slate-50 p-8 text-center">
              <p className="text-sm text-slate-500">
                No blocks assigned to this signing party yet.
              </p>
            </div>
          )}
        </div>

        {/* Right side - PDF Preview */}
        <div className="relative flex-1 overflow-hidden bg-slate-100">
          {documentUrl ? (
            <FormPreviewPdfDisplay
              documentUrl={documentUrl}
              blocks={fieldBlocksForPdf}
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

      {/* Test Form Generation - Minimal */}
      {showTestPdfButton && (
        <div className="flex items-center gap-2 border-slate-200 bg-white">
          <Button onClick={handleGenerateTestForm} disabled={isGenerating} size="xs">
            {isGenerating && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
            {isGenerating ? "..." : "Test PDF"}
          </Button>

          {generationResult && (
            <a
              href={generationResult.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-green-500 hover:text-green-600 hover:underline"
            >
              View result
            </a>
          )}

          {generationError && <span className="text-[11px] text-red-500">✕</span>}
        </div>
      )}
    </div>
  );

  /**
   * Handler for generating test PDF with all derived fields computed
   */
  async function handleGenerateTestForm() {
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationResult(null);

    if (!metadata?.name) {
      setGenerationError("Form name not found in metadata");
      setIsGenerating(false);
      return;
    }

    try {
      // Validate all fields before sending
      const fieldsToValidate = Array.isArray(metadata.schema)
        ? metadata.schema
        : (metadata.schema as any)?.blocks || [];

      const errors: string[] = [];

      for (const field of fieldsToValidate) {
        // Skip if not a form field block or if field is not defined
        if (!field || !("field_schema" in field)) continue;

        const fieldSchema = field.field_schema;
        if (!fieldSchema) continue;

        const fieldName = fieldSchema.field;
        const value = values[fieldName];

        // Validate the field if it has a validator
        if (fieldSchema.validator) {
          try {
            const validator = eval(`(${fieldSchema.validator})`);
            const result = validator.safeParse(value);
            if (!result.success) {
              errors.push(`${fieldSchema.label}: ${result.error.issues[0]?.message || "Invalid"}`);
            }
          } catch (e) {
            // Skip validation if there's an error parsing the validator
          }
        }
      }

      if (errors.length > 0) {
        setGenerationError(`Validation failed: ${errors.join(", ")}`);
        setIsGenerating(false);
        return;
      }

      // Add student context to the payload - this will be used by prefiller functions
      const studentContext = {
        student: {
          "student-degree": "We found love in a hopeless place",
          "student-college": "32665831-772f-4653-a76d-bc85aa5721a3",
          "student-full-name": "Jana Bantolino",
          "student-last-name": "Bantolino",
          "student-department": "7c964274-e4a0-43a8-897f-8d12949e4043",
          "student-first-name": "Jana",
          "student-university": "45e8deea-0635-4c9f-b0b0-05e6c55db8e3",
          "student-middle-name": "",
          "student-phone-number": "09209817567",
        },
      };

      // Compute ALL derived fields using their prefillers
      // This ensures the server receives complete values without needing context
      const derivedValues: Record<string, string> = {};

      if (metadata?.schema) {
        // Get all fields from metadata
        const getAllFields = (schema: any): any[] => {
          if (Array.isArray(schema)) {
            return schema;
          }
          if (schema?.blocks) {
            return schema.blocks;
          }
          return [];
        };

        const allBlocks = getAllFields(metadata.schema);

        // Build enriched context with user property for student prefillers
        const enrichedContext = {
          ...studentContext,
          user: {
            first_name: studentContext?.student?.["student-first-name"] || "",
            middle_name: studentContext?.student?.["student-middle-name"] || "",
            last_name: studentContext?.student?.["student-last-name"] || "",
            college: studentContext?.student?.["student-college"] || "",
          },
        };

        // Helper function to replace #fieldName references in function strings
        const replaceFieldReferences = (
          funcString: string,
          currentValues: Record<string, any>
        ): string => {
          // Match patterns like #{field.name:variant} - the # followed by curly braces and field identifier
          let result = funcString;
          const matches = funcString.match(/#\{[\w.\-:]+\}/g) || [];

          // Replace each #{fieldName} with the actual value from currentValues
          matches.forEach((match) => {
            // Extract field name from #{...}
            const fieldName = match.substring(2, match.length - 1); // Remove #{ and }
            const fieldValue = currentValues[fieldName];

            // Escape the value for use in JavaScript
            let replacement: string;
            if (typeof fieldValue === "string") {
              replacement = `"${fieldValue.replace(/"/g, '\\"')}"`;
            } else if (fieldValue !== undefined && fieldValue !== null) {
              replacement = String(fieldValue);
            } else {
              replacement = '""'; // Default to empty string if not found
            }

            result = result.replace(match, replacement);
          });

          return result;
        };

        // Process each block - both regular fields and derived fields with prefillers
        for (const block of allBlocks) {
          // Check if this block has a field_schema with a prefiller (derived field)
          if (block?.field_schema?.prefiller) {
            try {
              let prefiller = block.field_schema.prefiller;
              const fieldName = block.field_schema.field;
              let value: any = undefined;

              // Handle field references (e.g., "#internship.duration-in-words")
              if (typeof prefiller === "string" && prefiller.startsWith("#")) {
                // This is a field reference - look up the value from already computed/user values
                const refFieldName = prefiller.substring(1); // Remove the # prefix
                value = values[refFieldName] || derivedValues[refFieldName];
              } else if (typeof prefiller === "string") {
                // This is a serialized function - deserialize and execute
                try {
                  // Replace #fieldName references in the function string with actual values
                  const allCurrentValues = { ...derivedValues, ...values };
                  const processedFunctionString = replaceFieldReferences(
                    prefiller,
                    allCurrentValues
                  );

                  const prefillerFn = eval(`(${processedFunctionString})`);
                  if (typeof prefillerFn === "function") {
                    value = prefillerFn(enrichedContext);
                  }
                } catch (evalError) {
                  // Silently fail - field derivation not possible with current context
                }
              } else if (typeof prefiller === "function") {
                // Already a function object
                value = prefiller(enrichedContext);
              }

              // Store the computed value
              if (value !== undefined && value !== null) {
                derivedValues[fieldName] = typeof value === "string" ? value.trim() : String(value);
              }
            } catch (error) {
              // Silently skip if prefiller fails - field doesn't have required context
            }
          }
        }
      }

      // Merge computed derived fields with user-entered values (user values take precedence)
      const finalValues = { ...derivedValues, ...values };

      const result = await formsControllerGenerateTestForm({
        formName: metadata.name,
        values: finalValues,
      });

      // Handle both response structures
      const documentUrl = result?.data?.documentUrl || result?.documentUrl;
      const documentId = result?.data?.documentId || result?.documentId;

      if (!documentUrl || !documentId) {
        throw new Error("Invalid response: missing documentUrl or documentId");
      }

      setGenerationResult({
        documentUrl,
        documentId,
      });
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  }
};

export const FormPreview = ({
  formName,
  blocks,
  signingParties,
  documentUrl,
  metadata,
  showTestPdfButton,
}: FormPreviewProps) => {
  return (
    <FormPreviewContent
      formName={formName}
      blocks={blocks}
      signingParties={signingParties}
      documentUrl={documentUrl}
      metadata={metadata}
      showTestPdfButton={showTestPdfButton}
    />
  );
};
