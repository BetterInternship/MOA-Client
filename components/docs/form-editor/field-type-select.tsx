/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 23:53:41
 * @ Modified by: Your name
 * @ Modified time: 2025-12-17 00:00:33
 * @ Description: Component for field type selection
 */

import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ! Do something about this soon
const FIELD_TYPES = [
  { value: "signature", label: "Signature" },
  { value: "initials", label: "Initials" },
  { value: "date", label: "Date" },
  { value: "text", label: "Text" },
  { value: "checkbox", label: "Checkbox" },
] as const;

type FieldTypeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export const FieldTypeSelect = ({ value, onChange, disabled }: FieldTypeSelectProps) => {
  const fieldTypes = useMemo(() => FIELD_TYPES, []);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-9 text-xs">
        <SelectValue placeholder="Select field type" />
      </SelectTrigger>
      <SelectContent>
        {fieldTypes.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            {type.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export { FIELD_TYPES };
