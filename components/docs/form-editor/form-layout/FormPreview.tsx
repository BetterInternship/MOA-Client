"use client";

import { useState } from "react";
import { type IFormBlock, type IFormSigningParty } from "@betterinternship/core/forms";
import { Card } from "@/components/ui/card";
import { renderBlocks } from "@/lib/block-renderer";
import { Button } from "@/components/ui/button";

interface FormPreviewProps {
  formName: string;
  blocks: IFormBlock[];
  signingParties: IFormSigningParty[];
}

/**
 * Non-editable form preview that shows how the form looks for each signing party
 * Filters blocks by signing party to show what each party will see
 */
export const FormPreview = ({ formName, blocks, signingParties }: FormPreviewProps) => {
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(
    signingParties.length > 0 ? signingParties[0]._id : null
  );

  // Filter blocks for the selected signing party
  const filteredBlocks = selectedPartyId
    ? blocks.filter((block) => block.signing_party_id === selectedPartyId)
    : [];

  const selectedParty = signingParties.find((p) => p._id === selectedPartyId);

  return (
    <div className="space-y-4">
      {/* Party Selector */}
      <Card className="border border-slate-200 bg-white p-4">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Preview by Signing Party</h3>
          <div className="flex flex-wrap gap-2">
            {signingParties.map((party) => (
              <Button
                key={party._id}
                onClick={() => setSelectedPartyId(party._id)}
                variant={selectedPartyId === party._id ? "default" : "outline"}
                className="flex h-auto flex-col items-start px-3 py-2"
              >
                <span className="-mb-2.5 text-sm font-medium">
                  {party.signatory_account?.name || party.signatory_source}
                </span>
                <span className="text-xs opacity-60">Order: {party.order}</span>
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Preview Content */}
      <Card className="border border-slate-200 bg-white p-4">
        {filteredBlocks.length > 0 ? (
          <div className="space-y-3">
            {/* Render blocks in non-editable mode */}
            {renderBlocks(
              filteredBlocks,
              {
                values: {},
                onChange: () => {}, // No-op for preview
                errors: {},
              },
              {
                editorMode: false, // Non-editable mode
                stripStyling: true, // Clean form appearance
              }
            )}
          </div>
        ) : (
          <div className="rounded bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-500">No blocks assigned to this signing party yet.</p>
          </div>
        )}
      </Card>
    </div>
  );
};
