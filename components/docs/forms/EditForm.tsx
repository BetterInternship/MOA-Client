import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IFormData, IFormErrors, useFormData, useFormErrors } from "@/lib/form-data";
import { cn } from "@/lib/utils";
import { Checkbox } from "@radix-ui/react-checkbox";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import { createContext, useContext, useRef } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { GroupableRadioDropdown } from "./dropdown";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Matcher } from "react-day-picker";

interface EditFormContext<T extends IFormData> {
  formData: T;
  formErrors: IFormErrors<T>;
  setField: (k: keyof T, v: any) => void;
  fieldSetter: (k: keyof T) => (v: any) => void;
  addValidator: (k: keyof T, c: (v: any) => string | false) => void;
  validateFormData: () => boolean;
  cleanFormData: () => T;
}

/**
 * Creates an edit form context and provider.
 *
 * @returns
 */
export const createEditForm = <T extends IFormData>(): [
  React.ComponentType<{
    data: Partial<T>;
    children: React.ReactNode;
  }>,
  () => EditFormContext<T>,
] => {
  // Provides us with funcs to manipulate form
  const EditFormContext = createContext<EditFormContext<T>>({} as EditFormContext<T>);

  // The use hook
  const useEditForm = () => useContext(EditFormContext);

  // Create the component
  const EditForm = ({ data, children }: { data: Partial<T>; children: React.ReactNode }) => {
    const { formData, setField } = useFormData<T>(data);
    const { formErrors, setError, setErrors } = useFormErrors<T>();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    const validators = useRef<Function[]>([]);
    const errs = useRef<IFormErrors<T>>({} as IFormErrors<T>);

    // Validates a field; callback returns false when nothing is wrong.
    const addValidator = (field: keyof T, hasError: (value: any) => string | false) => {
      validators.current.push((data: T) => {
        const error = hasError(data[field]);
        if (typeof error === "boolean") {
          errs.current[field] = null;
          return false; // NO ERROR OCCURED
        } else errs.current[field] = error;
        return true; // AN ERROR OCCURED
      });
    };

    // Validates all fields with validators
    // Run map first to execute all validations
    // Returns true if good to go!
    const validateFormData = () => {
      errs.current = {} as IFormErrors<T>;
      const result = !validators.current
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        .map((validator) => validator(formData))
        .some((r) => r);
      setErrors(errs.current);
      return result;
    };

    // Cleans the data and providses undefined defaults
    const cleanFormData = () => {
      const result: { [k in keyof T]: any } = {} as T;
      for (const field in formData) {
        result[field] = formData[field] ?? undefined;
        if (typeof result[field] === "string") result[field] = result[field].trim();
      }
      return result;
    };

    return (
      <EditFormContext.Provider
        value={{
          formData,
          formErrors,
          setField: (k, v) => (setError(k, null), setField(k, v)),
          fieldSetter: (k) => (v) => (setError(k, null), setField(k, v)),
          addValidator,
          validateFormData,
          cleanFormData,
        }}
      >
        {children}
      </EditFormContext.Provider>
    );
  };

  return [EditForm, useEditForm];
};

/**
 * A utility to create form input fields easily.
 *
 * @component
 */
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  setter?: (value: string) => void;
  required?: boolean;
  className?: string;
}

export const FormInput = ({
  label,
  value,
  setter,
  required = true,
  className,
  ...props
}: FormInputProps) => {
  return (
    <div>
      {label && (
        <label className="mb-1 flex flex-row items-center gap-2 text-xs text-gray-600">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <Input
        value={value ?? ""}
        onChange={(e) => setter && setter(e.target.value)}
        className={className}
        {...props}
      />
    </div>
  );
};

/**
 * Big input
 */
interface FormTextareaProps extends React.InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  setter?: (value: string) => void;
  required?: boolean;
  className?: string;
}

export const FormTextarea = ({
  label,
  value,
  setter,
  required = true,
  className,
  ...props
}: FormTextareaProps) => {
  return (
    <div>
      {label && (
        <label className="mb-1 flex flex-row items-center gap-2 text-xs text-gray-600">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <Textarea
        value={value ?? ""}
        onChange={(e) => setter && setter(e.target.value)}
        className={cn(className, "rounded-[0.33em] outline-none focus-visible:ring-0")}
        {...props}
      />
    </div>
  );
};

/**
 * A utility to create form dropdown fields easily.
 *
 * @component
 */
interface FormDropdownProps extends React.InputHTMLAttributes<HTMLInputElement> {
  options: { id: number | string; name: string }[];
  label?: string;
  value?: string | number | string[];
  required?: boolean;
  setter?: (value: string | number) => void;
  className?: string;
}

export const FormDropdown = ({
  label,
  value,
  options,
  setter,
  required = true,
  className,
  ...props
}: FormDropdownProps) => {
  return (
    <div>
      {label && (
        <label className="mb-1 block text-xs text-gray-600">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <GroupableRadioDropdown
        name={label ?? ""}
        defaultValue={value}
        options={options}
        onChange={(id) => setter && setter(id)}
      />
    </div>
  );
};

/**
 * A utility to create form dropdown fields easily.
 *
 * @component
 */
interface FormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  label?: string;
  setter?: (value: boolean) => void;
  className?: string;
  sentence?: React.ReactNode;
  required?: boolean;
}

export const FormCheckbox = ({
  label,
  checked,
  setter,
  className,
  sentence,
  required,
  ...props
}: FormCheckboxProps) => {
  return (
    <div>
      {label && (
        <label className="mb-1 block text-xs text-gray-600">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="flex gap-2 sm:items-center">
        <Checkbox
          name={label ?? ""}
          checked={checked}
          className={cn(
            "inline-flex aspect-square h-6 w-6 items-center justify-center rounded-[0.33em] border sm:h-5 sm:w-5",
            checked ? "border-primary border-opacity-85 bg-blue-200" : "border-gray-300 bg-gray-50"
          )}
          onCheckedChange={(checked) => setter && setter(!!checked)}
        >
          {checked && <Check className="text-primary h-4 w-4 opacity-75" />}
        </Checkbox>
        {sentence && (
          <div
            className="cursor-pointer text-xs text-gray-500 select-none"
            onClick={() => setter?.(!checked)}
            role="button"
          >
            {sentence}
          </div>
        )}
      </div>
    </div>
  );
};

interface FormCheckBoxGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
  options: { value: string | number; label: string; description?: string }[];
  values: (string | number)[];
  setter: (value: any) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

export const FormCheckBoxGroup = ({
  options,
  values,
  setter,
  label,
  required = false,
  className,
  ...props
}: FormCheckBoxGroupProps) => {
  const handleValueChange = (optionValue: string | number) => {
    if (values.includes(optionValue)) {
      setter(values.filter((v) => v !== optionValue));
    } else {
      setter([...values, optionValue]);
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="mb-1 block text-lg font-medium tracking-tight text-gray-700">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {options.map((option) => {
          const isChecked = values.includes(option.value);

          return (
            <div
              key={option.value}
              onClick={() => handleValueChange(option.value)}
              className={`flex h-fit cursor-pointer items-start gap-4 rounded-[0.33em] border p-3 transition-colors ${isChecked ? "border-primary border-opacity-85" : "border-gray-200 hover:border-gray-300"}`}
            >
              <FormCheckbox checked={isChecked ?? false} />
              <div className="grid grid-rows-1 md:grid-rows-2">
                <Label className="text-xs font-medium text-gray-900">{option.label}</Label>
                {option.description && (
                  <p className="text-xs text-gray-500">{option.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface FormRadioProps<T extends string | boolean = string> {
  options: { value: T; label: string }[];
  value?: T;
  setter?: (value: T) => void;
  label?: string;
  required?: boolean;
  className?: string;
  name?: string;
}

export const FormRadio = <T extends string | boolean = string>({
  label,
  value,
  options,
  setter,
  required = false,
  className,
  name,
}: FormRadioProps<T>) => {
  const stringValue = value?.toString() || "";

  const handleValueChange = (stringValue: string) => {
    if (!setter) return;

    // Find the original option to get the correct type
    const selectedOption = options.find((option) => option.value.toString() === stringValue);
    if (selectedOption) {
      setter(selectedOption.value);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <label className="mb-1 block text-xs text-gray-600">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <RadioGroup.Root
        value={stringValue}
        onValueChange={handleValueChange}
        className="space-y-2"
        name={name}
      >
        {options.map((option) => (
          <div key={option.value.toString()} className="flex items-center space-x-3">
            <RadioGroup.Item
              value={option.value.toString()}
              id={`${name}-${option.value.toString()}`}
              className={cn(
                "h-4 w-4 rounded-full border-2 border-gray-300",
                "focus:ring-primary/50 focus:ring-2 focus:outline-none",
                "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
                "transition-colors duration-200"
              )}
            >
              <RadioGroup.Indicator className="relative flex h-full w-full items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-white" />
              </RadioGroup.Indicator>
            </RadioGroup.Item>

            <label
              htmlFor={`${name}-${option.value.toString()}`}
              className="flex-1 cursor-pointer text-sm font-medium"
            >
              {option.label}
            </label>
          </div>
        ))}
      </RadioGroup.Root>
    </div>
  );
};

/**
 * Datepicker.
 *
 * @component
 */
/**
 * Datepicker (shadcn).
 *
 * Accepts/returns a number timestamp (ms) via `date` / `setter`.
 */
interface FormDatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  date?: number;
  setter?: (value?: number) => void;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  contentClassName?: string;
  captionLayout?: "buttons" | "dropdown";
  required?: boolean;

  /** Optional: disable dates (react-day-picker style) */
  disabledDays?: Date | { before?: Date; after?: Date; from?: Date; to?: Date } | Date[];

  /** Close popover automatically on select (default true) */
  autoClose?: boolean;

  /** Placeholder text when no date selected */
  placeholder?: string;

  /** Format the button text */
  format?: (d: Date) => string;
}

export const FormDatePicker = ({
  label,
  date,
  setter,
  className,
  side = "bottom",
  align = "start",
  sideOffset = 6,
  contentClassName,
  captionLayout = "dropdown",
  disabledDays,
  autoClose = true,
  placeholder = "Select date",
  format = (d) => d.toLocaleDateString(),
  required = false,
  ...props
}: FormDatePickerProps) => {
  const [open, setOpen] = React.useState(false);
  const selected = date != null && date > 86400000 ? new Date(date) : undefined;

  return (
    <div className={cn("flex flex-col", className)}>
      {label && (
        <label htmlFor={props.id ?? "date"} className="mb-1 block text-xs text-gray-600">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" id={props.id ?? "date"} className="justify-between font-normal">
            {selected ? format(selected) : placeholder}
            <CalendarDays className="h-4 w-4 opacity-70" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align={align}
          side={side}
          sideOffset={sideOffset}
          className={cn("w-auto overflow-hidden p-0", contentClassName)}
        >
          <Calendar
            mode="single"
            selected={selected}
            captionLayout={captionLayout}
            disabled={disabledDays as Matcher[]}
            onSelect={(d) => {
              setter?.(d ? d.getTime() : undefined);
              if (autoClose) setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

/**
 * Month picker.
 *
 * @component
 */
/**
 * Datepicker (shadcn).
 *
 * Accepts/returns a number timestamp (ms) via `date` / `setter`.
 */
interface FormMonthPickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** ms since epoch; will be normalized to the first day of the month */
  date?: number;
  /** setter receives ms since epoch (first day of month at local midnight) or undefined when cleared */
  setter?: (value?: number) => void;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  contentClassName?: string;

  /** Placeholder text when no month selected */
  placeholder?: string;

  /** Format the button text */
  format?: (d: Date) => string;

  /** Year bounds for navigation (inclusive) */
  fromYear?: number;
  toYear?: number;

  /** Close popover automatically on select (default true) */
  autoClose?: boolean;
}

export const FormMonthPicker = ({
  label,
  date,
  setter,
  className,
  side = "bottom",
  align = "start",
  sideOffset = 6,
  contentClassName,
  placeholder = "Select month",
  format = (d) => d.toLocaleDateString(undefined, { month: "short", year: "numeric" }),
  fromYear = new Date().getFullYear() - 5,
  toYear = new Date().getFullYear() + 5,
  autoClose = true,
  ...props
}: FormMonthPickerProps) => {
  const [open, setOpen] = React.useState(false);

  // normalize incoming ms -> first day of month
  const selected = React.useMemo(() => {
    if (date == null) return undefined;
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  }, [date]);

  const [viewYear, setViewYear] = React.useState<number>(
    selected?.getFullYear() ?? new Date().getFullYear()
  );

  React.useEffect(() => {
    if (selected) setViewYear(selected.getFullYear());
  }, [selected]);

  const months = React.useMemo(
    () =>
      Array.from({ length: 12 }, (_, m) => ({
        m,
        label: new Date(2000, m, 1).toLocaleString(undefined, {
          month: "short",
        }),
      })),
    []
  );

  const clampYear = (y: number) => Math.min(Math.max(y, fromYear), toYear);

  const selectMonth = (monthIndex: number) => {
    const y = clampYear(viewYear);
    const firstOfMonth = new Date(y, monthIndex, 1, 0, 0, 0, 0).getTime();
    setter?.(firstOfMonth);
    if (autoClose) setOpen(false);
  };

  const prevYear = () => setViewYear((y) => clampYear(y - 1));
  const nextYear = () => setViewYear((y) => clampYear(y + 1));

  const isYearMin = viewYear <= fromYear;
  const isYearMax = viewYear >= toYear;

  return (
    <div className={cn("flex flex-col", className)}>
      {label && (
        <label htmlFor={props.id ?? "month"} className="mb-1 block text-xs text-gray-600">
          {label}
        </label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={props.id ?? "month"}
            className="justify-between font-normal"
          >
            {selected ? format(selected) : placeholder}
            <ChevronDown className="h-4 w-4 opacity-70" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align={align}
          side={side}
          sideOffset={sideOffset}
          className={cn("w-72 p-3", contentClassName)}
        >
          {/* Header: year controls */}
          <div className="mb-3 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={prevYear}
              disabled={isYearMin}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Select
              value={String(viewYear)}
              onValueChange={(val) => setViewYear(clampYear(Number(val)))}
            >
              <SelectTrigger className="w-fit text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="h-fit">
                {Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i).map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={nextYear}
              disabled={isYearMax}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-3 gap-2">
            {months.map(({ m, label }) => {
              const isActive =
                selected && selected.getFullYear() === viewYear && selected.getMonth() === m;

              return (
                <Button
                  key={m}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  className={cn(
                    "h-9 justify-center rounded-[0.33em]",
                    isActive ? "" : "bg-background"
                  )}
                  onClick={() => selectMonth(m)}
                >
                  <span className="text-sm">{label}</span>
                </Button>
              );
            })}
          </div>

          {/* Clear (optional) */}
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              className="h-8 px-2 text-xs"
              onClick={() => {
                setter?.(undefined);
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export function TimeInputNative({
  label,
  value, // "HH:MM"
  onChange, // (next?: string) => void
  required = true,
  helper,
  className,
  ...props
}: {
  label: string;
  value?: string;
  onChange?: (v?: string) => void;
  required?: boolean;
  helper?: string;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-xs text-gray-600">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <Input
        type="time"
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value || undefined)}
        // step controls minute granularity; 300 = 5 min
        step={300}
        {...props}
      />
      {helper && <p className="mt-1 text-xs text-gray-500">{helper}</p>}
    </div>
  );
}
