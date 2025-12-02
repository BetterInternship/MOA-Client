"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { HeaderIcon, HeaderText } from "@/components/ui/text";
import { Newspaper } from "lucide-react";
import { Card } from "@/components/ui/card";
import FormPreviewModal from "@/components/docs/forms/FormPreviewModal";
import { getViewableForms } from "@/app/api/docs.api";
import { useModal } from "@/app/providers/modal-provider";
import { getDocsSelf } from "@/app/api/docs.api";
import { DocsUser } from "@/types/docs-user";
import MyFormCard from "@/components/docs/MyFormCard";

type FormItem = { name: string };

export default function DocsFormsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["docs-self"],
    queryFn: getDocsSelf,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const user = data?.profile as DocsUser | undefined;
  const isCoordinator = !!user?.coordinatorId;

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

  const { openModal } = useModal();
  const onPreview = (name: string) => {
    openModal(`form-preview:${name}`, <FormPreviewModal previewName={name} />, {
      title: `Preview: ${name}`,
      panelClassName: "sm:max-w-4xl sm:min-w-[56rem]",
    });
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 pt-6 sm:px-10 sm:pt-16">
      <div className="mb-6 space-y-2 sm:mb-8">
        <div className="flex items-center gap-3">
          <HeaderIcon icon={Newspaper} />
          <HeaderText> {isCoordinator ? "Forms Preview" : "My Saved Forms"} </HeaderText>
        </div>
        <p className="text-sm text-gray-600 sm:text-base">
          {isCoordinator
            ? "Preview form templates used in the system. Switch parties to preview each party's portion of the form."
            : "View and manage your saved forms."}{" "}
          Check forms that have auto-sign enabled
        </p>
      </div>
      <Card className="p-3 sm:p-4">
        {rows.length === 0 ? (
          <div className="text-muted-foreground text-sm">No forms available.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {rows.map((f) => (
              <>
                <MyFormCard
                  row={f}
                  isCoordinator={isCoordinator}
                  onPreview={() => onPreview(f.name)}
                />
              </>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
