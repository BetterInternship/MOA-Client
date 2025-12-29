"use client";

import React, { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Info } from "lucide-react";
import {
  getFormFields,
  approveSignatory,
  getPendingInformation,
  ApproveSignatoryRequest,
} from "@/app/api/forms.api";
import { FormRenderer } from "@/components/docs/forms/FormRenderer";
import { FormMetadata, IFormMetadata } from "@betterinternship/core/forms";
import z from "zod";
import { useModal } from "@/app/providers/modal-provider";
import { DocumentRenderer } from "@/components/docs/forms/previewer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useSignatoryAccountActions } from "@/app/api/signatory.api";
import Link from "next/link";
import { useFormRendererContext } from "@/components/docs/forms/form.ctx";
import { useSignatoryProfile } from "../auth/provider/signatory.ctx";

type Audience = "entity" | "student-guardian" | "university";
type Party = "entity" | "student-guardian" | "university" | "";
type Role = "entity" | "student-guardian" | "university" | "";

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
  // ! WARNING, FACTOR THIS OUT: this allows editing form, and can be an exploit in the future
  const form = useFormRendererContext();
  const profile = useSignatoryProfile();
  const { openModal, closeModal } = useModal();
  const { update } = useSignatoryAccountActions();

  // For mobile
  const isMobile = useIsMobile();
  const [mobileStage, setMobileStage] = useState<"preview" | "form" | "confirm">("preview");
  const [lastFlatValues, setLastFlatValues] = useState<Record<string, string> | null>(null);

  // URL params
  const audienceParam = (params.get("for") || "entity").trim() as Audience;
  const { party } = mapAudienceToRoleAndParty(audienceParam);

  const formName = (params.get("form") || "").trim();
  const pendingDocumentId = (params.get("pending") || "").trim();

  // Optional header bits
  const studentName = params.get("student") || "The student";

  // Pending document preview
  const { data: pendingRes } = useQuery({
    queryKey: ["pending-info", pendingDocumentId],
    queryFn: () => getPendingInformation(pendingDocumentId),
    staleTime: 60_000,
    enabled: !!pendingDocumentId,
  });

  // Saved autofill
  const autofillValues = useMemo(() => {
    const profileAutofill = profile.autofill as Record<string, Record<string, string>>;
    if (!profileAutofill) return;

    // Destructure to isolate only shared fields or fields for that form
    const autofillValues = {
      ...(profileAutofill.base ?? {}),
      ...profileAutofill.shared,
      ...(profileAutofill[formName] ?? {}),
    };

    return autofillValues;
  }, [profile, formName]) as Record<string, string>;

  const pendingInfo = pendingRes?.pendingInformation;
  const pendingUrl = pendingInfo?.pendingInfo?.latest_document_url as string;
  const audienceAllowed = true;

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
    ? new FormMetadata(DUMMY_FORM_METADATA ?? (formRes?.formMetadata as unknown as IFormMetadata))
    : null;
  const fields = formMetadata?.getFieldsForClientService() ?? [];
  const blocks = formMetadata?.getBlocksForClientService() ?? [];

  // local form state
  const [previews, setPreviews] = useState<Record<number, React.ReactNode[]>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setMobileStage("preview");
    } else {
      setMobileStage("form");
    }
  }, [isMobile]);

  const setField = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value?.toString?.() ?? "" }));
  };

  const validateAndCollect = () => {
    const nextErrors: Record<string, string> = {};
    const flatValues: Record<string, string> = {};

    for (const field of fields) {
      // ! add this back, check if field is for person signing
      // ! note signingPartyId is sent by the server to the client, not the other way around
      // ! the person signing should not be able to specify it in the url
      // if (field.signing_party_id !== signingPartyId) continue;
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

  const [agreed, setAgreed] = useState<boolean>(false);
  const onClickSubmitRequest = () => {
    setSubmitted(true);
    const { nextErrors, flatValues } = validateAndCollect();
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLastFlatValues(flatValues);

    if (isMobile) {
      // On mobile, move to confirm preview stage instead of immediately asking for authorization
      setMobileStage("confirm");
      // scroll to top so preview is visible
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    openModal(
      "sign-auth",
      <SignAuthModalContent
        initial={agreed}
        onClose={() => closeModal("sign-auth")}
        onConfirm={(val) => {
          setAgreed(val);
          handleAuthorizeChoice(flatValues ?? {});
        }}
      />,
      { title: "Permission to e-sign", panelClassName: "sm:min-w-xl" }
    );
  };

  async function submitWithAuthorization(flatValuesParam?: Record<string, string>) {
    const flatValues = flatValuesParam ?? lastFlatValues;
    if (!formName || !pendingDocumentId || !party || !flatValues) return;
    try {
      setBusy(true);
      const clientSigningInfo = getClientSigningInfo();

      const signatories: Record<string, ApproveSignatoryRequest["signatories"]> = {};

      const finalValues = flatValues ?? {};
      const internshipMoaFieldsToSave: Record<string, Record<string, string>> = {
        shared: {},
      };

      // To save their autofill fields
      for (const field of fields) {
        // ! put this back as well
        // if (field.signing_party_id !== signingPartyId) continue;

        if (field.shared) {
          internshipMoaFieldsToSave.shared[field.field] = finalValues[field.field];
        } else {
          if (!internshipMoaFieldsToSave[formName]) {
            internshipMoaFieldsToSave[formName] = {};
          }
          internshipMoaFieldsToSave[formName][field.field] = finalValues[field.field];
        }
      }

      await update.mutateAsync({
        autofill: internshipMoaFieldsToSave,
        auto_form_permissions: {
          [formName]: {
            enabled: false,
            party: party,
          },
        },
      });

      const payload = {
        pendingDocumentId,
        signatories: signatories[audienceParam],
        party,
        values: flatValues,
        clientSigningInfo,
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
        <div className="flex flex-col items-center justify-center space-y-4 p-4 text-center">
          {/* Animated success icon */}
          <div className="grid h-24 w-24 animate-[pop_420ms_ease-out] place-items-center rounded-full border-4 border-emerald-200">
            <svg
              className="h-12 w-12 text-emerald-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" className="animate-[draw_420ms_ease-out_120ms_forwards]" />
            </svg>
          </div>

          {/* Success message */}
          <div className="text-base font-medium text-gray-800">{succ.body}</div>
          <Button onClick={() => (window.location.href = "/dashboard")} className="w-full">
            Close
          </Button>

          <style jsx>{`
            @keyframes pop {
              0% {
                transform: scale(0.8);
                opacity: 0.2;
              }
              100% {
                transform: scale(1);
                opacity: 1;
              }
            }
            @keyframes draw {
              0% {
                stroke-dasharray: 0 32;
                opacity: 1;
              }
              100% {
                stroke-dasharray: 32 0;
                opacity: 1;
              }
            }
          `}</style>
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

  const handleAuthorizeChoice = async (flatValues: Record<string, string> | undefined) => {
    closeModal("sign-auth");
    await submitWithAuthorization(flatValues);
  };

  const goHome = () => router.push("/dashboard");

  const docUrl = pendingUrl || form.document?.url;

  const openDocPreviewModal = () => {
    if (!docUrl) return;
    openModal(
      "doc-preview",
      <div className="h-[95dvh] w-[95dvw] sm:w-[80vw]">
        <DocumentRenderer
          documentUrl={docUrl}
          highlights={[]}
          previews={previews}
          onHighlightFinished={() => {}}
        />
      </div>,
      { title: "Document Preview" }
    );
  };

  // Update form data if ever
  useEffect(() => {
    if (!!formName && (!!formVersion || formVersion === 0)) {
      form.updateFormName(formName);
      form.updateFormVersion(formVersion);
    }
  }, [formName, formVersion, formRes]);

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
        <div className="relative max-h-[100%] overflow-y-auto">
          {/* Form Renderer */}
          <div className="h-full max-h-[100%] space-y-4 overflow-y-auto rounded-[0.33em] border border-gray-300 p-5">
            <div className={cn("mb-2 sm:hidden", mobileStage === "preview" ? "" : "hidden")}>
              <div className="relative w-full overflow-auto rounded-md border">
                {docUrl ? (
                  <DocumentRenderer
                    documentUrl={docUrl}
                    highlights={[]}
                    previews={previews}
                    onHighlightFinished={() => {}}
                  />
                ) : (
                  <div className="p-4 text-sm text-gray-500">No preview available</div>
                )}
              </div>

              <div className="mt-2 flex gap-2">
                <Button
                  className="w-full"
                  onClick={() => setMobileStage("form")}
                  disabled={!audienceAllowed || loadingForm}
                >
                  Fill Form
                </Button>
              </div>
            </div>

            {/* Mobile: confirm preview stage */}
            <div className={cn("sm:hidden", mobileStage === "confirm" ? "" : "hidden")}>
              <div className="relative h-[60vh] w-full overflow-auto rounded-md border">
                {docUrl ? (
                  <DocumentRenderer
                    documentUrl={docUrl}
                    highlights={[]}
                    previews={previews}
                    onHighlightFinished={() => {}}
                  />
                ) : (
                  <div className="p-4 text-sm text-gray-500">No preview available</div>
                )}
              </div>
              <div className="mt-2 flex gap-2">
                <Button className="w-full" variant="outline" onClick={() => setMobileStage("form")}>
                  Back to Edit
                </Button>
                <Button
                  onClick={() => {
                    // open the same authorization modal as desktop, using lastFlatValues
                    const flatValues = lastFlatValues ?? {};
                    openModal(
                      "sign-auth",
                      <div className="space-y-4 text-sm">
                        <p className="text-justify text-gray-700">
                          I authorize auto-fill and auto-sign of future school-issued templated
                          documents on my behalf. A copy of each signed document will be emailed to
                          me.
                        </p>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void handleAuthorizeChoice(flatValues ?? {})}
                            className="w-full"
                          >
                            No, I’ll sign manually for now
                          </Button>

                          <Button
                            type="button"
                            onClick={() => void handleAuthorizeChoice(flatValues ?? {})}
                            className="w-full"
                          >
                            Yes, auto-fill & auto-sign
                          </Button>
                        </div>
                      </div>,
                      { title: "Permission to Auto-Fill & Auto-Sign" }
                    );
                  }}
                  className="w-full"
                >
                  Submit & Sign
                </Button>
              </div>
            </div>

            <div className={cn(mobileStage === "form" ? "" : "hidden", "sm:block")}>
              {/* loading / error / empty / form */}
              {loadingForm ? (
                <div className="flex items-center justify-center">
                  <span className="inline-flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading form…
                  </span>
                </div>
              ) : formErr ? (
                <div className="text-sm text-rose-600">Failed to load fields.</div>
              ) : !audienceAllowed ? (
                <>
                  This form is not available. If you believe this is an error, please contact
                  support.
                </>
              ) : fields.length === 0 ? (
                <div className="text-sm text-gray-500">No fields available for this request.</div>
              ) : (
                <div className="space-y-4">
                  <FormRenderer
                    signingPartyId={party || "student"}
                    fields={fields}
                    blocks={blocks}
                    values={values}
                    pendingUrl={pendingUrl}
                    onChange={setField}
                    errors={errors}
                    formName={""}
                    autofillValues={autofillValues}
                    setValues={(newValues) => setValues((prev) => ({ ...prev, ...newValues }))}
                    setPreviews={setPreviews}
                  />

                  <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                    <Button
                      onClick={onClickSubmitRequest}
                      disabled={busy}
                      aria-busy={busy}
                      className="w-full sm:w-auto"
                    >
                      {busy ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting…
                        </span>
                      ) : (
                        "Submit & Sign"
                      )}
                    </Button>

                    {/* On mobile, also show a secondary preview button */}
                    <Button
                      variant="ghost"
                      onClick={() => {
                        // On mobile while editing, allow quick jump to preview stage
                        if (isMobile) {
                          setMobileStage("preview");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        } else {
                          openDocPreviewModal();
                        }
                      }}
                      disabled={!docUrl}
                      className="w-full sm:hidden"
                    >
                      Open Preview
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-5 flex items-start gap-2 text-xs text-gray-500">
                <Info className="mt-1 h-3 w-3 flex-shrink-0" />
                <div>
                  By selecting Submit & Sign, I agree that the signature and initials will be the
                  electronic representation of my signature and initials for all purposes when I (or
                  my agent) use them on documents, including legally binding contracts
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PDF Renderer - hidden on small screens, visible on sm+ */}
        <div className="relative hidden max-w-[600px] min-w-[600px] overflow-auto sm:block">
          {!loadingForm && audienceAllowed ? (
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

function SignAuthModalContent({
  initial,
  onClose,
  onConfirm,
}: {
  initial: boolean;
  onClose: () => void;
  onConfirm: (value: boolean) => void;
}) {
  const [localAgreed, setLocalAgreed] = useState<boolean>(initial);

  return (
    <div className="space-y-4">
      <p className="text-justify text-gray-700">
        Please read the{" "}
        <Link
          className="text-primary underline"
          href="/sign/disclosure"
          target="_blank"
          rel="noreferrer"
        >
          Electronic Record and Signature Disclosure
        </Link>
      </p>

      {/* TODO: LOL will integrate our checkbox here. For some reason refuses to work or im prolly dumb */}
      <div className="flex items-start gap-2">
        <input
          id="agree-e-sign"
          type="checkbox"
          checked={localAgreed}
          onChange={(e) => setLocalAgreed(e.target.checked)}
          className="focus:ring-primary mt-1 h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="agree-e-sign" className="cursor-pointer text-gray-700 select-none">
          I agree to use electronic records and signatures{" "}
          <span className="text-destructive"> *</span>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button type="button" variant="outline" onClick={() => onClose()} className="w-full">
          Cancel
        </Button>

        <Button
          type="button"
          onClick={() => {
            onConfirm(localAgreed);
          }}
          className="w-full"
          disabled={!localAgreed}
        >
          Yes, confirm and e-sign
        </Button>
      </div>
    </div>
  );
}

// Helpers
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
    webgl: webglVendor || webglRenderer ? { vendor: webglVendor, renderer: webglRenderer } : null,
  };
  return info;
}

export default Page;
