"use client";

import { Card } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>

      <Card className="flex flex-col gap-4 p-6">
        <p>
          Our Terms of Service meet, at a minimum, the same standards as DocuSign, ensuring
          equivalent clarity, enforceability, and protection of user rights and obligations:{" "}
          <a
            href="https://www.docusign.com/legal/terms-and-conditions"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:no-underline"
          >
            https://www.docusign.com/legal/terms-and-conditions
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
