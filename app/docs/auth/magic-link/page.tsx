"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { magicLinkLogin } from "@/app/api/docs.api";
import { Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function LinkLoginPage() {
  return (
    <Suspense>
      <LinkLogin />;
    </Suspense>
  );
}

export function LinkLogin() {
  const search = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>();
  const [message, setMessage] = useState<string>("Establishing secure session...");

  useEffect(() => {
    const id = search.get("id") || "";
    const hash = search.get("hash") || "";
    const redirect = search.get("redirect") || "";

    if (!id || !hash) {
      setStatus("error");
      setMessage("Missing parameters.");
      return;
    }

    const attempt = async () => {
      try {
        // Use the generated API client which sets cookie properly
        const res = await magicLinkLogin({ id, hash, redirect });

        if (!res) {
          throw new Error("Failed to establish session");
        }

        // Session established successfully, redirect to sign page
        setStatus("ok");
        setMessage("Session established. Redirecting...");
        await queryClient.invalidateQueries({ queryKey: ["my-profile"] });
        router.push(res.redirect);
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
