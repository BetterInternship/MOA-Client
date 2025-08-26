// app/(moa)/dashboard/request/negotiated/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Divider } from "@/components/ui/divider";

// TEMP: validation off — simple RHF types
type FormValues = {
  proposedDoc: File | null; // can be null while validation is disabled
  reason: string;
};

export default function NegotiatedMoaRequestPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // TEMP: no resolver, no schema
  const form = useForm<FormValues>({
    defaultValues: { reason: "", proposedDoc: null },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const formData = new FormData();
      if (values.proposedDoc) formData.append("proposedDoc", values.proposedDoc);
      formData.append("reason", values.reason || "");

      // TODO: call your API
      // const res = await fetch("/api/moa/negotiated", {
      //   method: "POST",
      //   body: formData,
      //   credentials: "include",
      // });
      // if (!res.ok) throw new Error("Submit failed");

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
      </div>

      <Card className="bg-white">
        <CardHeader>
          <div className="flex flex-row flex-wrap items-start gap-1">
            <Badge type="warning" className="font-medium">
              Important Note
            </Badge>
            <div className="mt-2 leading-5 text-gray-500">
              Custom MOA requests require detailed review by our legal team. It may take up to{" "}
              <span className="font-bold">4 weeks</span> to approve your request.
            </div>
          </div>
        </CardHeader>
        <Divider height={3} />
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* File upload using your component */}
              <FormField
                control={form.control}
                name="proposedDoc"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FileUpload
                        label="Proposed MOA Document"
                        name="proposedDoc"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        required
                        onFileSelect={(file) => {
                          // store file in RHF state; no validation
                          form.setValue("proposedDoc", (file as File) ?? null, {
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
                    <FormLabel>
                      Reason for Custom Terms<span className="text-red-500"> *</span>
                    </FormLabel>
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
        </CardContent>
      </Card>
    </div>
  );
}
