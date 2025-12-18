/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 20:52:53
 * @ Modified by: Your name
 * @ Modified time: 2025-12-18 19:12:43
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  onCoordinatesChange?: (coords: { x: number; y: number; w: number; h: number }) => void;
  onAlignmentChange?: (alignment: {
    align_h: "left" | "center" | "right";
    align_v: "top" | "middle" | "bottom";
  }) => void;
  registry?: FieldRegistryEntry[];
};

/**
 * AlignmentInputs component - allows editing field alignment
 */
const AlignmentInputs = ({
  align_h,
  align_v,
  onChange,
}: {
  align_h: "left" | "center" | "right";
  align_v: "top" | "middle" | "bottom";
  onChange: (alignment: {
    align_h: "left" | "center" | "right";
    align_v: "top" | "middle" | "bottom";
  }) => void;
}) => {
  return (
    <div className="space-y-2 rounded-md border border-slate-300 bg-slate-50 p-2">
      <div className="text-xs font-semibold text-slate-700">Alignment</div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-xs font-medium text-slate-600">Horizontal</Label>
          <Select
            value={align_h}
            onValueChange={(value) =>
              onChange({ align_h: value as "left" | "center" | "right", align_v })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs font-medium text-slate-600">Vertical</Label>
          <Select
            value={align_v}
            onValueChange={(value) =>
              onChange({ align_h, align_v: value as "top" | "middle" | "bottom" })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="middle">Middle</SelectItem>
              <SelectItem value="bottom">Bottom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
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
  align_h = "center",
  align_v = "middle",
  onCoordinatesChange,
  onAlignmentChange,
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

      {onAlignmentChange && (
        <AlignmentInputs align_h={align_h} align_v={align_v} onChange={onAlignmentChange} />
      )}

      <Button size="sm" onClick={onStartPlacing} className="w-full">
        Place Field
      </Button>
    </div>
  );
};
