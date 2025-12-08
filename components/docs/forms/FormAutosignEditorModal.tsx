"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DynamicForm } from "@/components/docs/forms/RecipientDynamicForm";
import { getFormFields } from "@/app/api/forms.api";
import { FormMetadata } from "@betterinternship/core/forms";
import z from "zod";
import { useModal } from "@/app/providers/modal-provider";
import { getSignatorySelf, useSignatoryAccountActions } from "@/app/api/signatory.api";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFormContext } from "@/app/docs/ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/form.ctx";
import { DocumentRenderer } from "./previewer";
import { useIsMobile } from "@/hooks/use-mobile";

type Props = {
  formName: string;
  party: string;
  currentValue: boolean;
};

export default function FormAutosignEditorModal({ formName, party, currentValue }: Props) {
  const queryClient = useQueryClient();
  const form = useFormContext();
  const isMobile = useIsMobile();
  const { update } = useSignatoryAccountActions();
  const { openModal, closeModal } = useModal();
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mobileStage, setMobileStage] = useState<"preview" | "form" | "confirm">("preview");
  const [previews, setPreviews] = useState<Record<number, React.ReactNode[]>>({});
  const [submitting, setSubmitting] = useState(false);

  const { data: formRes } = useQuery({
    queryKey: ["form-fields", formName],
    queryFn: () => getFormFields(formName),
    enabled: !!formName,
    staleTime: 1000,
  });

  const previewQuery = useQuery({
    queryKey: ["form-fields", formName],
    queryFn: async () => await getFormFields(formName),
    enabled: !!formName,
  });

  const profile = useQuery({
    queryKey: ["signatory-self"],
    queryFn: async () => await getSignatorySelf(),
    staleTime: 60_000,
  });

  // Saved autofill
  const autofillValues = useMemo(() => {
    const profileAutofill = profile.data?.autofill as Record<string, Record<string, string>>;
    if (!profileAutofill) return;

    // Destructure to isolate only shared fields or fields for that form
    const autofillValues = {
      ...(profileAutofill.base ?? {}),
      ...profileAutofill.shared,
      ...(profileAutofill[formName] ?? {}),
    };

    return autofillValues;
  }, [profile, formName]) as Record<string, string>;

  const formMetadata = previewQuery.data?.formMetadata
    ? new FormMetadata(previewQuery.data?.formMetadata)
    : null;
  const fields = formMetadata?.getFieldsForClient() ?? [];

  const fieldsForParty = (p: string) => fields.filter((f) => f.party === p);

  const setField = (p: string, key: string, value: any) => {
    setValues((prev) => {
      const partyVals = { ...(prev[p] ?? {}) };
      partyVals[key] = value?.toString() ?? "";
      return { ...prev, [p]: partyVals };
    });
  };

  const setValuesForParty = (p: string, newValues: Record<string, string>) => {
    setValues((prev) => ({ ...prev, [p]: { ...(prev[p] ?? {}), ...newValues } }));
  };

  const validateFieldOnBlur = (fieldKey: string) => {
    const field = fields.find((f) => f.field === fieldKey);
    if (!field) return;
    if (field.source !== "manual") return;

    const partyValues = values[field.party] ?? {};
    const value = partyValues[field.field];

    try {
      const coerced = field.coerce ? field.coerce(value) : value;
      const result = field.validator?.safeParse(coerced);

      if (result?.error) {
        const errorString = z
          .treeifyError(result.error)
          .errors.map((e) => e.split(" ").slice(0).join(" "))
          .join("\n");
        setErrors((prev) => ({ ...prev, [field.field]: `${field.label}: ${errorString}` }));
      } else {
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy[field.field];
          return copy;
        });
      }
    } catch {
      setErrors((prev) => ({ ...prev, [field.field]: `${field.label}: invalid value` }));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const newErrors: Record<string, string> = {};

    // Collect flat values from nested state
    const flatValues: Record<string, string> = {};
    for (const field of fields) {
      if (field.party !== party) continue;
      const value = values[field.party]?.[field.field];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        flatValues[field.field] = String(value);
      }
    }

    // Validate fields for this party
    const partyFields = fields.filter((f) => f.party === party);
    console.log("Validating fields for party", party, partyFields);

    for (const field of partyFields) {
      if (field.source !== "manual" && field.source !== "derived") continue;

      const value = flatValues[field.field];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        flatValues[field.field] = String(value);
      }
      const coerced = field.coerce ? field.coerce(value) : value;
      const result = field.validator?.safeParse(coerced);

      if (result?.error) {
        const errorString = z
          .treeifyError(result.error)
          .errors.map((e) => e.split(" ").slice(0).join(" "))
          .join("\n");
        newErrors[field.field] = `${field.label}: ${errorString}`;
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length) {
      setSubmitting(false);
      return;
    }

    // Build payload like in docs/sign/page.tsx
    const internshipMoaFieldsToSave: Record<string, Record<string, string>> = {
      shared: {},
    };

    for (const field of fields) {
      if (field.party !== party) continue; // only include fields relevant to this signing audience

      if (field.shared) {
        internshipMoaFieldsToSave.shared[field.field] = flatValues[field.field] ?? "";
      } else {
        if (!internshipMoaFieldsToSave[formName]) {
          internshipMoaFieldsToSave[formName] = {};
        }
        internshipMoaFieldsToSave[formName][field.field] = flatValues[field.field] ?? "";
      }
    }

    try {
      await update.mutateAsync({
        autofill: internshipMoaFieldsToSave,
        auto_form_permissions: {
          [formName]: {
            enabled: currentValue,
            party: party,
          },
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["docs-self"] });
      await queryClient.invalidateQueries({ queryKey: ["docs-forms-names"] });
      console.log("Autofill and autosign completed!");
    } catch (err) {
      console.error(err);
      console.log("Failed to save. Please try again.");
    } finally {
      setSubmitting(false);
      closeModal(`form-auto-sign:${formName}`);
    }
  };

  const openDocPreviewModal = () => {
    if (!form.document.url) return;
    openModal(
      "doc-preview",
      <div className="h-[95dvh] w-[95dvw] sm:w-[80vw]">
        <DocumentRenderer
          documentUrl={form.document.url}
          highlights={[]}
          previews={previews}
          onHighlightFinished={() => {}}
        />
      </div>,
      { title: "Document Preview" }
    );
  };

  useEffect(() => {
    if (!!formName && (!!formRes?.formVersion || formRes?.formVersion === 0)) {
      form.updateFormName(formName);
      form.updateFormVersion(formRes.formVersion);
    }
  }, [formName, formRes?.formVersion, formRes]);

  return (
    <div className="bg-opacity-25 relative mx-auto flex h-[100%] max-h-[100%] w-full flex-col items-center overflow-hidden">
      <div className="w-full max-w-7xl overflow-x-visible overflow-y-visible rounded-[0.33em] bg-white">
        <div className="flex flex-col items-start gap-1 rounded-[0.33em] rounded-b-none border bg-white px-6 py-3">
          <Button
            variant="ghost"
            className="text-opacity-65 relative translate-x-[-1em] p-2"
            size="xs"
            onClick={() => closeModal(`form-auto-sign:${formName}`)}
          >
            <ArrowLeft className="h-2 w-2 scale-75" />
            Back
          </Button>
          <h1 className="text-primary text-2xl font-bold tracking-tight whitespace-normal sm:whitespace-nowrap">
            {formName}
          </h1>
        </div>
      </div>
      <div className="relative flex h-[100%] w-full max-w-7xl flex-col justify-center overflow-y-hidden sm:flex-row">
        <div className="relative max-h-[100%] w-[100%] overflow-y-auto">
          {/* Form Renderer */}
          <div className="h-full max-h-[100%] space-y-4 overflow-y-auto rounded-[0.33em] rounded-t-none rounded-r-none border border-gray-300 bg-white p-5">
            <div className={cn("mb-2 sm:hidden", mobileStage === "preview" ? "" : "hidden")}>
              <div className="relative w-full overflow-auto rounded-md border">
                {form.document.url ? (
                  <DocumentRenderer
                    documentUrl={form.document.url}
                    highlights={[]}
                    previews={previews}
                    onHighlightFinished={() => {}}
                  />
                ) : (
                  <div className="p-4 text-sm text-gray-500">No preview available</div>
                )}
              </div>

              <div className="mt-2 flex gap-2">
                <Button
                  className="w-full"
                  onClick={() => setMobileStage("form")}
                  disabled={form.loading}
                >
                  Fill Form
                </Button>
              </div>
            </div>

            {/* Mobile: confirm preview stage */}
            <div className={cn("sm:hidden", mobileStage === "confirm" ? "" : "hidden")}>
              <div className="relative h-[60vh] w-full overflow-auto rounded-md border">
                {form.document.url ? (
                  <DocumentRenderer
                    documentUrl={form.document.url}
                    highlights={[]}
                    previews={previews}
                    onHighlightFinished={() => {}}
                  />
                ) : (
                  <div className="p-4 text-sm text-gray-500">No preview available</div>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={submitting || previewQuery.isLoading}
                >
                  {submitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>

            <div className={cn(mobileStage === "form" ? "" : "hidden", "sm:block")}>
              {/* loading / error / empty / form */}
              {form.loading ? (
                <div className="flex items-center justify-center">
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading form…
                  </span>
                </div>
              ) : fields.length === 0 ? (
                <div className="text-sm text-gray-500">No fields available for this request.</div>
              ) : (
                <div className="space-y-4">
                  <DynamicForm
                    party={party}
                    fields={fieldsForParty(party)}
                    values={values[party] ?? {}}
                    onChange={(field, value) => setField(party, field, value)}
                    errors={errors}
                    showErrors={true}
                    formName={formName ?? ""}
                    autofillValues={autofillValues}
                    setValues={(newVals) => setValuesForParty(party, newVals)}
                    setPreviews={setPreviews}
                    onBlurValidate={(fieldKey: string) => validateFieldOnBlur(fieldKey)}
                  />

                  <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                    <div className="flex flex-wrap justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        onClick={() => void handleSubmit()}
                        disabled={submitting || previewQuery.isLoading}
                      >
                        {submitting ? "Saving..." : "Save"}
                      </Button>
                    </div>

                    {/* On mobile, also show a secondary preview button */}
                    <Button
                      variant="ghost"
                      onClick={() => {
                        // On mobile while editing, allow quick jump to preview stage
                        if (isMobile) {
                          setMobileStage("preview");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        } else {
                          openDocPreviewModal();
                        }
                      }}
                      disabled={!form.document.url}
                      className="w-full sm:hidden"
                    >
                      Open Preview
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PDF Renderer - hidden on small screens, visible on sm+ */}
        <div className="relative hidden max-w-[600px] min-w-[600px] overflow-auto sm:block">
          {!form.loading ? (
            <div className="relative flex h-full w-full flex-row gap-2">
              {!!form.document.url && (
                <div className="relative h-full w-full">
                  <DocumentRenderer
                    documentUrl={form.document.url}
                    highlights={[]}
                    previews={previews}
                    onHighlightFinished={() => {}}
                  />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
  //   <div>
  //     <div className="space-y-3">
  //       {previewQuery.isLoading ? (
  //         <div className="rounded-md border p-3">
  //           <div className="text-muted-foreground text-sm">Loading form preview...</div>
  //         </div>
  //       ) : (previewQuery.data?.formMetadata?.schema ?? []).length === 0 ? (
  //         <div className="text-sm">No preview available.</div>
  //       ) : (
  //         <div className="rounded-md border p-3">
  //           <div className="mb-2 flex items-center justify-between">
  //             <div className="text-sm font-semibold">{party}</div>
  //             <div className="text-muted-foreground text-xs">
  //               {fieldsForParty(party).length} field{fieldsForParty(party).length !== 1 ? "s" : ""}
  //             </div>
  //           </div>

  //           <DynamicForm
  //             party={party}
  //             fields={fieldsForParty(party)}
  //             values={values[party] ?? {}}
  //             onChange={(field, value) => setField(party, field, value)}
  //             errors={errors}
  //             showErrors={true}
  //             formName={formName ?? ""}
  //             autofillValues={autofillValues}
  //             setValues={(newVals) => setValuesForParty(party, newVals)}
  //             onBlurValidate={(fieldKey: string) => validateFieldOnBlur(fieldKey)}
  //           />
  //         </div>
  //       )}

  //       <div className="mt-4 flex justify-end gap-2">
  //         <Button
  //           type="button"
  //           onClick={() => void handleSubmit()}
  //           disabled={submitting || previewQuery.isLoading}
  //         >
  //           {submitting ? "Saving..." : "Save"}
  //         </Button>
  //       </div>
  //     </div>
  //   </div>
  // );
}
