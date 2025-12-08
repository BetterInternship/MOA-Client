import { RowEntry } from "@/lib/types";
import { flattenData, getColumns } from "@/lib/dataProcessor";
import { useEffect, useMemo, useState } from "react";

interface TableProps {
  table: RowEntry[][];
  visibleColumns?: string[];
  onColumnsExtracted?: (columns: string[]) => void;
  onColumnOrderChange?: (newOrder: string[]) => void;
}

export default function Table({
  table,
  visibleColumns,
  onColumnsExtracted,
  onColumnOrderChange,
}: TableProps) {
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    column: string | null;
    direction: "asc" | "desc";
  }>({ column: null, direction: "asc" });

  // Flatten the data and extract columns
  const data = useMemo(() => flattenData(table), [table]);
  const allColumns = useMemo(() => getColumns(data), [data]);

  // Notify parent of available columns in useEffect (not during render)
  useEffect(() => {
    if (onColumnsExtracted && allColumns.length > 0) {
      onColumnsExtracted(allColumns);
    }
  }, [allColumns.length]); // Only when column count changes

  // Use visible columns if provided, otherwise show all
  const columns = visibleColumns && visibleColumns.length > 0 ? visibleColumns : allColumns;

  const sortedData = useMemo(() => {
    if (!sortConfig.column) return data;

    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortConfig.column!];
      const bVal = b[sortConfig.column!];

      const aStr = aVal == null ? "" : String(aVal).toLowerCase();
      const bStr = bVal == null ? "" : String(bVal).toLowerCase();

      if (aStr < bStr) return sortConfig.direction === "asc" ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [data, sortConfig]);

  // Handle empty data
  if (data.length === 0) {
    return <div className="p-4 text-gray-500">No data to display</div>;
  }

  const handleDragStart = (e: React.DragEvent, columnName: string) => {
    setDraggedColumn(columnName);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, columnName: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnName);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();

    if (!draggedColumn || draggedColumn === targetColumn) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    const newOrder = [...columns];
    const draggedIndex = newOrder.indexOf(draggedColumn);
    const targetIndex = newOrder.indexOf(targetColumn);

    // Remove dragged column
    newOrder.splice(draggedIndex, 1);
    // Insert at target position
    newOrder.splice(targetIndex, 0, draggedColumn);

    setDraggedColumn(null);
    setDragOverColumn(null);

    // Notify parent of new order
    if (onColumnOrderChange) {
      onColumnOrderChange(newOrder);
    }
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleSortToggle = (columnName: string) => {
    setSortConfig((prev) => {
      if (prev.column === columnName) {
        return {
          column: columnName,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { column: columnName, direction: "asc" };
    });
  };

  const sortIcon = (columnName: string) => {
    if (sortConfig.column !== columnName) return "⇅";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
      <table className="min-w-full bg-white">
        {/* Table Header */}
        <thead className="sticky top-0 bg-gray-100">
          <tr>
            {columns.map((columnName) => (
              <th
                key={columnName}
                draggable
                onDragStart={(e) => handleDragStart(e, columnName)}
                onDragOver={(e) => handleDragOver(e, columnName)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, columnName)}
                onDragEnd={handleDragEnd}
                className={`cursor-move border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700 transition-colors select-none ${draggedColumn === columnName ? "opacity-50" : ""} ${dragOverColumn === columnName ? "bg-blue-100" : "hover:bg-gray-200"} `}
                onClick={() => handleSortToggle(columnName)}
              >
                <span className="flex items-center gap-1">
                  {columnName}
                  <span className="text-xs text-gray-500">{sortIcon(columnName)}</span>
                </span>
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {sortedData.map((row, index) => (
            <tr key={index} className="transition-colors hover:bg-gray-50">
              {columns.map((columnName) => {
                const value = row[columnName] ?? null;
                const displayValue = value === null ? "-" : String(value);

                return (
                  <td
                    key={columnName}
                    className="border border-gray-300 px-4 py-2 text-sm text-black"
                  >
                    {displayValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
