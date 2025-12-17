/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 20:52:53
 * @ Modified by: Your name
 * @ Modified time: 2025-12-17 14:24:21
 * @ Description: UI for field placement mode and type selection
 *                Handles the placement workflow with visual feedback
 */

"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { FieldTypeSelect } from "./field-type-select";
import { CoordinateInputs } from "./coordinate-inputs";
import { getFieldLabel } from "@/app/docs/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/field-template.ctx";
import type { FieldRegistryEntry } from "@/app/api";

type PlacementControlProps = {
  isPlacing: boolean;
  fieldType: string;
  onFieldTypeChange: (type: string) => void;
  onStartPlacing: () => void;
  onCancelPlacing: () => void;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  onCoordinatesChange?: (coords: { x: number; y: number; w: number; h: number }) => void;
  registry?: FieldRegistryEntry[];
};

/**
 * PlacementMode component - shows when user is actively placing a field
 */
const PlacementModeActive = ({
  fieldType,
  onCancelPlacing,
  registry = [],
}: {
  fieldType: string;
  onCancelPlacing: () => void;
  registry?: FieldRegistryEntry[];
}) => {
  const label = useMemo(() => getFieldLabel(fieldType, registry), [fieldType, registry]);

  return (
    <div className="border-primary bg-primary/5 flex items-center gap-3 rounded-md border px-4 py-3">
      <div className="flex-1">
        <p className="text-sm font-medium">Placement Mode Active</p>
        <p className="text-muted-foreground text-xs">Click on the PDF to place a {label} field</p>
      </div>
      <Button size="sm" variant="ghost" onClick={onCancelPlacing}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export const PlacementControl = ({
  isPlacing,
  fieldType,
  onFieldTypeChange,
  onStartPlacing,
  onCancelPlacing,
  x = 0,
  y = 0,
  w = 100,
  h = 50,
  onCoordinatesChange,
  registry = [],
}: PlacementControlProps) => {
  if (isPlacing) {
    return (
      <PlacementModeActive
        fieldType={fieldType}
        onCancelPlacing={onCancelPlacing}
        registry={registry}
      />
    );
  }

  return (
    <div className="space-y-2">
      <FieldTypeSelect value={fieldType} onChange={onFieldTypeChange} registry={registry} />

      {onCoordinatesChange && (
        <CoordinateInputs x={x} y={y} w={w} h={h} onChange={onCoordinatesChange} disabled={false} />
      )}

      <Button size="sm" onClick={onStartPlacing} className="w-full">
        Place Field
      </Button>
    </div>
  );
};
