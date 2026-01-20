"use client";

import { FONTS, type FontName } from "@betterinternship/core/forms";
import { toast } from "sonner";
import { toastPresets } from "@/components/sonner-toaster";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FontConstantsPanelProps {
  overrideFonts: boolean;
  onOverrideFontsChange: (override: boolean) => void;
  textFont: string;
  onTextFontChange: (font: string) => void;
  signatureFont: string;
  onSignatureFontChange: (font: string) => void;
  onApplyFonts: (textFont: FontName, signatureFont: FontName) => void;
}

export function FontConstantsPanel({
  overrideFonts,
  onOverrideFontsChange,
  textFont,
  onTextFontChange,
  signatureFont,
  onSignatureFontChange,
  onApplyFonts,
}: FontConstantsPanelProps) {
  const handleOverrideChange = (override: boolean) => {
    onOverrideFontsChange(override);
    if (!override) {
      // Clear selections when disabled
      onTextFontChange("");
      onSignatureFontChange("");
    }
  };

  const handleApply = () => {
    if (textFont && signatureFont) {
      onApplyFonts(textFont as FontName, signatureFont as FontName);
      toast.success("Fonts applied to form successfully!", toastPresets.success);
    }
  };

  return (
    <div className="h-full space-y-6 overflow-auto p-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Font Configuration</h3>

        <div className="space-y-4">
          {/* Info Section */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> Font overrides will be applied to all text and signature fields
              in your form. Changes are automatically saved when you adjust the settings.
            </p>
          </div>
          {/* Toggle for font override */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <label className="block text-sm font-medium">Overwrite Default Font Style</label>
              <p className="mt-1 text-xs text-gray-500">
                Apply custom fonts to text and signature fields
              </p>
            </div>
            <Switch
              checked={overrideFonts}
              onCheckedChange={handleOverrideChange}
              aria-label="Toggle font override"
            />
          </div>

          {/* Font selections - shown when override is enabled */}
          {overrideFonts && (
            <div className="space-y-4 rounded-lg bg-gray-50 p-4">
              {/* Text Font Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Text</label>
                <Select value={textFont} onValueChange={onTextFontChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a font..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {FONTS.map((font) => (
                      <SelectItem key={font.name} value={font.name}>
                        {font.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Signature Font Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Signature</label>
                <Select value={signatureFont} onValueChange={onSignatureFontChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a font..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {FONTS.map((font) => (
                      <SelectItem key={font.name} value={font.name}>
                        {font.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview info */}
              <div className="mt-4 rounded border bg-white p-3 text-xs text-gray-600">
                <p>
                  <strong>Text Font:</strong> {textFont || "Not selected"}
                </p>
                <p className="mt-1">
                  <strong>Signature Font:</strong> {signatureFont || "Not selected"}
                </p>
              </div>

              {/* Apply Button */}
              <Button
                onClick={handleApply}
                disabled={!textFont || !signatureFont}
                className="mt-4 w-full"
              >
                Apply Fonts to Form
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
