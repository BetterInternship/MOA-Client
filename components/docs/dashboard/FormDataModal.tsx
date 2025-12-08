"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Table from "@/components/docs/dashboard/Table";
import CsvExporter from "@/components/docs/dashboard/CsvExporter";
import FieldVisibilityToggle from "@/components/docs/dashboard/FieldVisibilityToggle";
import { FormRow } from "@/components/docs/dashboard/FormTable";
import { RowEntry } from "@/lib/types";
import { RotateCcw } from "lucide-react";

function formRowsToRowEntries(rows: FormRow[]): RowEntry[][] {
  return rows.map((row) => {
    const entries: RowEntry[] = [
      { col: "form_label", value: row.form_label },
      { col: "form_name", value: row.form_name },
      { col: "timestamp", value: row.timestamp },
      { col: "url", value: row.url },
    ];

    Object.entries(row.display_information || {}).forEach(([k, v]) => {
      entries.push({ col: k, value: v as RowEntry["value"] });
    });

    return entries;
  });
}

export default function FormDataModal({ rows, label }: { rows: FormRow[]; label: string }) {
  const tableData = useMemo(() => formRowsToRowEntries(rows), [rows]);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  const handleColumnsExtracted = (columns: string[]) => {
    setAvailableColumns(columns);
    // initialize only once to avoid clobbering reorder/hide; set if empty
    if (visibleColumns.length === 0) {
      setVisibleColumns(columns);
    }
  };

  const handleToggleColumn = (columnName: string) => {
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
    setVisibleColumns(newOrder);
    // keep availableColumns aligned to the new order for future toggles
    const remainder = availableColumns.filter((c) => !newOrder.includes(c));
    setAvailableColumns([...newOrder, ...remainder]);
  };

  const hasData = tableData.length > 0;

  return (
    <div className="flex flex-col gap-3 px-4">
      <div className="space-y-1">
        <p className="text-sm text-gray-600">
          Reorder or hide fields, then export the visible data as CSV.
        </p>
      </div>

      <div className="flex flex-wrap justify-between gap-2">
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
            onClick={() => {
              // reset columns to initial state
              setVisibleColumns(availableColumns);
            }}
            disabled={!availableColumns.length}
          >
            <RotateCcw className="h-4 w-4" />
            Reset columns
          </Button>
        </div>

        <CsvExporter tableData={tableData} visibleColumns={visibleColumns} />
      </div>

      <div className="max-h-[70vh] overflow-auto rounded-[0.33em]">
        {hasData ? (
          <Table
            table={tableData}
            visibleColumns={visibleColumns}
            onColumnsExtracted={handleColumnsExtracted}
            onColumnOrderChange={handleColumnOrderChange}
          />
        ) : (
          <div className="p-6 text-sm text-gray-600">No data available.</div>
        )}
      </div>
    </div>
  );
}
