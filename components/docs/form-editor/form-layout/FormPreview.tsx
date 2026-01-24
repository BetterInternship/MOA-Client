"use client";

import { useState, useEffect, useMemo } from "react";
import type { IFormBlock, IFormSigningParty, IFormMetadata } from "@betterinternship/core/forms";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormPreviewRenderer } from "./FormPreviewRenderer";
import { FormPreviewPdfDisplay } from "@/components/docs/forms/previewer";
import { Loader2 } from "lucide-react";
import { formsControllerGenerateTestForm } from "@/app/api";
import { useFormEditor } from "@/app/contexts/form-editor.context";
import { getPartyColorByIndex } from "@/lib/party-colors";
import { cn } from "@/lib/utils";

interface FormPreviewProps {
  metadata?: IFormMetadata;
  mode?: "preview" | "sort";
}

/**
 * Sort View - Display all fields organized by party
 */
const FormSortView = ({
  blocks,
  signingParties,
}: {
  blocks: IFormBlock[];
  signingParties: IFormSigningParty[];
}) => {
  const fieldsByParty = useMemo(() => {
    const grouped: Record<string, { party: IFormSigningParty; fields: IFormBlock[] }> = {};

    signingParties.forEach((party) => {
      grouped[party._id] = {
        party,
        fields: blocks.filter((b) => b.signing_party_id === party._id && b.field_schema?.field),
      };
    });

    return Object.values(grouped).sort((a, b) => a.party.order - b.party.order);
  }, [blocks, signingParties]);

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4">
      <div>
        <h2 className="text-lg font-semibold">Field Order by Party</h2>
        <p className="text-muted-foreground text-sm">Organize fields by signing party</p>
      </div>

      <div className="space-y-4">
        {fieldsByParty.map(({ party, fields }) => (
          <div key={party._id} className="space-y-2">
            <h3 className="text-foreground text-sm font-medium">{party.signatory_title}</h3>
            <div className="space-y-1 pl-2">
              {fields.length > 0 ? (
                fields.map((field) => (
                  <div
                    key={field._id}
                    className="border-border bg-secondary/30 rounded border-l-2 p-2 text-xs"
                  >
                    <p className="font-medium">
                      {field.field_schema?.label || field.field_schema?.field}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-xs italic">No fields assigned</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Preview Content - Main form and PDF preview
 */
const FormPreviewContent = ({
  formMetadata,
  blocks,
  signingParties,
  documentUrl,
}: {
  formMetadata: IFormMetadata;
  blocks: IFormBlock[];
  signingParties: IFormSigningParty[];
  documentUrl?: string | null;
}) => {
  const [selectedPartyId, setSelectedPartyId] = useState(signingParties[0]._id);
  const [values, setValues] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<string | null>(null);

  const filteredBlocks = useMemo(
    () => blocks.filter((b) => b.signing_party_id === selectedPartyId || !b.signing_party_id),
    [blocks, selectedPartyId]
  );

  const fieldBlocksForPdf = useMemo(
    () =>
      filteredBlocks
        .filter((b) => b.field_schema?.field)
        .map((block) => ({
          field: block.field_schema?.field || "",
          label: block.field_schema?.label || "",
          page: block.field_schema?.page || 0,
          x: block.field_schema?.x || 0,
          y: block.field_schema?.y || 0,
          w: block.field_schema?.w || 100,
          h: block.field_schema?.h || 12,
          size: block.field_schema?.size ?? 11,
          wrap: block.field_schema?.wrap ?? true,
          align_h: block.field_schema?.align_h ?? "left",
          align_v: block.field_schema?.align_v ?? "top",
        })),
    [filteredBlocks]
  );

  const handleGenerateTestForm = async () => {
    setIsGenerating(true);
    try {
      const result = await formsControllerGenerateTestForm({
        formName: formMetadata.name,
        values,
      });
      const url = result?.data?.documentUrl || result?.documentUrl;
      if (url) setGenerationResult(url);
    } catch (error) {
      console.error("Failed to generate test form", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Main Content Area with Party Tabs Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Party Tabs */}
        <div className="bg-muted/20 flex w-1/7 flex-col overflow-y-auto border-r">
          {signingParties.map((party) => {
            const partyColor = getPartyColorByIndex(Math.max(0, party.order - 1));
            const isSelected = selectedPartyId === party._id;

            return (
              <button
                key={party._id}
                onClick={() => setSelectedPartyId(party._id)}
                className={cn(
                  "flex w-full items-start justify-start border-l-[3px] px-1 py-2 text-xs transition-all",
                  isSelected ? "shadow-sm" : "hover:bg-gray-50"
                )}
                style={{
                  backgroundColor: isSelected ? partyColor.hex + "25" : "transparent",
                  borderLeftColor: isSelected ? partyColor.hex : "transparent",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                }}
                title={party.signatory_title}
              >
                <span className="line-clamp-2">{party.signatory_title}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content - Form and PDF Preview */}
        <div className="flex flex-1 gap-4 overflow-hidden p-4">
          {/* Form */}
          <div className="flex-1 overflow-auto rounded-lg border bg-white">
            {filteredBlocks.length > 0 ? (
              <FormPreviewRenderer
                formName={formMetadata.name}
                formLabel={formMetadata.label}
                blocks={filteredBlocks}
                values={values}
                onChange={(key, value) => setValues((prev) => ({ ...prev, [key]: value }))}
                metadata={formMetadata}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground text-sm">No fields for this party</p>
              </div>
            )}
          </div>

          {/* PDF Preview */}
          <div className="bg-secondary/30 flex-1 overflow-hidden rounded-lg border">
            {documentUrl ? (
              <FormPreviewPdfDisplay
                documentUrl={documentUrl}
                blocks={fieldBlocksForPdf}
                values={values}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground text-sm">Upload a PDF to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-background flex items-center gap-2 border-t p-3">
        <Button
          onClick={handleGenerateTestForm}
          disabled={isGenerating}
          size="sm"
          variant="default"
        >
          {isGenerating && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          {isGenerating ? "Generating..." : "Generate Test PDF"}
        </Button>
        {generationResult && (
          <a
            href={generationResult}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-600 hover:underline"
          >
            Download
          </a>
        )}
      </div>
    </div>
  );
};

export const FormPreview = ({ metadata, mode = "preview" }: FormPreviewProps) => {
  const { formMetadata, documentUrl, documentFile } = useFormEditor();
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);

  // Convert file to data URL
  useEffect(() => {
    if (!documentFile) {
      setFileDataUrl(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        setFileDataUrl(e.target.result);
      }
    };
    reader.readAsDataURL(documentFile);
  }, [documentFile]);

  const actualMetadata = metadata || formMetadata;
  const actualBlocks = (actualMetadata?.schema as any)?.blocks || [];
  const actualSigningParties = actualMetadata?.signing_parties || [];
  const actualDocumentUrl = documentUrl || fileDataUrl;

  if (!actualMetadata) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading form...</p>
      </div>
    );
  }

  if (mode === "sort") {
    return <FormSortView blocks={actualBlocks} signingParties={actualSigningParties} />;
  }

  if (!actualSigningParties?.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">No signing parties configured</p>
      </div>
    );
  }

  return (
    <FormPreviewContent
      formMetadata={actualMetadata}
      blocks={actualBlocks}
      signingParties={actualSigningParties}
      documentUrl={actualDocumentUrl}
    />
  );
};
