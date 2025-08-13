"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DemoRT } from "@/lib/demo-realtime"; // 👈 broadcast updates

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
      setSubmitting(true);

      // 🔗 Call your demo API to move to stage 1 (Under Review)
      const res = await fetch("/api/moa/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          name: values.signatoryName,
          title: values.signatoryTitle,
        }),
      });

      if (!res.ok) {
        const msg = `Failed to submit (HTTP ${res.status})`;
        console.error(msg);
        form.setError("root", { message: msg });
        return;
      }

      // 📣 notify other tabs/pages (dashboard will auto-refresh)
      DemoRT.sendStage(2);

      // optional: form.reset();
      router.push("/moa/dashboard"); // back to the company dashboard
    } catch (err) {
      console.error(err);
      form.setError("root", { message: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">Standard MOA Request</h1>
        <p className="text-muted-foreground text-sm">
          Please provide the signatory information and digital signature authorization.
        </p>
      </div>

      {/* Top utility row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>Processing time:</span>
          <Badge variant="secondary" className="text-sm font-medium">
            1 minute
          </Badge>
        </div>

        <Button asChild variant="outline">
          <Link href="/templates/standard-moa.pdf" target="_blank">
            <Download className="mr-2 h-4 w-4" />
            Download Standard MOA Template
          </Link>
        </Button>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Signatory Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="signatoryName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Authorized Signatory Name<span className="text-red-500"> *</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Juan Dela Cruz" {...field} />
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
                    <FormLabel>
                      Signatory Title/Position<span className="text-red-500"> *</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Chief Executive Officer" {...field} />
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
                    <div className="flex items-start gap-3 rounded-md border p-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(Boolean(v))}
                        />
                      </FormControl>
                      <div className="space-y-2 leading-relaxed">
                        <FormLabel className="italic">
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

              {form.formState.errors.root?.message && (
                <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
              )}

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/moa/dashboard")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Standard MOA Request"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
