"use client";

import React from "react";
import { FileUp } from "lucide-react";

export default function JsonUploader({ onDataLoaded }: { onDataLoaded: (data: any) => void }) {
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const text = reader.result as string;
        const json = JSON.parse(text);

        const res = await fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        });
        
        const processed = await res.json();
        onDataLoaded(processed);

      } catch (err) {
        console.error("Invalid JSON", err);
      }
    };

    reader.readAsText(file);
  }

  return (
    <div>
      <label htmlFor="json-file-input" className="inline-flex items-center gap-2 rounded bg-blue-900 px-4 py-2 text-white cursor-pointer">
        <FileUp className="h-4 w-4" />
        Upload JSON
      </label>
      <input type="file" id="json-file-input" accept="application/json" onChange={handleFile} className="hidden" />
    </div>
  );
}


