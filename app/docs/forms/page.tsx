"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HeaderIcon, HeaderText } from "@/components/ui/text";
import { Newspaper } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { DynamicForm } from "@/components/docs/forms/RecipientDynamicForm";
import { getFormFields } from "@/app/api/forms.api";
import { getViewableForms } from "@/app/api/docs.api";
import { FormMetadata } from "@betterinternship/core/forms";
import z from "zod";
import { requestGenerateForm } from "@/app/api/forms.api";

type FormItem = { name: string };

export default function DocsFormsPage() {
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<string>("student");

  const { data: rows = [] } = useQuery<FormItem[]>({
    queryKey: ["docs-forms-names"],
    queryFn: async () => {
      const res = await getViewableForms();
      if (!res) return [];
      if (Array.isArray(res.forms)) return res.forms.map((n: string) => ({ name: n }));
      return [];
    },
    staleTime: 60_000,
  });

  const previewQuery = useQuery({
    queryKey: ["form-fields", previewName],
    queryFn: async () => {
      return await getFormFields(previewName);
    },
    enabled: !!previewName && open,
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

  // ensure selectedParty is reset to student when opening a new preview
  const onPreview = (name: string) => {
    setPreviewName(name);
    setSelectedParty("student");
    setOpen(true);
  };

  // helper to set a single field under a party
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

  const [allValid, setAllValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleValidate = () => {
    const newErrors: Record<string, string> = { ...(errors ?? {}) };

    // Clear previous errors for fields in this party
    for (const f of fieldsForParty(selectedParty)) {
      if (newErrors[f.field]) delete newErrors[f.field];
    }

    // Validate visible fields
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
        console.debug(err);
        newErrors[field.field] = `${field.label}: invalid value`;
      }
    }

    setErrors(newErrors);

    // Determine if all fields are valid for this party
    const partyFieldKeys = fieldsForParty(selectedParty).map((f) => f.field);
    const hasPartyErrors = partyFieldKeys.some((k) => !!newErrors[k]);
    setAllValid(!hasPartyErrors);

    if (!hasPartyErrors) {
      console.log("Validation passed for party:", selectedParty);
    } else {
      console.log("Validation failed for party:", selectedParty, newErrors);
    }

    return !hasPartyErrors;
  };

  /**
   * This submits the student form to the server
   * @returns
   */
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
      // TODO: Replace with your actual API call
      console.log("Submitting student form:", {
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

      // Success
      alert("Student form submitted successfully!");
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // UI helpers: fields per party
  const fieldsForParty = (party: string) => showableFields.filter((f) => f.party === party);

  const validateFieldOnBlur = (fieldKey: string) => {
    const field = fields.find((f) => f.field === fieldKey);
    if (!field) return;

    // Only validate fields for the current party
    if (field.party !== selectedParty || field.source !== "manual") return;

    // Get the value from the correct party
    const partyValues = values[field.party] ?? {};
    const value = partyValues[field.field];

    try {
      const coerced = field.coerce ? field.coerce(value) : value;
      const result = field.validator?.safeParse(coerced);

      console.log("Validating field on blur:", field.field, value, coerced, result);

      if (result?.error) {
        const errorString = z
          .treeifyError(result.error)
          .errors.map((e) => e.split(" ").slice(0).join(" "))
          .join("\n");
        setErrors((prev) => ({
          ...prev,
          [field.field]: `${field.label}: ${errorString}`,
        }));
      } else {
        setErrors((prev) => {
          const copy = { ...prev };
          delete copy[field.field];
          return copy;
        });
      }
    } catch (err) {
      console.debug("Validation error:", err);
      setErrors((prev) => ({
        ...prev,
        [field.field]: `${field.label}: invalid value`,
      }));
    }
  };

  const autofillValues = useMemo(() => {
    const autofillValues: Record<string, string> = {};
    if (!fields || fields.length === 0) return autofillValues;

    for (const field of fields) {
      if (!field.prefiller) continue;
      try {
        const s = field.prefiller({
          user: {
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
          },
        });
        autofillValues[field.field] = typeof s === "string" ? s.trim().replace(/\s{2,}/g, " ") : s;
      } catch (e) {
        console.debug("prefiller error for field", field.field, e);
      }
    }

    return autofillValues;
  }, [fields]);

  return (
    <div className="container mx-auto max-w-6xl px-4 pt-6 sm:px-10 sm:pt-16">
      <div className="mb-6 space-y-2 sm:mb-8">
        <div className="flex items-center gap-3">
          <HeaderIcon icon={Newspaper} />
          <HeaderText>Forms Preview</HeaderText>
        </div>
        <p className="text-sm text-gray-600 sm:text-base">
          Preview form templates used in the system. Switch parties to preview each party's portion
          of the form.
        </p>
      </div>

      <Card className="p-3 sm:p-4">
        {rows.length === 0 ? (
          <div className="text-muted-foreground text-sm">No forms available.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {rows.map((f) => (
              <Card key={f.name} className="flex-row items-center justify-between px-3">
                <div className="flex flex-col">
                  <div className="line-clamp-1 text-sm leading-tight font-medium">{f.name}</div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => onPreview(f.name)} className="h-8 px-3">
                    Preview
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[75vh] w-full overflow-auto sm:max-w-4xl">
          <DialogTitle>Preview: {previewName}</DialogTitle>
          <DialogDescription>
            {previewQuery.isLoading ? (
              <div className="text-sm">Loading…</div>
            ) : previewQuery.data ? (
              <div className="space-y-3">
                {/* Party tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {parties.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setSelectedParty(p);
                        setAllValid(false);
                      }}
                      className={`rounded-full border px-3 py-1 text-sm whitespace-nowrap transition ${
                        selectedParty === p
                          ? "bg-primary border-primary text-white"
                          : "bg-transparent"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* No schema */}
                {(previewQuery.data?.formMetadata?.schema ?? []).length === 0 ? (
                  <div className="text-sm">No preview available.</div>
                ) : (
                  <div className="space-y-4">
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
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm">No preview available.</div>
            )}
          </DialogDescription>

          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleValidate}>
              Test Validation
            </Button>
            {selectedParty === "student" && (
              <Button
                type="button"
                onClick={() => void handleSubmitStudent()}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Student Form"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
