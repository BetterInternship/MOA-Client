"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HeaderIcon, HeaderText } from "@/components/ui/text";
import { Newspaper } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { DynamicForm } from "@/components/docs/forms/RecipientDynamicForm";
import { getFormFields } from "@/app/api/forms.api";
import { getViewableForms } from "@/app/api/docs.api";

type FormItem = { name: string };

export default function DocsFormsPage() {
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const { data: rows = [] } = useQuery<FormItem[]>({
    queryKey: ["docs-forms-names"],
    queryFn: async () => {
      const res = await getViewableForms();
      if (!res) return [];
      if (Array.isArray(res.forms)) return res.forms.map((n: string) => ({ name: n }));
      return [];
    },
    staleTime: 60_000,
  });

  const previewQuery = useQuery({
    queryKey: ["form-fields", previewName],
    queryFn: async () => {
      if (!previewName) return null;
      const res = await getFormFields(previewName);
      return res?.formFields ?? null;
    },
    enabled: !!previewName && open,
  });

  const onPreview = (name: string) => {
    setPreviewName(name);
    setOpen(true);
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 pt-6 sm:px-10 sm:pt-16">
      <div className="mb-6 space-y-2 sm:mb-8">
        <div className="flex items-center gap-3">
          <HeaderIcon icon={Newspaper} />
          <HeaderText>Forms Preview</HeaderText>
        </div>
        <p className="text-sm text-gray-600 sm:text-base">
          Preview form templates used in the system.
        </p>
      </div>

      <Card className="p-3 sm:p-4">
        {rows.length === 0 ? (
          <div className="text-muted-foreground text-sm">No forms available.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {rows.map((f) => (
              <div
                key={f.name}
                className="group bg-background/60 relative rounded-[0.33em] border border-gray-200 backdrop-blur-sm transition-all duration-200 hover:shadow-sm dark:border-gray-800"
                role="article"
              >
                <div className="flex items-center justify-between p-3.5">
                  <div className="flex flex-col">
                    <div className="line-clamp-1 text-sm leading-tight font-medium">{f.name}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => onPreview(f.name)} className="h-8 px-3">
                      Preview
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Preview: {previewName}</DialogTitle>
          <DialogDescription>
            {previewQuery.isLoading ? (
              <div className="text-sm">Loading…</div>
            ) : previewQuery.data ? (
              <div className="space-y-2">
                <div className="text-sm font-medium">Preview</div>
                {(previewQuery.data?.formMetadata?.schema ?? []).length ? (
                  <div className="mt-2">
                    <DynamicForm
                      source={"student"}
                      fields={fields}
                      values={values}
                      onChange={setField}
                      errors={errors}
                      showErrors={submitted}
                      formName={""}
                      autofillValues={{}}
                      setValues={(newValues) => setValues({ ...values, ...newValues })}
                    />
                  </div>
                ) : (
                  <div className="text-sm">No preview available.</div>
                )}
              </div>
            ) : (
              <div className="text-sm">No preview available.</div>
            )}
          </DialogDescription>
          <div className="mt-4 flex justify-end">
            <DialogClose>
              <Button>Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
