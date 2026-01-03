"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { HeaderIcon, HeaderText } from "@/components/ui/text";
import { FolderOpen, Plus, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useFormsControllerGetRegistry } from "@/app/api";
import { fetchAllFormGroups, addFormToGroup } from "@/app/api/forms.api";
import { Card } from "@/components/ui/card";

interface FormGroup {
  id: string;
  name?: string;
  forms?: string[];
  description?: string;
}

export default function FormGroupsPage() {
  const queryClient = useQueryClient();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGroupForModal, setSelectedGroupForModal] = useState<string | null>(null);
  const [selectedFormToAdd, setSelectedFormToAdd] = useState<string>("");

  // Fetch all form templates (registry)
  const formRegistry = useFormsControllerGetRegistry();
  const rawForms = formRegistry.data?.registry ?? [];
  const allForms = rawForms.sort((a, b) => a.name.localeCompare(b.name));

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
      setSelectedFormToAdd("");
      setModalOpen(false);
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

  const openModal = (groupId: string) => {
    setSelectedGroupForModal(groupId);
    setSelectedFormToAdd("");
    setModalOpen(true);
  };

  const handleAddForm = () => {
    if (!selectedFormToAdd || !selectedGroupForModal) {
      toast.error("Please select a form");
      return;
    }
    addFormMutation.mutate({ formName: selectedFormToAdd, groupId: selectedGroupForModal });
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
                            openModal(group.id);
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

      {/* Add Form Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Add Form</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <Select value={selectedFormToAdd} onValueChange={setSelectedFormToAdd}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select a form..." />
              </SelectTrigger>
              <SelectContent>
                {allForms.length === 0 ? (
                  <div className="p-2 text-sm text-slate-500">No forms available</div>
                ) : (
                  allForms.map((form) => (
                    <SelectItem key={form.name} value={form.name} className="text-sm">
                      {form.label || form.name} (v{form.version})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddForm}
              disabled={!selectedFormToAdd || addFormMutation.isPending}
            >
              {addFormMutation.isPending ? (
                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
              ) : null}
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
