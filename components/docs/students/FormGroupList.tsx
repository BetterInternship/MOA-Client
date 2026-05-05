"use client";

import { ChevronRight, FileText } from "lucide-react";
import { HeaderIcon } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AccessCodeCopy } from "./AccessCodeCopy";
import type { FormGroup } from "./types";

export function FormGroupList({
  formGroups,
  selectedFormGroupId,
  onSelectFormGroup,
  onCopyAccessCode,
}: {
  formGroups: FormGroup[];
  selectedFormGroupId: string | null;
  onSelectFormGroup: (formGroup: FormGroup) => void;
  onCopyAccessCode: (code: string) => void | Promise<void>;
}) {
  return (
    <aside className="flex min-h-0 flex-col overflow-hidden bg-white md:border-r md:border-gray-200">
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
                  onClick={() => onSelectFormGroup(formGroup)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectFormGroup(formGroup);
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
                    <div className="min-w-0 flex-1 space-y-6">
                      <div className="flex flex-col flex-wrap items-start">
                        <h3 className="text-base leading-snug font-semibold break-words text-gray-900">
                          {formGroup.description}
                        </h3>
                        <div className="flex w-full flex-row items-center gap-1.5 text-sm">
                          <span className="text-gray-500">Access Code:</span>
                          <AccessCodeCopy
                            code={formGroup.code}
                            onCopy={onCopyAccessCode}
                            stopPropagation
                            className="py-0.5 text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500">
                          {formGroup.forms.length} Form Template
                          {formGroup.forms.length === 1 ? "" : "s"}
                        </p>
                        <div className="mt-2 flex flex-col">
                          {formGroup.forms.map((form) => (
                            <p className="text-xs text-gray-400">{form}</p>
                          ))}
                        </div>
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
  );
}
