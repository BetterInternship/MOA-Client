"use client";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">Terms & Privacy</h1>

      <div className="bg-card text-card-foreground rounded-2xl border shadow-sm">
        <div className="space-y-4 p-5 text-sm leading-relaxed sm:p-6 sm:text-base">
          <p>
            For our privacy, please visit{" "}
            <a
              href="https://www.docusign.com/en-au/privacy"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 hover:no-underline"
            >
              https://www.docusign.com/en-au/privacy
            </a>
          </p>

          <p>Find/Replace Docusign with BetterInternship.</p>

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
