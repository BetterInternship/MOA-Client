"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

interface Response {
  email: string;
  message: string;
}

export default function EmailTestPage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [response, setResponse] = useState<Response | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendTestEmail(e: React.FormEvent) {
    e.preventDefault();
    setResponse(null);

    if (!token) {
      alert("Please complete the CAPTCHA");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        (process.env.NEXT_PUBLIC_API_SERVER_URL as string) + "api/email-test",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey: process.env.NEXT_PUBLIC_MOA_SERVER_API_KEY_EMAIL,
            "cf-token": token,
            email,
          }),
        }
      );
      const data = (await res.json()) as Response;
      setResponse(data);

      await new Promise((r) => setTimeout(r, 800));
    } finally {
      setLoading(false);
    }
  }

  const Strategy = ({ title, body }: { title: string; body: React.ReactNode }) => (
    <div
      className="rounded-[0.33em]"
      style={{
        border: "1px solid #e0e0e0",
        padding: 14,
        background: "#fff",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 6, color: "#202124" }}>{title}</div>
      <div style={{ fontSize: 14, lineHeight: 1.65, color: "#3c4043" }}>{body}</div>
    </div>
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial',
        background: "#fff",
        color: "#202124",
      }}
    >
      {/* Logo title */}
      <div
        style={{
          fontSize: 44,
          fontWeight: 700,
          letterSpacing: -0.5,
          marginBottom: 30,
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        <span className="text-primary">BetterInternship</span>
      </div>

      {/* Search-like send bar */}
      <form className="mx-auto w-full max-w-[680px]" onSubmit={(e) => void sendTestEmail(e)}>
        <div
          className="w-[100%] rounded-[0.33em]"
          style={{
            display: "flex",
            alignItems: "center",
            border: "1px solid #dfe1e5",
            padding: "6px 6px 6px 16px",
            boxShadow: "0 1px 4px rgba(32,33,36,0.16)",
          }}
        >
          <input
            type="email"
            placeholder="Enter your email to receive a test message"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 18,
              background: "transparent",
            }}
          />

          <Button disabled={loading} className="bg-primary rounded-[0.33em]" size="md">
            {loading ? "Sending…" : "Send email"}
          </Button>
        </div>
        <div className="relative flex w-full flex-row items-end">
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_MOA_SERVER_API_KEY_TURNSTILE!}
            onSuccess={(t) => setToken(t)}
            onError={() => setToken("")}
          />
        </div>
      </form>

      {/* Status only after response */}
      {response && <div style={{ marginTop: 18, fontSize: 15 }}>{response.message}</div>}

      {/* Collapsible help */}
      <div style={{ width: "100%", maxWidth: 680, marginTop: 42 }}>
        <details
          className="rounded-[0.33em]"
          style={{
            border: "1px solid #e0e0e0",
            padding: 14,
            background: "#fafafa",
          }}
        >
          <summary
            style={{
              cursor: "pointer",
              userSelect: "none",
              fontWeight: 600,
              fontSize: 15,
              color: "#202124",
              listStyle: "none",
              outline: "none",
            }}
          >
            Not receiving the email?
            <span style={{ color: "#5f6368", fontWeight: 500 }}> (click to expand)</span>
          </summary>

          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <Strategy
              title="Check Spam Folder"
              body={
                <>
                  Look in <strong>Spam</strong> / <strong>Junk</strong>. If you find it, mark it as{" "}
                  <strong>Not spam</strong>.
                </>
              }
            />
            <Strategy
              title="Allow-list Our Sender"
              body={
                <>
                  Add <strong>hello@betterinternship.com</strong> to your contacts or allow list
                  (safe senders).
                </>
              }
            />
            <Strategy
              title="Search Everywhere"
              body={
                <>
                  Search your inbox for “BetterInternship” and check “All Mail” / “Archive” /
                  “Other” depending on your email client.
                </>
              }
            />
            <Strategy
              title="Corporate Email Filters"
              body={
                <>
                  If you’re using a work email, your company may block unknown senders. Ask IT to
                  check quarantine and allow our sender / domain.
                </>
              }
            />
            <Strategy
              title="Try a Different Email Address"
              body={
                <>
                  Test with a personal email (like Gmail) to confirm whether it’s specific to
                  corporate filtering.
                </>
              }
            />
          </div>
        </details>
      </div>
    </main>
  );
}
