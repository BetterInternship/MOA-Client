"use client";

import { Card } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>

      <Card className="flex flex-col gap-4 p-6">
        <p>
          Our privacy policy meets, at a minimum, the same standards as DocuSign, ensuring
          equivalent safeguards, controls, and practices to protect the confidentiality and
          integrity of user data:{" "}
          <a
            href="https://www.docusign.com/en-au/privacy"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:no-underline"
          >
            https://www.docusign.com/en-au/privacy
          </a>
        </p>

        <p>
          For contact, please email{" "}
          <a
            href="mailto:hello@betterinternship.com"
            className="underline underline-offset-4 hover:no-underline"
          >
            hello@betterinternship.com
          </a>
          .
        </p>
      </Card>
    </main>
  );
}
