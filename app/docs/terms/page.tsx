"use client";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">Terms of Service</h1>

      <div className="bg-card text-card-foreground rounded-2xl border shadow-sm">
        <div className="space-y-4 p-5 text-sm leading-relaxed sm:p-6 sm:text-base">
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
        </div>
      </div>
    </main>
  );
}
