/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 20:52:53
 * @ Modified by: Your name
 * @ Modified time: 2025-12-19 00:15:51
 * @ Description: UI for field placement mode and type selection
 *                Handles the placement workflow with visual feedback
 */

"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { FieldTypeSelect } from "./FieldTypeSelect";
import { CoordinateInputs } from "./CoordinatorInputs";
import { AlignmentInputs } from "./AlignmentInputs";
import { getFieldLabel } from "@/app/docs/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/field-template.ctx";
import type { FieldRegistryEntry } from "@/app/api";
import { Divider } from "@/components/ui/divider";

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
  align_h?: "left" | "center" | "right";
  align_v?: "top" | "middle" | "bottom";
  size?: number;
  wrap?: boolean;
  onCoordinatesChange?: (coords: { x: number; y: number; w: number; h: number }) => void;
  onAlignmentChange?: (alignment: {
    align_h: "left" | "center" | "right";
    align_v: "top" | "middle" | "bottom";
  }) => void;
  onSizeChange?: (size: number) => void;
  onWrapChange?: (wrap: boolean) => void;
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
    <div className="flex items-center gap-3 rounded-md bg-blue-50/50 px-4 py-3">
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
  align_h = "center",
  align_v = "middle",
  size = 11,
  wrap = true,
  onCoordinatesChange,
  onAlignmentChange,
  onSizeChange,
  onWrapChange,
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

      <Divider />

      {onAlignmentChange && (
        <AlignmentInputs align_h={align_h} align_v={align_v} onChange={onAlignmentChange} />
      )}

      <Divider />

      {/* Font Size and Wrap Controls */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-700">Font Size & Wrap</label>
        <div className="flex gap-2">
          <input
            type="number"
            min="6"
            max="72"
            value={size}
            onChange={(e) => onSizeChange?.(parseInt(e.target.value) || 11)}
            className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="Size"
          />
          <select
            value={wrap ? "wrap" : "no-wrap"}
            onChange={(e) => onWrapChange?.(e.target.value === "wrap")}
            className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="wrap">Wrap</option>
            <option value="no-wrap">No Wrap</option>
          </select>
        </div>
      </div>

      <Button size="sm" onClick={onStartPlacing} className="w-full">
        Place Field
      </Button>
    </div>
  );
};
