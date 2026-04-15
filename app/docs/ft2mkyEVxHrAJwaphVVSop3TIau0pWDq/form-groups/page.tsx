"use client";

import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { HeaderIcon, HeaderText } from "@/components/ui/text";
import { FolderOpen, Plus, Loader2, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useFormsControllerGetRegistry } from "@/app/api";
import { fetchAllFormGroups, addFormToGroup } from "@/app/api/forms.api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useModal } from "@/app/providers/modal-provider";

interface FormGroup {
  id: string;
  name?: string;
  forms?: string[];
  description?: string;
}

interface FormOption {
  name: string;
  label?: string;
  version?: number;
}

function AddFormModalContent({
  forms,
  onSubmit,
  onClose,
}: {
  forms: FormOption[];
  onSubmit: (formName: string) => Promise<void>;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedForm, setSelectedForm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredForms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return forms;
    return forms.filter(
      (form) =>
        form.name.toLowerCase().includes(query) ||
        (form.label || "").toLowerCase().includes(query) ||
        String(form.version || "").includes(query)
    );
  }, [forms, searchQuery]);

  const handleAdd = async () => {
    if (!selectedForm) {
      toast.error("Please select a form");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(selectedForm);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search forms..."
        className="h-9 text-sm"
        autoFocus
      />

      <div className="h-72 overflow-auto rounded-md border border-slate-200">
        {forms.length === 0 ? (
          <div className="flex h-full items-center justify-center p-3 text-sm text-slate-500">
            No forms available
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="flex h-full items-center justify-center p-3 text-sm text-slate-500">
            No forms match your search
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredForms.map((form) => {
              const isSelected = selectedForm === form.name;
              return (
                <button
                  key={form.name}
                  type="button"
                  onClick={() => setSelectedForm(form.name)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                    isSelected ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="truncate pr-3">
                    {form.label || form.name} (v{form.version})
                  </span>
                  {isSelected ? <Check className="h-4 w-4 flex-shrink-0 text-slate-700" /> : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleAdd} disabled={!selectedForm || isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : null}
          Add
        </Button>
      </div>
    </div>
  );
}

export default function FormGroupsPage() {
  const queryClient = useQueryClient();
  const { openModal, closeModal } = useModal();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Fetch all form templates (registry)
  const formRegistry = useFormsControllerGetRegistry();
  const rawForms = formRegistry.data?.registry ?? [];
  const allForms = [...rawForms].sort((a, b) => a.name.localeCompare(b.name));

  // Fetch all form groups
  const { data: groupsData } = useQuery({
    queryKey: ["FormGroupsController_GetAllFormGroups"],
    queryFn: fetchAllFormGroups,
  });

  const formGroups = (groupsData?.groups || []) as FormGroup[];

  // Mutation to add form to group
  const addFormMutation = useMutation({
    mutationFn: ({ formName, groupId }: { formName: string; groupId: string }) =>
      addFormToGroup(formName, groupId),
    onSuccess: () => {
      toast.success("Form added to group successfully");
      queryClient.invalidateQueries({ queryKey: ["FormGroupsController_GetAllFormGroups"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add form to group");
    },
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const openAddFormModal = (groupId: string) => {
    const modalKey = "form-groups:add-form";
    openModal(
      modalKey,
      <AddFormModalContent
        forms={allForms}
        onSubmit={(formName) => addFormMutation.mutateAsync({ formName, groupId })}
        onClose={() => closeModal(modalKey)}
      />,
      {
        title: "Add Form",
        panelClassName: "sm:w-[640px] sm:min-w-[640px] sm:max-w-[640px]",
        contentClassName: "w-full px-4 pb-4 pt-2",
      }
    );
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl bg-white">
      {/* Header Section */}
      <div className="w-full border-b border-slate-200">
        <div className="w-full py-6">
          <div className="flex items-center gap-3">
            <HeaderIcon icon={FolderOpen} />
            <div>
              <HeaderText>Form Groups</HeaderText>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full py-6">
        <div className="mx-auto w-full max-w-7xl">
          {formGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="mb-2 h-8 w-8 text-slate-400" />
              <p className="text-sm text-slate-600">No form groups yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {formGroups.map((group) => {
                const isExpanded = expandedGroups.has(group.id);
                return (
                  <Card key={group.id} className="p-1">
                    {/* Row Header */}
                    <button onClick={() => toggleGroup(group.id)} className="w-full">
                      <div className="flex items-center justify-between px-4 py-3">
                        <div className="flex flex-1 items-center gap-3">
                          <ChevronDown
                            className={`mt-1 h-4 w-4 text-slate-400 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                          <div className="text-left">
                            <h3 className="text-sm font-medium text-slate-900">
                              {group.description || `Group ${group.id.slice(0, 8)}`}
                            </h3>
                          </div>
                          <span className="mr-4 ml-auto text-xs text-slate-500">
                            {group.forms?.length || 0} forms
                          </span>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddFormModal(group.id);
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span className="text-xs">Add</span>
                        </Button>
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 px-4 py-2">
                        {group.forms && group.forms.length > 0 ? (
                          <div className="space-y-1">
                            {group.forms.map((formName) => {
                              const formInfo = allForms.find((f) => f.name === formName);
                              return (
                                <div
                                  key={formName}
                                  className="flex items-center gap-2 py-1.5 text-xs"
                                >
                                  <span className="text-slate-700">
                                    {formInfo?.label || formName}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="py-2 text-xs text-slate-500">No forms</p>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
