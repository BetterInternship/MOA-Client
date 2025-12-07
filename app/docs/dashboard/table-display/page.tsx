"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { HeaderIcon, HeaderText } from "@/components/ui/text";
import { Table2, Database, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Table from "@/components/docs/dashboard/Table";
import CsvExporter from "@/components/docs/dashboard/CsvExporter";
import FieldVisibilityToggle from "@/components/docs/dashboard/FieldVisibilityToggle";
import { RowEntry } from "@/lib/types";
import { getAllSignedForms } from "@/app/api/forms.api";

type DataSource = "api" | "upload";

export default function TableDisplayPage() {
  const [dataSource, setDataSource] = useState<DataSource>("api");
  const [uploadedData, setUploadedData] = useState<RowEntry[][]>([]);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch data from API
  const { data: apiData, isLoading } = useQuery({
    queryKey: ["docs-signed-table"],
    queryFn: async () => {
      const res = await getAllSignedForms();
      const signedDocs = res?.signedDocuments ?? [];
      
      // Transform API data to RowEntry[][] format
      return signedDocs.map((doc: any) => {
        const entries: RowEntry[] = [];
        
        // Add basic fields
        entries.push({ col: "id", value: doc.id });
        entries.push({ col: "form_name", value: doc.form_name });
        entries.push({ col: "form_label", value: doc.form_label });
        entries.push({ col: "timestamp", value: doc.timestamp });
        entries.push({ col: "url", value: doc.url });
        
        // Flatten display_information if it exists
        if (doc.display_information) {
          Object.entries(doc.display_information).forEach(([key, value]) => {
            entries.push({ col: key, value: value as string | number | boolean | null });
          });
        }
        
        return entries;
      });
    },
    staleTime: 60_000,
    enabled: dataSource === "api",
  });

  // Use either API data or uploaded data
  const tableData = dataSource === "api" ? (apiData ?? []) : uploadedData;

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
        setDataSource("upload");
        setVisibleColumns([]);
      } catch (err) {
        console.error("Invalid JSON", err);
        alert("Failed to parse JSON file");
      }
    };
    reader.readAsText(file);
  };

  const handleDataLoaded = (data: RowEntry[][]) => {
    setUploadedData(data);
    setDataSource("upload");
    setVisibleColumns([]); // Reset visible columns when new data loads
  };

  const handleColumnsExtracted = (columns: string[]) => {
    setAvailableColumns(columns);
    setVisibleColumns(columns); // Show all columns by default
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

      {/* Data Source Toggle */}
      <Card className="p-6">
        <div className="flex gap-2">
          <Button
            variant={dataSource === "api" ? "default" : "outline"}
            onClick={() => setDataSource("api")}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            API Data
          </Button>
          <Button
            variant={dataSource === "upload" ? "default" : "outline"}
            onClick={() => {
              setDataSource("upload");
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </Card>

      {/* Column Visibility Controls */}
      {availableColumns.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between gap-4">
            <FieldVisibilityToggle
              availableColumns={availableColumns}
              visibleColumns={visibleColumns}
              onToggleColumn={handleToggleColumn}
            />
            {tableData.length > 0 && (
              <CsvExporter tableData={tableData} visibleColumns={visibleColumns} />
            )}
          </div>
        </Card>
      )}

      {/* Table Display */}
      {isLoading && dataSource === "api" ? (
        <Card className="p-6">
          <div className="text-sm text-gray-600">Loading data...</div>
        </Card>
      ) : tableData.length > 0 ? (
        <Card className="p-4 overflow-hidden">
          <Table
            table={tableData}
            visibleColumns={visibleColumns}
            onColumnsExtracted={handleColumnsExtracted}
          />
        </Card>
      ) : (
        <Card className="p-6">
          <div className="text-sm text-gray-500">
            {dataSource === "api" 
              ? "No data available from API" 
              : "Upload a JSON file to display data"}
          </div>
        </Card>
      )}
    </div>
  );
}
