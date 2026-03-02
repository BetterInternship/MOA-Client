"use client";

import {
  formsControllerGetFieldFromRegistry,
  formsControllerRegisterField,
  formsControllerUpdateField,
  getFormsControllerGetFieldFromRegistryQueryKey,
  getFormsControllerGetFieldRegistryQueryKey,
  useFormsControllerGetFieldFromRegistry,
  useFormsControllerGetFieldRegistry,
} from "../../../api/app/api/endpoints/forms/forms";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Loader } from "@/components/ui/loader";
import { Plus, ChevronDown, Pencil, MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CustomFieldModalForm } from "@/components/docs/form-editor/CustomFieldModalForm";
import {
  FieldLibraryFieldOption,
  FieldLibraryPresetTemplateOption,
  FieldLibraryProvider,
  useFieldLibrary,
} from "@/app/contexts/field-library.context";
import {
  createCustomFieldDraftFromPreset,
  FieldSource,
  normalizeFieldSource,
  toRegisterFieldPayload,
} from "@/lib/custom-field-mappers";
import type { ValidatorIRv0 } from "@/lib/validator-ir";
import { deriveFieldNameFromLabel } from "@/lib/field-name";
import {
  buildFieldOptionsFromRegistry,
  buildTagOptionsFromRegistry,
  isPresetRegistryField,
} from "@/lib/field-library";
import { resolveSystemPresetTemplates } from "@/lib/system-preset-resolver";
import type { FieldSchemaDefaults } from "@/lib/field-schema-defaults";
import { cn } from "@/lib/utils";

interface FieldRegistryEntry {
  id?: string;
  name: string;
  label: string;
  preset: string;
  type: string;
  source: FieldSource;
  shared: boolean;
  tooltip_label: string;
  validator: string;
  validator_ir?: ValidatorIRv0 | null;
  field_schema_defaults?: FieldSchemaDefaults | null;
  prefiller: string;
  is_phantom?: boolean;
  party?: string;
  tag?: string;
}

type FieldRegistryMinimalEntry = {
  id: string;
  name: string;
  preset: string;
  label?: string;
  type?: string;
  tag?: string;
};

type EditorPaneState = { mode: "none" } | { mode: "create" } | { mode: "edit"; id: string };

// Stable ordering keeps grouped field lists predictable across rerenders and searches.
const sortFields = (list: FieldRegistryMinimalEntry[]) =>
  (list ?? []).slice().sort((a, b) => {
    const labelA = (a.label || a.name || "").toLowerCase();
    const labelB = (b.label || b.name || "").toLowerCase();
    if (labelA === labelB) {
      const presetA = (a?.preset ?? "").toLowerCase();
      const presetB = (b?.preset ?? "").toLowerCase();
      return presetA.localeCompare(presetB);
    }
    return labelA.localeCompare(labelB);
  });

const FieldRegistryPage = ({ embedded = false }: { embedded?: boolean }) => {
  const queryClient = useQueryClient();
  const fieldRegistry = useFormsControllerGetFieldRegistry({});

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedTags, setExpandedTags] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTargetTag, setBulkTargetTag] = useState("");
  const [bulkMoving, setBulkMoving] = useState(false);
  const [editorPane, setEditorPane] = useState<EditorPaneState>({ mode: "none" });

  const fields = useMemo(
    () => sortFields((fieldRegistry.data?.fields as FieldRegistryMinimalEntry[]) || []),
    [fieldRegistry.data?.fields]
  );

  const filteredFields = useMemo(() => {
    if (!searchTerm.trim()) return fields;
    const terms = searchTerm
      .toLowerCase()
      .split(" ")
      .map((s) => s.trim())
      .filter(Boolean);

    return fields.filter((field) => {
      const haystack = `${field.label || ""} ${field.name} ${field.preset}`.toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [fields, searchTerm]);

  const groupedFields = useMemo(() => {
    const groups: Record<string, FieldRegistryMinimalEntry[]> = {};
    filteredFields.forEach((field) => {
      const tag = field.tag?.trim() || "uncategorized";
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(field);
    });
    return Object.entries(groups)
      .map(([tag, entries]) => ({
        tag,
        entries: sortFields(entries),
      }))
      .sort((a, b) => a.tag.localeCompare(b.tag));
  }, [filteredFields]);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    groupedFields.forEach((group) => {
      next[group.tag] = expandedTags[group.tag] ?? true;
    });
    setExpandedTags(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupedFields.map((g) => g.tag).join("|")]);

  const allAvailableTags = useMemo(
    () =>
      buildTagOptionsFromRegistry(
        (fieldRegistry.data?.fields as FieldRegistryMinimalEntry[]) || []
      ),
    [fieldRegistry.data?.fields]
  );

  const modalLibraryValue = useMemo(
    () => ({
      // Pre-compute modal data contracts so add/edit modals stay presentation-focused.
      fieldOptions: buildFieldOptionsFromRegistry(fields) as FieldLibraryFieldOption[],
      presetTemplates: resolveSystemPresetTemplates(
        (fieldRegistry.data?.fields as FieldRegistryEntry[]) || []
      ) as FieldLibraryPresetTemplateOption[],
      tagOptions: allAvailableTags,
    }),
    [fields, allAvailableTags, fieldRegistry.data?.fields]
  );

  const toggleTag = (tag: string) => {
    setExpandedTags((prev) => ({ ...prev, [tag]: !prev[tag] }));
  };

  const toggleFieldSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroupSelection = (ids: string[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  const handleAdd = () => {
    setEditorPane({ mode: "create" });
  };

  const handleEdit = (id: string) => {
    setEditorPane({ mode: "edit", id });
  };

  const refreshRegistry = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getFormsControllerGetFieldRegistryQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getFormsControllerGetFieldFromRegistryQueryKey() }),
    ]);
    await queryClient.refetchQueries({
      queryKey: getFormsControllerGetFieldRegistryQueryKey(),
      type: "active",
    });
    queryClient.removeQueries({
      queryKey: getFormsControllerGetFieldFromRegistryQueryKey(),
      type: "inactive",
    });
  };

  const handleBulkMove = async () => {
    const targetTag = bulkTargetTag.trim();
    if (!targetTag) {
      toast.error("Pick a target category/tag.");
      return;
    }
    if (selectedIds.size === 0) {
      toast.error("Select at least one field.");
      return;
    }

    setBulkMoving(true);
    try {
      const ids = Array.from(selectedIds);
      let movedCount = 0;
      let skippedPresetCount = 0;
      // Endpoint is single-record update, so bulk move fans out requests by selected id.
      await Promise.all(
        ids.map(async (id) => {
          const fieldRes = await formsControllerGetFieldFromRegistry({ id });
          const field = fieldRes?.field;
          if (!field) return;
          if (isPresetRegistryField(field as any)) {
            skippedPresetCount += 1;
            return;
          }

          await formsControllerUpdateField({
            id: field.id,
            name: field.name,
            label: field.label,
            type: field.type,
            shared: field.shared,
            party: field.party ?? "__deprecated",
            source: normalizeFieldSource(field.source),
            tag: targetTag,
            prefiller: field.prefiller ?? null,
            preset: field.preset,
            tooltip_label: field.tooltip_label ?? null,
            validator: field.validator ?? null,
            validator_ir: (field as { validator_ir?: ValidatorIRv0 | null }).validator_ir ?? null,
            field_schema_defaults:
              (field as { field_schema_defaults?: FieldSchemaDefaults | null })
                .field_schema_defaults ?? null,
            is_phantom: field.is_phantom ?? false,
          } as any);
          movedCount += 1;
        })
      );

      if (movedCount > 0) {
        await refreshRegistry();
      }
      setSelectedIds(new Set());
      if (movedCount > 0) {
        toast.success(`Moved ${movedCount} field(s) to "${targetTag}".`);
      }
      if (skippedPresetCount > 0) {
        toast(`Skipped ${skippedPresetCount} preset field(s). Preset tags are locked.`);
      }
    } catch {
      toast.error("Failed to move selected fields.");
    } finally {
      setBulkMoving(false);
    }
  };

  return (
    <FieldLibraryProvider value={modalLibraryValue}>
      <div
        className={cn(
          embedded ? "h-full w-full overflow-hidden" : "mx-auto mt-4 max-w-5xl space-y-3"
        )}
      >
        <div
          className={cn(
            "grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]",
            embedded ? "h-full min-h-0" : "lg:h-full lg:min-h-0"
          )}
        >
          <div
            className={cn(
              "space-y-3",
              embedded ? "flex min-h-0 flex-col" : "lg:flex lg:min-h-0 lg:flex-col"
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Field Registry</h1>
              <div className="flex-1" />
              <Input
                value={searchTerm}
                placeholder="Search fields..."
                className="h-9 w-[240px] rounded-[0.33em]"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button size="sm" onClick={handleAdd} className="h-9 rounded-[0.33em] px-3">
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add new field
              </Button>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-[0.33em] border border-slate-200 bg-white p-2">
                <Badge className="p-2">{selectedIds.size} selected</Badge>
                <Autocomplete
                  value={bulkTargetTag}
                  setter={(nextTag) => setBulkTargetTag(String(nextTag || ""))}
                  options={allAvailableTags.map((tag) => ({ id: tag, name: tag }))}
                  placeholder="Move to category/tag..."
                  className="w-[220px]"
                  inputClassName="h-8 rounded-[0.33em]"
                />
                <Button
                  size="sm"
                  className="h-8 rounded-[0.33em]"
                  onClick={() => void handleBulkMove()}
                  disabled={bulkMoving}
                >
                  <MoveRight className="mr-1 h-3.5 w-3.5" />
                  {bulkMoving ? "Moving..." : "Move"}
                </Button>
              </div>
            )}
            <div
              className={cn(
                "space-y-2",
                embedded
                  ? "min-h-0 flex-1 overflow-y-auto pr-1"
                  : "lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1"
              )}
            >
              {fieldRegistry.isLoading || fieldRegistry.isFetching ? (
                <Loader>Loading fields...</Loader>
              ) : groupedFields.length === 0 ? (
                <div className="rounded-[0.33em] border border-slate-200 bg-white p-4 text-sm text-slate-500">
                  No fields found.
                </div>
              ) : (
                groupedFields.map((group) => {
                  const groupIds = group.entries.map((f) => f.id);
                  const selectedCount = groupIds.filter((id) => selectedIds.has(id)).length;
                  const allSelected = groupIds.length > 0 && selectedCount === groupIds.length;
                  const someSelected = selectedCount > 0 && !allSelected;

                  return (
                    <Collapsible
                      key={group.tag}
                      open={expandedTags[group.tag]}
                      onOpenChange={() => toggleTag(group.tag)}
                      className="space-y-2"
                    >
                      <div className="rounded-[0.33em] border border-slate-200 bg-slate-50">
                        <Checkbox
                          checked={allSelected ? true : someSelected ? "indeterminate" : false}
                          onCheckedChange={(checked) =>
                            toggleGroupSelection(groupIds, checked === true)
                          }
                          aria-label={`Select all in ${group.tag}`}
                          className="sr-only"
                        />
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="group hover:bg-primary/5 flex w-full items-center justify-between rounded-[0.33em] px-3 py-2 text-left"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <Checkbox
                                checked={
                                  allSelected ? true : someSelected ? "indeterminate" : false
                                }
                                onCheckedChange={(checked) =>
                                  toggleGroupSelection(groupIds, checked === true)
                                }
                                aria-label={`Select all in ${group.tag}`}
                              />
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {group.tag}
                              </p>
                              <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                                {group.entries.length}
                              </span>
                            </div>
                            <ChevronDown
                              className={`h-4 w-4 text-slate-500 transition-transform ${
                                expandedTags[group.tag] ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </CollapsibleTrigger>
                      </div>

                      <CollapsibleContent className="space-y-1 pl-6">
                        <div className="space-y-1 border-l border-slate-200 pl-2">
                          {group.entries.map((field) => (
                            <div
                              key={field.id}
                              className={`hover:bg-primary/5 flex w-full items-center gap-2 rounded-[0.33em] px-2 py-1.5 transition-colors ${
                                selectedIds.has(field.id) ? "bg-primary/5" : ""
                              }`}
                            >
                              <Checkbox
                                checked={selectedIds.has(field.id)}
                                onCheckedChange={() => toggleFieldSelection(field.id)}
                                aria-label={`Select ${field.name}`}
                              />
                              <div className="min-w-0 flex-1 flex-col">
                                <p className="truncate text-sm font-medium text-slate-800">
                                  {field.label || field.name}
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                  {field.name}:{field.preset}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 rounded-[0.33em] px-2"
                                onClick={() => handleEdit(field.id)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })
              )}
            </div>
          </div>

          <div
            className={cn(
              "rounded-[0.33em] border border-slate-200 bg-white p-3",
              embedded
                ? "flex h-full min-h-0 flex-col overflow-hidden"
                : "lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden"
            )}
          >
            {editorPane.mode === "none" ? (
              <div className="flex h-full min-h-[180px] items-center justify-center">
                <p className="text-sm text-slate-500">
                  Select a field to edit, or add a new field.
                </p>
              </div>
            ) : editorPane.mode === "create" ? (
              <div className="flex h-full min-h-0 flex-col">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-800">Add Custom Field</h2>
                  <Button variant="ghost" size="sm" onClick={() => setEditorPane({ mode: "none" })}>
                    Close
                  </Button>
                </div>
                <div className="min-h-0 flex-1">
                  <FieldRegistration
                    close={() => setEditorPane({ mode: "none" })}
                    onSaved={refreshRegistry}
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-0 flex-col">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-800">Edit Field</h2>
                  <Button variant="ghost" size="sm" onClick={() => setEditorPane({ mode: "none" })}>
                    Close
                  </Button>
                </div>
                <div className="min-h-0 flex-1">
                  <FieldEditor key={editorPane.id} id={editorPane.id} onSaved={refreshRegistry} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </FieldLibraryProvider>
  );
};

const FieldEditor = ({
  id,
  onSaved,
}: {
  id: string | null;
  onSaved?: () => Promise<void> | void;
}) => {
  const { fieldOptions, tagOptions } = useFieldLibrary();
  const { data, isLoading, isFetching } = useFormsControllerGetFieldFromRegistry(
    { id: id ?? "" },
    {
      query: {
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
      },
    }
  );
  const [fieldId, setFieldId] = useState<string | null>(null);
  const [field, setField] = useState<FieldRegistryEntry>();
  const [editing, setEditing] = useState(false);

  // Update API expects a full field payload, so we normalize optional values before submit.
  const handleEdit = async () => {
    if (!fieldId || !field || !field.name || !field.preset) return;

    setEditing(true);
    try {
      await formsControllerUpdateField({
        ...field,
        id: fieldId,
        tag: field.tag || "",
        party: field.party || "__deprecated",
        source: normalizeFieldSource(field.source),
        tooltip_label: field.tooltip_label ?? null,
        validator: field.validator ?? null,
        prefiller: field.prefiller ?? null,
        field_schema_defaults: field.field_schema_defaults ?? null,
        is_phantom: field?.is_phantom ?? false,
      } as any);
      await onSaved?.();
    } finally {
      setEditing(false);
    }
  };

  useEffect(() => {
    if (data?.field) {
      setFieldId(data.field.id);
      setField({
        ...data.field,
        shared: data.field.shared.toString() === "true",
        tooltip_label: data.field.tooltip_label ?? "",
        validator: data.field.validator ?? "",
        validator_ir: (data.field as { validator_ir?: ValidatorIRv0 | null }).validator_ir ?? null,
        field_schema_defaults:
          (data.field as { field_schema_defaults?: FieldSchemaDefaults | null })
            .field_schema_defaults ?? null,
        prefiller: data.field.prefiller ?? "",
      });
    } else {
      setFieldId(null);
    }
  }, [data]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {isLoading || isFetching ? (
          <Loader>Loading field...</Loader>
        ) : field ? (
          <>
            <CustomFieldModalForm
              value={{
                name: field.name,
                label: field.label,
                tag: field.tag || "",
                tooltip_label: field.tooltip_label || "",
                type: field.type,
                source: field.source,
                shared: field.shared,
                prefiller: field.prefiller || "",
                validator: field.validator || "",
                validator_ir: field.validator_ir || null,
                field_schema_defaults: field.field_schema_defaults || null,
              }}
              fieldOptions={fieldOptions}
              tagOptions={tagOptions}
              onLabelChange={(label) =>
                setField((prev) =>
                  prev
                    ? isPresetRegistryField(prev as any)
                      ? {
                          ...prev,
                          label,
                        }
                      : {
                          ...prev,
                          label,
                          name: deriveFieldNameFromLabel(label),
                        }
                    : prev
                )
              }
              showDerivedNameHint={!isPresetRegistryField(field as any)}
              tagReadOnly={isPresetRegistryField(field as any)}
              hideTagField={isPresetRegistryField(field as any)}
              onChange={(updates) => setField((prev) => (prev ? { ...prev, ...updates } : prev))}
            />
          </>
        ) : null}
      </div>
      <div className="mt-3 flex shrink-0 flex-row justify-between">
        <div className="flex-1" />
        <Button
          disabled={editing || isLoading || isFetching || !field}
          onClick={() => void handleEdit()}
          className="w-full"
        >
          {editing ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};

const FieldRegistration = ({
  close,
  onSaved,
}: {
  close: () => void;
  onSaved?: () => Promise<void> | void;
}) => {
  const { fieldOptions, presetTemplates, tagOptions } = useFieldLibrary();
  const [field, setField] = useState<Partial<FieldRegistryEntry>>({
    name: "",
    label: "",
    type: "text",
    source: "manual",
    tag: "",
    shared: true,
    tooltip_label: "",
    prefiller: "",
    validator: "",
    validator_ir: null,
    field_schema_defaults: null,
  });
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [registering, setRegistering] = useState(false);

  // Selecting a package preset hydrates a full editable draft in one step.
  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (!presetId) return;

    const preset = presetTemplates.find((entry) => entry.id === presetId);
    if (!preset) {
      toast.error("Preset template not found.");
      return;
    }
    if (preset.disabled) return;

    const label = preset.label || "";
    setField((prev) => ({
      ...prev,
      ...createCustomFieldDraftFromPreset(
        {
          ...preset,
          label,
          type: (preset.type as "text" | "signature" | "image") || "text",
          source: normalizeFieldSource(preset.source),
          shared: preset.shared ?? true,
          prefiller: preset.prefiller ?? "",
          tooltip_label: preset.tooltip_label ?? "",
          validator: preset.validator ?? "",
          validator_ir: preset.validator_ir ?? null,
          field_schema_defaults: preset.field_schema_defaults ?? null,
        },
        deriveFieldNameFromLabel,
        prev?.tag || ""
      ),
    }));
  };

  const handleAdd = async () => {
    if (!selectedPresetId) return alert("Missing preset template.");
    if (!field?.name) return alert("Missing field name.");
    if (!field.label) return alert("Missing field label.");
    if (!field.type) return alert("Missing field type.");
    if (!field.source) return alert("Missing field source.");

    setRegistering(true);
    try {
      await formsControllerRegisterField(
        toRegisterFieldPayload({
          name: field.name || "",
          label: field.label || "",
          type: (field.type as "text" | "signature" | "image") || "text",
          source: normalizeFieldSource(field.source),
          party: "__deprecated",
          shared: field.shared ?? true,
          tag: field.tag || "",
          tooltip_label: field.tooltip_label || "",
          prefiller: field.prefiller || "",
          validator: field.validator || "",
          validator_ir: field.validator_ir || null,
          field_schema_defaults: field.field_schema_defaults || null,
          is_phantom: false,
          preset: "default",
        })
      );
      await onSaved?.();
      close();
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <CustomFieldModalForm
          value={{
            name: field.name || "",
            label: field.label || "",
            tag: field.tag || "",
            tooltip_label: field.tooltip_label || "",
            type: field.type || "text",
            source: normalizeFieldSource(field.source),
            shared: field.shared ?? true,
            prefiller: field.prefiller || "",
            validator: field.validator || "",
            validator_ir: field.validator_ir || null,
            field_schema_defaults: field.field_schema_defaults || null,
          }}
          fieldOptions={fieldOptions}
          presetTemplates={presetTemplates}
          selectedPresetId={selectedPresetId}
          onPresetChange={(presetId) => void handlePresetSelect(presetId)}
          tagOptions={tagOptions}
          onLabelChange={(label) =>
            setField((prev) => ({
              ...prev,
              label,
              name: deriveFieldNameFromLabel(label),
            }))
          }
          showDerivedNameHint={true}
          hideTagField={isPresetRegistryField(field as any)}
          onChange={(updates) => setField((prev) => ({ ...prev, ...updates }))}
        />
      </div>
      <div className="flex shrink-0 flex-row justify-between bg-white pt-3">
        <div className="flex-1" />
        <Button
          className="w-full"
          disabled={registering || !selectedPresetId}
          onClick={() => void handleAdd()}
        >
          {registering ? "Registering..." : "Register"}
        </Button>
      </div>
    </div>
  );
};

export default FieldRegistryPage;
