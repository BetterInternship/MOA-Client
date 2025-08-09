"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, Mail, MessageSquare, Phone, Info } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileUpload } from "@/components/ui/file-upload";

export default function SupportPage() {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    try {
      // Example: POST to your API
      // const res = await fetch("/api/support/tickets", {
      //   method: "POST",
      //   body: formData,
      //   credentials: "include",
      // });
      // if (!res.ok) throw new Error("Submit failed");

      // For now just simulate success:
      await new Promise((r) => setTimeout(r, 700));
      window.location.href = "/dashboard/status";
    } catch (e) {
      console.error(e);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">Support</h1>
        <p className="text-muted-foreground text-sm">
          Get help with MOA requests, documents, and account issues.
        </p>
      </div>

      {/* Top strip: SLA + quick badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <HelpCircle className="h-4 w-4" />
          <span>We aim to respond within</span>
          <Badge variant="secondary" className="text-xs font-medium">
            1–2 business days
          </Badge>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/status">View your tickets</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact options */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Contact Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-md">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Email</div>
                <p className="text-muted-foreground text-sm">support@betterinternship.example</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-md">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">In‑app Messages</div>
                <p className="text-muted-foreground text-sm">Start a new ticket using the form.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-md">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Phone</div>
                <p className="text-muted-foreground text-sm">+63 2 1234 5678</p>
                <p className="text-muted-foreground text-xs">Mon–Fri, 9am–5pm PHT</p>
              </div>
            </div>

            <Separator />

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Tip</AlertTitle>
              <AlertDescription className="text-sm">
                For MOA-specific issues, include your request ID (e.g., REQ-2025-014) so we can help faster.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Open a ticket (form) */}
        <Card className="bg-white lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Open a Support Ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              action={async (formEl) => {
                // Using form actions to gather data
                const fd = new FormData(formEl as unknown as HTMLFormElement);
                await handleSubmit(fd);
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Your Name<span className="text-red-500"> *</span>
                  </label>
                  <Input name="name" placeholder="e.g., Jana Marie Bantolino" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Email<span className="text-red-500"> *</span>
                  </label>
                  <Input type="email" name="email" placeholder="you@example.com" required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Subject<span className="text-red-500"> *</span>
                </label>
                <Input name="subject" placeholder="Brief summary of the issue" required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Message<span className="text-red-500"> *</span>
                </label>
                <Textarea
                  name="message"
                  rows={5}
                  placeholder="Describe the problem, steps to reproduce, and any relevant request IDs or URLs."
                  required
                />
              </div>

              <div className="space-y-2">
                <FileUpload
                  label="Attachment (optional)"
                  name="attachment"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                />
                <p className="text-muted-foreground text-xs">
                  You can attach screenshots or documents that help explain the issue.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button asChild variant="outline">
                  <Link href="/dashboard">Cancel</Link>
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-lg">FAQ</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="q1">
              <AccordionTrigger>How long do MOA reviews take?</AccordionTrigger>
              <AccordionContent>
                Standard MOAs typically take <strong>2–4 weeks</strong>. Negotiated MOAs may take{" "}
                <strong>3–6 weeks</strong> depending on complexity.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q2">
              <AccordionTrigger>Where can I track my request?</AccordionTrigger>
              <AccordionContent>
                Go to{" "}
                <Link href="/dashboard/status" className="text-primary underline">
                  MOA Status
                </Link>{" "}
                to see progress, signatories, and timelines.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="q3">
              <AccordionTrigger>What file types do you accept?</AccordionTrigger>
              <AccordionContent>
                For MOA documents, we accept <strong>PDF, DOC, DOCX</strong>. For screenshots,
                attach <strong>PNG/JPG</strong>.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
