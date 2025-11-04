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
import { FormMetadata } from "@betterinternship/core/forms";
import z from "zod";

type FormItem = { name: string };

export default function DocsFormsPage() {
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
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
      return await getFormFields(previewName);
    },
    enabled: !!previewName && open,
  });

  const formMetadata = previewQuery.data?.formMetadata
    ? new FormMetadata(previewQuery.data?.formMetadata)
    : null;
  const fields = formMetadata?.getFieldsForClient() ?? [];

  const setField = (key: string, value: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    setValues({ ...values, [key]: value?.toString() ?? "" });
  };

  const handleSubmit = () => {
    // Validate fields before allowing to proceed
    const errors: Record<string, string> = {};
    for (const field of fields) {
      if (field.party !== "student") continue;

      // Check if missing

      const value = values[field.field];

      // Check validator error
      const coerced = field.coerce(value);
      const result = field.validator?.safeParse(coerced);
      if (result?.error) {
        const errorString = z
          .treeifyError(result.error)
          .errors.map((e) => e.split(" ").slice(0).join(" "))
          .join("\n");
        errors[field.field] = `${field.label}: ${errorString}`;
        continue;
      }
    }

    setErrors(errors);
  };

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
        <DialogContent className="max-h-[75vh] w-full overflow-auto sm:max-w-4xl">
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
                      party={"student"}
                      fields={fields}
                      values={values}
                      onChange={setField}
                      errors={errors}
                      showErrors={true}
                      formName={previewName ?? ""}
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
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" onClick={handleSubmit}>
              Test Validation
            </Button>
            <DialogClose>
              <Button>Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
