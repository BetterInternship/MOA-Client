"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { approveSignatory, getPendingInformation } from "@/app/api/forms.api";
import { useModal } from "@/app/providers/modal-provider";
import { DocumentRenderer } from "@/components/docs/forms/previewer";
import { useFormRendererContext } from "@/components/docs/forms/form-renderer.ctx";
import { getClientAudit } from "@/lib/audit";
import { useSignatoryAccountActions } from "@/app/api/signatory.api";
import { useSignatoryProfile } from "../auth/provider/signatory.ctx";
import { useMyAutofill } from "@/hooks/use-my-autofill";
import { useFormFiller } from "@/components/docs/forms/form-filler.ctx";

const Page = () => {
  return (
    <Suspense>
      <PageContent />
    </Suspense>
  );
};

function PageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const form = useFormRendererContext();
  const profile = useSignatoryProfile();
  const autofillValues = useMyAutofill();
  const formFiller = useFormFiller();

  // ! user to update autofill later
  const { update } = useSignatoryAccountActions();

  // ! todo: copy over form flow router from students side

  // For mobile
  const [lastFlatValues, setLastFlatValues] = useState<Record<string, string> | null>(null);
  const formProcessId = (params.get("form-process-id") || "").trim();

  // ! Pull these info from the form process, which you should request directly from the server on page mount
  const formName = "Form";
  const studentName = "The student";

  // Pending document preview
  const { data: formProcess } = useQuery({
    queryKey: ["pending-info", formProcessId],
    queryFn: () => getPendingInformation(formProcessId),
    staleTime: 60_000,
    enabled: !!formProcessId,
  });

  const pendingInfo = formProcess?.pendingInformation;
  const pendingUrl = pendingInfo?.pendingInfo?.latest_document_url as string;
  const audienceAllowed = true;

  // local form state
  const [previews, setPreviews] = useState<Record<number, React.ReactNode[]>>({});
  const docUrl = pendingUrl || form.document?.url;

  // Update form data if ever
  useEffect(() => {
    if (formName) form.updateFormName(formName);
  }, [formName]);

  return (
    <div className="relative mx-auto flex h-[100%] max-h-[100%] flex-col items-center space-y-4 overflow-y-hidden px-4 py-8">
      <div className="w-full max-w-7xl overflow-x-visible overflow-y-visible sm:w-7xl">
        <h2 className="text-justify text-sm tracking-tight whitespace-normal sm:text-base sm:whitespace-nowrap">
          Internship Document Fill-out Request from{" "}
          <span className="font-semibold">{studentName}</span>
        </h2>
        <h1 className="text-primary text-2xl font-bold tracking-tight whitespace-normal sm:whitespace-nowrap">
          {pendingInfo?.pendingInfo?.form_label as string}
        </h1>
      </div>
      <div className="relative flex h-[100%] w-full max-w-7xl flex-col justify-center gap-7 overflow-y-hidden sm:w-7xl sm:flex-row">
        {/* PDF Renderer - hidden on small screens, visible on sm+ */}
        <div className="relative hidden max-w-[600px] min-w-[600px] overflow-auto sm:block">
          {!form.loading && audienceAllowed ? (
            <div className="relative flex h-full w-full flex-row gap-2">
              {!!docUrl && (
                <div className="relative h-full w-full">
                  <DocumentRenderer
                    documentUrl={docUrl}
                    highlights={[]}
                    previews={previews}
                    onHighlightFinished={() => {}}
                  />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Page;
