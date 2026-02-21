"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import {
  ClientBlock,
  FormMetadata,
  IFormBlock,
  IFormField,
  IFormSigningParty,
  SCHEMA_VERSION,
} from "@betterinternship/core/forms";
import {
  FieldRegistryEntryDetails,
  formsControllerRegisterField,
  getFormsControllerGetFieldRegistryQueryKey,
} from "@/app/api";
import { useFieldTemplateContext } from "@/app/docs/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/field-template.ctx";
import { useFormEditorTab } from "@/app/contexts/form-editor-tab.context";
import { usePdfViewer } from "@/app/contexts/pdf-viewer.context";
import { getPartyColorByIndex } from "@/lib/party-colors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, Plus, ChevronDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ValidatorBuilder } from "@/components/docs/form-editor/ValidatorBuilder";
import { zodCodeToValidatorConfig, validatorConfigToZodCode } from "@/lib/validator-engine";
import {
  buildFieldRefPrefiller,
  buildManualPrefiller,
  parsePrefillerToCompactState,
} from "@/lib/default-value-builder";
import { validateExpression } from "@/lib/expression-validator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { BlocksRenderer } from "@/components/docs/forms/FormFillerRenderer";

interface BlocksPanelProps {
  blocks: IFormBlock[];
  selectedPartyId: string | null;
  onPartyChange: (partyId: string | null) => void;
  signingParties: IFormSigningParty[];
}

interface CustomFieldDraft {
  name: string;
  label: string;
  type: "text" | "signature";
  party: string;
  shared: boolean;
  source: "auto" | "prefill" | "derived" | "manual";
  tag: string;
  prefiller: string;
  preset: string;
  tooltip_label: string;
  validator: string;
  is_phantom: boolean;
}

interface FieldOption {
  id: string;
  name: string;
}

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

const CUSTOM_TAG = "custom";
const CUSTOM_PRESET = "default";

const deriveNameFromLabel = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

const normalizeValidatorCode = (value: string) =>
  (value || "").replace(/\s+/g, "").replace(/;$/, "").trim();

const DEFAULT_CUSTOM_FIELD_DRAFT: CustomFieldDraft = {
  name: "",
  label: "",
  type: "text",
  party: "",
  shared: true,
  source: "manual",
  tag: CUSTOM_TAG,
  prefiller: "",
  preset: CUSTOM_PRESET,
  tooltip_label: "",
  validator: "",
  is_phantom: false,
};

const isPresetRegistryField = (field: FieldRegistryEntryDetails) =>
  field.preset?.toLowerCase() === "preset" || field.tag?.toLowerCase() === "preset";

function DefaultValueEditor({
  value,
  onChange,
  fieldOptions,
}: {
  value: string;
  onChange: (value: string) => void;
  fieldOptions: FieldOption[];
}) {
  const prefillerValue = value || "";
  const parsed = useMemo(() => parsePrefillerToCompactState(prefillerValue), [prefillerValue]);
  const [open, setOpen] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const [mode, setMode] = useState<"simple" | "raw">("simple");
  const advancedValidation = validateExpression(prefillerValue);

  useEffect(() => {
    if (parsed.kind === "manual") setManualValue(parsed.manualValue);
    if (parsed.kind === "empty") setManualValue("");
  }, [parsed.kind, parsed.manualValue]);

  const triggerText =
    parsed.kind === "field"
      ? fieldOptions.find((f) => f.id === parsed.fieldRef)?.name || parsed.fieldRef
      : parsed.kind === "manual"
        ? parsed.manualValue || "Manual"
        : parsed.kind === "custom"
          ? "Custom"
          : "Select";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold text-slate-700">Default value</Label>
        <button
          type="button"
          onClick={() => setMode((prev) => (prev === "raw" ? "simple" : "raw"))}
          className="rounded-[0.33em] px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          title={mode === "raw" ? "Back to simple mode" : "Open raw mode"}
        >
          {mode === "raw" ? "Back" : "<>"}
        </button>
      </div>

      {mode === "simple" ? (
        <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-8 w-full items-center justify-between rounded-[0.33em] border border-slate-300 bg-white px-2.5 text-sm text-slate-700"
            >
              <span className="truncate">{triggerText}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={6}
            className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-[0.33em] p-2"
          >
            <div className="max-h-44 space-y-1 overflow-auto pr-0.5">
              {fieldOptions.map((field) => (
                <button
                  key={field.id}
                  type="button"
                  onClick={() => {
                    onChange(buildFieldRefPrefiller(field.id));
                    setOpen(false);
                  }}
                  className="w-full rounded-[0.33em] px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
                >
                  <span className="block truncate">{field.name}</span>
                </button>
              ))}
            </div>
            <div className="my-2 h-px bg-slate-200" />
            <div className="space-y-1">
              <p className="text-xs text-slate-600">Manual value</p>
              <input
                type="text"
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                onBlur={() => onChange(buildManualPrefiller(manualValue))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onChange(buildManualPrefiller(manualValue));
                    setOpen(false);
                  }
                }}
                placeholder="Type value"
                className="h-8 w-full rounded-[0.33em] border border-slate-300 px-2 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none"
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="space-y-1">
          <Textarea
            value={prefillerValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder='() => "Sample Value"'
            className="min-h-20 font-mono text-xs"
          />
          {!advancedValidation.valid && (
            <p className="text-xs text-red-600">{advancedValidation.message}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function BlocksPanel({
  blocks,
  selectedPartyId,
  onPartyChange,
  signingParties,
}: BlocksPanelProps) {
  const { registry } = useFieldTemplateContext();
  const { handleBlockCreate, searchQuery, setSearchQuery } = useFormEditorTab();
  const { visiblePage } = usePdfViewer();
  const queryClient = useQueryClient();
  const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [customFieldDraft, setCustomFieldDraft] = useState<CustomFieldDraft>(
    DEFAULT_CUSTOM_FIELD_DRAFT
  );
  const [previewValidator, setPreviewValidator] = useState<string>("");
  const [isSavingCustomField, setIsSavingCustomField] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, string>>({});
  const [previewErrors, setPreviewErrors] = useState<Record<string, string>>({});
  const previewFieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const selectedParty =
    signingParties.find((party) => party._id === selectedPartyId) || signingParties[0];
  const selectedPartyColor = getPartyColorByIndex(Math.max(0, (selectedParty?.order || 1) - 1));
  const isPresetSelected = Boolean(selectedPresetId);

  const presetTemplates = useMemo(() => {
    return registry
      .filter(isPresetRegistryField)
      .sort((a, b) => (a.label || a.name || "").localeCompare(b.label || b.name || ""));
  }, [registry]);

  const customLibraryFields = useMemo(() => {
    return registry.filter((field) => !isPresetRegistryField(field));
  }, [registry]);

  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return customLibraryFields;
    const query = searchQuery.toLowerCase();
    return customLibraryFields.filter(
      (field) =>
        field.name?.toLowerCase().includes(query) || field.label?.toLowerCase().includes(query)
    );
  }, [customLibraryFields, searchQuery]);

  const groupedFields = useMemo(() => {
    const tags = Array.from(
      new Set(filteredFields.map((f) => f.tag || "Ungrouped").filter(Boolean))
    );
    return tags
      .sort((a, b) => {
        if (a.toLowerCase() === "preset") return -1;
        if (b.toLowerCase() === "preset") return 1;
        return a.localeCompare(b);
      })
      .map((tag) => ({
        tag,
        fields: filteredFields
          .filter((f) => f.tag === tag)
          .sort((a, b) => (a.label || a.name || "").localeCompare(b.label || b.name || "")),
      }));
  }, [filteredFields]);

  const handleDragStart = (e: React.DragEvent, fieldData: FieldRegistryEntryDetails) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("field", JSON.stringify(fieldData));
  };

  const handleOpenCustomFieldModal = () => {
    setSelectedPresetId("");
    setPreviewValidator("");
    setCustomFieldDraft(DEFAULT_CUSTOM_FIELD_DRAFT);
    setIsCustomFieldModalOpen(true);
  };

  const customFieldOptions = useMemo<FieldOption[]>(
    () =>
      customLibraryFields
        .map((field) => ({
          id: field.name || field.id,
          name: field.label || field.name || field.id,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [customLibraryFields]
  );

  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = presetTemplates.find((entry) => entry.id === presetId);
    if (!preset) return;

    const label = preset.label || "Custom Field";
    const draftFromPreset: CustomFieldDraft = {
      name: deriveNameFromLabel(label),
      label,
      type: (preset.type as "text" | "signature") || "text",
      party: preset.party || "",
      shared: preset.shared ?? true,
      source: (preset.source as "auto" | "prefill" | "derived" | "manual") || "manual",
      tag: CUSTOM_TAG,
      prefiller: preset.prefiller || "",
      preset: CUSTOM_PRESET,
      tooltip_label: preset.tooltip_label || "",
      validator: preset.validator || "",
      is_phantom: preset.is_phantom ?? false,
    };
    setPreviewValidator(draftFromPreset.validator || "");
    setCustomFieldDraft(draftFromPreset);
  };

  const handleCreateCustomField = async () => {
    if (!selectedPresetId) {
      toast.error("Select a preset template first.");
      return;
    }
    if (!customFieldDraft.name.trim() || !customFieldDraft.label.trim()) {
      toast.error("Name and label are required.");
      return;
    }

    setIsSavingCustomField(true);
    try {
      await formsControllerRegisterField({
        name: customFieldDraft.name.trim(),
        label: customFieldDraft.label.trim(),
        type: customFieldDraft.type,
        party: customFieldDraft.party.trim(),
        shared: customFieldDraft.shared,
        source: customFieldDraft.source,
        tag: CUSTOM_TAG,
        prefiller: customFieldDraft.prefiller.trim() || null,
        preset: CUSTOM_PRESET,
        tooltip_label: customFieldDraft.tooltip_label.trim() || null,
        validator: customFieldDraft.validator.trim() || null,
        is_phantom: customFieldDraft.is_phantom,
      });

      await queryClient.invalidateQueries({
        queryKey: getFormsControllerGetFieldRegistryQueryKey(),
      });

      toast.success("Custom field saved to library.");
      setIsCustomFieldModalOpen(false);
      setSelectedPresetId("");
      setPreviewValidator("");
      setCustomFieldDraft(DEFAULT_CUSTOM_FIELD_DRAFT);
    } catch (error) {
      toast.error(
        `Failed to save custom field: ${error instanceof Error ? error.message : "Error"}`
      );
    } finally {
      setIsSavingCustomField(false);
    }
  };

  const previewRawBlocks = useMemo<IFormBlock[]>(
    () =>
      [
        {
          _id: "preview-custom-field",
          block_type: "form_field",
          order: 0,
          signing_party_id: "",
          field_schema: {
            field: customFieldDraft.name || "custom_field",
            type: customFieldDraft.type,
            label: customFieldDraft.label || "Field Label",
            tooltip_label: customFieldDraft.tooltip_label || "",
            source: "manual",
            shared: true,
            prefiller: customFieldDraft.prefiller || undefined,
            validator: previewValidator || undefined,
            page: 1,
            x: 0,
            y: 0,
            w: 100,
            h: 12,
            align_h: "left",
            align_v: "middle",
          } as IFormField,
        } as IFormBlock,
      ].filter(Boolean),
    [
      customFieldDraft.label,
      customFieldDraft.name,
      customFieldDraft.tooltip_label,
      customFieldDraft.type,
      customFieldDraft.prefiller,
      previewValidator,
    ]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      const candidate = customFieldDraft.validator || "";
      try {
        const testMetadata = new FormMetadata({
          name: "preview-custom-field",
          label: "Preview Custom Field",
          schema_version: SCHEMA_VERSION,
          schema: {
            blocks: [
              {
                _id: "preview-custom-field",
                block_type: "form_field",
                order: 0,
                signing_party_id: "",
                field_schema: {
                  field: customFieldDraft.name || "custom_field",
                  type: customFieldDraft.type,
                  label: customFieldDraft.label || "Field Label",
                  tooltip_label: customFieldDraft.tooltip_label || "",
                  source: "manual",
                  shared: true,
                  validator: candidate || undefined,
                  page: 1,
                  x: 0,
                  y: 0,
                  w: 100,
                  h: 12,
                  align_h: "left",
                  align_v: "middle",
                } as IFormField,
              } as IFormBlock,
            ],
          },
          signing_parties: [],
          subscribers: [],
        });
        testMetadata.getFieldsForClientService();
        setPreviewValidator(candidate);
      } catch {
        // Keep last valid preview validator to avoid flicker while typing partial expressions.
      }
    }, 180);
    return () => clearTimeout(timeout);
  }, [
    customFieldDraft.validator,
    customFieldDraft.name,
    customFieldDraft.label,
    customFieldDraft.type,
    customFieldDraft.tooltip_label,
  ]);

  useEffect(() => {
    // Keep preview state aligned with the currently derived preview field key
    setPreviewValues({});
    setPreviewErrors({});
  }, [customFieldDraft.name, selectedPresetId]);

  const previewMetadata = useMemo(() => {
    try {
      return new FormMetadata({
        name: "preview-custom-field",
        label: "Preview Custom Field",
        schema_version: SCHEMA_VERSION,
        schema: {
          blocks: previewRawBlocks,
        },
        signing_parties: [],
        subscribers: [],
      });
    } catch {
      return null;
    }
  }, [previewRawBlocks]);

  const parsedValidatorConfig = useMemo(
    () => zodCodeToValidatorConfig(customFieldDraft.validator || ""),
    [customFieldDraft.validator]
  );
  const isBuilderCompatible = useMemo(() => {
    const current = customFieldDraft.validator || "";
    if (!current.trim()) return true;
    const rebuilt = validatorConfigToZodCode(parsedValidatorConfig);
    return normalizeValidatorCode(rebuilt) === normalizeValidatorCode(current);
  }, [customFieldDraft.validator, parsedValidatorConfig]);

  const previewBlocks = useMemo<ClientBlock<[]>[]>(
    () =>
      previewMetadata ? (previewMetadata.getBlocksForClientService() as ClientBlock<[]>[]) : [],
    [previewMetadata]
  );

  const previewFieldMap = useMemo(() => {
    try {
      if (!previewMetadata) return new Map<string, PreviewClientField>();

      const map = new Map<string, PreviewClientField>();
      previewMetadata.getFieldsForClientService().forEach((field: unknown) => {
        const candidate = field as Partial<PreviewClientField>;
        if (!candidate.field || typeof candidate.field !== "string") return;
        map.set(candidate.field, candidate as PreviewClientField);
      });

      return map;
    } catch {
      return new Map<string, PreviewClientField>();
    }
  }, [customFieldDraft, previewMetadata, previewRawBlocks]);

  const handleFieldAdd = (field: FieldRegistryEntryDetails) => {
    const partyId = selectedPartyId || signingParties[0]?._id;
    if (!partyId) return;

    const fieldWidth = 100;
    const fieldHeight = 12;
    const page = Math.max(1, visiblePage || 1);
    const pageMaxX = 560;
    const pageMaxY = 760;
    const marginX = 40;
    const marginY = 48;
    const gapX = 16;
    const gapY = 12;
    const rowStep = fieldHeight + gapY;
    const colStep = fieldWidth + gapX;

    const pageFieldBlocks = blocks.filter(
      (block) =>
        block.block_type === "form_field" &&
        block.field_schema?.page === page &&
        typeof block.field_schema?.x === "number" &&
        typeof block.field_schema?.y === "number" &&
        typeof block.field_schema?.w === "number" &&
        typeof block.field_schema?.h === "number"
    );

    const overlapsExisting = (x: number, y: number) =>
      pageFieldBlocks.some((block) => {
        const bx = block.field_schema!.x;
        const by = block.field_schema!.y;
        const bw = block.field_schema!.w;
        const bh = block.field_schema!.h;
        const pad = 6;
        return !(
          x + fieldWidth + pad <= bx ||
          x >= bx + bw + pad ||
          y + fieldHeight + pad <= by ||
          y >= by + bh + pad
        );
      });

    let nextX = marginX;
    let nextY = marginY;
    let foundSpot = false;

    for (let y = marginY; y <= pageMaxY - fieldHeight; y += rowStep) {
      for (let x = marginX; x <= pageMaxX - fieldWidth; x += colStep) {
        if (!overlapsExisting(x, y)) {
          nextX = x;
          nextY = y;
          foundSpot = true;
          break;
        }
      }
      if (foundSpot) break;
    }

    if (!foundSpot && pageFieldBlocks.length > 0) {
      const last = [...pageFieldBlocks].sort(
        (a, b) => a.field_schema!.y - b.field_schema!.y || a.field_schema!.x - b.field_schema!.x
      )[pageFieldBlocks.length - 1];
      nextX = Math.min(pageMaxX - fieldWidth, Math.max(marginX, last.field_schema!.x));
      nextY = Math.min(pageMaxY - fieldHeight, last.field_schema!.y + rowStep);
    }

    const fieldKey = field.name || field.id;
    const existingForField = blocks.find(
      (block) =>
        block.block_type === "form_field" &&
        block.signing_party_id === partyId &&
        block.field_schema?.field === fieldKey
    );

    const baseSchema = existingForField?.field_schema;

    const newBlock: IFormBlock = {
      _id: `block-${field.id}-${Date.now()}`,
      block_type: "form_field",
      signing_party_id: partyId,
      order: blocks.length,
      field_schema: {
        field: fieldKey,
        type: baseSchema?.type || field.type || "text",
        page,
        x: nextX,
        y: nextY,
        w: fieldWidth,
        h: fieldHeight,
        align_h: baseSchema?.align_h || "center",
        align_v: baseSchema?.align_v || "middle",
        label: baseSchema?.label || field.label || field.name || field.id,
        tooltip_label: baseSchema?.tooltip_label || field.tooltip_label || "",
        shared:
          typeof baseSchema?.shared === "boolean" ? baseSchema.shared : (field.shared ?? true),
        source: baseSchema?.source || field.source || "manual",
        prefiller: baseSchema?.prefiller ?? field.prefiller,
        validator: baseSchema?.validator ?? field.validator,
        size: baseSchema?.size,
        wrap: baseSchema?.wrap ?? true,
        font: baseSchema?.font,
      } as IFormField,
    };

    handleBlockCreate(newBlock);
  };

  const handleCustomLabelChange = (label: string) => {
    setCustomFieldDraft((prev) => ({
      ...prev,
      label,
      name: deriveNameFromLabel(label),
    }));
  };

  const handlePreviewBlurValidate = (fieldKey: string, fieldFromRenderer?: unknown) => {
    const rendererField = (fieldFromRenderer as Partial<PreviewClientField>) || null;
    const mappedField = previewFieldMap.get(fieldKey);
    const field =
      rendererField?.field === fieldKey
        ? (rendererField as PreviewClientField)
        : mappedField || undefined;

    if (!field || field.source !== "manual") return;
    if (!field.validator || typeof field.validator.safeParse !== "function") {
      setPreviewErrors((prev) => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
      return;
    }

    const rawValue = previewValues[fieldKey] ?? "";
    const coerced = typeof field.coerce === "function" ? field.coerce(rawValue) : rawValue;
    const result = field.validator.safeParse(coerced);

    if (result?.success === false || result?.error) {
      const message =
        (result.error?.issues?.[0]?.message || result.error?.errors?.[0]?.message) ??
        "Invalid value";
      setPreviewErrors((prev) => ({
        ...prev,
        [fieldKey]: `${field.label || fieldKey}: ${message}`,
      }));
      return;
    }

    setPreviewErrors((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="space-y-3 border-b p-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-600">Recipient</p>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-[0.33em] border border-slate-300 bg-white px-2.5 py-2 text-sm"
              >
                <span
                  className="max-w-[calc(100%-1.5rem)] truncate rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: selectedPartyColor.hex }}
                >
                  {selectedParty?.signatory_title || "Select recipient"}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={6}
              className="w-[var(--radix-dropdown-menu-trigger-width)] rounded-[0.33em]"
            >
              {signingParties.map((party) => {
                const color = getPartyColorByIndex(Math.max(0, party.order - 1));
                return (
                  <DropdownMenuItem
                    key={party._id}
                    onClick={() => onPartyChange(party._id)}
                    className="py-1.5"
                  >
                    <span
                      className="max-w-full truncate rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                      style={{ backgroundColor: color.hex }}
                    >
                      {party.signatory_title}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-2 left-2 z-50 h-5 w-5 text-slate-500" />
          <Input
            placeholder="Search fields..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {groupedFields.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground text-sm">No custom fields found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {groupedFields.map(({ tag, fields }) => {
              const tagDisplay = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
              return (
                <Collapsible key={tag} defaultOpen={true} className="space-y-1.5">
                  <CollapsibleTrigger className="group hover:bg-primary/5 flex w-full items-center justify-between rounded-[0.33em] px-2 py-1.5 text-sm font-semibold">
                    <span className="flex items-center gap-2">
                      <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-data-[state=open]:rotate-180" />
                      {tagDisplay}
                    </span>
                    <span className="text-muted-foreground ml-2 text-xs font-normal">
                      ({fields.length})
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1.5">
                    {fields.map((field) => (
                      <button
                        key={field.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, field)}
                        onClick={() => handleFieldAdd(field)}
                        className="hover:bg-primary/5 hover:text-primary flex w-full cursor-move items-center rounded-[0.33em] border border-transparent px-2 py-1.5 text-left transition-colors"
                        type="button"
                      >
                        <span className="text-sm text-slate-800">{field.label || field.name}</span>
                      </button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t bg-white p-3">
        <Button
          onClick={handleOpenCustomFieldModal}
          size="sm"
          variant="outline"
          className="w-full gap-2 border-dashed"
        >
          <Plus className="h-4 w-4" />
          Add custom field
        </Button>
      </div>

      <Dialog open={isCustomFieldModalOpen} onOpenChange={setIsCustomFieldModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add custom field</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700">Preset template</Label>
              <select
                value={selectedPresetId}
                onChange={(e) => handlePresetSelect(e.target.value)}
                className="h-9 w-full rounded-[0.33em] border border-slate-300 bg-white px-2.5 text-sm"
              >
                <option value="">Select a preset</option>
                {presetTemplates.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label || preset.name}
                  </option>
                ))}
              </select>
            </div>

            {isPresetSelected && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Label</Label>
                    <Input
                      value={customFieldDraft.label}
                      onChange={(e) => handleCustomLabelChange(e.target.value)}
                      placeholder="Field Label"
                    />
                    <p className="text-[11px] text-slate-500">
                      Field name auto-derives from label:{" "}
                      <span className="font-mono">{customFieldDraft.name || "(empty)"}</span>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Tag</Label>
                    <Input value={CUSTOM_TAG} readOnly />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Tooltip Label</Label>
                  <Input
                    value={customFieldDraft.tooltip_label}
                    onChange={(e) =>
                      setCustomFieldDraft((prev) => ({ ...prev, tooltip_label: e.target.value }))
                    }
                    placeholder="Tooltip text"
                  />
                </div>

                <DefaultValueEditor
                  value={customFieldDraft.prefiller}
                  fieldOptions={customFieldOptions}
                  onChange={(value) =>
                    setCustomFieldDraft((prev) => ({
                      ...prev,
                      prefiller: value,
                    }))
                  }
                />

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Validation</Label>
                  <ValidatorBuilder
                    config={parsedValidatorConfig}
                    rawZodCode={customFieldDraft.validator}
                    onConfigChange={(newConfig) =>
                      setCustomFieldDraft((prev) => {
                        // Preserve raw Zod expressions that the UI builder can't faithfully represent.
                        if (!isBuilderCompatible && (prev.validator || "").trim()) return prev;
                        const validator = validatorConfigToZodCode(newConfig);
                        setPreviewValidator(validator);
                        return {
                          ...prev,
                          validator,
                        };
                      })
                    }
                    onRawZodChange={(code) =>
                      setCustomFieldDraft((prev) => ({
                        ...prev,
                        validator: code,
                      }))
                    }
                    emitRawOnChange={true}
                    compact={true}
                    hideGeneratedPreview={true}
                  />
                </div>

                <div className="rounded-[0.33em] border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-semibold text-slate-700">Field Preview</p>
                  <div className="rounded-[0.33em] border border-slate-300 bg-white p-2">
                    <BlocksRenderer
                      formKey="custom-field-preview"
                      blocks={previewBlocks}
                      values={previewValues}
                      onChange={(key, value) => {
                        setPreviewValues((prev) => ({ ...prev, [key]: String(value) }));
                        setPreviewErrors((prev) => {
                          if (!prev[key]) return prev;
                          const next = { ...prev };
                          delete next[key];
                          return next;
                        });
                      }}
                      errors={previewErrors}
                      setSelected={() => {}}
                      onBlurValidate={(fieldKey, field) =>
                        handlePreviewBlurValidate(fieldKey, field)
                      }
                      fieldRefs={previewFieldRefs.current}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomFieldModalOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => void handleCreateCustomField()}
              disabled={isSavingCustomField || !isPresetSelected}
            >
              {isSavingCustomField ? "Saving..." : "Save Custom Field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
