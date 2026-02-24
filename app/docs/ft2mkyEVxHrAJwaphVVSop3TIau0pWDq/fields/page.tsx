"use client";

import { useModal } from "@/app/providers/modal-provider";
import {
  formsControllerGetFieldFromRegistry,
  formsControllerRegisterField,
  formsControllerUpdateField,
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
  toRegisterFieldPayload,
} from "@/lib/custom-field-mappers";
import { deriveFieldNameFromLabel } from "@/lib/field-name";
import {
  buildFieldOptionsFromRegistry,
  buildPresetTemplatesFromRegistry,
  buildTagOptionsFromRegistry,
} from "@/lib/field-library";

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

const FieldRegistryPage = () => {
  const queryClient = useQueryClient();
  const fieldRegistry = useFormsControllerGetFieldRegistry({
    query: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedTags, setExpandedTags] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTargetTag, setBulkTargetTag] = useState("");
  const [bulkMoving, setBulkMoving] = useState(false);
  const { openModal, closeModal } = useModal();

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
      fieldOptions: buildFieldOptionsFromRegistry(fields) as FieldLibraryFieldOption[],
      presetTemplates: buildPresetTemplatesFromRegistry(
        fields
      ) as FieldLibraryPresetTemplateOption[],
      tagOptions: allAvailableTags,
    }),
    [fields, allAvailableTags]
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
    openModal(
      "field-add",
      <FieldLibraryProvider value={modalLibraryValue}>
        <FieldRegistration close={closeModal} onSaved={refreshRegistry} />
      </FieldLibraryProvider>,
      {
        title: "Add Custom Field",
        showHeaderDivider: true,
        panelClassName: "sm:max-w-3xl",
      }
    );
  };

  const handleEdit = (id: string) => {
    openModal(
      "field-editor",
      <FieldLibraryProvider value={modalLibraryValue}>
        <FieldEditor id={id} close={closeModal} onSaved={refreshRegistry} />
      </FieldLibraryProvider>,
      {
        title: "Edit Field",
        showHeaderDivider: true,
        panelClassName: "sm:max-w-3xl",
      }
    );
  };

  const refreshRegistry = async () => {
    await queryClient.invalidateQueries({ queryKey: getFormsControllerGetFieldRegistryQueryKey() });
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
      await Promise.all(
        ids.map(async (id) => {
          const fieldRes = await formsControllerGetFieldFromRegistry({ id });
          const field = fieldRes?.field;
          if (!field) return;

          await formsControllerUpdateField({
            id: field.id,
            name: field.name,
            label: field.label,
            type: field.type,
            shared: field.shared,
            party: field.party ?? "__deprecated",
            source: field.source,
            tag: targetTag,
            prefiller: field.prefiller ?? null,
            preset: field.preset,
            tooltip_label: field.tooltip_label ?? null,
            validator: field.validator ?? null,
            is_phantom: field.is_phantom ?? false,
          });
        })
      );

      await refreshRegistry();
      setSelectedIds(new Set());
      toast.success(`Moved ${ids.length} field(s) to "${targetTag}".`);
    } catch {
      toast.error("Failed to move selected fields.");
    } finally {
      setBulkMoving(false);
    }
  };

  return (
    <div className="mx-auto mt-4 max-w-5xl space-y-3 pb-12">
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
                  onCheckedChange={(checked) => toggleGroupSelection(groupIds, checked === true)}
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
                        checked={allSelected ? true : someSelected ? "indeterminate" : false}
                        onCheckedChange={(checked) =>
                          toggleGroupSelection(groupIds, checked === true)
                        }
                        aria-label={`Select all in ${group.tag}`}
                      />
                      <p className="truncate text-sm font-semibold text-slate-800">{group.tag}</p>
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
  );
};

const FieldEditor = ({
  id,
  close,
  onSaved,
}: {
  id: string | null;
  close: () => void;
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

  const handleEdit = async () => {
    if (!fieldId || !field || !field.name || !field.preset) return;

    setEditing(true);
    try {
      await formsControllerUpdateField({
        ...field,
        id: fieldId,
        tag: field.tag || "uncategorized",
        party: field.party || "__deprecated",
        tooltip_label: field.tooltip_label ?? null,
        validator: field.validator ?? null,
        prefiller: field.prefiller ?? null,
        is_phantom: field?.is_phantom ?? false,
      });
      await onSaved?.();
      close();
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
        prefiller: data.field.prefiller ?? "",
      });
    } else {
      setFieldId(null);
    }
  }, [data]);

  return (
    <div className="h-fit w-xl flex-col">
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
              }}
              fieldOptions={fieldOptions}
              tagOptions={tagOptions}
              onLabelChange={(label) =>
                setField((prev) =>
                  prev
                    ? {
                        ...prev,
                        label,
                        name: deriveFieldNameFromLabel(label),
                      }
                    : prev
                )
              }
              showDerivedNameHint={true}
              onChange={(updates) => setField((prev) => (prev ? { ...prev, ...updates } : prev))}
            />
          </>
        ) : null}
      </div>
      <div className="mt-3 flex flex-row justify-between gap-1 pt-3">
        <div className="flex-1" />
        <Button disabled={editing} onClick={() => void handleEdit()}>
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
    tag: "uncategorized",
    shared: true,
    tooltip_label: "",
    prefiller: "",
    validator: "",
  });
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [loadingPreset, setLoadingPreset] = useState(false);
  const [registering, setRegistering] = useState(false);

  const handlePresetSelect = async (presetId: string) => {
    setSelectedPresetId(presetId);
    if (!presetId) return;

    setLoadingPreset(true);
    try {
      const data = await formsControllerGetFieldFromRegistry({ id: presetId });
      const preset = data?.field;
      if (!preset) return;

      const label = preset.label || "";
      setField((prev) => ({
        ...prev,
        label,
        ...createCustomFieldDraftFromPreset(
          {
            ...preset,
            label,
            type: (preset.type as "text" | "signature") || "text",
            source: (preset.source as FieldSource) || "manual",
            shared: preset.shared?.toString() === "true",
          },
          deriveFieldNameFromLabel,
          prev?.tag || "uncategorized"
        ),
      }));
    } catch {
      toast.error("Failed to load preset template.");
    } finally {
      setLoadingPreset(false);
    }
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
        toRegisterFieldPayload(
          {
            name: field.name || "",
            label: field.label || "",
            type: (field.type as "text" | "signature") || "text",
            source: (field.source as FieldSource) || "manual",
            party: "__deprecated",
            shared: field.shared ?? true,
            tag: field.tag || "uncategorized",
            tooltip_label: field.tooltip_label || "",
            prefiller: field.prefiller || "",
            validator: field.validator || "",
            is_phantom: false,
            preset: "default",
          },
          { preset: "default", defaultTag: "uncategorized" }
        )
      );
      await onSaved?.();
      close();
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="w-xl space-y-4">
      <CustomFieldModalForm
        value={{
          name: field.name || "",
          label: field.label || "",
          tag: field.tag || "",
          tooltip_label: field.tooltip_label || "",
          type: field.type || "text",
          source: (field.source as FieldSource) || "manual",
          shared: field.shared ?? true,
          prefiller: field.prefiller || "",
          validator: field.validator || "",
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
        onChange={(updates) => setField((prev) => ({ ...prev, ...updates }))}
      />
      <div className="flex flex-row justify-between gap-1">
        <div className="flex-1" />
        <Button
          disabled={registering || loadingPreset}
          scheme="destructive"
          variant="outline"
          onClick={close}
        >
          Cancel
        </Button>
        <Button
          disabled={registering || loadingPreset || !selectedPresetId}
          onClick={() => void handleAdd()}
        >
          {registering ? "Registering..." : "Register"}
        </Button>
      </div>
    </div>
  );
};

export default FieldRegistryPage;
