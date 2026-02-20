"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  IFormMetadata,
  IFormBlock,
  IFormSigningParty,
  IFormSubscriber,
} from "@betterinternship/core/forms";

export type EditorTab = "editor" | "preview" | "metadata" | "parties" | "subscribers" | "settings";

interface FormEditorContextType {
  // Metadata
  formMetadata: IFormMetadata | null;
  setFormMetadata: (metadata: IFormMetadata) => void;

  // UI State
  activeTab: EditorTab;
  setActiveTab: (tab: EditorTab) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;

  // Form operations
  updateFormMetadata: (updates: Partial<IFormMetadata>) => void;
  updateBlocks: (blocks: IFormBlock[]) => void;
  updateSigningParties: (parties: IFormSigningParty[]) => void;
  updateSubscribers: (subscribers: IFormSubscriber[]) => void;
}

const FormEditorContext = createContext<FormEditorContextType | undefined>(undefined);

export function FormEditorProvider({
  children,
  initialMetadata,
}: {
  children: ReactNode;
  initialMetadata: IFormMetadata;
}) {
  const [formMetadata, setFormMetadata] = useState<IFormMetadata>(initialMetadata);
  const [activeTab, setActiveTab] = useState<EditorTab>("editor");
  const [isEditing, setIsEditing] = useState(false);

  const updateFormMetadata = useCallback((updates: Partial<IFormMetadata>) => {
    setFormMetadata((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const updateBlocks = useCallback((blocks: IFormBlock[]) => {
    setFormMetadata((prev) => ({
      ...prev,
      schema: {
        ...prev.schema,
        blocks,
      },
    }));
  }, []);

  const updateSigningParties = useCallback((parties: IFormSigningParty[]) => {
    setFormMetadata((prev) => ({
      ...prev,
      signing_parties: parties,
    }));
  }, []);

  const updateSubscribers = useCallback((subscribers: IFormSubscriber[]) => {
    setFormMetadata((prev) => ({
      ...prev,
      subscribers,
    }));
  }, []);

  const value: FormEditorContextType = {
    formMetadata,
    setFormMetadata,
    activeTab,
    setActiveTab,
    isEditing,
    setIsEditing,
    updateFormMetadata,
    updateBlocks,
    updateSigningParties,
    updateSubscribers,
  };

  return <FormEditorContext.Provider value={value}>{children}</FormEditorContext.Provider>;
}

export function useFormEditor() {
  const context = useContext(FormEditorContext);
  if (!context) {
    throw new Error("useFormEditor must be used within FormEditorProvider");
  }
  return context;
}
