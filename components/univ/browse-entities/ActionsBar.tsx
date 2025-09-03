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
import { Button } from "@/components/ui/button";

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
          <Button
            disabled={pending}
            className="border-destructive/50 text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-[0.33em] border text-sm hover:cursor-pointer disabled:opacity-50"
          >
            <ShieldAlert className="h-4 w-4" />
            {pending ? "Blacklisting..." : "Blacklist Entity"}
          </Button>
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
