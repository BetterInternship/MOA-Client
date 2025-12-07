"use client";

import React from "react";
import { FileDown } from "lucide-react";
import { RowEntry } from "@/lib/types";

interface CsvExporterProps {
  tableData: RowEntry[][];
  visibleColumns: string[];
}

export default function CsvExporter({ tableData, visibleColumns }: CsvExporterProps) {
  async function handleExport() {
    if (!tableData || tableData.length === 0) {
      alert("No data to export");
      return;
    }

    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableData, visibleColumns }),
      });

      if (!res.ok) {
        throw new Error("Export failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error", err);
      alert("Failed to export CSV");
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={!tableData || tableData.length === 0}
      className="flex cursor-pointer items-center gap-2 rounded border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      <FileDown className="h-4 w-4" />
      Export CSV
    </button>
  );
}
