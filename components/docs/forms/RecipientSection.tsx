import { FieldRenderer } from "@/components/docs/forms/FieldRenderer";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ClientField } from "@betterinternship/core/forms";
import { useState, useMemo } from "react";

type RecipientHandlingOption = "self" | "delegate-email" | "on-behalf";

export function RecipientSection({
  formKey,
  title,
  fields,
  values,
  onChange,
  onBlurValidate,
  errors,
}: {
  formKey: string;
  title: string;
  fields: ClientField<[]>[];
  values: Record<string, string>;
  onChange: (key: string, value: any) => void;
  onBlurValidate?: (fieldKey: string) => void;
  errors: Record<string, string>;
}) {
  if (!fields.length) return null;

  const fieldsByParty = useMemo(() => {
    const grouped: Record<string, ClientField<[]>[]> = {};
    fields.forEach((field) => {
      const party = field.party || "unknown";
      if (!grouped[party]) grouped[party] = [];
      grouped[party].push(field);
    });
    return grouped;
  }, [fields]);

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

  const partyKeys = Object.keys(reducedFieldsByParty);
  const [recipientHandling, setRecipientHandling] = useState<
    Record<string, RecipientHandlingOption>
  >(partyKeys.reduce((acc, party) => ({ ...acc, [party]: "self" }), {}));

  const handleRecipientOptionChange = (party: string, option: RecipientHandlingOption) => {
    setRecipientHandling((prev) => ({ ...prev, [party]: option }));
    if (option !== "delegate-email") {
      onChange(`${party}:delegate-email`, undefined);
    }
  };

  const renderOption = (
    party: string,
    option: RecipientHandlingOption,
    label: string,
    content?: React.ReactNode
  ) => {
    const isSelected = recipientHandling[party] === option;
    return (
      <div key={option} className="space-y-2">
        <div className="flex items-center gap-3 rounded-[0.33em] p-2 transition-all hover:bg-slate-100">
          <Checkbox
            id={`${formKey}-${party}-${option}`}
            checked={isSelected}
            onCheckedChange={() => handleRecipientOptionChange(party, option)}
            className="h-4 w-4"
          />
          <label
            htmlFor={`${formKey}-${party}-${option}`}
            className="flex-1 cursor-pointer text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        </div>
        {isSelected && content && (
          <div className="ml-7 rounded-lg border border-slate-200 bg-slate-50 p-3">{content}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3 border-t border-slate-300 pt-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      <div className="space-y-2">
        {partyKeys.map((party) => {
          const partyFields = reducedFieldsByParty[party];
          const currentHandling = recipientHandling[party];
          const delegateEmailField = partyFields.find((f) => f.field === `${party}:delegate-email`);
          const partyFormFields = partyFields.filter((f) => !f.field.includes(":delegate-email"));

          return (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold capitalize">{party.replace(/-/g, " ")}</h3>
              <Card key={party} className="space-y-2 rounded-[0.33em] border border-slate-300 p-2">
                <div className="space-y-1">
                  {renderOption(
                    party,
                    "self",
                    `I am the ${party.replace(/-/g, " ")}`,
                    <div className="space-y-3">
                      {partyFormFields.map((field) => (
                        <FieldRenderer
                          key={`${formKey}:${field.section}:${field.field}`}
                          field={field}
                          value={values[field.field]}
                          onChange={(v) => onChange(field.field, v)}
                          onBlur={() => onBlurValidate?.(field.field)}
                          error={errors[field.field]}
                          allValues={values}
                        />
                      ))}
                    </div>
                  )}

                  {renderOption(
                    party,
                    "delegate-email",
                    `Send to the ${party.replace(/-/g, " ")}`,
                    delegateEmailField ? (
                      <FieldRenderer
                        field={delegateEmailField}
                        value={values[delegateEmailField.field]}
                        onChange={(v) => onChange(delegateEmailField.field, v)}
                        onBlur={() => onBlurValidate?.(delegateEmailField.field)}
                        error={errors[delegateEmailField.field]}
                        allValues={values}
                      />
                    ) : null
                  )}

                  {renderOption(
                    party,
                    "on-behalf",
                    `Sign on behalf of the ${party.replace(/-/g, " ")}`,
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {partyFormFields.map((field) => (
                          <FieldRenderer
                            key={`${formKey}:${field.section}:${field.field}`}
                            field={field}
                            value={values[field.field]}
                            onChange={(v) => onChange(field.field, v)}
                            onBlur={() => onBlurValidate?.(field.field)}
                            error={errors[field.field]}
                            allValues={values}
                          />
                        ))}
                      </div>

                      <div className="flex items-start gap-3 rounded-[0.33em] border border-yellow-600 bg-yellow-50 p-3">
                        <Checkbox
                          id={`${formKey}-${party}-auth`}
                          checked={values[`${party}:on-behalf-auth`] === "true"}
                          onCheckedChange={(checked) =>
                            onChange(`${party}:on-behalf-auth`, checked ? "true" : "false")
                          }
                          className="h-4 w-4"
                        />
                        <label
                          htmlFor={`${formKey}-${party}-auth`}
                          className="cursor-pointer text-xs font-medium text-amber-700"
                        >
                          I have authorization to sign on behalf of the {party.replace(/-/g, " ")}
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
