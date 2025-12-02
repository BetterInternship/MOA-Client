"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DynamicForm } from "@/components/docs/forms/RecipientDynamicForm";
import { getFormFields, requestGenerateForm } from "@/app/api/forms.api";
import { FormMetadata } from "@betterinternship/core/forms";
import z from "zod";
import { useModal } from "@/app/providers/modal-provider";

type Props = {
  previewName: string;
  // optional initial values to seed the preview
  initialValues?: Record<string, Record<string, string>>;
};

export default function FormPreviewModal({ previewName, initialValues = {} }: Props) {
  const { closeModal } = useModal();
  const [values, setValues] = useState<Record<string, Record<string, string>>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedParty, setSelectedParty] = useState<string>("student");
  const [allValid, setAllValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const previewQuery = useQuery({
    queryKey: ["form-fields", previewName],
    queryFn: async () => await getFormFields(previewName),
    enabled: !!previewName,
  });

  const formMetadata = previewQuery.data?.formMetadata
    ? new FormMetadata(previewQuery.data?.formMetadata)
    : null;
  const fields = formMetadata?.getFieldsForClient() ?? [];
  const showableFields = fields.filter((f) => f.source === "manual");

  const parties = useMemo(() => {
    const required = formMetadata?.getRequiredParties?.() ?? [];
    const uniq = new Set<string>(["student", ...(Array.isArray(required) ? required : [])]);
    return Array.from(uniq);
  }, [formMetadata]);

  const fieldsForParty = (party: string) => showableFields.filter((f) => f.party === party);

  const setField = (party: string, key: string, value: any) => {
    setValues((prev) => {
      const partyVals = { ...(prev[party] ?? {}) };
      partyVals[key] = value?.toString() ?? "";
      return { ...prev, [party]: partyVals };
    });
  };

  const setValuesForParty = (party: string, newValues: Record<string, string>) => {
    setValues((prev) => ({ ...prev, [party]: { ...(prev[party] ?? {}), ...newValues } }));
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
    } catch (err) {
      setErrors((prev) => ({ ...prev, [field.field]: `${field.label}: invalid value` }));
    }
  };

  const handleValidate = () => {
    const newErrors: Record<string, string> = { ...(errors ?? {}) };

    // Clear previous errors for fields in this party
    for (const f of fieldsForParty(selectedParty)) {
      if (newErrors[f.field]) delete newErrors[f.field];
    }

    for (const field of fieldsForParty(selectedParty)) {
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
          newErrors[field.field] = `${field.label}: ${errorString}`;
          continue;
        }
      } catch (err) {
        newErrors[field.field] = `${field.label}: invalid value`;
      }
    }

    setErrors(newErrors);

    const partyFieldKeys = fieldsForParty(selectedParty).map((f) => f.field);
    const hasPartyErrors = partyFieldKeys.some((k) => !!newErrors[k]);
    setAllValid(!hasPartyErrors);
    return !hasPartyErrors;
  };

  const handleSubmitStudent = async () => {
    if (selectedParty !== "student") return;

    setSubmitting(true);
    const newErrors: Record<string, string> = {};

    // Validate all student fields
    const studentFields = showableFields.filter((f) => f.party === "student");
    const studentValues = values["student"] ?? {};

    for (const field of studentFields) {
      if (field.source !== "manual") continue;

      const value = studentValues[field.field];
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

    // If any errors, show them and stop
    setErrors(newErrors);
    if (Object.keys(newErrors).length) {
      setSubmitting(false);
      return;
    }

    try {
      console.log("(Preview modal) Submit student payload", {
        formName: previewName,
        values: studentValues,
      });

      const testStudentValues = {
        "student.email:default": "hello@betterinternship.com",
        "student.school:default": "9c044cb4-637d-427c-a399-b00b01d573d4",
        "student.full-name:default": "Test Student",
        "student.last-name:default": "Student",
        "student.department:default": "7c964274-e4a0-43a8-897f-8d12949e4043",
        "student.first-name:default": "Test",
        "student.university:default": "45e8deea-0635-4c9f-b0b0-05e6c55db8e3",
        "student.middle-name:default": "",
        "student.phone-number:default": "09123456789",
        "student-signature:default": "Test Student",
      };
      const payloadValues = { ...autofillValues, ...(studentValues ?? {}), ...testStudentValues };

      await requestGenerateForm({
        formName: previewName || "",
        values: payloadValues,
      });

      alert("Student form submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to submit form. Please try again.");
    } finally {
      setSubmitting(false);
      closeModal("form-preview");
    }
  };

  const autofillValues = useMemo(() => {
    const autofillValues: Record<string, string> = {};
    if (!fields || fields.length === 0) return autofillValues;

    for (const field of fields) {
      if (!field.prefiller) continue;
      try {
        const s = field.prefiller({ user: {} as any });
        autofillValues[field.field] = typeof s === "string" ? s.trim().replace(/\s{2,}/g, " ") : s;
      } catch (e) {
        // ignore
      }
    }

    return autofillValues;
  }, [fields]);

  return (
    <div>
      <div className="space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {parties.map((p) => (
            <button
              key={p}
              onClick={() => {
                setSelectedParty(p);
                setAllValid(false);
              }}
              className={`rounded-full border px-3 py-1 text-sm whitespace-nowrap transition ${
                selectedParty === p ? "bg-primary border-primary text-white" : "bg-transparent"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {previewQuery.isLoading ? (
          <div className="rounded-md border p-3">
            <div className="text-sm text-muted-foreground">Loading form preview...</div>
          </div>
        ) : (previewQuery.data?.formMetadata?.schema ?? []).length === 0 ? (
          <div className="text-sm">No preview available.</div>
        ) : (
          <div className="rounded-md border p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold">{selectedParty}</div>
              <div className="text-muted-foreground text-xs">
                {fieldsForParty(selectedParty).length} field
                {fieldsForParty(selectedParty).length !== 1 ? "s" : ""}
              </div>
            </div>

            <DynamicForm
              party={selectedParty}
              fields={fieldsForParty(selectedParty)}
              values={values[selectedParty] ?? {}}
              onChange={(field, value) => setField(selectedParty, field, value)}
              errors={errors}
              showErrors={true}
              formName={previewName ?? ""}
              autofillValues={autofillValues}
              setValues={(newVals) => setValuesForParty(selectedParty, newVals)}
              onBlurValidate={(fieldKey: string) => validateFieldOnBlur(fieldKey)}
            />

            {allValid && fieldsForParty(selectedParty).length > 0 && (
              <div className="mt-2 flex items-center gap-1 text-sm font-medium text-green-600">
                All fields are valid ✅
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleValidate} disabled={previewQuery.isLoading}>
            Test Validation
          </Button>
          {selectedParty === "student" && (
            <Button type="button" onClick={() => void handleSubmitStudent()} disabled={submitting || previewQuery.isLoading}>
              {submitting ? "Submitting..." : "Submit Student Form"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
