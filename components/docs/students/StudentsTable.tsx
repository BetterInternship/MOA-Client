"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "date-fns";
import { X } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";

export type FormGroupMember = {
  name: string;
  email: string;
  joinedAt: string | Date;
};

function getStudentId(student: FormGroupMember) {
  return student.email;
}

function createColumns(onRemove: (studentId: string) => void): ColumnDef<FormGroupMember>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "joinedAt",
      header: "Joined At",
      cell: (info) => formatDate(new Date(info.getValue() as string | Date), "MM/dd/yyyy hh:mm a"),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (info) => (
        <Button
          size="sm"
          variant="outline"
          scheme="destructive"
          className="gap-1"
          onClick={() => onRemove(getStudentId(info.row.original))}
        >
          Remove
          <X className="h-4 w-4" />
        </Button>
      ),
    },
  ];
}

export default function StudentsTable({ members }: { members: FormGroupMember[] }) {
  const [removedStudentIds, setRemovedStudentIds] = useState<Set<string>>(new Set());

  const rows = useMemo(() => {
    return members.filter((student) => !removedStudentIds.has(getStudentId(student)));
  }, [members, removedStudentIds]);

  const columns = useMemo(
    () =>
      createColumns((studentId) => {
        setRemovedStudentIds((current) => new Set(current).add(studentId));
      }),
    []
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      enableColumnVisibility
      initialSorting={[{ id: "joinedAt", desc: true }]}
      sortingStorageKey="docs-students-sorting"
      pageSizes={[20, 50]}
      searchPlaceholder="Search students..."
      rowLabelSingular="student"
      rowLabelPlural="students"
      className="h-full"
    />
  );
}
