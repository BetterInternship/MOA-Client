"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CheckCircle2, Loader2, Info } from "lucide-react";
import { getFormFields, approveSignatory, getPendingInformation } from "@/app/api/forms.api";
import { DynamicForm } from "@/components/docs/forms/RecipientDynamicForm";
import { FormMetadata, IFormMetadata } from "@betterinternship/core/forms";
import z from "zod";

type Audience = "entity" | "student-guardian" | "university";
type Party = "entity" | "student-guardian" | "university";
type Role = "entity" | "student-guardian" | "university";

function mapAudienceToRoleAndParty(aud: Audience): { role: Role; party: Party } {
  switch (aud) {
    case "entity":
      return { role: "entity", party: "entity" };
    case "student-guardian":
      return { role: "student-guardian", party: "student-guardian" };
    case "university":
      return { role: "university", party: "university" };
  }
}

function getClientSigningInfo() {
  if (typeof window === "undefined") return {};
  const nav = typeof navigator !== "undefined" ? navigator : ({} as Navigator);
  const scr = typeof screen !== "undefined" ? screen : ({} as Screen);

  // Optional: try to get WebGL vendor/renderer (best-effort)
  let webglVendor: string | undefined;
  let webglRenderer: string | undefined;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const dbgInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (dbgInfo) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        webglVendor = gl.getParameter(dbgInfo.UNMASKED_VENDOR_WEBGL);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        webglRenderer = gl.getParameter(dbgInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch {
    // ignore
  }

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const info = {
    timestamp: new Date().toISOString(),
    timezone: tz,
    tzOffsetMinutes: new Date().getTimezoneOffset(),
    languages: (nav.languages || []).slice(0, 5),
    userAgent: nav.userAgent,
    platform: nav.platform,
    vendor: nav.vendor,
    deviceMemory: (nav as any).deviceMemory ?? null,
    hardwareConcurrency: nav.hardwareConcurrency ?? null,
    doNotTrack: (nav as any).doNotTrack ?? null,
    referrer: document.referrer || null,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
    },
    screen: {
      width: scr.width,
      height: scr.height,
      availWidth: scr.availWidth,
      availHeight: scr.availHeight,
      colorDepth: scr.colorDepth,
    },
    // ipAddress: added server-side
    webgl: webglVendor || webglRenderer ? { vendor: webglVendor, renderer: webglRenderer } : null,
  };
  return info;
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

  // Optional header bits
  const studentName = params.get("student") || "The student";
  const templateHref = params.get("template") || "";

  const [lastValidValues, setLastValidValues] = useState<Record<string, string> | null>(null);
  const [authorizeChoice, setAuthorizeChoice] = useState<"yes" | "no">("yes");

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
  const pendingUrl = pendingInfo?.pendingInfo?.latest_document_url;

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

  // success modal
  const [successOpen, setSuccessOpen] = useState(false);
  const [success, setSuccess] = useState<{ title: string; body: string; href?: string } | null>(
    null
  );

  // Authorization modal
  const [authOpen, setAuthOpen] = useState(false);

  const setField = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value?.toString?.() ?? "" }));
  };

  const validateAndCollect = () => {
    const nextErrors: Record<string, string> = {};
    const flatValues: Record<string, string> = {};

    for (const field of fields) {
      if (field.party !== audienceParam) continue;

      const value = values[field.field];

      if (value !== undefined && value !== null && String(value).trim() !== "") {
        flatValues[field.field] = String(value);
      }

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
    return { nextErrors, flatValues };
  };

  async function submitWithAuthorization(choice: "yes" | "no") {
    if (!formName || !pendingDocumentId) return;

    const flatValues = lastValidValues ?? {};
    try {
      setBusy(true);
      const clientSigningInfo = getClientSigningInfo();

      const signatories: Record<string, { name: string; title: string }[]> = {
        entity: [
          {
            name: flatValues["entity.representative-full-name:default"],
            title: flatValues["entity.representative-title:default"],
          },
          {
            name: flatValues["entity.supervisor-full-name:default"],
            title: "HTE Internship Supervisor",
          },
        ],
        "student-guardian": [
          {
            name: flatValues["student.guardian-full-name:default"],
            title: "Student Guardian",
          },
        ],
      };

      const payload = {
        pendingDocumentId,
        signatories: signatories[audienceParam],
        party,
        values: flatValues,
        clientSigningInfo,
        // authorizeProfileSave: choice === "yes",
      };

      const res = await approveSignatory(payload);

      if (res?.approval?.signedDocumentUrl || res?.approval?.signedDocumentId) {
        setSuccess({
          title: "Submitted & Signed",
          body: "This document is now fully signed. You can download the signed copy below.",
          href: res.approval.signedDocumentUrl,
        });
      } else {
        setSuccess({
          title: "Details Submitted",
          body: "Thanks! Your details were submitted. We’ll notify you when the document is ready.",
        });
      }

      setSuccessOpen(true);
    } catch (e: any) {
      setSuccess({
        title: "Submission Failed",
        body: "Something went wrong while submitting your details.",
      });
      setSuccessOpen(true);
    } finally {
      setBusy(false);
    }
  }

  const onClickSubmitRequest = () => {
    setSubmitted(true);
    const { nextErrors, flatValues } = validateAndCollect();
    if (Object.keys(nextErrors).length > 0) {
      setAuthOpen(false);
      setLastValidValues(null);
      return;
    }
    setLastValidValues(flatValues);
    setAuthOpen(true);
  };

  const handleAuthorizeChoice = async (choice: "yes" | "no") => {
    setAuthorizeChoice(choice);
    setAuthOpen(false);
    await submitWithAuthorization(choice);
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
                  <span className="font-semibold">{pendingInfo.pendingInfo?.form_label}</span>
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
              party={party}
              fields={fields}
              values={values}
              onChange={setField}
              errors={errors}
              showErrors={submitted}
              formName={""}
              autofillValues={{}}
              setValues={(newValues) => setValues((prev) => ({ ...prev, ...newValues }))}
            />

            <div className="flex justify-end pt-2">
              <Button onClick={onClickSubmitRequest} disabled={busy} aria-busy={busy}>
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

        <div className="flex gap-2 text-xs text-gray-500">
          <Info className="size-8 lg:size-5" />
          By selecting Submit & Sign, I agree that the signature and initials will be the electronic
          representation of my signature and initials for all purposes when I (or my agent) use them
          on documents, including legally binding contracts
        </div>
      </div>

      {/* Success Dialog */}
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

          <div className="flex w-full justify-center gap-2 pt-1 pb-2">
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Authorization Dialog with explicit buttons; clicking either submits */}
      <Dialog open={authOpen} onOpenChange={setAuthOpen}>
        <DialogContent className="sm:max-w-lg sm:p-8">
          <DialogHeader>
            <DialogTitle className="mt-3">Permission to Auto-Fill & Auto-Sign</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4 text-sm">
                <p className="text-justify text-gray-700">
                  I authorize auto-fill and auto-sign of future school-issued templated documents on
                  my behalf. A copy of each signed document will be emailed to me.
                </p>

                <div className="flex w-full items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAuthorizeChoice("no")}
                    aria-pressed={authorizeChoice === "no"}
                    className="w-1/2"
                  >
                    No, I’ll sign manually for now
                  </Button>

                  <Button
                    type="button"
                    onClick={() => handleAuthorizeChoice("yes")}
                    aria-pressed={authorizeChoice === "yes"}
                    className="w-1/2"
                  >
                    Yes, auto-fill & auto-sign
                  </Button>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Page;
