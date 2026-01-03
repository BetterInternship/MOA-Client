"use client";

import React from "react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HeaderIcon, HeaderText } from "@/components/ui/text";
import { Newspaper } from "lucide-react";
import { getViewableForms } from "@/app/api/docs.api";
import { useModal } from "@/app/providers/modal-provider";
import { useSignatoryAccountActions } from "@/app/api/signatory.api";
import { useSignatoryProfile } from "../auth/provider/signatory.ctx";
import FormPreviewModal from "@/components/docs/forms/FormPreviewModal";
import FormAutosignEditorModal from "@/components/docs/forms/FormAutosignEditorModal";
import MyFormsTableLike from "@/components/docs/forms/MyFormTableLike";

type FormItem = {
  name: string;
  enabledAutosign: boolean;
  party: string;
  order?: number;
};

export default function DocsFormsPage() {
  const queryClient = useQueryClient();
  const profile = useSignatoryProfile();
  const isCoordinator = !!profile.coordinatorId;
  const { update } = useSignatoryAccountActions();
  const [togglingName, setTogglingName] = useState<string | null>(null);

  const { data: rows = [] } = useQuery<FormItem[]>({
    queryKey: ["docs-forms-names"],
    queryFn: async () => {
      type FormsResponse = {
        forms?: {
          [name: string]: {
            enabled: boolean;
            party: string;
            date: string;
          };
        };
      };

      const res = (await getViewableForms()) as FormsResponse;
      if (!res || !res.forms) return [];

      // res.forms is an object keyed by form name. Convert to array.
      const entries = Object.entries(res.forms);
      return entries.map(([name, obj]) => ({
        name,
        enabledAutosign: !!obj?.enabled,
        party: obj?.party ?? "",
        date: obj?.date,
      }));
    },
    staleTime: 60_000,
  });

  const { openModal } = useModal();

  // Open form preview
  const onPreview = (name: string, party: string) => {
    openModal(`form-preview:${name}`, <FormPreviewModal formName={name} selectedParty={party} />, {
      title: `Preview: ${name}`,
      useCustomPanel: true,
    });
  };

  // Open auto-sign editor
  const onOpenAutoSignForm = (formName: string, party: string, currentValue: boolean) => {
    openModal(
      `form-auto-sign:${formName}`,
      <FormAutosignEditorModal formName={formName} party={party} currentValue={currentValue} />,
      {
        title: `Enable Auto-Sign: ${formName}`,
        panelClassName: "sm:max-w-2xl sm:min-w-[32rem]",
        useCustomPanel: true,
      }
    );
  };

  const toggleAutoSign = async (formName: string, party: string, currentValue: boolean) => {
    console.log("Toggled auto-sign for", formName);

    try {
      setTogglingName(formName);
      await update.mutateAsync({
        auto_form_permissions: {
          [formName]: {
            enabled: !currentValue,
            party: party,
            date: new Date().toISOString(),
          },
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["docs-forms-names"] });
      await queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    } catch (err) {
      console.error("Failed to toggle auto-sign:", err);
      alert("Failed to toggle auto-sign. Please try again.");
    } finally {
      setTogglingName(null);
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
      <MyFormsTableLike
        rows={rows}
        onPreview={(name, party) => onPreview(name, party)}
        onOpenAutoSignForm={(name, party, currentValue) =>
          void onOpenAutoSignForm(name, party, currentValue)
        }
        toggleAutoSign={(name, party, currentValue) =>
          void toggleAutoSign(name, party, currentValue)
        }
        togglingName={togglingName}
        isCoordinator={isCoordinator}
      />
    </div>
  );
}
