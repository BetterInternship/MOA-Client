// app/docs/page.tsx
"use client";

import { useState } from "react";
import { z } from "zod";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { VerificationResponse } from "@/types/docs";
import { VerificationDetailsCard } from "@/components/docs/VerificationDetailsCard";
import { PdfViewerPanel } from "@/components/docs/PdfViewerPanel";
import { NotFoundCard } from "@/components/docs/NotFoundCard";
import { SerialInput } from "@/components/docs/SerialInput";

const SerialSchema = z
  .string()
  .trim()
  .regex(
    /^\d{10}-\d{10}-\d{10}$/,
    "Serial must be 10-10-10 digits (e.g., 1691769600-1234567890-0987654321)"
  );

export default function VerifyDocsPage() {
  const [serial, setSerial] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasValid = !!result && result.status !== "not_found";

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const parsed = SerialSchema.safeParse(serial);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid serial");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/docs/verify?serial=${encodeURIComponent(parsed.data)}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Request failed");
      const data = (await res.json()) as VerificationResponse;
      setResult(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-screen-2xl px-4 py-6">
      {/* FORM: centered on first load; pinned to top after search */}
      {!hasValid ? (
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
              <SerialInput
                value={serial}
                onChange={(v) => setSerial(v)}
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
            <SerialInput
              value={serial}
              onChange={(v) => setSerial(v)}
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
      {hasValid ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
          {/* Left: document data */}
          <div>
            <VerificationDetailsCard result={result} />
          </div>
          {/* Right: PDF viewer */}
          <div className="sticky top-24 self-start">
            <PdfViewerPanel
              title={result.documentTitle}
              viewUrl={result.viewUrl}
              downloadUrl={"downloadUrl" in result ? result.downloadUrl : undefined}
            />
          </div>
        </div>
      ) : result?.status === "not_found" ? (
        <div className="mx-auto max-w-2xl">
          <NotFoundCard />
        </div>
      ) : null}
    </section>
  );
}

function Form({
  serial,
  setSerial,
  loading,
  onSubmit,
}: {
  serial: string;
  setSerial: (v: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="w-full">
      {/* Title (header on the form) */}
      <div className="mb-6 space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Verify a DLSU Document</h1>
        <p className="text-muted-foreground text-sm">
          Enter the <strong>Serial Number</strong> printed on the document to check its
          authenticity.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <Input
          placeholder="1691769600-1234567890-0987654321"
          value={serial}
          onChange={(e) => setSerial(e.target.value.trim())}
          inputMode="numeric"
          pattern="\d{10}-\d{10}-\d{10}"
          autoComplete="off"
          aria-label="Serial number"
          className="h-11 flex-1"
        />

        <Button type="submit" className="h-11 sm:w-40" disabled={loading}>
          <Search className="mr-2 h-4 w-4" /> {loading ? "Verifying…" : "Verify"}
        </Button>
      </form>
    </div>
  );
}
