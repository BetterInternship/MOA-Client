"use client";

import React from "react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HeaderIcon, HeaderText } from "@/components/ui/text";
import { Newspaper, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toastPresets } from "@/components/sonner-toaster";
import { useModal } from "@/app/providers/modal-provider";
import { useSignatoryAccountActions } from "@/app/api/signatory.api";
import { useSignatoryProfile } from "../auth/provider/signatory.ctx";
import { useFormSettings } from "../auth/provider/form-settings.ctx";
import { useMyAutofillUpdate } from "@/hooks/use-my-autofill";
import { FormDefaultValueCapture } from "@/components/docs/form-editor/form-layout/FormDefaultValueCapture";
import { getFormFields } from "@/app/api/forms.api";
import MyFormsTableLike from "@/components/docs/forms/MyFormTableLike";
import { FormMetadata, IFormMetadata } from "@betterinternship/core/forms";
import { getViewableForms } from "@/app/api/docs.api";

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
  const updateAutofill = useMyAutofillUpdate();
  const formSettings = useFormSettings();
  const { openModal, closeModal } = useModal();
  const [togglingName, setTogglingName] = useState<string | null>(null);
  const [openFormName, setOpenFormName] = useState<string | null>(null);
  const [openPartyId, setOpenPartyId] = useState<string | null>(null);
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(null);

  const { data: rows = [] } = useQuery<FormItem[]>({
    queryKey: ["docs-forms-names"],
    queryFn: async () => {
      // Get all viewable form names
      const response = await getViewableForms();

      const formNames = Array.isArray(response) ? response : response?.forms || [];

      const formItems = await Promise.all(
        formNames.map(async (name) => {
          const settings = await formSettings.getFormSettings(name);

          const firstPartyId = Object.keys(settings || {})[0];
          const partySettings = firstPartyId ? settings[firstPartyId] : {};

          return {
            name,
            enabledAutosign: !!partySettings?.autosign,
            party: firstPartyId ?? "",
            date: partySettings?.autosign_date ?? "",
          };
        })
      );

      return formItems;
    },
    staleTime: 60_000,
  });

  // Load form data when modal opens
  React.useEffect(() => {
    if (!openFormName) {
      setFormData(null);
      setFormError(null);
      setIsLoadingForm(false);
      return;
    }

    const loadForm = async () => {
      setIsLoadingForm(true);
      setFormError(null);
      try {
        const data = await getFormFields(openFormName);
        setFormData(data);
      } catch (err) {
        console.error("Failed to load form:", err);
        setFormError("Please try again later or contact support");
      } finally {
        setIsLoadingForm(false);
      }
    };

    loadForm();
  }, [openFormName]);

  // Render modal content based on state
  const renderModalContent = () => {
    if (isLoadingForm) {
      return (
        <div className="flex h-[80dvh] w-full items-center justify-center transition-opacity">
          <Loader2 className="text-primary h-12 w-12 animate-spin" />
        </div>
      );
    }

    if (formError) {
      return (
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
            <p className="mt-2 text-sm text-gray-600">{formError}</p>
          </div>
        </div>
      );
    }

    if (!formData || !openPartyId) {
      return null;
    }

    const onSave = async (defaultValues: Record<string, string>) => {
      await handleSaveDefaultValues(openFormName!, formData.formMetadata, defaultValues);
      closeModal(`form-default-values:${openFormName!}`);
    };

    return (
      <div className="h-[80dvh] w-full">
        <FormDefaultValueCapture
          formName={openFormName!}
          documentUrl={formData.formUrl || ""}
          metadata={formData.formMetadata as IFormMetadata}
          onSave={onSave}
          selectedPartyId={openPartyId}
        />
      </div>
    );
  };

  // Update modal whenever content changes
  React.useEffect(() => {
    if (!openFormName) return;

    openModal(`form-default-values:${openFormName}`, renderModalContent(), {
      title: `My Default Values: ${openFormName}`,
      panelClassName: "sm:min-w-[95vw] sm:max-w-[95vw] sm:w-[95vw] sm:h-[90vh] sm:flex sm:flex-col",
      contentClassName: "flex-1 overflow-hidden p-4",
      showHeaderDivider: true,
    });
  }, [openFormName, isLoadingForm, formError, formData, openPartyId]);

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

  const onOpenAutoSignForm = (formName: string, party: string, currentValue: boolean) => {
    setOpenFormName(formName);
    setOpenPartyId(party);
  };

  // Save default values for form fields
  const handleSaveDefaultValues = async (
    formName: string,
    formMetadata: any,
    defaultValues: Record<string, string>
  ) => {
    try {
      // Get the fields for this form to know which are shared
      const fm = new FormMetadata(formMetadata);
      const fields = fm.getFieldsForClientService(openPartyId!);

      // Save to autofill
      await updateAutofill(formName, fields, defaultValues);

      // Show success message
      toast.success("Default values saved successfully!", toastPresets.success);
    } catch (error) {
      console.error("Failed to save default values:", error);
      toast.error("Failed to save default values", toastPresets.destructive);
      throw error;
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
