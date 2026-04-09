"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ClientBlock,
  FormMetadata,
  IFormBlock,
  IFormField,
  SCHEMA_VERSION,
} from "@betterinternship/core/forms";

type PreviewFieldFormValue = {
  name: string;
  label: string;
  tooltip_label: string;
  type: string;
  source: string;
  shared: boolean;
  prefiller: string;
  validator: string;
};

interface PreviewClientField {
  field: string;
  label?: string;
  source?: string;
  coerce?: (value: unknown) => unknown;
  validator?: {
    safeParse: (value: unknown) => {
      success?: boolean;
      error?: {
        issues?: Array<{ message?: string }>;
        errors?: Array<{ message?: string }>;
      };
    };
  };
}

export function useCustomFieldPreview(
  value: PreviewFieldFormValue,
  resetKey?: string
) {
  const [previewValidator, setPreviewValidator] = useState<string>(value.validator || "");
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
  const [previewErrors, setPreviewErrors] = useState<Record<string, string>>({});
  const previewValuesRef = useRef<Record<string, string>>({});
  const previewFieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const previewRawBlocks = useMemo<IFormBlock[]>(
    () => [
      {
        _id: "preview-custom-field",
        block_type: "form_field",
        order: 0,
        signing_party_id: "",
        field_schema: {
          field: value.name || "custom_field",
          type: (value.type as "text" | "signature") || "text",
          label: value.label || "Field Label",
          tooltip_label: value.tooltip_label || "",
          source: value.source || "manual",
          shared: value.shared ?? true,
          prefiller: value.prefiller || undefined,
          validator: previewValidator || undefined,
          page: 1,
          x: 0,
          y: 0,
          w: 100,
          h: 12,
          align_h: "center",
          align_v: "bottom",
        } as IFormField,
      } as IFormBlock,
    ],
    [
      value.name,
      value.type,
      value.label,
      value.tooltip_label,
      value.source,
      value.shared,
      value.prefiller,
      previewValidator,
    ]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      const candidate = value.validator || "";
      try {
        const testMetadata = new FormMetadata({
          name: "preview-custom-field",
          label: "Preview Custom Field",
          schema_version: SCHEMA_VERSION,
          schema: { blocks: previewRawBlocks },
          signing_parties: [],
          subscribers: [],
        });
        testMetadata.getFieldsForClientService();
        setPreviewValidator(candidate);
      } catch {
        // Keep last valid preview validator while typing.
      }
    }, 180);

    return () => clearTimeout(timeout);
  }, [value.validator, previewRawBlocks]);

  useEffect(() => {
    setPreviewValues({});
    previewValuesRef.current = {};
    setPreviewErrors({});
  }, [value.name, resetKey]);

  const previewMetadata = useMemo(() => {
    try {
      return new FormMetadata({
        name: "preview-custom-field",
        label: "Preview Custom Field",
        schema_version: SCHEMA_VERSION,
        schema: { blocks: previewRawBlocks },
        signing_parties: [],
        subscribers: [],
      });
    } catch {
      return null;
    }
  }, [previewRawBlocks]);

  const previewBlocks = useMemo<ClientBlock<[]>[]>(
    () => (previewMetadata ? (previewMetadata.getBlocksForClientService() as ClientBlock<[]>[]) : []),
    [previewMetadata]
  );

  const previewFieldMap = useMemo(() => {
    try {
      if (!previewMetadata) return new Map<string, PreviewClientField>();
      const map = new Map<string, PreviewClientField>();
      previewMetadata.getFieldsForClientService().forEach((rawField: unknown) => {
        const candidate = rawField as Partial<PreviewClientField>;
        if (!candidate.field || typeof candidate.field !== "string") return;
        map.set(candidate.field, candidate as PreviewClientField);
      });
      return map;
    } catch {
      return new Map<string, PreviewClientField>();
    }
  }, [previewMetadata]);

  const onBlurValidate = (
    fieldKey: string,
    fieldFromRenderer?: unknown,
    nextValue?: unknown
  ) => {
    const rendererField = (fieldFromRenderer as Partial<PreviewClientField>) || null;
    const mappedField = previewFieldMap.get(fieldKey);
    const resolvedField =
      rendererField?.field === fieldKey
        ? (rendererField as PreviewClientField)
        : mappedField || undefined;

    if (!resolvedField || resolvedField.source !== "manual") return;
    if (!resolvedField.validator || typeof resolvedField.validator.safeParse !== "function") {
      setPreviewErrors((prev) => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
      return;
    }

    const rawValue =
      nextValue === undefined
        ? (previewValuesRef.current[fieldKey] ?? "")
        : String(nextValue ?? "");
    const coerced =
      typeof resolvedField.coerce === "function" ? resolvedField.coerce(rawValue) : rawValue;
    const result = resolvedField.validator.safeParse(coerced);

    if (result?.success === false || result?.error) {
      const message =
        (result.error?.issues?.[0]?.message || result.error?.errors?.[0]?.message) ??
        "Invalid value";
      setPreviewErrors((prev) => ({
        ...prev,
        [fieldKey]: `${resolvedField.label || fieldKey}: ${message}`,
      }));
      return;
    }

    setPreviewErrors((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const onValueChange = (key: string, nextValue: unknown) => {
    const nextRawValue = String(nextValue);
    const next = { ...previewValuesRef.current, [key]: nextRawValue };
    previewValuesRef.current = next;
    setPreviewValues(next);
    setPreviewErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return {
    previewBlocks,
    previewValues,
    previewErrors,
    previewFieldRefs,
    onValueChange,
    onBlurValidate,
  };
}

