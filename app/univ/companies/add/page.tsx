"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

// If you use shadcn Form primitives, uncomment these imports and swap to <FormField/> usage.
// import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const COMPANY_SCHEMA = z.object({
  doingBusinessAs: z.string().min(2, "Required"),
  legalEntityName: z.string().min(2, "Required"),
  generalOfficeLocation: z.string().min(2, "Required"),
  website: z
    .string()
    .min(1, "Required")
    .refine((v) => !!v.trim(), "Required"),
  industry: z.string().min(2, "Required"),
  description: z.string().min(10, "Add a short description (≥10 chars)"),

  contactName: z.string().min(2, "Required"),
  contactPhone: z.string().min(5, "Enter a valid phone"),
  contactEmail: z.string().email("Enter a valid email"),

  acceptsNonUnivInterns: z.boolean().default(false),
  ongoingMoaWithDlsu: z.boolean().default(false),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Terms & Privacy Policy" }),
  }),
});

type FormValues = z.infer<typeof COMPANY_SCHEMA>;

// Change this to your API
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

function normalizeUrl(u: string) {
  if (!u) return u;
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

export default function NewCompanyPage() {
  const router = useRouter();

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
      website: "",
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
      website: normalizeUrl(values.website.trim()),
      industry: values.industry.trim(),
      description: values.description.trim(),
      contact: {
        name: values.contactName.trim(),
        phone: values.contactPhone.trim(),
        email: values.contactEmail.trim(),
      },
      profile: {
        acceptsNonUniversityInterns: values.acceptsNonUnivInterns,
        ongoingMoaWithDlsu: values.ongoingMoaWithDlsu,
      },
    };

    try {
      const res = await fetch(`${API_BASE}/api/univ/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Add auth header if needed:
        // headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to create company");
      }

      const data = await res.json().catch(() => ({}));
      // Expect { id } or { _id }; fallback to list on success:
      const id = data?.id ?? data?._id;
      if (id) {
        router.push(`/univ/companies/${id}`);
      } else {
        router.push(`/univ/companies`);
      }
    } catch (err: any) {
      // Replace with your toast system if available
      alert(err?.message || "Something went wrong.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl p-6 md:p-8">
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
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="doingBusinessAs">Doing Business As *</Label>
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
              <Label htmlFor="legalEntityName">Legal Entity Name *</Label>
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
              <Label htmlFor="generalOfficeLocation">General Office Location *</Label>
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
              <Label htmlFor="website">Website *</Label>
              <Input id="website" placeholder="https://acme.com" {...register("website")} />
              {errors.website && (
                <p className="text-destructive text-xs">{errors.website.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="industry">Industry *</Label>
              <Input
                id="industry"
                placeholder="Software, Healthcare, Finance..."
                {...register("industry")}
              />
              {errors.industry && (
                <p className="text-destructive text-xs">{errors.industry.message}</p>
              )}
            </div>

            <div className="space-y-1 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Description *</Label>
                <span className="text-muted-foreground text-xs">{descCount}/500</span>
              </div>
              <Textarea
                id="description"
                placeholder="What does this company do? (mission, products, workforce size, etc.)"
                maxLength={500}
                rows={5}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-destructive text-xs">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Person Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Person Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="contactName">Contact Name *</Label>
              <Input id="contactName" placeholder="Juan Dela Cruz" {...register("contactName")} />
              {errors.contactName && (
                <p className="text-destructive text-xs">{errors.contactName.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="contactPhone">Contact Phone Number *</Label>
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
              <Label htmlFor="contactEmail">Contact Email *</Label>
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
          </CardContent>
        </Card>

        {/* Profile Agreements */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Agreements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border p-3">
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

            <Separator />

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
                .
              </Label>
            </div>
            {errors.acceptedTerms && (
              <p className="text-destructive text-xs">{errors.acceptedTerms.message}</p>
            )}
          </CardContent>
        </Card>

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
