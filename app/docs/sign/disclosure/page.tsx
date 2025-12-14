export default function DisclosurePage() {
  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-10 text-justify leading-relaxed text-gray-800">
      <h1 className="text-2xl font-bold">Electronic Record and Signature Disclosure</h1>

      <p>
        From time to time, ("we", "us", or "Company") may be required by law to provide certain
        written notices or disclosures. Below are the terms and conditions for providing such
        notices and disclosures electronically through the BetterInternship Signing system. Please
        read carefully. If you agree and can access this information electronically, confirm your
        agreement by selecting the checkbox next to {""}
        <span className="italic">“I agree to use electronic records and signatures”</span> before
        clicking{""}
        <span className="italic"> “CONTINUE”</span> inside the BetterInternship Signing Website.
      </p>

      <h2 className="text-xl font-semibold">Getting Paper Copies</h2>
      <p>
        You may request paper copies of any document provided electronically. Documents you sign in
        BetterInternship Signing Website can be downloaded and printed during or immediately after
        the signing session.
      </p>
      <p>
        After this period, requesting paper copies from our office may incur a fee of{" "}
        <strong>PHP10.00 per page</strong>. Requests can be made via the procedure described below.
      </p>

      <h2 className="text-xl font-semibold">Withdrawing Your Consent</h2>
      <p>
        You may choose at any time to stop receiving electronic notices and disclosures.
        Instructions for withdrawing consent are provided below.
      </p>

      <h2 className="text-xl font-semibold">Consequences of Withdrawing Consent</h2>
      <p>Withdrawing consent means:</p>
      <ul className="list-disc space-y-1 pl-6">
        <li>Processing may take longer because documents must be mailed to you.</li>
        <li>
          You will no longer be able to receive electronic notices or sign documents electronically.
        </li>
      </ul>

      <h2 className="text-xl font-semibold">Electronic Delivery of Notices</h2>
      <p>
        Unless you notify us otherwise, we will send all required notices, disclosures, and
        acknowledgements electronically through BetterInternship Signing Website. If you prefer
        paper delivery, inform us using the instructions below.
      </p>

      <h3 className="text-lg font-medium">To Update Your Email Address</h3>
      <p>
        Send an email including your previous and new email addresses. No additional information is
        required. If you have a BetterInternship Signing account, you may update your address
        directly through your account preferences.
      </p>

      <h3 className="text-lg font-medium">To Request Paper Copies</h3>
      <p>
        Email us with your full name, email address, mailing address, and telephone number. If fees
        apply, we will notify you.
      </p>

      <h3 className="text-lg font-medium">To Withdraw Your Consent</h3>
      <ol className="list-decimal space-y-1 pl-6">
        <li>
          Decline to sign a document during your signing session, then select the option to withdraw
          consent.
        </li>
        <li>
          Or email us with your full name, email address, mailing address, and telephone number.
        </li>
      </ol>

      <h2 className="text-xl font-semibold">Acknowledging Access and Consent</h2>
      <p>
        By selecting the checkbox next to{" "}
        <span className="italic">“I agree to use electronic records and signatures”</span>, you
        confirm that you:
      </p>
      <ul className="list-disc space-y-1 pl-6">
        <li>Can access and read this disclosure electronically.</li>
        <li>Can print or save this disclosure for future reference.</li>
        <li>
          Consent to receive all required notices and disclosures electronically unless you notify
          us otherwise.
        </li>
      </ul>

      <p>
        This consent applies to all documents and notices provided for the duration of your
        relationship with us.
      </p>
    </div>
  );
}
