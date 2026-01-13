"use client";

import { useCallback, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { ArrowRight, Download, Hourglass, Table2, Loader2 } from "lucide-react";
import FormDataModal from "@/components/docs/dashboard/FormDataModal";
import { useModal } from "@/app/providers/modal-provider";
import { IMyForm } from "../forms/myforms.ctx";
import { IFormSignatory } from "@betterinternship/core/forms";
import { useSignatoryProfile } from "@/app/docs/auth/provider/signatory.ctx";
import { useFormsControllerGetBulkFormProcesses, ExportableFormsResponse } from "@/app/api";
import { toast } from "sonner";

export type FormRow = {
  form_label: string;
  form_name: string;
  timestamp: string;
  url?: string;
  inputs?: Record<string, unknown>;
};

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
const createCoordinatorFormColumns = (profile: IFormSignatory): ColumnDef<IMyForm>[] => [
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
  ...createActionColumns(profile),
];

/**
 * Non-coordinator cols.
 *
 * @returns
 */
const createNonCoordintatorColumns = (profile: IFormSignatory): ColumnDef<IMyForm>[] => [
  ...createBaseFormColumns(),
  ...createActionColumns(profile),
];

/**
 * A column for the actions you can perform on a form.
 *
 * @returns
 */
const createActionColumns = (profile: IFormSignatory): ColumnDef<IMyForm>[] => [
  {
    id: "actions",
    header: "Actions",
    cell: (info) => {
      const myForm = info.row.original;
      const lastUnsignedSigningParty = myForm.signing_parties
        .toSorted((a, b) => a.order - b.order)
        .find((signingParty) => !signingParty.signed);
      const mySigningParty = myForm.signing_parties.find(
        (signingParty) =>
          signingParty.signatory_account?.email === profile.email && !signingParty.signed
      );

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
      } else if (lastUnsignedSigningParty?._id !== mySigningParty?._id) {
        return (
          <Button size="sm" variant="outline" disabled className="flex items-center gap-1">
            Pending
            <Hourglass className="h-4 w-4" />
          </Button>
        );
      } else {
        const baseUrl = process.env.NEXT_PUBLIC_DOCS_URL;
        const pendingLink = `${baseUrl}sign?form-process-id=${myForm.form_process_id}&signing-party-id=${mySigningParty?._id}`;
        return (
          <a href={pendingLink} target="_blank">
            <Button size="sm" variant="outline" className="relative flex items-center gap-1">
              Sign Now
              <ArrowRight className="h-4 w-4" />
              <div className="bg-warning absolute top-[-4px] right-[-4px] aspect-square h-2 w-2 rounded-full"></div>
            </Button>
          </a>
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
  const profile = useSignatoryProfile();
  const columns = isCoordinator
    ? createCoordinatorFormColumns(profile)
    : createNonCoordintatorColumns(profile);
  const { openModal } = useModal();
  const modalName = useMemo(
    () => `form-data-${exportLabel ? exportLabel.replace(/\s+/g, "-").toLowerCase() : "all"}`,
    [exportLabel]
  );

  const mutation = useFormsControllerGetBulkFormProcesses({
    mutation: {
      onSuccess: (response: ExportableFormsResponse) => {
        if (!response?.processes || response.processes.length === 0) {
          toast.error("No processes found");
          return;
        }

        // Transform response data to FormDataModal format
        const exportedForms: FormRow[] = response.processes.map((process) => ({
          form_label: process.formLabel,
          form_name: process.formName,
          timestamp: process.createdAt,
          url: (typeof process.documentUrl === "string" ? process.documentUrl : "") || "",
          inputs: process.inputs,
        }));

        openModal(
          modalName,
          <FormDataModal rows={exportedForms} label={exportLabel ?? "Form Data"} />,
          {
            title: exportLabel ?? "Form Data",
            panelClassName: "sm:max-w-6xl sm:w-[92vw]",
          }
        );
      },
      onError: () => {
        toast.error("Failed to load export data");
      },
    },
  });

  const { mutate: getExportData, isPending } = mutation;

  const handleOpenExport = useCallback(() => {
    getExportData({ data: { signatoryId: profile.id } });
  }, [getExportData, profile.id]);

  return (
    <DataTable
      columns={columns}
      data={rows}
      enableColumnVisibility
      initialSorting={[{ id: "timestamp", desc: true }]}
      pageSizes={[20, 50]}
      toolbarActions={
        exportEnabled ? (
          <Button
            className="inline-flex h-10 items-center gap-2"
            onClick={handleOpenExport}
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Table2 className="h-4 w-4" />
            )}
            {isPending ? "Loading..." : "Export CSV"}
          </Button>
        ) : null
      }
    />
  );
}
