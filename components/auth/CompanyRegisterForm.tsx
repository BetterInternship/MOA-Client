"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { Separator } from "@/components/ui/separator";

export function CompanyRegisterForm() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    // TODO: send formData to backend
    await new Promise((r) => setTimeout(r, 1000));

    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[500px]"
    >
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Company Registration
        </h1>
        <p className="text-muted-foreground text-sm">
          Start or manage your Memorandum of Agreement with <br />
          <span className="font-medium text-foreground">
            De La Salle University
          </span>
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="companyName">Company Name</Label>
          <Input id="companyName" name="companyName" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="address">Company Address</Label>
          <Input id="address" name="address" required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phone">Company Phone</Label>
          <Input id="phone" name="phone" type="tel" required />
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

        <Separator className="my-4" />
        
        {/* File Uploads */}
        <FileUpload
            label="Company Registration"
            name="registrationFile"
            accept=".pdf,.jpg,.png"
            required
            />

            <FileUpload
            label="BIR Registration"
            name="birFile"
            accept=".pdf,.jpg,.png"
            required
            />

            <FileUpload
            label="Business Permit"
            name="permitFile"
            accept=".pdf,.jpg,.png"
            required
            />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Register Company"}
      </Button>

      <p className="text-center text-sm">
        Already have an account?{" "}
        <Link href="login" className="underline hover:text-primary">
          Go to login
        </Link>
      </p>
    </form>
  );
}
