"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  label: string;
  name: string;
  accept?: string;
  required?: boolean;
  /** Called with the selected file (or null if none) */
  onFileSelect?: (file: File | null) => void;
  /** Disable the control */
  disabled?: boolean;
}

export function FileUpload({
  label,
  name,
  accept,
  required,
  onFileSelect,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const id = name; // use name as id for label association

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFileName(file?.name ?? null);
    onFileSelect?.(file);
  }

  function handleClick() {
    if (disabled) return;
    // allow selecting the same file twice by resetting the value
    if (inputRef.current) inputRef.current.value = "";
    inputRef.current?.click();
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </Label>

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 rounded-[0.33em] border border-gray-300 px-4 py-4 text-left text-sm transition-colors",
          "hover:bg-muted text-muted-foreground hover:cursor-pointer",
          disabled && "cursor-not-allowed opacity-60"
        )}
        aria-label={label}
      >
        <Upload className="text-primary h-5 w-5 shrink-0" />
        {fileName ? (
          <span className="text-foreground truncate">{fileName}</span>
        ) : (
          <span>Click to upload file</span>
        )}
      </button>

      <input
        ref={inputRef}
        id={id}
        type="file"
        name={name}
        accept={accept}
        required={required}
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />
    </div>
  );
}
