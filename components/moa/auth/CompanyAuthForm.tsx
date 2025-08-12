"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Autocomplete } from "@/components/ui/autocomplete";
import { useState } from "react";

export function CompanyAuthForm() {
  const router = useRouter();
  const [company, setCompany] = useState<string | null>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    alert(`Hello ${company}`);
    // TODO: Call your real company auth endpoint here
    await new Promise((r) => setTimeout(r, 600));

    setLoading(false);
    router.push("/dashboard");
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="tin">Company TIN</Label>
        <Autocomplete
          value={company}
          placeholder="Enter company name..."
          options={[
            { id: "ahh", name: "I AM A Company" },
            { id: "lol", name: "WOOG" },
            { id: "this shud be a uuid", name: "To be replaced later" },
          ]}
          setter={(value) => setCompany(value ?? null)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Verifying..." : "Continue"}
      </Button>
    </form>
  );
}
