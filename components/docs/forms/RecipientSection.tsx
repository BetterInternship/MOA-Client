import { FieldRenderer } from "@/components/docs/forms/FieldRenderer";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ClientField } from "@betterinternship/core/forms";
import { useState, useMemo } from "react";

type RecipientHandlingOption = "self" | "delegate-email" | "on-behalf";

export function RecipientSection({
  formKey,
  title,
  subtitle,
  fields,
  values,
  onChange,
  onBlurValidate,
  errors,
}: {
  formKey: string;
  title: string;
  subtitle?: string;
  fields: ClientField<[]>[];
  values: Record<string, string>;
  onChange: (key: string, value: any) => void;
  onBlurValidate?: (fieldKey: string) => void;
  errors: Record<string, string>;
}) {
  if (!fields.length) return null;

  // Group fields by party type
  const fieldsByParty = useMemo(() => {
    const grouped: Record<string, ClientField<[]>[]> = {};
    fields.forEach((field) => {
      const party = field.party || "unknown";
      if (!grouped[party]) grouped[party] = [];
      grouped[party].push(field);
    });
    return grouped;
  }, [fields]);

  // Remove duplicates per party
  const reducedFieldsByParty = useMemo(() => {
    const reduced: Record<string, ClientField<[]>[]> = {};
    Object.entries(fieldsByParty).forEach(([party, partyFields]) => {
      reduced[party] = partyFields.reduce(
        (acc, cur) => (acc.map((f) => f.field).includes(cur.field) ? acc : [...acc, cur]),
        [] as ClientField<[]>[]
      );
    });
    return reduced;
  }, [fieldsByParty]);

  // Track handling options per party
  const partyKeys = Object.keys(reducedFieldsByParty);
  const [recipientHandling, setRecipientHandling] = useState<
    Record<string, RecipientHandlingOption>
  >(partyKeys.reduce((acc, party) => ({ ...acc, [party]: "self" }), {}));

  const handleRecipientOptionChange = (party: string, option: RecipientHandlingOption) => {
    setRecipientHandling((prev) => ({ ...prev, [party]: option }));

    // Reset email if switching away from delegate mode
    if (option !== "delegate-email") {
      onChange(`${party}:delegate-email`, undefined);
    }
  };

  return (
    <Card className="space-y-4 rounded-lg border border-amber-600 bg-amber-50/50 p-4">
      {/* Header */}
      <div className="border-b border-amber-600 pb-3">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900">{title}</h3>
            {subtitle && <p className="mt-1 text-xs text-amber-800">{subtitle}</p>}
          </div>
        </div>
      </div>

      {/* Recipient sections per party */}
      <div className="space-y-6">
        {partyKeys.map((party) => {
          const partyFields = reducedFieldsByParty[party];
          const currentHandling = recipientHandling[party];
          const delegateEmailField = partyFields.find((f) => f.field === `${party}:delegate-email`);
          const partyFormFields = partyFields.filter((f) => !f.field.includes(":delegate-email"));

          return (
            <div key={party} className="border-t border-amber-100 pt-4 first:border-t-0 first:pt-0">
              {/* Party Title */}
              <h4 className="mb-3 text-sm font-semibold text-amber-900 capitalize">
                {party.replace(/-/g, " ")}
              </h4>

              {/* Question: Who will handle the signing? */}
              <div className="mb-4 space-y-3">
                {/* Option 1: I am the recipient */}
                <div className="flex items-start gap-3 rounded-md p-3 transition-colors hover:bg-amber-100/30">
                  <Checkbox
                    id={`${formKey}-${party}-self`}
                    checked={currentHandling === "self"}
                    onCheckedChange={() => handleRecipientOptionChange(party, "self")}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={`${formKey}-${party}-self`}
                    className="flex-1 cursor-pointer text-sm font-medium text-amber-900"
                  >
                    I am the {party.replace(/-/g, " ")}
                  </label>
                </div>

                {/* Option 2: Send to their email */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3 rounded-md p-3 transition-colors hover:bg-amber-100/30">
                    <Checkbox
                      id={`${formKey}-${party}-delegate`}
                      checked={currentHandling === "delegate-email"}
                      onCheckedChange={() => handleRecipientOptionChange(party, "delegate-email")}
                      className="mt-0.5"
                    />
                    <label
                      htmlFor={`${formKey}-${party}-delegate`}
                      className="flex-1 cursor-pointer text-sm font-medium text-amber-900"
                    >
                      Send this to the {party.replace(/-/g, " ")}
                    </label>
                  </div>

                  {/* Email field for delegate option */}
                  {currentHandling === "delegate-email" && delegateEmailField && (
                    <div className="ml-7 rounded-md border border-amber-200 bg-white p-3">
                      <FieldRenderer
                        field={delegateEmailField}
                        value={values[delegateEmailField.field]}
                        onChange={(v) => onChange(delegateEmailField.field, v)}
                        onBlur={() => onBlurValidate?.(delegateEmailField.field)}
                        error={errors[delegateEmailField.field]}
                        allValues={values}
                      />
                    </div>
                  )}
                </div>

                {/* Option 3: Sign on behalf */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3 rounded-md p-3 transition-colors hover:bg-amber-100/30">
                    <Checkbox
                      id={`${formKey}-${party}-behalf`}
                      checked={currentHandling === "on-behalf"}
                      onCheckedChange={() => handleRecipientOptionChange(party, "on-behalf")}
                      className="mt-0.5"
                    />
                    <label
                      htmlFor={`${formKey}-${party}-behalf`}
                      className="flex-1 cursor-pointer text-sm font-medium text-amber-900"
                    >
                      I will sign on behalf of the {party.replace(/-/g, " ")}
                    </label>
                  </div>

                  {/* Show recipient fields + authorization checkbox when signing on behalf */}
                  {currentHandling === "on-behalf" && (
                    <div className="ml-7 space-y-3 rounded-md border border-amber-200 bg-white p-3">
                      {/* Recipient's form fields */}
                      <div className="space-y-3 border-b border-amber-100 pb-3">
                        {partyFormFields.map((field) => (
                          <div key={`${formKey}:${field.section}:${field.field}`}>
                            <FieldRenderer
                              field={field}
                              value={values[field.field]}
                              onChange={(v) => onChange(field.field, v)}
                              onBlur={() => onBlurValidate?.(field.field)}
                              error={errors[field.field]}
                              allValues={values}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Authorization confirmation checkbox */}
                      <div className="flex items-start gap-3 rounded bg-blue-50 p-2">
                        <Checkbox
                          id={`${formKey}-${party}-auth`}
                          checked={values[`${party}:on-behalf-auth`] === "true"}
                          onCheckedChange={(checked) =>
                            onChange(`${party}:on-behalf-auth`, checked ? "true" : "false")
                          }
                          className="mt-1"
                        />
                        <label
                          htmlFor={`${formKey}-${party}-auth`}
                          className="cursor-pointer text-xs text-blue-900"
                        >
                          I have obtained authorization to sign on behalf of the{" "}
                          {party.replace(/-/g, " ")}
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Show recipient fields when signing as self (default case) */}
              {currentHandling === "self" && (
                <div className="space-y-3 rounded-md border border-amber-200 bg-white p-3">
                  {partyFormFields.map((field) => (
                    <div key={`${formKey}:${field.section}:${field.field}`}>
                      <FieldRenderer
                        field={field}
                        value={values[field.field]}
                        onChange={(v) => onChange(field.field, v)}
                        onBlur={() => onBlurValidate?.(field.field)}
                        error={errors[field.field]}
                        allValues={values}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
