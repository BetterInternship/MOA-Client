// src/components/moa/auth/CompanyRegisterForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Progress } from "@/components/ui/progress";
import { buildCompanyRegisterPayload, usePublicCompanyRegister } from "@/app/api/entity.api";

export function CompanyRegisterForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();
  const { register, isPending } = usePublicCompanyRegister();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    try {
      const payload = buildCompanyRegisterPayload(formData);
      await register(payload);
      // ✅ Do NOT auto-login; send them to the login page
      router.replace("/login?registered=1");
    } catch (err: any) {
      setErrorMsg(err?.message || "Registration failed. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const submitting = loading || isPending;

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[500px]"
      noValidate
    >
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Company Registration</h1>
        <p className="text-muted-foreground text-sm">
          Start or manage your Memorandum of Agreement with <br />
          <span className="text-foreground font-medium">De La Salle University</span>
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <Progress value={(step / 2) * 100} className="h-2" />

      {/* Step 1 */}
      <div className={step === 1 ? "grid gap-4" : "hidden"}>
        <div className="grid gap-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input id="companyName" name="companyName" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="legalIdentifier">Legal Identifier</Label>
          <Input id="legalIdentifier" name="legalIdentifier" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="address">Company Address</Label>
          <Input id="address" name="address" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="industry">Industry</Label>
          <Input id="industry" name="industry" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="contactName">Contact Person</Label>
          <Input id="contactName" name="contactName" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="contactEmail">Contact Person Email</Label>
          <Input id="contactEmail" name="contactEmail" type="email" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="contactPhone">Contact Person Phone</Label>
          <Input id="contactPhone" name="contactPhone" type="tel" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Account Password (optional)</Label>
          <Input id="password" name="password" type="password" minLength={8} />
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={() => setStep(2)} disabled={submitting}>
            Next
          </Button>
        </div>
      </div>

      {/* Step 2 */}
      <div className={step === 2 ? "grid gap-4" : "hidden"}>
        <div className="text-muted-foreground grid gap-2 text-sm">
          <h2 className="text-foreground text-base font-medium">Required Documents</h2>
          <p>
            Please upload clear and legible copies of the following documents in PDF, JPG, or PNG
            format.
          </p>
        </div>

        <FileUpload
          label="Company Registration"
          name="registrationFile"
          accept=".pdf,.jpg,.png"
          required
        />
        <FileUpload label="BIR Registration" name="birFile" accept=".pdf,.jpg,.png" required />
        <FileUpload label="Business Permit" name="permitFile" accept=".pdf,.jpg,.png" required />

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={submitting}>
            Back
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Register Company"}
          </Button>
        </div>
      </div>

      <p className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="hover:text-primary underline">
          Go to login
        </Link>
      </p>
    </form>
  );
}
