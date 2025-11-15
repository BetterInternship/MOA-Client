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
        className={cn("border-gray-300", inputClassName)}
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
        <ul className="ring-opacity-5 absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-[0.33em] bg-white py-1 text-sm shadow-lg ring-1 ring-black">
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
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
                >
                  {option.name}
                </li>
              ))
          ) : (
            <li
              key="no-match"
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
            >
              No matching results.
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
};
