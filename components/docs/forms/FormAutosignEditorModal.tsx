"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DynamicForm } from "@/components/docs/forms/RecipientDynamicForm";
import { getFormFields } from "@/app/api/forms.api";
import { FormMetadata } from "@betterinternship/core/forms";
import z from "zod";
import { useModal } from "@/app/providers/modal-provider";
import { useSignatoryAccountActions } from "@/app/api/signatory.api";
import { useQueryClient } from "@tanstack/react-query";

type Props = {
  formName: string;
  party: string;
  initialValues?: Record<string, string>;
};

export default function FormAutosignEditorModal({ formName, initialValues = {}, party }: Props) {
  const queryClient = useQueryClient();
  const { update } = useSignatoryAccountActions();
  const { closeModal } = useModal();
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const previewQuery = useQuery({
    queryKey: ["form-fields", formName],
    queryFn: async () => await getFormFields(formName),
    enabled: !!formName,
  });

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
        auto_form_permissions: { [formName]: true },
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

  return (
    <div>
      <div className="space-y-3">
        {previewQuery.isLoading ? (
          <div className="rounded-md border p-3">
            <div className="text-muted-foreground text-sm">Loading form preview...</div>
          </div>
        ) : (previewQuery.data?.formMetadata?.schema ?? []).length === 0 ? (
          <div className="text-sm">No preview available.</div>
        ) : (
          <div className="rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold">{party}</div>
              <div className="text-muted-foreground text-xs">
                {fieldsForParty(party).length} field{fieldsForParty(party).length !== 1 ? "s" : ""}
              </div>
            </div>

            <DynamicForm
              party={party}
              fields={fieldsForParty(party)}
              values={values[party] ?? {}}
              onChange={(field, value) => setField(party, field, value)}
              errors={errors}
              showErrors={true}
              formName={formName ?? ""}
              autofillValues={{}}
              setValues={(newVals) => setValuesForParty(party, newVals)}
              onBlurValidate={(fieldKey: string) => validateFieldOnBlur(fieldKey)}
            />
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || previewQuery.isLoading}
          >
            {submitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
