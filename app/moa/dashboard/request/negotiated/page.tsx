// app/(moa)/dashboard/request/negotiated/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import CustomCard from "@/components/shared/CustomCard";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FileUpload } from "@/components/ui/file-upload";
import { useEntityMoaControllerRequestNewCustom } from "../../../../api/app/api/endpoints/entity-moa/entity-moa";

// TEMP: validation off — simple RHF types
type FormValues = {
  school_id: string;
  proposed_moa: File | null; // can be null while validation is disabled
  reason: string;
};

export default function NegotiatedMoaRequestPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  // ! move this to entity.api.ts later on
  const customRequest = useEntityMoaControllerRequestNewCustom();

  // TEMP: no resolver, no schema
  const form = useForm<FormValues>({
    defaultValues: {
      school_id: "0fde7360-7c13-4d27-82e9-7db8413a08a5",
      reason: "",
      proposed_moa: null,
    },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      await customRequest.mutateAsync({
        data: {
          school_id: "0fde7360-7c13-4d27-82e9-7db8413a08a5",
          reason: values.reason,
          proposed_moa: new Blob(
            [(await values.proposed_moa?.arrayBuffer()) ?? new Uint8Array([])],
            {
              type: "application/pdf",
            }
          ),
        },
        // data: formData as any,
      });

      router.push("/dashboard/status");
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Negotiate a Custom MOA</h1>
        <p className="text-muted-foreground text-sm">
          Propose specific changes to the standard agreement and explain your rationale.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>Processing time:</span>
          <Badge className="text-sm font-medium">4 weeks</Badge>
        </div>
      </div>

      <CustomCard
        variant="warning"
        heading="Important note"
        className="flex flex-row flex-wrap items-start gap-1"
      >
        <div className="text-sm text-justify">
          Custom MOA requests require detailed review by our legal team. It may take up to{" "}
          <span className="font-bold">4 weeks</span> to approve your request.
        </div>
      </CustomCard>

      <CustomCard className="bg-white">
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* File upload using your component */}
              <FormField
                control={form.control}
                name="proposed_moa"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FileUpload
                        label="Proposed MOA Document"
                        name="proposed_moa"
                        accept="application/pdf"
                        required
                        onFileSelect={(file) => {
                          // store file in RHF state; no validation
                          form.setValue("proposed_moa", (file as File) ?? null, {
                            shouldDirty: true,
                          });
                        }}
                      />
                    </FormControl>
                    <FormMessage /> {/* harmless while validation is off */}
                  </FormItem>
                )}
              />

              {/* Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-muted-foreground text-xs font-normal">
                      Reason for Custom Terms<span className="text-red-500"> *</span>
                    </Label>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why your proposal departs from the standard terms. Include business context and specific clauses to be changed."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Negotiated MOA Request"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </CustomCard>
    </div>
  );
}
