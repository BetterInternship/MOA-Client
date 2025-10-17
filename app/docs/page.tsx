// app/docs/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { z } from "zod";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VerificationDetailsCard } from "@/components/docs/VerificationDetailsCard";
import { PdfViewerPanel } from "@/components/docs/PdfViewerPanel";
import { useDocsControllerGetByVerificationCode } from "../api";
import { SignedDocument } from "@/types/db";
import { useSearchParams } from "next/navigation";

const SerialSchema = z
  .string()
  .trim()
  .regex(
    /^\d{10}-[A-Fa-f0-9]{8}-[A-Fa-f0-9]{8}$/,
    "Serial must be 10-8-8 characters (e.g., 1234567890-aaaaaaaa-bbbbbbbb)"
  );

export default function VerifyDocsPage() {
  return (
    <Suspense>
      <VerifyDocsPageContent />
    </Suspense>
  );
}

function VerifyDocsPageContent() {
  const [serial, setSerial] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SignedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const signedDocument = useDocsControllerGetByVerificationCode(serial);
  const searchParams = useSearchParams();

  useEffect(() => {
    const verificationCode = searchParams.get("verification-code");
    if (verificationCode) setSerial(verificationCode);
  }, [searchParams]);

  useEffect(() => {
    const doc = signedDocument.data?.signedDocument;
    if (doc) setResult(doc ?? ({} as SignedDocument));
    setLoading(signedDocument.isFetching);
  }, [signedDocument]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const parsed = SerialSchema.safeParse(serial);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid serial");
      return;
    }
  }

  return (
    <section className="mx-auto w-full max-w-screen-2xl px-4 py-6">
      {/* FORM: centered on first load; pinned to top after search */}
      {!result ? (
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="w-full">
            {/* Header on the form */}
            <div className="mb-6 space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                BetterInternship Document Verifier
              </h1>
              <p className="text-muted-foreground text-sm">
                Enter the <strong>Serial Number</strong> printed on the document to check its
                authenticity.
              </p>
            </div>

            <form
              onSubmit={handleVerify}
              className="mx-auto flex w-full max-w-md flex-col gap-3 sm:flex-row"
            >
              <Input
                value={serial}
                placeholder="0123456789-0123abcd-4567defa"
                onChange={(v) => (setSerial(v.target.value), setResult(null))}
                aria-invalid={!!error}
                className="h-12 flex-1 font-mono"
              />
              <Button type="submit" className="h-11 sm:w-40" disabled={loading}>
                <Search className="mr-2 h-4 w-4" /> {loading ? "Verifying…" : "Verify"}
              </Button>
            </form>

            {error && (
              <p className="mt-2 text-center text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-6">
          {/* Header stays above the form when pinned */}
          <div className="mb-3 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              BetterInternship Document Verifier
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter the <strong>Serial Number</strong> printed on the document to check its
              authenticity.
            </p>
          </div>

          <form
            onSubmit={handleVerify}
            className="mx-auto flex w-full max-w-md flex-col gap-3 sm:flex-row"
          >
            <Input
              value={serial}
              onChange={(v) => setSerial(v.target.value)}
              aria-invalid={!!error}
              className="flex-1"
            />
            <Button type="submit" className="h-11 sm:w-40" disabled={loading}>
              <Search className="mr-2 h-4 w-4" /> {loading ? "Verifying…" : "Verify"}
            </Button>
          </form>
          {error && (
            <p className="mt-2 text-center text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
      )}

      {/* RESULTS */}
      {!!result ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
          {/* Left: document data */}
          <div>
            <VerificationDetailsCard signedDocument={result as SignedDocument} />
          </div>
          {/* Right: PDF viewer */}
          <div className="sticky top-24 self-start">
            <PdfViewerPanel
              title={"Memorandum of Agreement"}
              viewUrl={result.url}
              downloadUrl={result.url}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
