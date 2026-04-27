"use client";

import { useEffect, useMemo, useState } from "react";
import { HeaderIcon } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import { ChevronRight, Clipboard, FileText, RefreshCw, Trash2, Users2 } from "lucide-react";
import { useSignatoryProfile } from "../auth/provider/signatory.ctx";
import StudentsTable from "@/components/docs/students/StudentsTable";
import type { Student } from "@/components/docs/students/StudentsTable";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export type FormGroup = {
  id: string;
  description: string;
  forms: string[];
  code: string;
};

const formGroups: FormGroup[] = [{ id: "", description: "Test Forms", forms: [], code: "ABC123" }];
const students: Student[] = [];

function AccessCodeCopy({
  code,
  onCopy,
  stopPropagation = false,
  className,
}: {
  code: string;
  onCopy: (code: string) => void | Promise<void>;
  stopPropagation?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      title="Copy access code"
      className={cn(
        "group/code text-primary bg-primary/20 hover:bg-primary/30 inline-flex cursor-pointer items-center gap-1.5 rounded-[0.33em] px-2 py-1 font-mono text-sm font-bold tracking-wide transition-colors",
        className
      )}
      onClick={(event) => {
        if (stopPropagation) event.stopPropagation();
        void onCopy(code);
      }}
    >
      <span>{code}</span>
      <Clipboard className="h-3.5 w-3.5 transition-transform duration-200 group-hover/code:scale-110 group-hover/code:-rotate-6" />
    </button>
  );
}

export default function DocsStudentsPage() {
  const profile = useSignatoryProfile();
  const router = useRouter();
  const isLoggedIn = Boolean(profile?.email);
  const [selectedFormGroupId, setSelectedFormGroupId] = useState<string | null>(null);

  const selectedFormGroup = useMemo(() => {
    return formGroups.find((group) => group.id === selectedFormGroupId) ?? null;
  }, [selectedFormGroupId]);

  useEffect(() => {
    if (!profile.loading && isLoggedIn && !profile.coordinatorId) {
      router.push("/dashboard");
    }
  }, [isLoggedIn, profile.coordinatorId, profile.loading, router]);

  const copyAccessCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Access code copied.");
    } catch {
      toast.error("Failed to copy access code.");
    }
  };

  const resetAccessCode = () => {
    toast.success("Access code reset.");
  };

  const clearStudentList = () => {
    toast.success("Student list cleared.");
  };

  if (profile.loading || !isLoggedIn || !profile.coordinatorId) {
    return null;
  }

  return (
    <div className="grid h-full min-h-0 w-full grid-cols-1 grid-rows-[minmax(180px,35%)_minmax(0,1fr)] overflow-hidden bg-gray-50 md:grid-cols-[clamp(260px,32vw,420px)_minmax(0,1fr)] md:grid-rows-1">
      <aside className="flex min-h-0 flex-col overflow-hidden border-b border-gray-200 bg-white md:border-r md:border-b-0">
        <div className="shrink-0 p-4 sm:px-5">
          <div className="flex items-center gap-3">
            <HeaderIcon icon={FileText} />
            <div>
              <h2 className="text-base font-semibold text-gray-900">Student Form Access</h2>
              <p className="text-muted-foreground text-sm">
                Manage student form template access here.
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 pt-0 sm:p-4 sm:pt-0">
          {formGroups.length ? (
            <div className="space-y-2.5">
              {formGroups.map((formGroup) => {
                const isActive = formGroup.id === selectedFormGroupId;

                return (
                  <Card
                    key={formGroup.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedFormGroupId(formGroup.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedFormGroupId(formGroup.id);
                      }
                    }}
                    className={cn(
                      "group cursor-pointer rounded-[0.33em] border p-4 transition-all duration-200",
                      isActive
                        ? "border-primary/40 bg-primary/10 ring-primary/20 shadow-sm ring-1"
                        : "hover:border-primary/20 hover:bg-primary/5 border-gray-200/90 bg-white"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-4">
                        <div className="flex flex-col flex-wrap items-start">
                          <h3 className="text-base leading-snug font-semibold break-words text-gray-900">
                            {formGroup.description}
                          </h3>
                          <div className="flex w-full flex-row items-center gap-1.5 text-sm">
                            <span className="text-gray-500">Access Code:</span>
                            <AccessCodeCopy
                              code={formGroup.code}
                              onCopy={copyAccessCode}
                              stopPropagation
                              className="py-0.5 text-xs"
                            />
                          </div>
                        </div>
                        <div className="">
                          <p className="text-xs text-gray-500">
                            {formGroup.forms.length} Form Template
                            {formGroup.forms.length === 1 ? "" : "s"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formGroup.forms.length} Student
                            {formGroup.forms.length === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className={cn(
                          "mt-1 h-4 w-4 shrink-0 text-gray-400 transition-all duration-200",
                          isActive
                            ? "text-primary/80 translate-x-0.5"
                            : "group-hover:text-primary/70 group-hover:translate-x-0.5"
                        )}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[0.33em] border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-700">
              No form groups yet.
            </div>
          )}
        </div>
      </aside>

      <section className="flex min-h-0 flex-col gap-3 overflow-hidden p-3 sm:p-4">
        {selectedFormGroup ? (
          <>
            <div className="flex shrink-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-2">
                <h2 className="text-2xl leading-tight font-semibold break-words text-gray-900 sm:text-3xl">
                  {selectedFormGroup.description}
                </h2>
                <div className="flex flex-wrap items-center gap-1.5 text-sm">
                  <span className="text-gray-500">Access Code:</span>
                  <AccessCodeCopy code={selectedFormGroup.code} onCopy={copyAccessCode} />
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
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
                        Any students who have not joined the group will need to know the new code to
                        join.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction scheme="destructive" onClick={resetAccessCode}>
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
                      <AlertDialogAction scheme="destructive" onClick={clearStudentList}>
                        Clear Student List
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <Card className="min-h-0 flex-1 p-3">
              <StudentsTable key={selectedFormGroup.id} students={students} />
            </Card>
          </>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center bg-white p-6 text-center">
            <div className="flex max-w-sm flex-col items-center gap-3 text-gray-500">
              <Users2 className="h-12 w-12 opacity-40" />
              <p className="text-sm">No form group selected.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
