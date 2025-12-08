"use client";

import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Download, Hourglass } from "lucide-react";

export interface FormRow {
  id: string | number;
  form_name: string;
  form_label: string;
  prefilled_document_id?: string;
  pending_document_id?: string;
  signed_document_id?: string;
  timestamp: string;
  url: string;
  display_information: Record<string, any>;
}

export function getDisplayValue(
  info: Record<string, any>,
  section: string,
  key: string,
  preferredSuffixes: string[] = ["student-filled", "default"]
) {
  if (!info) return "—";
  for (const sfx of preferredSuffixes) {
    const composed = `${section}.${key}:${sfx}`;
    if (info[composed]) return info[composed];
  }
  return info[`${section}.${key}`] ?? "—";
}

export function createFormColumns(isCoordinator: boolean): ColumnDef<FormRow>[] {
  const cols: ColumnDef<FormRow>[] = [
    {
      accessorKey: "form_label",
      header: "Form",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "timestamp",
      header: "Generated At",
      cell: (info) => formatDate(new Date(info.getValue() as string), "MM/dd/yyyy hh:mm a"),
    },
    {
      id: "requester",
      header: "Requester",
      accessorFn: (row) => getDisplayValue(row.display_information, "student", "full-name"),
      cell: (info) => info.getValue(),
      enableSorting: true,
    },
  ];

  if (isCoordinator) {
    cols.splice(
      3,
      0,
      {
        id: "studentId",
        header: "Student ID",
        accessorFn: (row) => getDisplayValue(row.display_information, "student", "id-number"),
        cell: (info) => info.getValue(),
        enableSorting: true,
      },
      {
        id: "company",
        header: "Company",
        accessorFn: (row) => getDisplayValue(row.display_information, "entity", "legal-name"),
        cell: (info) => info.getValue(),
        enableSorting: true,
      }
    );
  }

  cols.push({
    id: "actions",
    header: "Actions",
    cell: (info) =>
      info.row.original.url ? (
        <Button
          size="sm"
          onClick={() => window.open(info.row.original.url, "_blank")}
          className="flex items-center gap-2"
        >
          Download
          <Download className="h-4 w-4" />
        </Button>
      ) : (
        <Button size="sm" variant="outline" disabled className="flex items-center gap-1">
          Pending
          <Hourglass className="h-4 w-4" />
        </Button>
      ),
  });

  return cols;
}

export default function FormTable({
  rows,
  isCoordinator,
}: {
  rows: FormRow[];
  isCoordinator: boolean;
}) {
  const columns = createFormColumns(isCoordinator);

  return (
    <DataTable
      columns={columns}
      data={rows}
      enableColumnVisibility
      initialSorting={[{ id: "timestamp", desc: true }]}
      pageSizes={[20, 50]}
    />
  );
}
