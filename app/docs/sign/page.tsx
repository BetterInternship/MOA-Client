"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { getFormFields, approveSignatory } from "@/app/api/forms.api";
import { DynamicForm } from "@/components/docs/forms/RecipientDynamicForm";
import { useQuery } from "@tanstack/react-query";
import { getPendingInformation } from "@/app/api/forms.api";
import { useRouter } from "next/navigation";
import { FormMetadata, IFormMetadata } from "@betterinternship/core/forms";
import z from "zod";

type Audience = "entity" | "student-guardian" | "university";
type Party = "entity" | "student-guardian" | "university";
type Role = "entity" | "student-guardian" | "university";

function mapAudienceToRoleAndParty(aud: Audience): {
  role: Role;
  party: Party;
} {
  switch (aud) {
    case "entity":
      return { role: "entity", party: "entity" };
    case "student-guardian":
      return { role: "student-guardian", party: "student-guardian" };
    case "university":
      return { role: "university", party: "university" };
  }
}

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

  // URL params
  const audienceParam = (params.get("for") || "entity").trim() as Audience;
  const { party } = mapAudienceToRoleAndParty(audienceParam);

  const formName = (params.get("form") || "").trim();
  const pendingDocumentId = (params.get("pending") || "").trim();
  const signatoryName = (params.get("name") || "").trim();
  const signatoryTitle = (params.get("title") || "").trim();

  // Optional header bits
  const studentName = params.get("student") || "The student";
  const templateHref = params.get("template") || "";

  // Pending document preview
  const {
    data: pendingRes,
    isLoading: loadingPending,
    error: pendingErr,
  } = useQuery({
    queryKey: ["pending-info", pendingDocumentId],
    queryFn: () => getPendingInformation(pendingDocumentId),
    staleTime: 60_000,
    enabled: !!pendingDocumentId,
  });

  const pendingInfo = pendingRes?.pendingInformation;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const pendingUrl = pendingInfo?.pendingInfo?.latest_document_url;
  console.log("pendingInfo", pendingInfo);

  // Fetch form fields schema from API
  const {
    data: formRes,
    isLoading: loadingForm,
    error: formErr,
  } = useQuery({
    queryKey: ["form-fields", formName],
    queryFn: () => getFormFields(formName),
    enabled: !!formName,
    staleTime: 60_000,
  });

  // Fields
  const formMetadata: FormMetadata<any> | null = formRes?.formMetadata
    ? new FormMetadata(formRes?.formMetadata as unknown as IFormMetadata)
    : null;
  const fields = formMetadata?.getFieldsForClient() ?? [];

  // local form state
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  // success modal state (forms-style)
  const [successOpen, setSuccessOpen] = useState(false);
  const [success, setSuccess] = useState<{
    title: string;
    body: string;
    href?: string;
  } | null>(null);

  const setField = (key: string, value: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    setValues({ ...values, [key]: value?.toString() ?? "" });
  };

  const handleSubmit = async () => {
    setSubmitted(true);

    // Validate fields before allowing to proceed
    const nextErrors: Record<string, string> = {};
    const flatValues: Record<string, string> = {};

    for (const field of fields) {
      if (field.source !== audienceParam) continue;

      const value = values[field.field];

      // collect value if present
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        flatValues[field.field] = String(value);
      }

      // Check validator error
      const coerced = field.coerce(value);
      const result = field.validator?.safeParse(coerced);
      if (result?.error) {
        const errorString = z
          .treeifyError(result.error)
          .errors.map((e) => e.split(" ").slice(0).join(" "))
          .join("\n");
        nextErrors[field.field] = `${field.label}: ${errorString}`;
      }
    }

    setErrors(nextErrors);
    console.log("nextErrors", nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    if (!formName || !pendingDocumentId) return;

    try {
      setBusy(true);
      const payload = {
        pendingDocumentId,
        signatoryName,
        signatoryTitle,
        party,
        values: flatValues,
      };

      console.log("approveSignatory payload", payload);
      const res = await approveSignatory(payload);
      console.log("approveSignatory res", res);

      if (res?.approval?.signedDocumentUrl || res?.approval?.signedDocumentId) {
        setSuccess({
          title: "Submitted & Signed",
          body: "This document is now fully signed. You can download the signed copy below.",
          href: res.approval.signedDocumentUrl,
        });
      } else {
        setSuccess({
          title: "Details Submitted",
          body:
            res?.message ??
            "Thanks! Your details were submitted. We’ll notify you when the document is ready.",
        });
      }

      setSuccessOpen(true);
    } catch (e: any) {
      setSuccess({
        title: "Submission Failed",
        body: e?.message ?? "Something went wrong while submitting your details.",
      });
      setSuccessOpen(true);
    } finally {
      setBusy(false);
    }
  };

  const goHome = () => router.push("/");
  const onDialogOpenChange = (open: boolean) => {
    setSuccessOpen(open);
    if (!open) goHome();
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 pt-8 sm:px-10 sm:pt-16">
      <div className="space-y-6">
        {/* header */}
        <div className="space-y-2">
          <h1 className="text-justify text-xl font-semibold sm:text-2xl">
            {studentName} is requesting the following details for{" "}
            {templateHref ? (
              <Link
                href={templateHref}
                className="hover:text-primary underline underline-offset-2"
                target="_blank"
              >
                the internship document
              </Link>
            ) : (
              "the internship document"
            )}
            .
          </h1>
        </div>

        {/* pending document preview */}
        {pendingDocumentId && (
          <Card className="p-4 text-sm">
            {loadingPending ? (
              <div className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading pending document…
              </div>
            ) : pendingErr ? (
              <div className="text-rose-600">Failed to load pending document.</div>
            ) : !pendingInfo ? (
              <div className="text-gray-600">No pending document data found.</div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="truncate text-sm">
                  Form name:{" "}
                  <span className="font-semibold">{pendingInfo.pendingInfo?.form_name}</span>
                </div>

                {pendingUrl ? (
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => window.open(pendingUrl, "_blank")}
                    aria-label="Open pending document"
                  >
                    Preview document
                  </Button>
                ) : (
                  <div className="text-sm text-gray-500">
                    A preview link isn’t available for this document.
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        <p className="text-sm text-gray-600">
          Please provide the required{" "}
          {audienceParam === "entity"
            ? "entity"
            : audienceParam === "student-guardian"
              ? "guardian"
              : "university"}{" "}
          details below.
        </p>

        {/* loading / error / empty / form */}
        {loadingForm ? (
          <Card className="flex items-center justify-center p-6">
            <span className="inline-flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading form…
            </span>
          </Card>
        ) : formErr ? (
          <Card className="p-6 text-sm text-rose-600">Failed to load fields.</Card>
        ) : fields.length === 0 ? (
          <Card className="p-6 text-sm text-gray-500">No fields available for this request.</Card>
        ) : (
          <Card className="space-y-4 p-4 sm:p-5">
            <DynamicForm
              source={party}
              fields={fields}
              values={values}
              onChange={setField}
              errors={errors}
              showErrors={submitted}
              formName={""}
              autofillValues={{}}
              setValues={(newValues) => setValues({ ...values, ...newValues })}
            />

            <div className="flex justify-end pt-2">
              <Button onClick={handleSubmit} disabled={busy} aria-busy={busy}>
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  "Submit & Sign"
                )}
              </Button>
            </div>
          </Card>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="size-4" />
          Your information is used only for internship documentation.
        </div>
      </div>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="mb-2">
              <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
            </div>
            <DialogTitle className="text-lg">{success?.title ?? "Success"}</DialogTitle>
            <DialogDescription className="text-sm">
              {success?.body ?? "Your submission was successful."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex w-full gap-2 sm:justify-center">
            {success?.href && (
              <Button asChild>
                <Link href={success.href} target="_blank" rel="noopener noreferrer">
                  Open signed document
                </Link>
              </Button>
            )}
            <Button
              variant={success?.href ? "outline" : "default"}
              onClick={() => onDialogOpenChange(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Page;
