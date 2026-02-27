"use client";

import { useMemo, useState, type DragEvent } from "react";
import {
  getFieldPresetTemplates,
  IFormBlock,
  IFormField,
  IFormSigningParty,
} from "@betterinternship/core/forms";
import { useFieldTemplateContext } from "@/app/docs/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/field-template.ctx";
import { useFormEditorTab } from "@/app/contexts/form-editor-tab.context";
import { usePdfViewer } from "@/app/contexts/pdf-viewer.context";
import { normalizePresetTemplate } from "@/lib/default-field-preset-utils";
import { isPresetRegistryField } from "@/lib/field-library";
import { getPartyColorByIndex } from "@/lib/party-colors";
import { getPresetFieldIcon, type PresetFieldIconKey } from "@/lib/preset-field-icons";
import type { ValidatorIRv0 } from "@/lib/validator-ir";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BlocksPanelProps {
  blocks: IFormBlock[];
  selectedPartyId: string | null;
  onPartyChange: (partyId: string | null) => void;
  signingParties: IFormSigningParty[];
}

type PaletteSource = "default" | "custom";

type PresetFieldTemplate = ReturnType<typeof getFieldPresetTemplates>[number] & {
  iconKey?: string;
};

type PaletteField = {
  id: string;
  name: string;
  label: string;
  type: "text" | "signature" | "image";
  source: "auto" | "prefill" | "derived" | "manual";
  shared: boolean;
  tag: string;
  preset: string;
  prefiller: string;
  tooltip_label: string;
  validator: string;
  validator_ir: ValidatorIRv0 | null;
  iconKey?: string;
  paletteSource: PaletteSource;
};

type DragFieldPayload = Omit<PaletteField, "iconKey" | "paletteSource"> & {
  __palette_source: PaletteSource;
};

const normalizeSearch = (value: string) => value.trim().toLowerCase();

const matchesSearch = (field: Pick<PaletteField, "name" | "label">, query: string) => {
  if (!query) return true;
  return field.name.toLowerCase().includes(query) || field.label.toLowerCase().includes(query);
};

const toDisplayTag = (tag: string) =>
  tag.length > 0 ? tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase() : "Ungrouped";

const BASE_TYPE_ICON_MAP: Partial<Record<ValidatorIRv0["baseType"], PresetFieldIconKey>> = {
  text: "shortText",
  textarea: "longText",
  number: "number",
  date: "date",
  time: "time",
  enum: "dropdown",
  array: "multiselect",
  checkbox: "multiselect",
  signature: "signature",
  image: "signature",
};

/**
 * Left-side field palette for the form editor.
 * - Default fields come from package presets.
 * - Custom fields come from DB registry.
 */
export function BlocksPanel({
  blocks,
  selectedPartyId,
  onPartyChange,
  signingParties,
}: BlocksPanelProps) {
  const { registry } = useFieldTemplateContext();
  const { handleBlockCreate, searchQuery, setSearchQuery } = useFormEditorTab();
  const { visiblePage } = usePdfViewer();
  const [fieldTab, setFieldTab] = useState<"default" | "custom">("default");

  const selectedParty =
    signingParties.find((party) => party._id === selectedPartyId) || signingParties[0];
  const selectedPartyColor = getPartyColorByIndex(Math.max(0, (selectedParty?.order || 1) - 1));

  const defaultFields = useMemo<PaletteField[]>(() => {
    const presets = (getFieldPresetTemplates() as PresetFieldTemplate[]).map((preset) =>
      normalizePresetTemplate(preset)
    );
    return presets.map((preset) => ({
      id: preset.id,
      name: preset.name,
      label: preset.label || preset.name,
      type: preset.type || "text",
      source: preset.source || "manual",
      shared: typeof preset.shared === "boolean" ? preset.shared : true,
      tag: preset.tag || "preset",
      preset: preset.preset || "preset",
      prefiller: preset.prefiller || "",
      tooltip_label: preset.tooltip_label || "",
      validator: preset.validator || "",
      validator_ir: preset.validator_ir || null,
      iconKey: preset.iconKey,
      paletteSource: "default" as const,
    }));
  }, []);

  const customFields = useMemo<PaletteField[]>(() => {
    return registry
      .filter((field) => !isPresetRegistryField(field))
      .map((field) => ({
        id: field.id,
        name: field.name || field.id,
        label: field.label || field.name || field.id,
        type: (field.type as PaletteField["type"]) || "text",
        source: (field.source as PaletteField["source"]) || "manual",
        shared: typeof field.shared === "boolean" ? field.shared : true,
        tag: field.tag || "Ungrouped",
        preset: field.preset || "default",
        prefiller: field.prefiller || "",
        tooltip_label: field.tooltip_label || "",
        validator: field.validator || "",
        validator_ir: (field as { validator_ir?: ValidatorIRv0 | null }).validator_ir ?? null,
        paletteSource: "custom" as const,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [registry]);

  const searchQueryNormalized = useMemo(() => normalizeSearch(searchQuery), [searchQuery]);

  const filteredDefaultFields = useMemo(
    () => defaultFields.filter((field) => matchesSearch(field, searchQueryNormalized)),
    [defaultFields, searchQueryNormalized]
  );

  const filteredCustomFields = useMemo(
    () => customFields.filter((field) => matchesSearch(field, searchQueryNormalized)),
    [customFields, searchQueryNormalized]
  );

  const groupedCustomFields = useMemo(() => {
    const tags = Array.from(
      new Set(filteredCustomFields.map((field) => field.tag).filter((tag) => tag.trim().length > 0))
    );

    return tags
      .sort((a, b) => a.localeCompare(b))
      .map((tag) => ({
        tag,
        fields: filteredCustomFields
          .filter((field) => field.tag === tag)
          .sort((a, b) => a.label.localeCompare(b.label)),
      }));
  }, [filteredCustomFields]);

  const handleDragStart = (e: DragEvent, field: PaletteField) => {
    const payload: DragFieldPayload = {
      id: field.id,
      name: field.name,
      label: field.label,
      type: field.type,
      source: field.source,
      shared: field.shared,
      tag: field.tag,
      preset: field.preset,
      prefiller: field.prefiller,
      tooltip_label: field.tooltip_label,
      validator: field.validator,
      validator_ir: field.validator_ir,
      __palette_source: field.paletteSource,
    };

    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("field", JSON.stringify(payload));
  };

  const handleFieldAdd = (field: PaletteField) => {
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

    // Use current page occupancy to place new fields in the next open slot.
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

    const baseFieldKey = field.name || field.id;
    const presetTag = (field.preset || "").trim();
    const fieldKey = presetTag ? `${baseFieldKey}:${presetTag}` : baseFieldKey;

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
        align_v: baseSchema?.align_v || "bottom",
        label: baseSchema?.label || field.label || field.name || field.id,
        tooltip_label: baseSchema?.tooltip_label || field.tooltip_label || "",
        shared:
          typeof baseSchema?.shared === "boolean" ? baseSchema.shared : (field.shared ?? true),
        source: baseSchema?.source || field.source || "manual",
        prefiller: baseSchema?.prefiller ?? field.prefiller,
        validator: baseSchema?.validator ?? field.validator,
        validator_ir:
          (baseSchema as { validator_ir?: ValidatorIRv0 | null } | undefined)?.validator_ir ??
          field.validator_ir,
        size: baseSchema?.size,
        wrap: baseSchema?.wrap ?? true,
        font: baseSchema?.font,
      } as IFormField,
    };

    handleBlockCreate(newBlock);
  };

  const hasDefaultResults = filteredDefaultFields.length > 0;
  const hasCustomResults = groupedCustomFields.length > 0;
  const hasActiveTabResults = fieldTab === "default" ? hasDefaultResults : hasCustomResults;

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

      <div className="flex-1 overflow-auto p-3 space-y-2">
        <div className="grid grid-cols-2 gap-1 rounded-[0.33em] border border-slate-300 bg-white">
          <button
            type="button"
            onClick={() => setFieldTab("default")}
            className={`rounded-[0.33em] p-2 text-xs font-semibold transition-colors ${
              fieldTab === "default"
                ? "bg-slate-100 text-slate-800"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            Default Fields
          </button>
          <button
            type="button"
            onClick={() => setFieldTab("custom")}
            className={`rounded-[0.33em] px-2 py-1 text-xs font-semibold transition-colors ${
              fieldTab === "custom"
                ? "bg-slate-100 text-slate-800"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            Custom Fields
          </button>
        </div>
        {!hasActiveTabResults ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground text-sm">
              {fieldTab === "default"
                ? "No default fields match this search."
                : "No custom fields match this search."}
            </p>
          </div>
        ) : fieldTab === "default" ? (
          <div className="space-y-1.5">
            {filteredDefaultFields.map((field) => {
              const Icon = getPresetFieldIcon(field.iconKey, field.name);
              return (
                <button
                  key={field.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, field)}
                  onClick={() => handleFieldAdd(field)}
                  className="hover:bg-primary/5 hover:text-primary flex w-full cursor-move items-center gap-2 rounded-[0.33em] border border-transparent px-2 py-1.5 text-left transition-colors"
                  type="button"
                >
                  <Icon className="h-4 w-4 flex-shrink-0 text-slate-500" />
                  <span className="text-sm text-slate-800">{field.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1.5">
            {groupedCustomFields.map(({ tag, fields }) => (
              <Collapsible key={tag} defaultOpen={true} className="space-y-1.5">
                <CollapsibleTrigger className="group hover:bg-primary/5 flex w-full items-center justify-between rounded-[0.33em] px-2 py-1.5 text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-data-[state=open]:rotate-180" />
                    {toDisplayTag(tag)}
                  </span>
                  <span className="text-muted-foreground ml-2 text-xs font-normal">
                    ({fields.length})
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1.5">
                  {fields.map((field) => {
                    const iconKey = field.validator_ir
                      ? BASE_TYPE_ICON_MAP[field.validator_ir.baseType]
                      : undefined;
                    const Icon = getPresetFieldIcon(iconKey);
                    return (
                      <button
                        key={field.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, field)}
                        onClick={() => handleFieldAdd(field)}
                        className="hover:bg-primary/5 hover:text-primary flex w-full cursor-move items-center gap-2 rounded-[0.33em] border border-transparent px-2 py-1.5 text-left transition-colors"
                        type="button"
                      >
                        <Icon className="h-4 w-4 flex-shrink-0 text-slate-400 mt-0.5" />
                        <span className="text-sm text-slate-800">{field.label}</span>
                      </button>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
