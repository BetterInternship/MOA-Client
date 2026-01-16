"use client";

import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Table from "@/components/docs/dashboard/Table";
import CsvExporter from "@/components/docs/dashboard/CsvExporter";
import FieldVisibilityToggle from "@/components/docs/dashboard/FieldVisibilityToggle";
import { FormRow } from "@/components/docs/dashboard/FormTable";
import { RowEntry } from "@/lib/types";
import { RotateCcw } from "lucide-react";
import { formsControllerGetLatestFormDocumentAndMetadata } from "@/app/api";
import { FormMetadata, IFormMetadata } from "@betterinternship/core/forms";

function formRowsToRowEntries(rows: FormRow[]): RowEntry[][] {
  return rows.map((row) => {
    const entries: RowEntry[] = [
      { col: "form_label", value: row.form_label },
      { col: "form_name", value: row.form_name },
      { col: "timestamp", value: row.timestamp },
      { col: "url", value: row.url },
    ];

    Object.entries(row.inputs || {}).forEach(([k, v]) => {
      entries.push({ col: k, value: v as RowEntry["value"] });
    });

    return entries;
  });
}

export default function FormDataModal({
  rows,
  label,
  formName,
}: {
  rows: FormRow[];
  label: string;
  formName?: string;
}) {
  const tableData = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    return formRowsToRowEntries(rows);
  }, [rows]);

  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [fieldLabels, setFieldLabels] = useState<Record<string, string>>({});

  // Fetch form metadata to get field labels
  useEffect(() => {
    if (!formName) return;

    const fetchMetadata = async () => {
      try {
        const response = await formsControllerGetLatestFormDocumentAndMetadata({
          name: formName,
        });

        if (response?.formMetadata) {
          const fm = new FormMetadata(response.formMetadata as unknown as IFormMetadata);
          const labels: Record<string, string> = {
            form_label: "Form Label",
            form_name: "Form Name",
            timestamp: "Created At",
            url: "Document URL",
          };

          // Get all fields from the form metadata (includes labels)
          const fieldsForClient = fm.getFieldsForClientService();

          console.log("[DEBUG] FormMetadata fieldsForClient:", fieldsForClient);

          // Add client fields with labels
          fieldsForClient.forEach((field: any) => {
            if (field.field && field.label) {
              labels[field.field] = field.label;
            }
          });

          console.log("[DEBUG] Final fieldLabels:", labels);
          setFieldLabels(labels);
        }
      } catch (error) {
        console.error("Failed to fetch form metadata:", error);
        // Continue without metadata - will fall back to field names
      }
    };

    fetchMetadata();
  }, [formName]);

  const handleColumnsExtracted = (columns: string[]) => {
    if (!columns || columns.length === 0) return;
    setAvailableColumns(columns);
    // Initialize only once to avoid clobbering reorder/hide; set if empty
    if (visibleColumns.length === 0) {
      setVisibleColumns(columns);
    }
  };

  const handleToggleColumn = (columnName: string) => {
    if (!columnName) return;
    setVisibleColumns((prev) => {
      if (prev.includes(columnName)) {
        return prev.filter((c) => c !== columnName);
      }
      // Insert in original order based on availableColumns
      const originalIndex = availableColumns.indexOf(columnName);
      const next = [...prev];
      let insertAt = next.length;
      for (let i = 0; i < next.length; i++) {
        const idx = availableColumns.indexOf(next[i]);
        if (idx > originalIndex) {
          insertAt = i;
          break;
        }
      }
      next.splice(insertAt, 0, columnName);
      return next;
    });
  };

  const handleColumnOrderChange = (newOrder: string[]) => {
    if (!newOrder || newOrder.length === 0) return;
    setVisibleColumns(newOrder);
    // Keep availableColumns aligned to the new order for future toggles
    const remainder = availableColumns.filter((c) => !newOrder.includes(c));
    setAvailableColumns([...newOrder, ...remainder]);
  };

  const handleResetColumns = () => {
    if (availableColumns.length > 0) {
      setVisibleColumns([...availableColumns]);
    }
  };

  const hasData = tableData && tableData.length > 0;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Info Section */}
      <div className="space-y-2 px-1">
        <h3 className="text-foreground text-sm font-semibold">Export Data</h3>
        <p className="text-muted-foreground text-xs">
          Reorder or hide fields, then export the visible data as CSV.
        </p>
        <p className="text-muted-foreground text-xs">
          Total records: <span className="font-medium">{tableData.length}</span>
        </p>
      </div>

      {/* Controls Section */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex gap-2">
          {availableColumns.length > 0 && (
            <FieldVisibilityToggle
              availableColumns={availableColumns}
              visibleColumns={visibleColumns}
              onToggleColumn={handleToggleColumn}
            />
          )}

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleResetColumns}
            disabled={!availableColumns.length || visibleColumns.length === availableColumns.length}
            title="Reset to all columns"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        <CsvExporter
          tableData={tableData}
          visibleColumns={visibleColumns}
          recordCount={tableData.length}
        />
      </div>

      {/* Table Section */}
      <div className="bg-muted/50 flex-1 overflow-auto rounded-md border">
        {hasData ? (
          <Table
            table={tableData}
            visibleColumns={visibleColumns}
            fieldLabels={fieldLabels}
            onColumnsExtracted={handleColumnsExtracted}
            onColumnOrderChange={handleColumnOrderChange}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-8">
            <div className="text-muted-foreground text-center text-sm">
              <p className="font-medium">No data available</p>
              <p className="mt-1 text-xs">Check your filters and try again</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
