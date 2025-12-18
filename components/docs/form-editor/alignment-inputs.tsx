/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-18
 * @ Modified by: Your name
 * @ Modified time: 2025-12-18 20:04:13
 * @ Description: Reusable alignment input component
 *                Handles horizontal and vertical alignment selection
 */

"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AlignmentInputsProps = {
  align_h: "left" | "center" | "right";
  align_v: "top" | "middle" | "bottom";
  onChange: (alignment: {
    align_h: "left" | "center" | "right";
    align_v: "top" | "middle" | "bottom";
  }) => void;
};

export const AlignmentInputs = ({ align_h, align_v, onChange }: AlignmentInputsProps) => {
  return (
    <div className="space-y-2">
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
