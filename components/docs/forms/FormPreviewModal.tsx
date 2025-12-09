"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DynamicForm } from "@/components/docs/forms/RecipientDynamicForm";
import { getFormFields, requestGenerateForm } from "@/app/api/forms.api";
import { FormMetadata } from "@betterinternship/core/forms";
import z from "zod";
import { useModal } from "@/app/providers/modal-provider";
import FormAutosignEditorModal from "./FormAutosignEditorModal";
import { ArrowLeft } from "lucide-react";

type Props = {
  formName: string;
  // optional initial values to seed the preview
  initialValues?: Record<string, Record<string, string>>;
};

export default function FormPreviewModal({ formName, initialValues = {} }: Props) {
  const { closeModal } = useModal();
  const [selectedParty, setSelectedParty] = useState<string>("student");
  const [allValid, setAllValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [values, setValues] = useState(initialValues);

  const previewQuery = useQuery({
    queryKey: ["form-fields", formName],
    queryFn: async () => await getFormFields(formName),
    enabled: !!formName,
  });

  const formMetadata = previewQuery.data?.formMetadata
    ? new FormMetadata(previewQuery.data?.formMetadata)
    : null;
  const fields = formMetadata?.getFieldsForClient() ?? [];
  const showableFields = useMemo(() => {
    if (!fields) return [];
    return fields.filter((f) => (selectedParty === "student" ? f.source === "manual" : true));
  }, [fields, selectedParty]);

  const parties = useMemo(() => {
    const required = formMetadata?.getRequiredParties?.() ?? [];
    const requiredParties = Array.isArray(required)
      ? required.map((r) => (typeof r === "string" ? r : r.party))
      : [];
    const uniq = new Set<string>(["student", ...requiredParties]);
    return Array.from(uniq);
  }, [formMetadata]);

  const fieldsForParty = (party: string) => showableFields.filter((f) => f.party === party);

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
        formName: formName,
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
        formName: formName || "",
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
    <div className="relative h-full w-full">
      <div className="relative mx-auto h-full w-fit rounded-[0.33em] bg-white">
        <div className="mx-auto h-[80%] w-fit space-y-3 p-5">
          <div className="w-fit">
            <Button
              variant="ghost"
              className="text-opacity-65 relative translate-x-[-1em] p-2"
              size="xs"
              onClick={() => closeModal(`form-preview:${formName}`)}
            >
              <ArrowLeft className="h-2 w-2 scale-75" />
              Back
            </Button>
            <h1 className="text-primary text-2xl font-bold tracking-tight whitespace-normal sm:whitespace-nowrap">
              Preview: {formName}
            </h1>
          </div>
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

          <>
            <FormAutosignEditorModal
              formName={formName}
              party={selectedParty}
              currentValue={false}
              notAsModal={true}
            ></FormAutosignEditorModal>
          </>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleValidate}
              disabled={previewQuery.isLoading}
            >
              Test Validation
            </Button>
            {selectedParty === "student" && (
              <Button
                type="button"
                onClick={() => void handleSubmitStudent()}
                disabled={submitting || previewQuery.isLoading}
              >
                {submitting ? "Submitting..." : "Submit Student Form"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
