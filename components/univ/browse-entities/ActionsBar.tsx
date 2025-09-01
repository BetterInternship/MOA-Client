"use client";

import { ShieldAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export default function ActionsBar({
  onBlacklist,
  pending,
}: {
  onBlacklist?: () => void | Promise<void>;
  pending?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-white p-4">
      <h2 className="text-lg font-semibold">Actions</h2>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            disabled={pending}
            className="inline-flex items-center rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:cursor-pointer hover:bg-rose-100 disabled:opacity-50"
          >
            <ShieldAlert className="mr-2 h-4 w-4" />
            {pending ? "Blacklisting..." : "Blacklist Entity"}
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent variant="destructive">
          <AlertDialogHeader>
            <AlertDialogTitle>Blacklist this entity?</AlertDialogTitle>
            <AlertDialogDescription>
              They won’t be able to initiate or sign new MOAs with your school. This can be reversed
              later by changing the partner status.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction scheme="destructive" onClick={onBlacklist}>
              Yes, blacklist entity
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
