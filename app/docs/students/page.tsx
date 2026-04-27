"use client";

import { useEffect, useMemo, useState } from "react";
import { HeaderIcon } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronRight, FileText, Users2 } from "lucide-react";
import { useSignatoryProfile } from "../auth/provider/signatory.ctx";
import StudentsTable from "@/components/docs/students/StudentsTable";
import type { Student } from "@/components/docs/students/StudentsTable";
import { useRouter } from "next/navigation";

export type FormGroup = {
  id: string;
  description: string;
  forms: string[];
  code: string;
};

const formGroups: FormGroup[] = [{ id: "", description: "Test Forms", forms: [], code: "ABC123" }];
const students: Student[] = [];

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
                  <button
                    key={formGroup.id}
                    type="button"
                    onClick={() => setSelectedFormGroupId(formGroup.id)}
                    className="group w-full text-left"
                  >
                    <Card
                      className={cn(
                        "rounded-[0.33em] border p-4 transition-all duration-200",
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
                            <div className="flex w-full flex-row items-baseline text-xs">
                              <pre className="text-gray-500">Access Code: </pre>
                              <pre className="text-primary bg-primary/20 rounded-[0.33em] px-2 font-bold tracking-wide">
                                {formGroup.code}
                              </pre>
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
                  </button>
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

      <section className="flex min-h-0 flex-col overflow-hidden p-3 sm:p-4">
        {selectedFormGroup ? (
          <Card className="min-h-0 flex-1 p-3">
            <StudentsTable key={selectedFormGroup.id} students={students} />
          </Card>
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
