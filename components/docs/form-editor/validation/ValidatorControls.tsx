"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormInput, FormTextarea, TimeInputNative } from "@/components/docs/forms/EditForm";
import { Switch } from "@/components/ui/switch";

export function ValidatorRow({
  label,
  description,
  enabled,
  onToggle,
  disabled = false,
  children,
}: {
  label: string;
  description?: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[0.33em] border border-slate-200 bg-white p-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-xs font-medium text-slate-800">{label}</p>
          {description ? <p className="text-[11px] text-slate-500">{description}</p> : null}
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} disabled={disabled} />
      </div>
      {enabled && children ? <div className="mt-2 space-y-2">{children}</div> : null}
    </div>
  );
}

export function ValidatorStaticRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[0.33em] border border-slate-200 bg-white p-2">
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-slate-800">{label}</p>
        {description ? <p className="text-[11px] text-slate-500">{description}</p> : null}
      </div>
      {children ? <div className="mt-2 space-y-2">{children}</div> : null}
    </div>
  );
}

export function ValidatorNumberInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value?: number;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <FormInput
      type="number"
      value={value ?? ""}
      setter={onChange}
      placeholder={placeholder}
      required={false}
      disabled={disabled}
      className="h-8 text-xs"
    />
  );
}

export function ValidatorTextInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value?: string;
  onChange: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <FormInput
      value={value || ""}
      setter={onChange}
      placeholder={placeholder}
      required={false}
      disabled={disabled}
      className="h-8 text-xs"
    />
  );
}

export function ValidatorDateInput({
  value,
  onChange,
  disabled,
}: {
  value?: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  return (
    <FormInput
      type="date"
      value={value || ""}
      setter={onChange}
      required={false}
      disabled={disabled}
      className="h-8 text-xs"
    />
  );
}

export function ValidatorTimeInput({
  value,
  onChange,
  disabled,
}: {
  value?: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  return (
    <TimeInputNative
      label=""
      value={value}
      onChange={(next) => onChange(next || "")}
      required={false}
      disabled={disabled}
      className="[&>input]:h-8 [&>input]:text-xs"
    />
  );
}

export function ValidatorOptionsInput({
  values,
  onChange,
  disabled,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <FormTextarea
      value={values.join("\n")}
      setter={(value) => {
        const next = value
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean);
        onChange(next);
      }}
      required={false}
      disabled={disabled}
      placeholder="One option per line"
      className="min-h-20 text-xs"
    />
  );
}

export function ValidatorFieldReferenceInput({
  value,
  options,
  onChange,
  disabled,
}: {
  value?: string;
  options: Array<{ id: string; name: string; partyName?: string }>;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  if (!options.length) {
    return (
      <FormInput
        value={value || ""}
        setter={onChange}
        required={false}
        disabled={disabled}
        placeholder="Enter field name"
        className="h-8 text-xs"
      />
    );
  }

  return (
    <Select value={value || "__none"} onValueChange={(next) => onChange(next === "__none" ? "" : next)}>
      <SelectTrigger className="h-8 text-xs" disabled={disabled}>
        <SelectValue placeholder="Select field" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none">Select field</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.partyName ? `${option.name} (${option.partyName})` : option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ValidatorMessageInput({
  value,
  onChange,
  disabled,
}: {
  value?: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(value));
  return (
    <div className="space-y-1">
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
        >
          Customize message
        </button>
      )}
      {open && (
        <div className="space-y-1">
          <FormInput
            value={value || ""}
            setter={onChange}
            required={false}
            disabled={disabled}
            placeholder="Custom error message"
            className="h-8 text-xs"
          />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              if (value) onChange("");
            }}
            disabled={disabled}
            className="text-[11px] text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            Hide message
          </button>
        </div>
      )}
    </div>
  );
}
