import { FieldRenderer } from "@/components/docs/forms/FieldRenderer";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ClientField } from "@betterinternship/core/forms";
import { useState, useMemo } from "react";

type RecipientHandlingOption = "self" | "delegate-email" | "on-behalf";

type PickOption<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
};

function SinglePickerBig<T extends string = string>({
  label = "Select one",
  options,
  value,
  onChange,
  className,
}: {
  label?: React.ReactNode;
  options: PickOption<T>[];
  value: T | null;
  onChange: (v: T | null) => void;
  className?: string;
}) {
  const handlePick = (v: T) => {
    onChange(v);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <div className="text-xs text-gray-600">{label}</div>}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handlePick(opt.value)}
              className={cn(
                "relative min-h-[72px] rounded-[0.33em] border px-3 py-2.5 text-left transition-all",
                "ring-primary/50 focus-visible:ring-2 focus-visible:outline-none",
                "hover:border-primary/50 hover:bg-border/10 hover:shadow-sm",
                active ? "border-primary bg-primary/10 shadow-sm" : "border-border bg-card"
              )}
            >
              <div className="flex h-full flex-col items-center justify-center space-y-1 text-center">
                <div className="text-primary text-base leading-tight font-semibold">
                  {opt.label}
                </div>
                {opt.description && (
                  <div className="text-muted-foreground mt-0.5 text-xs">{opt.description}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RecipientSection({
  formKey,
  title,
  fields,
  values,
  onChange,
  onBlurValidate,
  errors,
  onClearErrors,
  onHandlingChange,
}: {
  formKey: string;
  title: string;
  fields: ClientField<[]>[];
  values: Record<string, string>;
  onChange: (key: string, value: any) => void;
  onBlurValidate?: (fieldKey: string) => void;
  errors: Record<string, string>;
  onClearErrors?: (keys: string[]) => void;
  onHandlingChange?: (handling: Record<string, RecipientHandlingOption>) => void;
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

  const partyKeys = Object.keys(reducedFieldsByParty).sort((a, b) => {
    // Always place company representative first, then others
    if (a === "entity-representative") return -1;
    if (b === "entity-representative") return 1;
    return a.localeCompare(b);
  });
  const [recipientHandling, setRecipientHandling] = useState<
    Record<string, RecipientHandlingOption>
  >(partyKeys.reduce((acc, party) => ({ ...acc, [party]: "self" }), {}));

  const handleRecipientOptionChange = (party: string, option: RecipientHandlingOption) => {
    const previousOption = recipientHandling[party];
    setRecipientHandling((prev) => ({ ...prev, [party]: option }));

    const partyFields = reducedFieldsByParty[party] || [];
    const fieldsToClean: string[] = [];

    // Clear delegate-email when switching away from delegate-email option
    if (option !== "delegate-email" && previousOption === "delegate-email") {
      const delegateField = `${party}:delegate-email`;
      fieldsToClean.push(delegateField);
      onChange(delegateField, undefined);
    }

    // Clear all party form fields when switching to delegate-email
    if (option === "delegate-email" && previousOption !== "delegate-email") {
      partyFields.forEach((field) => {
        if (!field.field.includes(":delegate-email")) {
          fieldsToClean.push(field.field);
          onChange(field.field, undefined);
        }
      });
    }

    // Clear errors for fields that are no longer visible
    if (fieldsToClean.length > 0 && onClearErrors) {
      onClearErrors(fieldsToClean);
    }

    // Notify parent of handling change
    if (onHandlingChange) {
      onHandlingChange({ ...recipientHandling, [party]: option });
    }
  };
  const formatPartyLabel = (party: string) =>
    party
      .replace(/entity/gi, "Company/Internship")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <div className="space-y-3 border-t border-slate-300 pt-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      <div className="space-y-4">
        {partyKeys.map((party) => {
          const partyFields = reducedFieldsByParty[party];
          const delegateEmailField = partyFields.find((f) => f.field === `${party}:delegate-email`);
          const partyFormFields = partyFields.filter((f) => !f.field.includes(":delegate-email"));

          const options: PickOption<RecipientHandlingOption>[] = [
            {
              value: "delegate-email",
              label: `Request Signature`,
            },
            {
              value: "self",
              label: `Self Sign`,
            },
            {
              value: "on-behalf",
              label: `Sign on Behalf`,
            },
          ];

          const selected = recipientHandling[party] ?? null;

          return (
            <Card key={party} className="rounded-[0.33em] border border-slate-300 p-3">
              <div className="text-sm font-semibold capitalize">{formatPartyLabel(party)}</div>

              <SinglePickerBig
                label={null}
                options={options}
                value={selected}
                onChange={(v) => v && handleRecipientOptionChange(party, v)}
              />

              <div className="space-y-3">
                {selected === "delegate-email" && delegateEmailField ? (
                  <div className="rounded-[0.33em] border border-slate-200 bg-slate-50 p-3">
                    <FieldRenderer
                      field={delegateEmailField}
                      value={values[delegateEmailField.field]}
                      onChange={(v) => onChange(delegateEmailField.field, v)}
                      onBlur={() => onBlurValidate?.(delegateEmailField.field)}
                      error={errors[delegateEmailField.field]}
                      allValues={values}
                    />
                  </div>
                ) : null}

                {selected === "self" && (
                  <div className="space-y-3 rounded-[0.33em] border border-slate-200 bg-slate-50 p-3">
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

                {selected === "on-behalf" && (
                  <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
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
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
