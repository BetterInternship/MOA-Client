"use client";

import { createContext, useContext } from "react";
import type { ValidatorIRv0 } from "@/lib/validator-ir";
import type { FieldSchemaDefaults } from "@/lib/field-schema-defaults";

export type FieldLibraryFieldOption = {
  id: string;
  name: string;
};

export type FieldLibraryPresetTemplateOption = {
  id: string;
  name: string;
  label?: string;
  group?: "core" | "format";
  iconKey?: string;
  disabled?: boolean;
  type?: "text" | "signature" | "image";
  source?: "auto" | "prefill" | "derived" | "manual";
  shared?: boolean;
  tag?: string;
  preset?: string;
  prefiller?: string;
  tooltip_label?: string;
  validator?: string;
  validator_ir?: ValidatorIRv0 | null;
  field_schema_defaults?: FieldSchemaDefaults;
  is_phantom?: boolean;
  party?: string;
};

type FieldLibraryContextValue = {
  fieldOptions: FieldLibraryFieldOption[];
  presetTemplates: FieldLibraryPresetTemplateOption[];
  tagOptions: string[];
};

// Modal-scoped context for field create/edit screens to avoid prop drilling.
const FieldLibraryContext = createContext<FieldLibraryContextValue | null>(null);

export function FieldLibraryProvider({
  value,
  children,
}: {
  value: FieldLibraryContextValue;
  children: React.ReactNode;
}) {
  return <FieldLibraryContext.Provider value={value}>{children}</FieldLibraryContext.Provider>;
}

export function useFieldLibrary() {
  const context = useContext(FieldLibraryContext);
  if (!context) {
    // Fail fast if a modal forgets to wrap with provider.
    throw new Error("useFieldLibrary must be used within FieldLibraryProvider");
  }
  return context;
}
