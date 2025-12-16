/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 20:52:53
 * @ Modified by: Your name
 * @ Modified time: 2025-12-16 21:01:51
 * @ Description: UI for mode selection and field type choice
 */

"use client";

import { Button } from "@/components/ui/button";
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
};

export const PlacementControl = ({
  isPlacing,
  fieldType,
  onFieldTypeChange,
  onStartPlacing,
  onCancelPlacing,
}: PlacementControlProps) => {
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
    <div className="flex items-center gap-3">
      <Select value={fieldType} onValueChange={onFieldTypeChange}>
        <SelectTrigger className="w-40">
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
      <Button size="sm" onClick={onStartPlacing}>
        Place Field
      </Button>
    </div>
  );
};
