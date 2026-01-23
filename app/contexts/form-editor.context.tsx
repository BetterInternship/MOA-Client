"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  IFormMetadata,
  IFormBlock,
  IFormSigningParty,
  IFormSubscriber,
} from "@betterinternship/core/forms";

const BLANK_FORM_METADATA: IFormMetadata = {
  name: "new-form",
  label: "New Form",
  schema_version: 1,
  schema: {
    blocks: [],
  },
  signing_parties: [
    {
      _id: "initiator",
      order: 1,
      signatory_title: "initiator",
    },
  ],
  subscribers: [],
};

export type EditorTab = "editor" | "preview" | "metadata" | "parties" | "subscribers" | "settings";

interface FormDocumentType {
  name: string;
  label: string;
  version: number;
  base_document_id: string;
  time_generated: string;
}

interface FormEditorContextType {
  // Metadata
  formMetadata: IFormMetadata | null;
  setFormMetadata: (metadata: IFormMetadata) => void;

  // Fetched Data
  formDocument: FormDocumentType | null;
  setFormDocument: (document: FormDocumentType | null) => void;
  formVersion: number | null;
  setFormVersion: (version: number | null) => void;
  documentUrl: string | null;
  setDocumentUrl: (url: string | null) => void;

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
  initialMetadata = BLANK_FORM_METADATA,
}: {
  children: ReactNode;
  initialMetadata?: IFormMetadata;
}) {
  const [formMetadata, setFormMetadata] = useState<IFormMetadata>(initialMetadata);
  const [formDocument, setFormDocument] = useState<FormDocumentType | null>(null);
  const [formVersion, setFormVersion] = useState<number | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
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
    formDocument,
    setFormDocument,
    formVersion,
    setFormVersion,
    documentUrl,
    setDocumentUrl,
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
