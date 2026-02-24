import useOnclickOutside from "react-cool-onclickoutside";
import { useState, useEffect } from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface IAutocompleteOption<ID extends number | string> {
  id: ID;
  name: string;
}

export const Autocomplete = <ID extends number | string>({
  options,
  setter,
  placeholder,
  className,
  inputClassName,
  value,
}: {
  options: IAutocompleteOption<ID>[];
  setter: (value?: ID | null) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  value?: ID | null;
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<IAutocompleteOption<ID> | null>(null);
  const [filteredOptions, setFilteredOptions] = useState<IAutocompleteOption<ID>[]>([]);
  const ref = useOnclickOutside(() => setIsOpen(false));

  useEffect(() => {
    setSelected(options.find((o) => o.id === value) || null);
  }, [value]);

  useEffect(() => {
    const match = options.find((o) => o.id === value);
    if (match) {
      setSelected(match);
      setIsOpen(false);
    }
  }, [options]);

  // Filter by query
  useEffect(() => {
    setFilteredOptions(
      query
        ? options.filter((option) => option?.name?.toLowerCase()?.includes(query.toLowerCase()))
        : options
    );
  }, [query, options]);

  return (
    <div className={cn("relative w-full", className)} ref={ref}>
      <Input
        value={selected?.name || query || ""}
        className={cn(
          "h-9 rounded-[0.33em] border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus-visible:border-slate-400 focus-visible:ring-slate-200/80",
          inputClassName
        )}
        placeholder={placeholder}
        onChange={(e) => {
          setter(e.target.value as ID);
          setQuery(e.target.value);
          setSelected(null);
          setIsOpen(true);

          const match = options.find((o) => o.name === e.target.value);
          if (match) {
            setSelected(match);
            setter(match.id);
          }
        }}
        onFocus={() => setIsOpen(true)}
      />
      {isOpen ? (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto overscroll-contain rounded-[0.33em] border border-slate-200 bg-white p-1 text-sm shadow-xl space-y-1">
          {filteredOptions.length ? (
            filteredOptions
              .toSorted((a, b) => a.name.localeCompare(b.name))
              .map((option, index) => (
                <li
                  key={index}
                  onClick={() => {
                    setSelected(option);
                    setter(option.id);
                    setQuery("");
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center rounded-[0.33em] px-2.5 py-1.5 text-left text-sm transition-colors",
                    selected?.id === option.id
                      ? "bg-primary/10 text-primary"
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                >
                  {option.name}
                </li>
              ))
          ) : (
            <li
              key="no-match"
              className="flex w-full items-center rounded-[0.33em] px-2.5 py-1.5 text-left text-sm text-slate-500"
            >
              No matching results.
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
};
