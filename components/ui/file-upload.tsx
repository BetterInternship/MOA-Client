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
          "border  rounded-md px-4 py-4 text-sm cursor-pointer",
          "hover:bg-muted transition-colors text-muted-foreground",
          "flex items-center gap-2"
        )}
      >
        <Upload className="w-5 h-5 shrink-0 text-primary" />
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
