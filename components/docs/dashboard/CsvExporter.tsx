"use client";

import React, { useState } from "react";
import { Download, AlertCircle } from "lucide-react";
import { RowEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CsvExporterProps {
  tableData: RowEntry[][];
  visibleColumns: string[];
  recordCount?: number;
}

export default function CsvExporter({ tableData, visibleColumns, recordCount }: CsvExporterProps) {
  const [isExporting, setIsExporting] = useState(false);

  const validateData = (): boolean => {
    if (!tableData || !Array.isArray(tableData)) {
      toast.error("Invalid table data format");
      return false;
    }

    if (tableData.length === 0) {
      toast.error("No data to export");
      return false;
    }

    if (!visibleColumns || visibleColumns.length === 0) {
      toast.error("Please select at least one column to export");
      return false;
    }

    return true;
  };

  const generateCsvContent = (): string => {
    try {
      // Header row
      const header = visibleColumns.map((col) => `"${col}"`).join(",");
      const rows = tableData.map((rowEntries) => {
        const rowData = visibleColumns.map((col) => {
          const entry = rowEntries.find((e) => e.col === col);
          let value = entry?.value ?? "";
          
          // Handle different types
          if (typeof value === "object") {
            value = JSON.stringify(value);
          }
          
          // Escape quotes and wrap in quotes
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        });
        return rowData.join(",");
      });

      // Add UTF-8 BOM to ensure proper encoding in Excel and other tools
      const csvContent = [header, ...rows].join("\n");
      return "\uFEFF" + csvContent;
    } catch (error) {
      console.error("Error generating CSV:", error);
      throw new Error("Failed to generate CSV content");
    }
  };

  async function handleExport() {
    if (!validateData()) return;

    setIsExporting(true);
    try {
      // Generate CSV locally instead of calling API
      const csvContent = generateCsvContent();
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      
      // Create download link
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `export_${timestamp}_${Date.now()}.csv`;
      
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${tableData.length} record(s) as CSV`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export CSV. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  const canExport = tableData && tableData.length > 0 && visibleColumns.length > 0;

  return (
    <Button
      onClick={handleExport}
      disabled={!canExport || isExporting}
      variant={canExport ? "default" : "secondary"}
      className="flex items-center gap-2"
      title={!canExport ? "Select at least one column to export" : "Export as CSV"}
    >
      {isExporting ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Export CSV
        </>
      )}
    </Button>
  );
