"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import CustomCard from "@/components/shared/CustomCard";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { useMoaRequests } from "@/app/api/entity.api";

const FormSchema = z.object({
  signatoryName: z.string().trim().min(2, "Please enter the full name."),
  signatoryTitle: z.string().trim().min(2, "Please enter the title/position."),
  accepted: z
    .boolean()
    .refine((v) => v === true, { message: "You must accept the declaration to proceed." }),
});

type FormValues = z.infer<typeof FormSchema>;

export default function StandardMoaRequestPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const moaRequests = useMoaRequests();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      signatoryName: "",
      signatoryTitle: "",
      accepted: false,
    },
    mode: "onTouched",
  });

  async function onSubmit(values: FormValues) {
    try {
      console.log(form.getValues());
      setSubmitting(true);
      const r = await moaRequests.createStandard({
        data: {
          school_id: "0fde7360-7c13-4d27-82e9-7db8413a08a5",
          entity_signatory_name: form.getValues().signatoryName,
          entity_signatory_title: form.getValues().signatoryTitle,
        },
      });

      if (r.moaRequestId) router.push("/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Request a Standard MOA</h1>
        <p className="text-muted-foreground text-sm">
          Please provide the signatory information and digital signature authorization.
        </p>
      </div>

      {/* Top utility row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>Processing time:</span>
          <Badge className="text-sm font-medium">1 minute</Badge>
        </div>

        <Button asChild variant="outline" scheme="secondary">
          <Link
            href="https://storage.googleapis.com/better-internship-public-bucket/dlsu-standard-moa-template.pdf"
            target="_blank"
          >
            <Download className="mr-1 h-4 w-4" />
            Download Standard MOA Template
          </Link>
        </Button>
      </div>

      <CustomCard className="space-y-3 bg-white">
        <h1 className="text-lg font-semibold">Signatory Information</h1>
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="signatoryName"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-muted-foreground text-xs font-normal">
                      Authorized Signatory Name<span className="text-red-500"> *</span>
                    </Label>
                    <FormControl>
                      <Input placeholder="e.g., Juan Dela Cruz" {...field} maxLength={48} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="signatoryTitle"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-muted-foreground text-xs font-normal">
                      Signatory Title/Position<span className="text-red-500"> *</span>
                    </Label>
                    <FormControl>
                      <Input
                        placeholder="e.g., Chief Executive Officer"
                        {...field}
                        maxLength={48}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accepted"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div className="flex items-start gap-3 rounded-xs border p-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(Boolean(v))}
                        />
                      </FormControl>
                      <div className="space-y-2 leading-relaxed">
                        <FormLabel className="text-muted-foreground font-normal italic">
                          I hereby declare that I am authorized to sign on behalf of the company and
                          accept the terms of the Standard MOA template. I understand that this
                          agreement will be legally binding once executed by both parties.
                        </FormLabel>
                        <FormDescription className="text-sm text-red-500">
                          Required to proceed with the Standard MOA request.
                        </FormDescription>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Standard MOA Request"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </CustomCard>
    </div>
  );
}
