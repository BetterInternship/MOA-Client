"use client";

import React from "react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HeaderIcon, HeaderText } from "@/components/ui/text";
import { Newspaper, Loader2 } from "lucide-react";
import { getViewableForms } from "@/app/api/docs.api";
import { useModal } from "@/app/providers/modal-provider";
import { useSignatoryAccountActions } from "@/app/api/signatory.api";
import { useSignatoryProfile } from "../auth/provider/signatory.ctx";
import { FormPreview } from "@/components/docs/form-editor/form-layout/FormPreview";
import { getFormFields } from "@/app/api/forms.api";
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
  const onPreview = async (name: string, party: string) => {
    // Show loading modal first
    openModal(
      `form-preview:${name}`,
      <div className="flex h-[80dvh] w-full items-center justify-center transition-opacity">
        <Loader2 className="text-primary h-12 w-12 animate-spin" />
      </div>,
      {
        title: `Preview: ${name}`,
        panelClassName:
          "sm:min-w-[95vw] sm:max-w-[95vw] sm:w-[95vw] sm:h-[90vh] sm:flex sm:flex-col",
        contentClassName: "flex-1 overflow-hidden p-0",
        showHeaderDivider: true,
      }
    );

    // Load form data
    try {
      const formData = await getFormFields(name);

      // Update modal with actual content
      openModal(
        `form-preview:${name}`,
        <div className="h-[80dvh] w-full">
          <FormPreview
            formName={name}
            blocks={formData.formMetadata?.schema?.blocks || []}
            signingParties={
              formData.formMetadata?.schema?.blocks
                ?.flatMap((block) => (block.signing_party_id ? [block.signing_party_id] : []))
                ?.filter((party, index, self) => self.indexOf(party) === index)
                ?.map((partyId) => ({
                  _id: partyId,
                  name: partyId,
                  label: partyId,
                })) || []
            }
            documentUrl={formData.formUrl || ""}
            metadata={formData.formMetadata}
          />
        </div>,
        {
          title: `Preview: ${name}`,
          panelClassName:
            "sm:min-w-[95vw] sm:max-w-[95vw] sm:w-[95vw] sm:h-[90vh] sm:flex sm:flex-col",
          contentClassName: "flex-1 overflow-hidden p-4",
          showHeaderDivider: true,
        }
      );
    } catch (error) {
      console.error("Failed to load form:", error);
      openModal(
        `form-preview:${name}`,
        <div className="flex h-[80vh] items-center justify-center">
          <div className="w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-7 w-7 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Failed to load form</h3>
            <p className="mt-2 text-sm text-gray-600">Please try again later or contact support</p>
          </div>
        </div>,
        {
          title: `Preview: ${name}`,
          panelClassName:
            "sm:min-w-[95vw] sm:max-w-[95vw] sm:w-[95vw] sm:h-[90vh] sm:flex sm:flex-col",
          contentClassName: "flex-1 overflow-hidden p-0",
          showHeaderDivider: true,
        }
      );
    }
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
        onPreview={(name, party) => void onPreview(name, party)}
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
