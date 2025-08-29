"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import CustomCard from "@/components/shared/CustomCard";
import { useCreateCompany } from "@/app/api/school.api";

const COMPANY_SCHEMA = z.object({
  doingBusinessAs: z.string().min(2, "Required"),
  legalEntityName: z.string().min(2, "Required"),
  generalOfficeLocation: z.string().min(2, "Required"),
  industry: z.string().min(2, "Required"),
  contactName: z.string().min(2, "Required"),
  contactPhone: z.string().min(5, "Enter a valid phone"),
  acceptsNonUnivInterns: z.boolean().default(false),
  ongoingMoaWithDlsu: z.boolean().default(false),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Terms & Privacy Policy" }),
  }),
});
type FormValues = z.infer<typeof COMPANY_SCHEMA>;

function normalizeUrl(u: string) {
  if (!u) return u;
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export default function NewCompanyPage() {
  const router = useRouter();
  const createCompany = useCreateCompany();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(COMPANY_SCHEMA),
    defaultValues: {
      doingBusinessAs: "",
      legalEntityName: "",
      generalOfficeLocation: "",
      industry: "",
      description: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      acceptsNonUnivInterns: false,
      ongoingMoaWithDlsu: false,
      acceptedTerms: false,
    },
  });

  const descCount = (watch("description") || "").length;
  const acceptedTerms = watch("acceptedTerms");

  const onSubmit = async (values: FormValues) => {
    const payload = {
      display_name: values.doingBusinessAs.trim(),
      legal_name: values.legalEntityName.trim(),
      office_location: values.generalOfficeLocation.trim(),
      website: "",
      industry: values.industry.trim(),
      description: "",
      contact: {
        name: values.contactName.trim(),
        phone: values.contactPhone.trim(),
        email: "",
      },
      profile: {
        acceptsNonUniversityInterns: values.acceptsNonUnivInterns,
        ongoingMoaWithDlsu: values.ongoingMoaWithDlsu,
      },
    };

    try {
      await createCompany.mutateAsync(payload);
      router.push(`/univ/companies`);
    } catch (err: any) {
      alert(err?.message || "Something went wrong.");
    }
  };

  return (
    <div className="space-y-3">
      {/* Actions */}
      <div className="">
        {/* Back button to /companies */}
        <Button type="button" variant="outline" size="xs" onClick={() => router.push("/companies")}>
          ← Back
        </Button>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Add Company</h1>
          <p className="text-muted-foreground text-sm">
            Create a company profile that the university can use for MOA and onboarding.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* General Information */}
        <CustomCard className="space-y-4">
          <h1 className="text-lg font-semibold">General Information</h1>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="doingBusinessAs">
                Doing Business As <span className="text-destructive">*</span>
              </Label>
              <Input
                id="doingBusinessAs"
                placeholder="Acme Corp"
                {...register("doingBusinessAs")}
              />
              {errors.doingBusinessAs && (
                <p className="text-destructive text-xs">{errors.doingBusinessAs.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="legalEntityName">
                Legal Entity Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="legalEntityName"
                placeholder="Acme Corporation, Inc."
                {...register("legalEntityName")}
              />
              {errors.legalEntityName && (
                <p className="text-destructive text-xs">{errors.legalEntityName.message}</p>
              )}
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="generalOfficeLocation">
                Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="generalOfficeLocation"
                placeholder="Makati City, NCR, Philippines"
                {...register("generalOfficeLocation")}
              />
              {errors.generalOfficeLocation && (
                <p className="text-destructive text-xs">{errors.generalOfficeLocation.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="industry">
                Industry <span className="text-destructive">*</span>
              </Label>
              <Input
                id="industry"
                placeholder="Software, Healthcare, Finance..."
                {...register("industry")}
              />
              {errors.industry && (
                <p className="text-destructive text-xs">{errors.industry.message}</p>
              )}
            </div>

          </div>
        </CustomCard>

        {/* Contact Person Information */}
        <CustomCard className="space-y-4">
          <h1 className="text-lg font-semibold">Contact Person Information</h1>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="contactName">
                Contact Name <span className="text-destructive">*</span>
              </Label>
              <Input id="contactName" placeholder="Juan Dela Cruz" {...register("contactName")} />
              {errors.contactName && (
                <p className="text-destructive text-xs">{errors.contactName.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="contactPhone">
                Contact Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contactPhone"
                placeholder="+63 912 345 6789"
                {...register("contactPhone")}
              />
              {errors.contactPhone && (
                <p className="text-destructive text-xs">{errors.contactPhone.message}</p>
              )}
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="contactEmail">
                Contact Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="contact@acme.com"
                {...register("contactEmail")}
              />
              {errors.contactEmail && (
                <p className="text-destructive text-xs">{errors.contactEmail.message}</p>
              )}
            </div>
          </div>
        </CustomCard>

        {/* Profile Agreements */}
        <CustomCard className="space-y-4">
          <h1 className="text-lg font-semibold">Profile Agreements</h1>
          <div className="space-y-4">
            {/* <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Accept Non-University Interns?</p>
                <p className="text-muted-foreground text-xs">
                  If enabled, the company also accepts interns from other schools.
                </p>
              </div>
              <Switch
                checked={watch("acceptsNonUnivInterns")}
                onCheckedChange={(v) => setValue("acceptsNonUnivInterns", v)}
                aria-label="Accept Non-University Interns"
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Ongoing MOA with DLSU?</p>
                <p className="text-muted-foreground text-xs">
                  Mark true if there’s an active Memorandum of Agreement.
                </p>
              </div>
              <Switch
                checked={watch("ongoingMoaWithDlsu")}
                onCheckedChange={(v) => setValue("ongoingMoaWithDlsu", v)}
                aria-label="Ongoing MOA with DLSU"
              />
            </div>

            <Separator /> */}

            <div className="flex items-start gap-2">
              <Checkbox
                id="acceptedTerms"
                checked={acceptedTerms}
                onCheckedChange={(v) => setValue("acceptedTerms", Boolean(v))}
              />
              <Label htmlFor="acceptedTerms" className="text-sm leading-tight font-normal">
                I have read and agree to the{" "}
                <a
                  className="underline"
                  href="/legal/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms &amp; Conditions
                </a>{" "}
                and{" "}
                <a
                  className="underline"
                  href="/legal/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
                <span className="text-destructive">*</span>
              </Label>
            </div>
            {errors.acceptedTerms && (
              <p className="text-destructive text-xs">{errors.acceptedTerms.message}</p>
            )}
          </div>
        </CustomCard>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={!acceptedTerms || isSubmitting}>
            {isSubmitting ? "Saving..." : "Create Company"}
          </Button>
        </div>
      </form>
    </div>
  );
}
