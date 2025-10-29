"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { z, ZodTypeAny } from "zod";
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
import { getFormFields } from "@/app/api/forms.api";
import {
  RecipientDynamicForm,
  type RecipientFieldDef,
} from "@/components/docs/forms/RecipientDynamicForm";
import { useQuery } from "@tanstack/react-query";
import { getPendingInformation } from "@/app/api/forms.api";
import { useRouter } from "next/navigation";
import { approveSignatory } from "@/app/api/forms.api";

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

export default function Page() {
  const params = useSearchParams();
  const router = useRouter();

  // URL params
  const audienceParam = ((params.get("for") || "entity") as string).trim() as Audience;
  const { role, party } = mapAudienceToRoleAndParty(audienceParam);

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
  // @ts-ignore: API returns latest_document_url but the generated type does not include it
  const pendingUrl = (pendingInfo as any)?.latest_document_url;
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

  console.log("formRes", formRes);

  // Map returned schema into RecipientFieldDef[] and filter by source matching audienceParam.
  const fields: RecipientFieldDef[] = useMemo(() => {
    const rawSchema = (formRes as any)?.formFields?.formMetadata?.schema ?? [];
    if (!Array.isArray(rawSchema)) return [];

    return rawSchema
      .filter((s: any) => {
        // Normalize source info; accept string or array of strings
        const rawSource = s.source;
        if (!rawSource) {
          // If the field has no source defined, include it.
          return true;
        }
        const sources = Array.isArray(rawSource)
          ? rawSource.map((x: any) => String(x).trim())
          : String(rawSource)
              .split(",")
              .map((x) => x.trim());
        return sources.includes(audienceParam);
      })
      .map((s: any) => {
        const rawField = s.field ?? "";
        const key = rawField;
        const id = s.id;
        const label = s.label;
        const type = s.type ?? "text";

        const validators: ZodTypeAny[] = [];

        // If API returns a validator string like "z.string()" attempt to evaluate it.
        // This is intentionally conservative: we only provide z as the context.
        try {
          const validatorRaw = s.validator ?? null;
          if (typeof validatorRaw === "string" && validatorRaw.trim()) {
            // eslint-disable-next-line no-new-func
            const fn = new Function("z", `return (${validatorRaw})`);
            const zschema = fn(z);
            if (zschema && typeof (zschema as any).safeParse === "function") {
              validators.push(zschema as ZodTypeAny);
            }
          } else if (Array.isArray(validatorRaw)) {
            for (const v of validatorRaw) {
              if (typeof v === "string") {
                try {
                  // eslint-disable-next-line no-new-func
                  const fn2 = new Function("z", `return (${v})`);
                  const zschema2 = fn2(z);
                  if (zschema2 && typeof (zschema2 as any).safeParse === "function") {
                    validators.push(zschema2 as ZodTypeAny);
                  }
                } catch (e) {
                  console.warn("Failed to parse validator array item", v, e);
                }
              } else if (v && typeof v.safeParse === "function") {
                validators.push(v as ZodTypeAny);
              }
            }
          } else if (validatorRaw && typeof validatorRaw.safeParse === "function") {
            validators.push(validatorRaw as ZodTypeAny);
          }
        } catch (e) {
          console.warn("Failed to evaluate validator for field", key, e);
        }

        const options =
          Array.isArray(s.options) && s.options.length
            ? s.options.map((o: any) => ({
                value: o?.value ?? o,
                label: o?.label ?? o,
              }))
            : undefined;

        return {
          id,
          key,
          label,
          type,
          section: s.section ?? null,
          placeholder: s.placeholder ?? undefined,
          helper: s.helper ?? undefined,
          maxLength: s.maxLength ?? undefined,
          options,
          validators,
          params: s.params ?? undefined,
        } as RecipientFieldDef;
      });
  }, [formRes, audienceParam]);

  // local form state
  const [values, setValues] = useState<Record<string, any>>({});
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

  const setField = (k: string, v: any) => setValues((p) => ({ ...p, [k]: v }));

  const validatorFns = useMemo(() => compileValidators(fields), [fields]);

  const validateNow = () => {
    const next = validateAll(fields, values, validatorFns);
    setErrors(next);
    return Object.values(next).every((m) => !m);
  };

  // Section titles per audience
  const sectionTitleMap = {
    entity: "Entity Information",
    university: "University Information",
    student: "Student Information",
    "student-guardian": "Guardian Information",
    internship: "Internship Information",
  };

  async function handleSubmit() {
    setSubmitted(true);

    if (!formName || !pendingDocumentId) return;
    if (!validateNow()) return;

    // Flatten the fields present on this page
    const flatValues: Record<string, string> = {};
    for (const f of fields) {
      const v = values[f.key];
      if (v === undefined || v === null) continue;
      const s = typeof v === "string" ? v : String(v);
      if (s !== "undefined") flatValues[f.key] = s;
    }

    try {
      setBusy(true);
      const res = await approveSignatory({
        pendingDocumentId,
        signatoryName,
        signatoryTitle,
        party,
        values: flatValues,
      });

      const data = res?.data;

      if (data?.signedDocumentUrl) {
        setSuccess({
          title: "Submitted & Signed",
          body: "This document is now fully signed. You can download the signed copy below.",
          href: data.signedDocumentUrl,
        });
      } else {
        setSuccess({
          title: "Details Submitted",
          body:
            data?.message ??
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
  }

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
                  Form name: <span className="font-semibold">{pendingInfo.form_name}</span>
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
            <RecipientDynamicForm
              formKey={`recipient:${audienceParam}:${formName || "unknown"}`}
              fields={fields}
              values={values}
              onChange={setField}
              errors={errors}
              showErrors={submitted}
              sectionTitleMap={sectionTitleMap}
              emptyHint="All required fields for you have been completed."
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

/* ───────── helpers ───────── */

function compileValidators(defs: RecipientFieldDef[]) {
  const isEmpty = (v: any) =>
    v === undefined ||
    v === null ||
    (typeof v === "string" && v.trim() === "") ||
    (Array.isArray(v) && v.length === 0);

  const requiredCheckFor = (d: RecipientFieldDef) => {
    switch ((d.type || "text").toLowerCase()) {
      case "signature":
      case "checkbox":
        return (v: any) => (v === true ? null : "This field is required.");
      case "number":
        return (v: any) => {
          const s = v == null ? "" : String(v).trim();
          if (s === "") return "This field is required.";
          const n = Number(s);
          return Number.isFinite(n) ? null : "Enter a valid number.";
        };
      case "date":
        return (v: any) => (typeof v === "number" && v > 0 ? null : "Please select a date.");
      case "time":
        return (v: any) => {
          const s = v == null ? "" : String(v).trim();
          return s ? null : "Please select a time.";
        };
      case "select":
      case "reference":
        return (v: any) => {
          const s = v == null ? "" : String(v).trim();
          return s ? null : "Please choose an option.";
        };
      default:
        return (v: any) => (!isEmpty(v) ? null : "This field is required.");
    }
  };

  const map: Record<string, ((v: any) => string | null)[]> = {};

  for (const d of defs) {
    const fns: ((v: any) => string | null)[] = [];
    fns.push(requiredCheckFor(d));

    for (const schema of d.validators ?? []) {
      const zschema = schema as ZodTypeAny;
      fns.push((value: any) => {
        const res = zschema.safeParse(value);
        if (res.success) return null;
        const issues = (res.error as any)?.issues as { message: string }[] | undefined;
        return issues?.map((i) => i.message).join("\n") ?? res.error.message;
      });
    }

    map[d.key] = fns;
  }

  return map;
}

function validateAll(
  defs: RecipientFieldDef[],
  values: Record<string, any>,
  validatorFns: Record<string, ((v: any) => string | null)[]>
) {
  const next: Record<string, string> = {};
  for (const d of defs) {
    const fns = validatorFns[d.key] ?? [];
    const val = values[d.key];
    const firstErr = fns.map((fn) => fn(val)).find(Boolean) ?? "";
    next[d.key] = firstErr || "";
  }
  return next;
}
