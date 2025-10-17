"use client";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">Privacy</h1>

      <div className="bg-card text-card-foreground rounded-2xl border shadow-sm">
        <div className="space-y-4 p-5 text-sm leading-relaxed sm:p-6 sm:text-base">
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
        </div>
      </div>
    </main>
  );
}
