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
}

export function FileUpload({ label, name, accept, required }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  }

  function handleClick() {
    inputRef.current?.click();
  }

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>

      <div
        onClick={handleClick}
        className={cn(
          "cursor-pointer rounded-md border px-4 py-4 text-sm",
          "hover:bg-muted text-muted-foreground transition-colors",
          "flex items-center gap-2"
        )}
      >
        <Upload className="text-primary h-5 w-5 shrink-0" />
        {fileName ? (
          <span className="text-foreground truncate">{fileName}</span>
        ) : (
          <span>Click to upload file</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        required={required}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
