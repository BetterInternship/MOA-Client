"use client";

import React from "react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HeaderIcon, HeaderText } from "@/components/ui/text";
import { Newspaper } from "lucide-react";
import { Card } from "@/components/ui/card";
import FormPreviewModal from "@/components/docs/forms/FormPreviewModal";
import { getViewableForms } from "@/app/api/docs.api";
import { useModal } from "@/app/providers/modal-provider";
import { getDocsSelf } from "@/app/api/docs.api";
import { DocsUser } from "@/types/docs-user";
import MyFormCard from "@/components/docs/MyFormCard";
import FormAutosignEditorModal from "@/components/docs/forms/FormAutosignEditorModal";
import { Button } from "@/components/ui/button";
import { useSignatoryAccountActions } from "@/app/api/signatory.api";

type FormItem = { name: string; enabledAutosign: boolean; party: string };

export default function DocsFormsPage() {
  const { data } = useQuery({
    queryKey: ["docs-self"],
    queryFn: getDocsSelf,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const user = data?.profile as DocsUser | undefined;
  const isCoordinator = !!user?.coordinatorId;

  const { data: rows = [] } = useQuery<FormItem[]>({
    queryKey: ["docs-forms-names"],
    queryFn: async () => {
      const res = await getViewableForms();
      console.log("getViewableForms response:", res);
      if (!res || !res.forms) return [];

      // res.forms is an object keyed by form name. Convert to array.
      const entries = Object.entries(res.forms) as [
        string,
        { enabled?: boolean; party?: string },
      ][];
      return entries.map(([name, obj]) => ({
        name,
        enabledAutosign: !!obj.enabled,
        party: obj.party ?? "",
      }));
    },
    staleTime: 60_000,
  });

  const { openModal } = useModal();

  const onPreview = (name: string) => {
    openModal(`form-preview:${name}`, <FormPreviewModal formName={name} />, {
      title: `Preview: ${name}`,
      panelClassName: "sm:max-w-4xl sm:min-w-[56rem]",
    });
  };

  const onAuthorizeAutoSign = (name: string, currentValue: boolean, party: string) => {
    // If currently OFF (false), open enable modal; if ON (true), open disable modal
    if (!currentValue) {
      openModal(
        `form-auto-sign:${name}`,
        <FormAutosignEditorModal formName={name} party={party} />,
        {
          title: `Enable Auto-Sign: ${name}`,
          panelClassName: "sm:max-w-2xl sm:min-w-[32rem]",
        }
      );
    } else {
      openModal(
        `form-auto-sign:${name}`,
        <FormAutosignDisableModal formName={name} party={party} />,
        {
          title: `Disable Auto-Sign: ${name}`,
          panelClassName: "sm:min-w-md",
        }
      );
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 pt-6 sm:px-10 sm:pt-16">
      <div className="mb-6 space-y-2 sm:mb-8">
        <div className="flex items-center gap-3">
          <HeaderIcon icon={Newspaper} />
          <HeaderText> {isCoordinator ? "Forms Preview" : "My Saved Templates"} </HeaderText>
        </div>
        <p className="text-sm text-gray-600 sm:text-base">
          {isCoordinator
            ? "Preview form templates used in the system. Switch parties to preview each party's portion of the form."
            : "View and manage your saved form templates."}{" "}
          Check form templates that have auto-sign enabled
        </p>
      </div>
      <Card className="p-3 sm:p-4">
        {rows.length === 0 ? (
          <div className="text-muted-foreground text-sm">
            No form templates available. You will have access to a form template when you have
            signed one.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {rows.map((f) => (
              <MyFormCard
                key={f.name}
                row={f}
                isCoordinator={isCoordinator}
                onPreview={() => onPreview(f.name)}
                onToggleAutoSign={() => {
                  void onAuthorizeAutoSign(f.name, f.enabledAutosign, f.party);
                }}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function FormAutosignDisableModal({ formName, party }: { formName: string; party: string }) {
  const queryClient = useQueryClient();
  const { update } = useSignatoryAccountActions();
  const { closeModal } = useModal();
  const [saving, setSaving] = useState(false);

  const handleDisable = async () => {
    setSaving(true);
    try {
      await update.mutateAsync({
        auto_form_permissions: {
          [formName]: {
            enabled: false,
            party: party,
          },
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["docs-forms-names"] });
      await queryClient.invalidateQueries({ queryKey: ["docs-self"] });
      closeModal(`form-auto-sign:${formName}`);
    } catch (err) {
      console.error("Failed to disable auto-sign:", err);
      alert("Failed to disable auto-sign. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4">
        <h3 className="mb-1 text-sm font-medium">Disable Auto-sign</h3>
        <p className="text-muted-foreground text-sm">
          Turning off auto-sign means you'll need to sign this form manually.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => closeModal(`form-auto-sign:${formName}`)}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="button" onClick={handleDisable} disabled={saving}>
          {saving ? "Disabling..." : "Disable"}
        </Button>
      </div>
    </div>
  );
}
