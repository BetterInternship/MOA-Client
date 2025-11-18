"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Info } from "lucide-react";
import { getFormFields, approveSignatory, getPendingInformation } from "@/app/api/forms.api";
import { DynamicForm } from "@/components/docs/forms/RecipientDynamicForm";
import { FormMetadata, IFormMetadata } from "@betterinternship/core/forms";
import z from "zod";
import { useModal } from "@/app/providers/modal-provider";
import { DocumentRenderer } from "@/components/docs/forms/previewer";
import { useFormContext } from "../ft2mkyEVxHrAJwaphVVSop3TIau0pWDq/editor/form.ctx";
import { cn } from "@/lib/utils";
import { FormLabel } from "@/components/ui/form";

type Audience = "entity" | "student-guardian" | "university";
type Party = "entity" | "student-guardian" | "university" | "";
type Role = "entity" | "student-guardian" | "university" | "";

function mapAudienceToRoleAndParty(aud: Audience): { role: Role; party: Party } {
  switch (aud) {
    case "entity":
      return { role: "entity", party: "entity" };
    case "student-guardian":
      return { role: "student-guardian", party: "student-guardian" };
    case "university":
      return { role: "university", party: "university" };
    default:
      return { role: "", party: "" };
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
  const form = useFormContext();
  const { openModal, closeModal } = useModal();

  // URL params
  const audienceParam = (params.get("for") || "entity").trim() as Audience;
  const { party } = mapAudienceToRoleAndParty(audienceParam);

  const formName = (params.get("form") || "").trim();
  const pendingDocumentId = (params.get("pending") || "").trim();

  // Optional header bits
  const studentName = params.get("student") || "The student";
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
  const pendingUrl = pendingInfo?.pendingInfo?.latest_document_url as string;

  const audienceFromPending: string[] = (pendingInfo?.pendingInfo?.pending_parties ?? [])
    .map((p) => (typeof p === "string" ? p : (p?.party ?? "")))
    .filter(Boolean) as string[];
  const audienceAllowed = audienceFromPending.includes(audienceParam);

  // Fetch form fields schema from API
  const {
    data: formRes,
    isLoading: loadingForm,
    error: formErr,
  } = useQuery({
    queryKey: ["form-fields", formName],
    queryFn: () => getFormFields(formName),
    enabled: !!formName,
    staleTime: 1000,
  });

  // Fields
  const formVersion: number | undefined = formRes?.formVersion;
  const formMetadata: FormMetadata<any> | null = formRes?.formMetadata
    ? new FormMetadata(formRes?.formMetadata as unknown as IFormMetadata)
    : null;
  const fields = formMetadata?.getFieldsForClient() ?? [];

  // local form state
  const [previews, setPreviews] = useState<Record<number, React.ReactNode[]>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

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

  async function submitWithAuthorization(choice: "yes" | "no", flatValues: Record<string, string>) {
    if (!formName || !pendingDocumentId || !party) return;
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

      const succ =
        res?.approval?.signedDocumentUrl || res?.approval?.signedDocumentId
          ? {
              title: "Submitted & Signed",
              body: "This document is now fully signed. You can download the signed copy below.",
              href: res.approval.signedDocumentUrl,
            }
          : {
              title: "Details Submitted",
              body: "Thanks! Your details were submitted. We’ll notify you when the document is ready.",
            };

      openModal(
        "sign-success",
        <div className="p-2 text-center">
          <div className="mb-2">
            <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
          </div>
          <div className="text-sm">{succ.body}</div>
          <div className="flex w-full justify-center gap-2 pt-4">
            <Button
              variant={succ.href ? "outline" : "default"}
              onClick={() => closeModal("sign-success")}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>,
        {
          panelClassName: "sm:max-w-md",
          onClose: goHome,
          hasClose: false,
          allowBackdropClick: false,
          closeOnEsc: false,
        }
      );
    } catch (e: any) {
      console.error(e);
      const fail = {
        title: "Submission Failed",
        body: "Something went wrong while submitting your details.",
      };
      openModal(
        "sign-success",
        <div className="text-center">
          <div className="mb-2">
            <CheckCircle2 className="mx-auto h-16 w-16 text-rose-500" />
          </div>
          <div className="text-sm">{fail.body}</div>
          <div className="flex w-full justify-center gap-2 pt-4">
            <Button onClick={() => closeModal("sign-success")}>Close</Button>
          </div>
        </div>,
        { panelClassName: "sm:max-w-md", onClose: goHome }
      );
    } finally {
      setBusy(false);
    }
  }

  const onClickSubmitRequest = () => {
    setSubmitted(true);
    const { nextErrors, flatValues } = validateAndCollect();
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    openModal(
      "sign-auth",
      <div className="space-y-4 text-sm">
        <p className="text-justify text-gray-700">
          I authorize auto-fill and auto-sign of future school-issued templated documents on my
          behalf. A copy of each signed document will be emailed to me.
        </p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleAuthorizeChoice("no", flatValues ?? {})}
            aria-pressed={authorizeChoice === "no"}
            className="w-full"
          >
            No, I’ll sign manually for now
          </Button>

          <Button
            type="button"
            onClick={() => void handleAuthorizeChoice("yes", flatValues ?? {})}
            aria-pressed={authorizeChoice === "yes"}
            className="w-full"
          >
            Yes, auto-fill & auto-sign
          </Button>
        </div>
      </div>,
      { title: "Permission to Auto-Fill & Auto-Sign" }
    );
  };

  const handleAuthorizeChoice = async (
    choice: "yes" | "no",
    flatValues: Record<string, string>
  ) => {
    setAuthorizeChoice(choice);
    closeModal("sign-auth");
    await submitWithAuthorization(choice, flatValues);
  };

  const goHome = () => router.push("/");

  // Update form data if ever
  useEffect(() => {
    if (!!formName && (!!formVersion || formVersion === 0)) {
      form.updateFormName(formName);
      form.updateFormVersion(formVersion);
    }
  }, [formName, formVersion, formRes]);

  return (
    <div className="container mx-auto space-y-4 px-4 pt-8">
      <div>
        <h2 className="text-justify tracking-tight">
          Internship Document Fill-out Request from{" "}
          <span className="font-semibold">{studentName}</span>
        </h2>
        <h1 className="text-primary text-justify text-3xl font-bold tracking-tight">
          {pendingInfo?.pendingInfo?.form_label}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-x-8">
        {/* Form Renderer */}
        <div className="space-y-6">
          {/* loading / error / empty / form */}
          {loadingForm ? (
            <Card className="flex items-center justify-center p-6">
              <span className="inline-flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading form…
              </span>
            </Card>
          ) : formErr ? (
            <Card className="p-4 text-sm text-rose-600">Failed to load fields.</Card>
          ) : !audienceAllowed ? (
            <Card className="p-4 text-sm text-gray-600">
              This form is not available. If you believe this is an error, please contact support.
            </Card>
          ) : fields.length === 0 ? (
            <Card className="p-4 text-sm text-gray-500">No fields available for this request.</Card>
          ) : (
            <Card className="space-y-4 rounded-none! p-4 sm:p-5">
              <DynamicForm
                party={party}
                fields={fields}
                values={values}
                pendingUrl={pendingUrl}
                onChange={setField}
                errors={errors}
                showErrors={submitted}
                formName={""}
                autofillValues={{}}
                setValues={(newValues) => setValues((prev) => ({ ...prev, ...newValues }))}
                setPreviews={setPreviews}
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

          <div className="mb-4 flex gap-2 text-xs text-gray-500">
            <Info className="size-8 lg:size-5" />
            By selecting Submit & Sign, I agree that the signature and initials will be the
            electronic representation of my signature and initials for all purposes when I (or my
            agent) use them on documents, including legally binding contracts
          </div>
        </div>

        {/* PDF Renderer */}
        <div className="relative h-[70svh] w-full overflow-hidden">
          {!loadingForm && audienceAllowed ? (
            <div className="absolute flex h-full w-full flex-row gap-2">
              {(!!pendingUrl || !!form.document.url) && (
                <DocumentRenderer
                  documentUrl={pendingUrl || form.document.url}
                  highlights={[]}
                  previews={previews}
                  onHighlightFinished={() => {}}
                />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Page;
