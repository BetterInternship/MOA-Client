"use client";

import type { ValidatorConfig } from "@/lib/validator-engine";
import type { ValidatorBaseType } from "@/lib/validator-ir";
import {
  ValidatorDateInput,
  ValidatorFieldReferenceInput,
  ValidatorMessageInput,
  ValidatorNumberInput,
  ValidatorOptionsInput,
  ValidatorRow,
  ValidatorStaticRow,
  ValidatorTimeInput,
} from "@/components/docs/form-editor/validation/ValidatorControls";
import {
  getArrayOptions,
  getDateRelativeValidator,
  getEnumMessage,
  getEnumOptions,
  getToggleValidatorViewModel,
  setArrayOptions,
  setDateRelativeValidator,
  setEnumMessage,
  setEnumOptions,
  setToggleValidatorEnabled,
  setToggleValidatorMessage,
  setToggleValidatorValue,
} from "@/components/docs/form-editor/validation/validator-state";

export type ValidationFieldOption = {
  id: string;
  name: string;
  partyName?: string;
};

/**
 * Base-type scoped renderer for no-code validator controls.
 * All mutations flow through `validator-state` helpers so rule behavior is consistent
 * across all editor surfaces that use ValidationSection.
 */
export function ValidatorGroups({
  baseType,
  config,
  readOnly,
  fieldOptions,
  onConfigChange,
}: {
  baseType: ValidatorBaseType;
  config: ValidatorConfig;
  readOnly: boolean;
  fieldOptions: ValidationFieldOption[];
  onConfigChange: (next: ValidatorConfig) => void;
}) {
  const vm = getToggleValidatorViewModel(config);
  const relativeDate = getDateRelativeValidator(config);
  const relativeDateMessage = "message" in relativeDate ? relativeDate.message : undefined;
  const enumOptions = getEnumOptions(config);
  const enumMessage = getEnumMessage(config);
  const arrayOptions = getArrayOptions(config);

  // Thin wrappers keep JSX concise and enforce immutable updates in one place.
  const toggle = (id: Parameters<typeof setToggleValidatorEnabled>[1], enabled: boolean) =>
    onConfigChange(setToggleValidatorEnabled(config, id, enabled));
  const setValue = (id: Parameters<typeof setToggleValidatorValue>[1], value: string | number) =>
    onConfigChange(setToggleValidatorValue(config, id, value));
  const setMessage = (id: Parameters<typeof setToggleValidatorMessage>[1], message: string) =>
    onConfigChange(setToggleValidatorMessage(config, id, message));

  const renderRequiredRow = (label = "Required") => (
    <ValidatorRow
      label={label}
      enabled={vm.required.enabled}
      onToggle={(enabled) => toggle("required", enabled)}
      disabled={readOnly}
    />
  );

  if (baseType === "text") {
    return (
      <div>
        {renderRequiredRow()}

        <ValidatorRow
          label="Minimum characters"
          enabled={vm.minLength.enabled}
          onToggle={(enabled) => toggle("minLength", enabled)}
          disabled={readOnly}
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1">
              <ValidatorNumberInput
                value={vm.minLength.value as number | undefined}
                onChange={(next) => setValue("minLength", next)}
                placeholder="Minimum"
                disabled={readOnly}
              />
            </div>
            <ValidatorMessageInput
              value={vm.minLength.message}
              onChange={(next) => setMessage("minLength", next)}
              disabled={readOnly}
              expandBelow
            />
          </div>
        </ValidatorRow>

        <ValidatorRow
          label="Maximum characters"
          enabled={vm.maxLength.enabled}
          onToggle={(enabled) => toggle("maxLength", enabled)}
          disabled={readOnly}
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1">
              <ValidatorNumberInput
                value={vm.maxLength.value as number | undefined}
                onChange={(next) => setValue("maxLength", next)}
                placeholder="Maximum"
                disabled={readOnly}
              />
            </div>
            <ValidatorMessageInput
              value={vm.maxLength.message}
              onChange={(next) => setMessage("maxLength", next)}
              disabled={readOnly}
              expandBelow
            />
          </div>
        </ValidatorRow>

        <ValidatorRow
          label="Plain text only"
          enabled={vm.plainText.enabled}
          onToggle={(enabled) => toggle("plainText", enabled)}
          disabled={readOnly}
        />

      </div>
    );
  }

  if (baseType === "textarea") {
    return (
      <div className="space-y-2">
        {renderRequiredRow()}
        <ValidatorRow
          label="Minimum characters"
          enabled={vm.minLength.enabled}
          onToggle={(enabled) => toggle("minLength", enabled)}
          disabled={readOnly}
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1">
              <ValidatorNumberInput
                value={vm.minLength.value as number | undefined}
                onChange={(next) => setValue("minLength", next)}
                placeholder="Minimum"
                disabled={readOnly}
              />
            </div>
            <ValidatorMessageInput
              value={vm.minLength.message}
              onChange={(next) => setMessage("minLength", next)}
              disabled={readOnly}
              expandBelow
            />
          </div>
        </ValidatorRow>
        <ValidatorRow
          label="Maximum characters"
          enabled={vm.maxLength.enabled}
          onToggle={(enabled) => toggle("maxLength", enabled)}
          disabled={readOnly}
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1">
              <ValidatorNumberInput
                value={vm.maxLength.value as number | undefined}
                onChange={(next) => setValue("maxLength", next)}
                placeholder="Maximum"
                disabled={readOnly}
              />
            </div>
            <ValidatorMessageInput
              value={vm.maxLength.message}
              onChange={(next) => setMessage("maxLength", next)}
              disabled={readOnly}
              expandBelow
            />
          </div>
        </ValidatorRow>
        <ValidatorRow
          label="Plain text only"
          enabled={vm.plainText.enabled}
          onToggle={(enabled) => toggle("plainText", enabled)}
          disabled={readOnly}
        />
        <ValidatorRow
          label="Trim extra spaces"
          enabled={vm.trim.enabled}
          onToggle={(enabled) => toggle("trim", enabled)}
          disabled={readOnly}
        />
      </div>
    );
  }

  if (baseType === "number") {
    return (
      <div className="space-y-2">
        {renderRequiredRow()}
        <ValidatorRow
          label="Minimum value"
          enabled={vm.min.enabled}
          onToggle={(enabled) => toggle("min", enabled)}
          disabled={readOnly}
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1">
              <ValidatorNumberInput
                value={vm.min.value as number | undefined}
                onChange={(next) => setValue("min", next)}
                placeholder="Minimum value"
                disabled={readOnly}
              />
            </div>
            <ValidatorMessageInput
              value={vm.min.message}
              onChange={(next) => setMessage("min", next)}
              disabled={readOnly}
              expandBelow
            />
          </div>
        </ValidatorRow>
        <ValidatorRow
          label="Maximum value"
          enabled={vm.max.enabled}
          onToggle={(enabled) => toggle("max", enabled)}
          disabled={readOnly}
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1">
              <ValidatorNumberInput
                value={vm.max.value as number | undefined}
                onChange={(next) => setValue("max", next)}
                placeholder="Maximum value"
                disabled={readOnly}
              />
            </div>
            <ValidatorMessageInput
              value={vm.max.message}
              onChange={(next) => setMessage("max", next)}
              disabled={readOnly}
              expandBelow
            />
          </div>
        </ValidatorRow>
      </div>
    );
  }

  if (baseType === "date") {
    return (
      <div className="space-y-2">
        {renderRequiredRow()}
        <ValidatorRow
          label="On or after date"
          enabled={vm.minDate.enabled}
          onToggle={(enabled) => toggle("minDate", enabled)}
          disabled={readOnly}
        >
          <ValidatorDateInput
            value={vm.minDate.value as string | undefined}
            onChange={(next) => setValue("minDate", next)}
            disabled={readOnly}
          />
          <ValidatorMessageInput
            value={vm.minDate.message}
            onChange={(next) => setMessage("minDate", next)}
            disabled={readOnly}
          />
        </ValidatorRow>
        <ValidatorRow
          label="On or before date"
          enabled={vm.maxDate.enabled}
          onToggle={(enabled) => toggle("maxDate", enabled)}
          disabled={readOnly}
        >
          <ValidatorDateInput
            value={vm.maxDate.value as string | undefined}
            onChange={(next) => setValue("maxDate", next)}
            disabled={readOnly}
          />
          <ValidatorMessageInput
            value={vm.maxDate.message}
            onChange={(next) => setMessage("maxDate", next)}
            disabled={readOnly}
          />
        </ValidatorRow>
        <ValidatorRow
          label="On or after today"
          enabled={relativeDate.kind === "dateOnOrAfterToday"}
          onToggle={(enabled) =>
            onConfigChange(
              setDateRelativeValidator(
                config,
                enabled
                  ? { kind: "dateOnOrAfterToday", message: relativeDateMessage }
                  : { kind: "none" }
              )
            )
          }
          disabled={readOnly}
        >
          <ValidatorMessageInput
            value={relativeDate.kind === "dateOnOrAfterToday" ? relativeDate.message : ""}
            onChange={(next) =>
              onConfigChange(
                setDateRelativeValidator(config, {
                  kind: "dateOnOrAfterToday",
                  message: next,
                })
              )
            }
            disabled={readOnly}
          />
        </ValidatorRow>
        <ValidatorRow
          label="On or before today"
          enabled={relativeDate.kind === "dateOnOrBeforeToday"}
          onToggle={(enabled) =>
            onConfigChange(
              setDateRelativeValidator(
                config,
                enabled
                  ? { kind: "dateOnOrBeforeToday", message: relativeDateMessage }
                  : { kind: "none" }
              )
            )
          }
          disabled={readOnly}
        >
          <ValidatorMessageInput
            value={relativeDate.kind === "dateOnOrBeforeToday" ? relativeDate.message : ""}
            onChange={(next) =>
              onConfigChange(
                setDateRelativeValidator(config, {
                  kind: "dateOnOrBeforeToday",
                  message: next,
                })
              )
            }
            disabled={readOnly}
          />
        </ValidatorRow>
        <ValidatorRow
          label="On or after another field"
          enabled={relativeDate.kind === "dateOnOrAfterField"}
          onToggle={(enabled) =>
            onConfigChange(
              setDateRelativeValidator(
                config,
                enabled
                  ? {
                      kind: "dateOnOrAfterField",
                      field:
                        relativeDate.kind === "dateOnOrAfterField"
                          ? relativeDate.field
                          : (fieldOptions[0]?.id ?? ""),
                      message: relativeDateMessage,
                    }
                  : { kind: "none" }
              )
            )
          }
          disabled={readOnly}
        >
          <ValidatorFieldReferenceInput
            value={relativeDate.kind === "dateOnOrAfterField" ? relativeDate.field : ""}
            options={fieldOptions}
            onChange={(next) =>
              onConfigChange(
                setDateRelativeValidator(config, {
                  kind: "dateOnOrAfterField",
                  field: next,
                  message:
                    relativeDate.kind === "dateOnOrAfterField" ? relativeDate.message : undefined,
                })
              )
            }
            disabled={readOnly}
          />
          <ValidatorMessageInput
            value={relativeDate.kind === "dateOnOrAfterField" ? relativeDate.message : ""}
            onChange={(next) =>
              onConfigChange(
                setDateRelativeValidator(config, {
                  kind: "dateOnOrAfterField",
                  field: relativeDate.kind === "dateOnOrAfterField" ? relativeDate.field : "",
                  message: next,
                })
              )
            }
            disabled={readOnly}
          />
        </ValidatorRow>
        <ValidatorRow
          label="On or before another field"
          enabled={relativeDate.kind === "dateOnOrBeforeField"}
          onToggle={(enabled) =>
            onConfigChange(
              setDateRelativeValidator(
                config,
                enabled
                  ? {
                      kind: "dateOnOrBeforeField",
                      field:
                        relativeDate.kind === "dateOnOrBeforeField"
                          ? relativeDate.field
                          : (fieldOptions[0]?.id ?? ""),
                      message: relativeDateMessage,
                    }
                  : { kind: "none" }
              )
            )
          }
          disabled={readOnly}
        >
          <ValidatorFieldReferenceInput
            value={relativeDate.kind === "dateOnOrBeforeField" ? relativeDate.field : ""}
            options={fieldOptions}
            onChange={(next) =>
              onConfigChange(
                setDateRelativeValidator(config, {
                  kind: "dateOnOrBeforeField",
                  field: next,
                  message:
                    relativeDate.kind === "dateOnOrBeforeField" ? relativeDate.message : undefined,
                })
              )
            }
            disabled={readOnly}
          />
          <ValidatorMessageInput
            value={relativeDate.kind === "dateOnOrBeforeField" ? relativeDate.message : ""}
            onChange={(next) =>
              onConfigChange(
                setDateRelativeValidator(config, {
                  kind: "dateOnOrBeforeField",
                  field: relativeDate.kind === "dateOnOrBeforeField" ? relativeDate.field : "",
                  message: next,
                })
              )
            }
            disabled={readOnly}
          />
        </ValidatorRow>
      </div>
    );
  }

  if (baseType === "time") {
    return (
      <div className="space-y-2">
        {renderRequiredRow()}
        <ValidatorRow
          label="At or after time"
          enabled={vm.minTime.enabled}
          onToggle={(enabled) => toggle("minTime", enabled)}
          disabled={readOnly}
        >
          <ValidatorTimeInput
            value={vm.minTime.value as string | undefined}
            onChange={(next) => setValue("minTime", next)}
            disabled={readOnly}
          />
          <ValidatorMessageInput
            value={vm.minTime.message}
            onChange={(next) => setMessage("minTime", next)}
            disabled={readOnly}
          />
        </ValidatorRow>
        <ValidatorRow
          label="At or before time"
          enabled={vm.maxTime.enabled}
          onToggle={(enabled) => toggle("maxTime", enabled)}
          disabled={readOnly}
        >
          <ValidatorTimeInput
            value={vm.maxTime.value as string | undefined}
            onChange={(next) => setValue("maxTime", next)}
            disabled={readOnly}
          />
          <ValidatorMessageInput
            value={vm.maxTime.message}
            onChange={(next) => setMessage("maxTime", next)}
            disabled={readOnly}
          />
        </ValidatorRow>
      </div>
    );
  }

  if (baseType === "enum") {
    return (
      <div className="space-y-2">
        {renderRequiredRow()}
        <ValidatorStaticRow label="Dropdown options">
          <ValidatorOptionsInput
            values={enumOptions}
            onChange={(next) => onConfigChange(setEnumOptions(config, next))}
            disabled={readOnly}
          />
          <ValidatorMessageInput
            value={enumMessage}
            onChange={(next) => onConfigChange(setEnumMessage(config, next))}
            disabled={readOnly}
          />
        </ValidatorStaticRow>
      </div>
    );
  }

  if (baseType === "array") {
    return (
      <div className="space-y-2">
        {renderRequiredRow()}
        <ValidatorStaticRow label="Multi-select options">
          <ValidatorOptionsInput
            values={arrayOptions}
            onChange={(next) => onConfigChange(setArrayOptions(config, next))}
            disabled={readOnly}
          />
        </ValidatorStaticRow>
        <ValidatorRow
          label="Minimum selected items"
          enabled={vm.minItems.enabled}
          onToggle={(enabled) => toggle("minItems", enabled)}
          disabled={readOnly}
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1">
              <ValidatorNumberInput
                value={vm.minItems.value as number | undefined}
                onChange={(next) => setValue("minItems", next)}
                placeholder="Minimum items"
                disabled={readOnly}
              />
            </div>
            <ValidatorMessageInput
              value={vm.minItems.message}
              onChange={(next) => setMessage("minItems", next)}
              disabled={readOnly}
              expandBelow
            />
          </div>
        </ValidatorRow>
        <ValidatorRow
          label="Maximum selected items"
          enabled={vm.maxItems.enabled}
          onToggle={(enabled) => toggle("maxItems", enabled)}
          disabled={readOnly}
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1">
              <ValidatorNumberInput
                value={vm.maxItems.value as number | undefined}
                onChange={(next) => setValue("maxItems", next)}
                placeholder="Maximum items"
                disabled={readOnly}
              />
            </div>
            <ValidatorMessageInput
              value={vm.maxItems.message}
              onChange={(next) => setMessage("maxItems", next)}
              disabled={readOnly}
              expandBelow
            />
          </div>
        </ValidatorRow>
      </div>
    );
  }

  return <div className="space-y-2">{renderRequiredRow("This field is required")}</div>;
}
