"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { autoLogin } from "@/app/api/docs.api";

export default function LinkLoginPage() {
  const search = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "ok" | "error">("pending");
  const [message, setMessage] = useState<string>("Establishing secure session...");

  useEffect(() => {
    const id = search.get("id") || "";
    const email = search.get("email") || "";
    const form = search.get("form") || "";
    const aud = search.get("for") || "entity";
    const pending = search.get("pending") || "";
    const student = search.get("student") || "";

    if (!email) {
      setStatus("error");
      setMessage("Missing email parameter.");
      return;
    }

    const attempt = async () => {
      try {
        // Use the generated API client which sets cookie properly
        const res = await autoLogin({
          id: id,
          email,
          name: "",
          form,
          for: aud,
          pending,
          student,
        });

        if (!res) {
          throw new Error("Failed to establish session");
        }

        // Session established successfully, redirect to sign page
        setStatus("ok");
        setMessage("Session established. Redirecting...");
        router.push(res.url);
      } catch (e) {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Failed to establish session.");
      }
    };

    void attempt();
  }, [search, router]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Secure Document Access</h1>
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
      {status === "pending" && (
        <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
      )}
      {status === "error" && (
        <button
          onClick={() => window.location.reload()}
          className="hover:bg-muted rounded border px-3 py-1 text-sm"
        >
          Retry
        </button>
      )}
    </div>
  );
}
