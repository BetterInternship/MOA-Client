"use client";

import { RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import { AccessCodeCopy } from "./AccessCodeCopy";
import StudentsTable from "./StudentsTable";
import type { FormGroupMember } from "./StudentsTable";
import type { FormGroup } from "./types";

export function FormGroupStudentsDetail({
  formGroup,
  formGroups,
  members,
  onSelectFormGroup,
  onCopyAccessCode,
  onRefreshStudentList,
  isRefreshingStudentList = false,
  onResetAccessCode,
  onClearStudentList,
  onRemoveMember,
  className,
}: {
  formGroup: FormGroup;
  formGroups?: FormGroup[];
  members: FormGroupMember[];
  onSelectFormGroup?: (formGroup: FormGroup) => void;
  onCopyAccessCode: (code: string) => void | Promise<void>;
  onRefreshStudentList: () => void | Promise<void>;
  isRefreshingStudentList?: boolean;
  onResetAccessCode: () => void;
  onClearStudentList: () => void;
  onRemoveMember: (formGroupId: string, memberId: string) => void | Promise<void>;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-3", className)}>
      <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-2">
          <h2 className="flex min-w-0 flex-nowrap items-center gap-2 text-2xl leading-tight font-semibold text-gray-900 sm:text-3xl">
            <span className="shrink-0 whitespace-nowrap">Students who can access</span>
            {formGroups?.length && onSelectFormGroup ? (
              <Select
                value={formGroup.id}
                onValueChange={(formGroupId) => {
                  const nextFormGroup = formGroups.find((group) => group.id === formGroupId);

                  if (nextFormGroup) {
                    onSelectFormGroup(nextFormGroup);
                  }
                }}
              >
                <SelectTrigger
                  aria-label="Select form group"
                  className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 h-auto min-w-0 flex-1 px-2.5 py-1 text-left text-xl font-semibold shadow-none sm:max-w-[min(56rem,100%)] sm:text-2xl [&>span]:truncate"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-80 min-w-[min(28rem,calc(100vw-2rem))]">
                  {formGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-primary break-words">{formGroup.description}</span>
            )}
          </h2>
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="text-gray-500">Access Code:</span>
            <AccessCodeCopy code={formGroup.code} onCopy={onCopyAccessCode} />
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap lg:justify-end lg:pt-0">
          <Button
            variant="outline"
            type="button"
            className="gap-2"
            disabled={isRefreshingStudentList}
            onClick={() => {
              void onRefreshStudentList();
            }}
          >
            Refresh List
            <RefreshCw className={cn("h-4 w-4", isRefreshingStudentList && "animate-spin")} />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" type="button" scheme="destructive" className="gap-2">
                Reset Access Code
                <RefreshCw className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent variant="destructive">
              <AlertDialogHeader>
                <AlertDialogTitle>Reset access code?</AlertDialogTitle>
                <AlertDialogDescription>
                  Any students who have not joined the group will need to know the new code to join.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction scheme="destructive" onClick={onResetAccessCode}>
                  Reset Access Code
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" type="button" scheme="destructive" className="gap-2">
                Clear Student List
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent variant="destructive">
              <AlertDialogHeader>
                <AlertDialogTitle>Clear student list?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all students from the selected form group.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction scheme="destructive" onClick={onClearStudentList}>
                  Clear Student List
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card className="min-h-0 flex-1 p-3">
        <StudentsTable
          key={formGroup.id}
          members={members}
          onRemoveMember={(memberId) => onRemoveMember(formGroup.id, memberId)}
        />
      </Card>
    </div>
  );
}
