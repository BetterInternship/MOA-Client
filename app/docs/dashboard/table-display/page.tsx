"use client";

import { useState, useRef } from "react";
import { HeaderIcon, HeaderText } from "@/components/ui/text";
import { Table2, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Table from "@/components/docs/dashboard/Table";
import CsvExporter from "@/components/docs/dashboard/CsvExporter";
import FieldVisibilityToggle from "@/components/docs/dashboard/FieldVisibilityToggle";
import { RowEntry } from "@/lib/types";

export default function TableDisplayPage() {
  const [uploadedData, setUploadedData] = useState<RowEntry[][]>([]);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setUploadedData(processed);
        setVisibleColumns([]);
      } catch (err) {
        console.error("Invalid JSON", err);
        alert("Failed to parse JSON file");
      }
    };
    reader.readAsText(file);
  };

  const handleColumnsExtracted = (columns: string[]) => {
    setAvailableColumns(columns);
    setVisibleColumns(columns); // Show all columns by default
  };

  const handleColumnOrderChange = (newOrder: string[]) => {
    // Update both visible and available columns to maintain new order
    setVisibleColumns(newOrder);
    
    // Update availableColumns to reflect new order for future toggles
    const allColumnsInNewOrder = newOrder.concat(
      availableColumns.filter(col => !newOrder.includes(col))
    );
    setAvailableColumns(allColumnsInNewOrder);
  };

  const handleToggleColumn = (columnName: string) => {
    setVisibleColumns((prev) => {
      if (prev.includes(columnName)) {
        // Remove the column
        return prev.filter((col) => col !== columnName);
      } else {
        // Add the column back in its original position
        const newVisible = [...prev];
        const originalIndex = availableColumns.indexOf(columnName);
        
        // Find the correct position to insert
        let insertIndex = newVisible.length;
        for (let i = 0; i < newVisible.length; i++) {
          const currentColIndex = availableColumns.indexOf(newVisible[i]);
          if (currentColIndex > originalIndex) {
            insertIndex = i;
            break;
          }
        }
        
        newVisible.splice(insertIndex, 0, columnName);
        return newVisible;
      }
    });
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 pt-6 sm:px-10 sm:pt-16">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <HeaderIcon icon={Table2} />
          <HeaderText>Table Display</HeaderText>
        </div>
        <p className="text-sm text-gray-600 sm:text-base">
          Browse form submissions, toggle columns, and download as CSV.
        </p>
      </div>

      {/* Upload JSON Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload JSON
            </Button>
            {availableColumns.length > 0 && (
              <FieldVisibilityToggle
                availableColumns={availableColumns}
                visibleColumns={visibleColumns}
                onToggleColumn={handleToggleColumn}
              />
            )}
          </div>
          {availableColumns.length > 0 && (
            <CsvExporter tableData={uploadedData} visibleColumns={visibleColumns} />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </Card>

      {/* Table Display */}
      {uploadedData.length > 0 ? (
        <Card className="p-4 overflow-hidden mb-8">
          <Table
            table={uploadedData}
            visibleColumns={visibleColumns}
            onColumnsExtracted={handleColumnsExtracted}
            onColumnOrderChange={handleColumnOrderChange}
          />
        </Card>
      ) : (
        <Card className="p-6">
          <div className="text-sm text-gray-500">
            Upload a JSON file to display data
          </div>
        </Card>
      )}
    </div>
  );
}
