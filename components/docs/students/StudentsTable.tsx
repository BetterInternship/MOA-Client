"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDate } from "date-fns";
import { X } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatTimeAgo } from "@/lib/format";

export type FormGroupMember = {
  id: string;
  name: string;
  email: string;
  joinedAt: string | Date;
};

function getStudentId(student: FormGroupMember) {
  return student.id;
}

function createColumns(
  onRemoveMember: (member: FormGroupMember) => void | Promise<void>
): ColumnDef<FormGroupMember>[] {
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
      cell: (info) => formatTimeAgo(info.getValue() as string),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (info) => {
        const member = info.row.original;

        return (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" scheme="destructive" className="gap-1">
                Remove
                <X className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent variant="destructive">
              <AlertDialogHeader>
                <AlertDialogTitle>Remove student?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove {member.name} from the selected form group.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  scheme="destructive"
                  onClick={() => {
                    void onRemoveMember(member);
                  }}
                >
                  Remove Student
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
      },
    },
  ];
}

export default function StudentsTable({
  members,
  onRemoveMember,
}: {
  members: FormGroupMember[];
  onRemoveMember: (memberId: string) => void | Promise<void>;
}) {
  const rows = useMemo(() => members, [members]);

  const columns = useMemo(
    () =>
      createColumns((member) => {
        return onRemoveMember(getStudentId(member));
      }),
    [onRemoveMember]
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
