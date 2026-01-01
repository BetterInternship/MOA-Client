/**
 * @ Author: BetterInternship [Jana]
 * @ Create Time: 2025-12-16 23:53:41
 * @ Modified by: Your name
 * @ Modified time: 2025-12-26 01:01:21
 * @ Description: Component for field type selection with search bar dropdown (Facebook-style)
 */

import { useMemo, useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import type { FieldRegistryEntry } from "@/app/api";

type FieldTypeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  registry?: FieldRegistryEntry[];
};

export const FieldTypeSelect = ({
  value,
  onChange,
  disabled,
  registry = [],
}: FieldTypeSelectProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fieldTypes = useMemo(() => {
    // Sort fields by label
    const sorted = registry
      .map((field) => ({
        value: field.id,
        label: field.label,
        preset: field.preset,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    // Filter by search term
    if (!searchTerm.trim()) {
      return sorted;
    }

    const lowerSearch = searchTerm.toLowerCase();
    return sorted.filter((type) => type.label.toLowerCase().includes(lowerSearch));
  }, [registry, searchTerm]);

  const selectedLabel = useMemo(
    () => registry.find((field) => field.id === value)?.label || "",
    [value, registry]
  );

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchTerm("");
    onChange("");
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder={selectedLabel || "Search fields..."}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="h-9 w-full pr-7 text-xs"
          disabled={disabled}
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-[70dvh] overflow-y-auto rounded-[0.33em] border border-slate-200 bg-white shadow-md">
          {fieldTypes.length === 0 ? (
            <div className="p-2 text-center text-xs text-slate-500">No fields found</div>
          ) : (
            fieldTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => handleSelect(type.value)}
                className="w-full border-b border-slate-100 px-3 py-2 text-left text-xs transition-colors last:border-b-0 hover:bg-blue-50"
              >
                {type.label} <strong>({type.preset})</strong>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
