import { RowEntry } from "@/lib/types";
import { flattenData, getColumns } from "@/lib/dataProcessor";
import { useEffect } from "react";

interface TableProps {
table: RowEntry[][];
visibleColumns?: string[];
onColumnsExtracted?: (columns: string[]) => void;
}

export default function Table({ table, visibleColumns, onColumnsExtracted }: TableProps) {
// Flatten the data and extract columns
const data = flattenData(table);
const allColumns = getColumns(data);

// Notify parent of available columns in useEffect (not during render)
useEffect(() => {
	if (onColumnsExtracted && allColumns.length > 0) {
	onColumnsExtracted(allColumns);
	}
}, [allColumns.length]); // Only when column count changes

// Use visible columns if provided, otherwise show all
const columns = visibleColumns || allColumns;

// Handle empty data
if (data.length === 0) {
	return <div className="p-4 text-gray-500">No data to display</div>;
}

return (
	<div className="my-4 overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
	<table className="min-w-full bg-white">
		{/* Table Header */}
		<thead className="sticky top-0 bg-gray-100">
		<tr>
			{columns.map((columnName) => (
			<th
				key={columnName}
				className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700"
			>
				{columnName}
			</th>
			))}
		</tr>
		</thead>
		
		{/* Table Body */}
		<tbody>
		{data.map((row, index) => (
			<tr key={index} className="transition-colors hover:bg-gray-50">
			{columns.map((columnName) => {
				const value = row[columnName] ?? null;
				const displayValue = value === null ? "-" : String(value);
				
				return (
				<td key={columnName} className="border border-gray-300 px-4 py-2 text-sm text-black">
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
