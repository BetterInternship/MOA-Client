/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 20:52:53
 * @ Modified by: Your name
 * @ Modified time: 2025-12-16 23:45:45
 * @ Description: UI for mode selection and field type choice
 */

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

const FIELD_TYPES = [
  { value: "signature", label: "Signature" },
  { value: "initials", label: "Initials" },
  { value: "date", label: "Date" },
  { value: "text", label: "Text" },
  { value: "checkbox", label: "Checkbox" },
];

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
}: PlacementControlProps) => {
  const handleCoordChange = (key: "x" | "y" | "w" | "h", value: string) => {
    const num = parseFloat(value) || 0;
    if (onCoordinatesChange) {
      onCoordinatesChange({
        x: key === "x" ? num : x,
        y: key === "y" ? num : y,
        w: key === "w" ? num : w,
        h: key === "h" ? num : h,
      });
    }
  };
  if (isPlacing) {
    return (
      <div className="border-primary bg-primary/5 flex items-center gap-3 rounded-md border px-4 py-3">
        <div className="flex-1">
          <p className="text-sm font-medium">Placement Mode Active</p>
          <p className="text-muted-foreground text-xs">
            Click on the PDF to place a {fieldType} field
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={onCancelPlacing}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex-1">
        <Select value={fieldType} onValueChange={onFieldTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select field type" />
          </SelectTrigger>
          <SelectContent>
            {FIELD_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Coordinate inputs */}
      <div className="space-y-1.5 text-xs">
        <div className="grid grid-cols-2 gap-1.5">
          <div>
            <label className="text-muted-foreground mb-0.5 block">X</label>
            <Input
              type="number"
              value={x}
              onChange={(e) => handleCoordChange("x", e.target.value)}
              className="h-7 text-xs"
              placeholder="X"
            />
          </div>
          <div>
            <label className="text-muted-foreground mb-0.5 block">Y</label>
            <Input
              type="number"
              value={y}
              onChange={(e) => handleCoordChange("y", e.target.value)}
              className="h-7 text-xs"
              placeholder="Y"
            />
          </div>
          <div>
            <label className="text-muted-foreground mb-0.5 block">Width</label>
            <Input
              type="number"
              value={w}
              onChange={(e) => handleCoordChange("w", e.target.value)}
              className="h-7 text-xs"
              placeholder="Width"
            />
          </div>
          <div>
            <label className="text-muted-foreground mb-0.5 block">Height</label>
            <Input
              type="number"
              value={h}
              onChange={(e) => handleCoordChange("h", e.target.value)}
              className="h-7 text-xs"
              placeholder="Height"
            />
          </div>
        </div>
      </div>

      <Button size="sm" onClick={onStartPlacing} className="w-full">
        Place Field
      </Button>
    </div>
  );
};
