"use client";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  function redirectToSubdomain(subdomain: string) {
    const baseUrl = typeof window !== "undefined" ? window.location.hostname : "";
    const port = typeof window !== "undefined" ? window.location.port : "";

    const domainParts = baseUrl.split(".");
    const rootDomain = domainParts.slice(-2).join(".");

    const protocol = window?.location.protocol || "http:";
    const fullUrl =
      protocol +
      "//" +
      subdomain +
      "." +
      rootDomain +
      (port && port !== "80" && port !== "443" ? `:${port}` : "") +
      "/login";

    window.location.href = fullUrl;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to the MOA Management Platform
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Please choose your role to proceed.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          size="lg"
          className="w-64"
          onClick={() => redirectToSubdomain("moa")}
        >
          I'm a Company
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-64"
          onClick={() => redirectToSubdomain("univ")}
        >
          I'm from the University
        </Button>
      </div>
    </main>
  );
}
