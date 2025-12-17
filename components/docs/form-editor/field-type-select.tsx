/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 23:53:41
 * @ Modified by: Your name
 * @ Modified time: 2025-12-17 13:44:34
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
import { useFieldTemplateContext } from "@/app/docs/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/field-template.ctx";

type FieldTypeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export const FieldTypeSelect = ({ value, onChange, disabled }: FieldTypeSelectProps) => {
  const { registry } = useFieldTemplateContext();

  const fieldTypes = useMemo(
    () =>
      registry.map((field) => ({
        value: field.id,
        name: field.name,
        label: field.label,
      })),
    [registry]
  );

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
