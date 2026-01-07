"use client";

import { useCallback, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Download, Hourglass, Table2 } from "lucide-react";
import FormDataModal from "@/components/docs/dashboard/FormDataModal";
import { useModal } from "@/app/providers/modal-provider";
import { IMyForm } from "../forms/myforms.ctx";

export function getDisplayValue(info: Record<string, unknown>, section: string, key: string) {
  if (!info) return "—";
  const composed = `${section}.${key}:default`;
  const val = info[composed];
  if (val !== undefined && val !== null) return toDisplayString(val);
}

const toDisplayString = (value: unknown): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return `${value}`;
  try {
    return JSON.stringify(value);
  } catch {
    return "—";
  }
};

export const createBaseFormColumns = (): ColumnDef<IMyForm>[] => [
  {
    accessorKey: "label",
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
    accessorFn: (row) => getDisplayValue(row.display_information!, "student", "full-name"),
    cell: (info) => info.getValue(),
    enableSorting: true,
  },
];

/**
 * Form columns for coordinators.
 * Contains additional info about student and company.
 *
 * @returns
 */
const createCoordinatorFormColumns = (): ColumnDef<IMyForm>[] => [
  ...createBaseFormColumns(),
  {
    id: "student_id",
    header: "Student ID",
    accessorFn: (row) => getDisplayValue(row.display_information!, "student", "id-number"),
    cell: (info) => info.getValue(),
    enableSorting: true,
  },
  {
    id: "entity",
    header: "Company",
    accessorFn: (row) => getDisplayValue(row.display_information!, "entity", "legal-name"),
    cell: (info) => info.getValue(),
    enableSorting: true,
  },
  ...createActionColumns(),
];

/**
 * Non-coordinator cols.
 *
 * @returns
 */
const createNonCoordintatorColumns = (): ColumnDef<IMyForm>[] => [
  ...createBaseFormColumns(),
  ...createActionColumns(),
];

/**
 * A column for the actions you can perform on a form.
 *
 * @returns
 */
const createActionColumns = (): ColumnDef<IMyForm>[] => [
  {
    id: "actions",
    header: "Actions",
    cell: (info) => {
      const myForm = info.row.original;
      if (myForm.signed_document_id) {
        return (
          <Button
            size="sm"
            onClick={() => window.open(myForm.latest_document_url!, "_blank")}
            className="flex items-center gap-2"
          >
            Download
            <Download className="h-4 w-4" />
          </Button>
        );
      } else {
        return (
          <Button size="sm" variant="outline" disabled className="flex items-center gap-1">
            Pending
            <Hourglass className="h-4 w-4" />
          </Button>
        );
      }
    },
  },
];

export default function MyFormsTable({
  rows,
  isCoordinator,
  exportEnabled = false,
  exportLabel,
}: {
  rows: IMyForm[];
  isCoordinator: boolean;
  exportEnabled?: boolean;
  exportLabel?: string;
}) {
  const columns = isCoordinator ? createCoordinatorFormColumns() : createNonCoordintatorColumns();
  const { openModal } = useModal();
  const modalName = useMemo(
    () => `form-data-${exportLabel ? exportLabel.replace(/\s+/g, "-").toLowerCase() : "all"}`,
    [exportLabel]
  );

  const handleOpenExport = useCallback(() => {
    openModal(
      modalName,
      <FormDataModal rows={rows} label={exportLabel ?? "Form Data"} />, // content
      {
        title: exportLabel ?? "Form Data",
        panelClassName: "sm:max-w-6xl sm:w-[92vw]",
      }
    );
  }, [exportLabel, modalName, openModal, rows]);

  return (
    <DataTable
      columns={columns}
      data={rows}
      enableColumnVisibility
      initialSorting={[{ id: "timestamp", desc: true }]}
      pageSizes={[20, 50]}
      toolbarActions={
        exportEnabled ? (
          <Button className="inline-flex h-10 items-center gap-2" onClick={handleOpenExport}>
            <Table2 className="h-4 w-4" />
            Export CSV
          </Button>
        ) : null
      }
    />
  );
}
