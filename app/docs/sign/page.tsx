"use client";

import React, { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Info } from "lucide-react";
import Link from "next/link";
import z from "zod";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { approveSignatory, getPendingInformation } from "@/app/api/forms.api";
import { FormRenderer } from "@/components/docs/forms/FormRenderer";
import { useModal } from "@/app/providers/modal-provider";
import { DocumentRenderer } from "@/components/docs/forms/previewer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFormRendererContext } from "@/components/docs/forms/form-renderer.ctx";
import { getClientAudit } from "@/lib/audit";
import { useSignatoryAccountActions } from "@/app/api/signatory.api";
import { useSignatoryProfile } from "../auth/provider/signatory.ctx";
import { useMyAutofill } from "@/hooks/use-my-autofill";

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
  const { openModal, closeModal } = useModal();
  const { update } = useSignatoryAccountActions();

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

  // Fields
  const fields = form.formMetadata?.getFieldsForClientService() ?? [];
  const blocks = form.formMetadata?.getBlocksForClientService() ?? [];

  // local form state
  const [previews, setPreviews] = useState<Record<number, React.ReactNode[]>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const setField = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value?.toString?.() ?? "" }));
  };

  // !
  // !
  // !
  // ! COPY OVER COMPONENTS AND UTILS FROM BI CLIENT FOR FORM FILLING AND SHIT
  // !
  // !
  // !
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
    if (!formName || !formProcessId || !flatValues) return;
    try {
      setBusy(true);
      const clientAudit = getClientAudit();
      const finalValues = flatValues ?? {};
      const internshipMoaFieldsToSave: Record<string, Record<string, string>> = {
        shared: {},
      };

      // To save their autofill fields
      for (const field of fields) {
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
          },
        },
      });

      const payload = {
        pendingFormId: formProcessId,
        values: flatValues,
        clientSigningInfo: clientAudit,
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
          <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-emerald-200">
            <svg
              className="h-12 w-12 text-emerald-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          {/* Success message */}
          <div className="text-base font-medium text-gray-800">{succ.body}</div>
          <Button onClick={() => (window.location.href = "/dashboard")} className="w-full">
            Close
          </Button>
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

export default Page;
