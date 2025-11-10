/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-11-09 03:19:04
 * @ Modified time: 2025-11-10 15:13:53
 * @ Description:
 *
 * We can move this out later on so it becomes reusable in other places.
 * This allows the consumer to use information about a form within the component.
 */

import {
  formsControllerGetFieldFromRegistry,
  formsControllerGetRegistryFormDocument,
  formsControllerGetRegistryFormMetadata,
} from "@/app/api";
import { IFormField, IFormMetadata } from "@betterinternship/core/forms";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useFieldTemplateContext } from "./field-template.ctx";

// ? Current schema version, update if needed; tells us if out of date
export const SCHEMA_VERSION = 0;

// Context interface
export interface IFormContext {
  formName: string;
  formVersion: number;
  formMetadata: IFormMetadata;
  document: IDocument;
  fields: IFormField[];
  loading: boolean;
  refreshing: boolean;

  // Setters
  updateFormName: (newFormName: string) => void;
  updateFormVersion: (newFormVersion: number) => void;
  updateDocument: (newDocument: Partial<IDocument>) => void;
  updateField: (fieldIndex: number, newField: Partial<IFormField>) => void;
  removeField: (fieldIndex: number) => void;
  setFields: (newFields: IFormField[]) => void;
  addField: (newField: IFormField) => void;
  refreshFields: () => Promise<void>;
}

interface IDocument {
  name: string;
  url: string;
  file: File | null;
}

// Context defs
const FormContext = createContext<IFormContext>({} as IFormContext);
export const useFormContext = () => useContext(FormContext);

/**
 * Gives access to form context api
 *
 * @component
 * @provider
 */
export const FormContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { registry } = useFieldTemplateContext();

  // Define state here
  const [documentName, setDocumentName] = useState<string>("");
  const [documentUrl, setDocumentUrl] = useState<string>("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [formName, setFormName] = useState<string>("");
  const [formVersion, setFormVersion] = useState<number>(0);
  const [fields, setFields] = useState<IFormField[]>([]);

  // Default form metadata
  const initialFormMetadata = {
    name: "",
    label: "",
    schema_version: SCHEMA_VERSION,
    schema: [],
    subscribers: [],
    signatories: [],
    required_parties: [],
  };
  const [formMetadata, setFormMetadata] = useState<IFormMetadata>(initialFormMetadata);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Updates a field, given its index
  const updateField = (fieldIndex: number, newField: Partial<IFormField>) => {
    setFields([
      ...fields.slice(0, fieldIndex),
      { ...fields[fieldIndex], ...newField },
      ...fields.slice(fieldIndex + 1),
    ]);
  };

  // Add new field
  const addField = (field: IFormField) => {
    setFields([...fields, field]);
  };

  // Updates a field, given its index
  const removeField = (fieldIndex: number) => {
    setFields(fields.filter((f, i) => i !== fieldIndex));
  };

  // Refresh field references to template table
  const refreshFields = useCallback(async () => {
    setRefreshing(true);

    // Util for refreshing field
    const fieldRefresher = async (oldField: IFormField) => {
      const fieldId = registry.find((f) => `${f.name}:${f.preset}` === oldField.field)?.id;
      if (!fieldId) return oldField;

      const { field } = await formsControllerGetFieldFromRegistry({ id: fieldId });
      const { id: _id, name: _name, preset: _preset, ...rest } = field;
      const fieldFullName = `${field.name}:${field.preset}`;
      const newField = {
        ...oldField,
        ...rest,
        field: fieldFullName,
        validator: field.validator ?? "",
        prefiller: field.prefiller ?? "",
        tooltip_label: field.tooltip_label ?? "",
        h: 10,
      };

      return newField;
    };

    // Refresh all fields
    const newFields = await Promise.all(fields.map(fieldRefresher)).then((fs) =>
      fs
        .filter((f) => f !== undefined)
        .map((f) => (!f.align_h ? { ...f, align_h: "center" as const } : f))
        .map((f) => (!f.align_v ? { ...f, align_v: "bottom" as const } : f))
    );

    setFields(newFields);
    setRefreshing(false);
  }, [formName, formVersion]);

  // When form name and version are updated, pull latest
  useEffect(() => {
    if (!formName || (!formVersion && formVersion !== 0)) return;
    const controller = new AbortController();
    const payload = {
      name: formName,
      version: formVersion,
    };

    const promises = [
      // Promise for pulling metadata
      formsControllerGetRegistryFormMetadata(payload, controller.signal).then(
        ({ formMetadata }) => {
          console.log("Request for ", payload, formMetadata);
          setFields(formMetadata.schema);
          setDocumentName(formMetadata.name);
          setFormMetadata(formMetadata);
        }
      ),
      // Promise for retrieving the document
      formsControllerGetRegistryFormDocument(payload, controller.signal).then(
        ({ formDocument }) => {
          setDocumentUrl(formDocument);
        }
      ),
    ];

    setLoading(true);
    let rejector: (reason?: any) => void;
    void new Promise((resolve, reject) => {
      rejector = reject;
      void Promise.all(promises).then(resolve);
    })
      .then(() => setLoading(false))
      .catch((e) => {
        alert(e);
        setLoading(false);
      });

    console.log("CHANGING FORM");
    console.log(fields);

    return () => (
      controller.abort(),
      rejector?.("Rejecting request."),
      console.warn("Cancelling request.")
    );
  }, [formName, formVersion]);

  // Clear fields on refresh?
  useEffect(() => {
    setFields([]);
    setFormMetadata(initialFormMetadata);
    console.log("Clearing fields and metadata...");
  }, []);

  // The form context
  const formContext: IFormContext = {
    formName,
    formVersion,
    formMetadata,
    fields,
    loading,
    refreshing,
    document: { name: documentName, url: documentUrl, file: documentFile },

    updateField,
    removeField,
    addField,
    setFields,
    refreshFields,

    updateFormName: (newFormName: string) => setFormName(newFormName),
    updateFormVersion: (newFormVersion: number) => setFormVersion(newFormVersion),
    updateDocument: (newDocument: Partial<IDocument>) => {
      if (newDocument.name) setDocumentName(newDocument.name);
      if (newDocument.url) setDocumentUrl(newDocument.url);
      if (newDocument.file) setDocumentFile(newDocument.file);
    },
  };

  return <FormContext.Provider value={formContext}>{children}</FormContext.Provider>;
};
