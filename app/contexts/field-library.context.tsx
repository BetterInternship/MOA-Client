"use client";

import { createContext, useContext } from "react";

export type FieldLibraryFieldOption = {
  id: string;
  name: string;
};

export type FieldLibraryPresetTemplateOption = {
  id: string;
  name: string;
  label?: string;
};

type FieldLibraryContextValue = {
  fieldOptions: FieldLibraryFieldOption[];
  presetTemplates: FieldLibraryPresetTemplateOption[];
  tagOptions: string[];
};

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
    throw new Error("useFieldLibrary must be used within FieldLibraryProvider");
  }
  return context;
}

