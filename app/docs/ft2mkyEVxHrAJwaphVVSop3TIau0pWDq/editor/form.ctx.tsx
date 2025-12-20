/**
 * @ Author: BetterInternship
 * @ Create Time: 2025-11-09 03:19:04
 * @ Modified time: 2025-12-21 05:23:32
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
import {
  DUMMY_FORM_METADATA,
  FormMetadata,
  IFormField,
  IFormMetadata,
  IFormParameters,
  IFormPhantomField,
} from "@betterinternship/core/forms";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useFieldTemplateContext } from "./field-template.ctx";
import { cn } from "@/lib/utils";

// ? Current schema version, update if needed; tells us if out of date
export const SCHEMA_VERSION = 0;

// Context interface
export interface IFormContext {
  formName: string;
  formVersion: number;
  formMetadata: IFormMetadata;
  document: IDocument;
  fields: IFormField[];
  phantomFields: IFormPhantomField[];
  params: IFormParameters;
  keyedFields: (IFormField & { _id: string })[];
  keyedPhantomFields: (IFormPhantomField & { _id: string })[];
  previews: Record<number, React.ReactNode[]>;
  loading: boolean;
  refreshing: boolean;
  selectedPreviewId: string | null;
  setSelectedPreviewId: (id: string | null) => void;

  // Setters
  updateFormName: (newFormName: string) => void;
  updateFormVersion: (newFormVersion: number) => void;
  updateDocument: (newDocument: Partial<IDocument>) => void;
  updateField: (fieldIndex: number, newField: Partial<IFormField>) => void;
  addField: (newField: IFormField) => void;
  removeField: (fieldIndex: number) => void;
  updatePhantomField: (fieldIndex: number, newField: Partial<IFormPhantomField>) => void;
  addPhantomField: (newField: IFormPhantomField) => void;
  removePhantomField: (fieldIndex: number) => void;
  setFields: (newFields: IFormField[]) => void;
  updateParam: (key: string, value: string) => void;
  removeParam: (key: string) => void;
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
  const [phantomFields, setPhantomFields] = useState<IFormPhantomField[]>([]);
  const [params, setParams] = useState<IFormParameters>({});
  const [previews, setPreviews] = useState<Record<number, React.ReactNode[]>>({});
  const [selectedPreviewId, setSelectedPreviewId] = useState<string>("");

  // Used in the ui for selecting / distinguishing fields
  const keyedFields = useMemo(
    () => fields.map((field) => ({ _id: Math.random().toString(), ...field })),
    [fields, registry]
  );

  // Used in the ui for selecting / distinguishing phantom fields
  const keyedPhantomFields = useMemo(
    () => phantomFields.map((field) => ({ _id: Math.random().toString(), ...field })),
    [phantomFields, registry]
  );

  // Default form metadata
  const initialFormMetadata: IFormMetadata = {
    name: "",
    label: "",
    schema_version: SCHEMA_VERSION,
    schema: { blocks: [] },
    subscribers: [],
    signing_parties: [],
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

  // Updates a field, given its index
  const updatePhantomField = (fieldIndex: number, newField: Partial<IFormPhantomField>) => {
    setPhantomFields([
      ...phantomFields.slice(0, fieldIndex),
      { ...phantomFields[fieldIndex], ...newField },
      ...phantomFields.slice(fieldIndex + 1),
    ]);
  };

  // Add new field
  const addPhantomField = (field: IFormPhantomField) => {
    setPhantomFields([...phantomFields, field]);
  };

  // Updates a field, given its index
  const removePhantomField = (fieldIndex: number) => {
    setPhantomFields(phantomFields.filter((f, i) => i !== fieldIndex));
  };

  // Adds a new param
  const updateParam = (key: string, value: string) => {
    setParams({
      ...params,
      [key]: value,
    });
  };

  // Remove the specified param
  const removeParam = (key: string) => {
    const newParams = { ...params };
    delete newParams[key];
    setParams({
      ...newParams,
    });
  };

  const refreshParams = (fields: IFormField[]) => {
    // Convert fields to blocks for FormMetadata
    const blocks = fields.map((field, index) => ({
      block_type: "form_field" as const,
      order: index,
      field_schema: field,
      signing_party_id: "party-1", // Default party
    }));
    console.log("blocks", blocks);
    const fm = new FormMetadata({ ...initialFormMetadata, schema: { blocks } });
    setParams({
      ...fm.inferParams().reduce((acc, cur) => {
        acc[cur] = "";
        return acc;
      }, {} as IFormParameters),
      ...params,
    });
  };

  // Refresh field references to template table
  const refreshFields = async () => {
    setRefreshing(true);

    // Util for refreshing field
    const fieldRefresher = async (oldField: IFormField | IFormPhantomField) => {
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
      };

      return newField;
    };

    // Refresh all fields
    const newFields = await Promise.all(fields.map(fieldRefresher)).then((fs) =>
      fs
        .filter((f) => f !== undefined)
        .map((f) => f as IFormField)
        .map((f) => (!f.align_h ? { ...f, align_h: "center" as const } : f))
        .map((f) => (!f.align_v ? { ...f, align_v: "bottom" as const } : f))
    );

    // Refresh phantom fields too
    const newPhantomFields = await Promise.all(phantomFields.map(fieldRefresher)).then((fs) =>
      fs.filter((f) => f !== undefined).map((f) => f)
    );

    setFields(newFields);
    setPhantomFields(newPhantomFields);
    refreshParams(newFields);
    setRefreshing(false);
  };

  // Refresh previews of the different fields
  const refreshPreviews = () => {
    const newPreviews: Record<number, React.ReactNode[]> = {};

    // Push new previews here
    keyedFields.forEach((field) => {
      if (!newPreviews[field.page]) newPreviews[field.page] = [];
      newPreviews[field.page].push(
        <FieldPreview
          key={field._id}
          field={field.field}
          x={field.x}
          y={field.y}
          w={field.w}
          h={field.h}
          selected={field._id === selectedPreviewId}
          onClick={() => setSelectedPreviewId(field._id)}
        />
      );
    });

    setPreviews(newPreviews);
  };

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
          const fm = new FormMetadata(DUMMY_FORM_METADATA ?? formMetadata);
          setFields(fm.getFields());
          setPhantomFields(fm.getPhantomFields());
          setDocumentName(formMetadata.name);

          // ! REMOVE THIS SOON - the fix is just regenerating the spec.json for client and server
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          setFormMetadata(formMetadata);
          setParams({
            ...fm.inferParams().reduce((acc, cur) => {
              acc[cur] = "";
              return acc;
            }, {} as IFormParameters),
            ...formMetadata.params,
          });
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

    return () => (controller.abort(), rejector?.("Rejecting request."));
  }, [formName, formVersion]);

  // Clear fields on refresh?
  useEffect(() => {
    setFields([]);
    setPhantomFields([]);
    setParams({});
    setFormMetadata(initialFormMetadata);
    console.log("Clearing fields and metadata...");
  }, []);

  // Updates the field previews
  // (we have to touch the DOM directly for this to go under the hoods of the lib we're using)
  useEffect(() => {
    // Refresh previews
    refreshPreviews();

    // Update parameters as well
    refreshParams(fields);

    return () => setPreviews({});
  }, [selectedPreviewId, keyedFields, registry]);

  // The form context
  const formContext: IFormContext = {
    formName,
    formVersion,
    formMetadata,
    fields,
    phantomFields,
    params,
    keyedFields,
    keyedPhantomFields,
    previews,
    loading,
    refreshing,
    selectedPreviewId: selectedPreviewId || null,
    setSelectedPreviewId: (id: string | null) => setSelectedPreviewId(id ?? ""),
    document: { name: documentName, url: documentUrl, file: documentFile },

    updateField,
    removeField,
    addField,
    updatePhantomField,
    addPhantomField,
    removePhantomField,
    setFields,
    updateParam,
    removeParam,
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

/**
 * A preview of what the field will look like on the document.
 *
 * @component
 */
const FieldPreview = ({
  field,
  x,
  y,
  w,
  h,
  selected,
  onClick,
}: {
  field: string;
  x: number;
  y: number;
  w: number;
  h: number;
  selected: boolean;
  onClick: () => void;
}) => {
  return (
    <div
      className={cn(
        "absolute top-0 left-0 border-0!",
        selected ? "bg-supportive/50!" : "bg-warning/50!"
      )}
      onClick={() => onClick()}
      onMouseDown={onClick}
      style={{
        userSelect: "auto",
        display: "inline-block",
        width: `round(var(--scale-factor) * ${w}px, 1px)`,
        height: `round(var(--scale-factor) * ${h}px, 1px)`,
        fontSize: "10px",
        transform: `translate(round(var(--scale-factor) * ${x}px, 1px), round(var(--scale-factor) * ${y}px, 1px))`,
        boxSizing: "border-box",
        cursor: "pointer",
        flexShrink: "0",
      }}
    >
      {field}
    </div>
  );
};
