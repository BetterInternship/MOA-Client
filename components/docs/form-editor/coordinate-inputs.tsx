/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 23:53:46
 * @ Modified by: Your name
 * @ Modified time: 2025-12-16 23:59:22
 * @ Description: Reusable coordinate input component
 *                Handles X, Y, Width, Height editing with validation
 */

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CoordinateInputsProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  onChange: (coords: { x: number; y: number; w: number; h: number }) => void;
  disabled?: boolean;
};

const CoordinateField = ({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (newValue: number) => void;
  disabled?: boolean;
}) => (
  <div className="flex flex-col gap-1">
    <Label className="text-xs font-medium text-slate-600">{label}</Label>
    <Input
      type="number"
      value={Math.round(value * 10) / 10}
      onChange={(e) => {
        const newVal = parseFloat(e.target.value);
        if (!isNaN(newVal)) onChange(newVal);
      }}
      className="h-8 text-xs"
      disabled={disabled}
      step="0.1"
    />
  </div>
);

export const CoordinateInputs = ({ x, y, w, h, onChange, disabled }: CoordinateInputsProps) => {
  const handleChange = (key: "x" | "y" | "w" | "h", value: number) => {
    onChange({ x, y, w, h, [key]: value });
  };

  const memoizedCoordinates = useMemo(() => ({ x, y, w, h }), [x, y, w, h]);

  return (
    <div className="grid grid-cols-2 gap-2">
      <CoordinateField
        label="X"
        value={memoizedCoordinates.x}
        onChange={(value) => handleChange("x", value)}
        disabled={disabled}
      />
      <CoordinateField
        label="Y"
        value={memoizedCoordinates.y}
        onChange={(value) => handleChange("y", value)}
        disabled={disabled}
      />
      <CoordinateField
        label="Width"
        value={memoizedCoordinates.w}
        onChange={(value) => handleChange("w", value)}
        disabled={disabled}
      />
      <CoordinateField
        label="Height"
        value={memoizedCoordinates.h}
        onChange={(value) => handleChange("h", value)}
        disabled={disabled}
      />
    </div>
  );
};
