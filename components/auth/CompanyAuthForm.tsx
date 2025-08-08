"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function CompanyAuthForm() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const tin = (form.elements.namedItem("tin") as HTMLInputElement).value;

    if (!/^\d{9,15}$/.test(tin)) {
      setError("Invalid TIN format.");
      setLoading(false);
      return;
    }

    // TODO: Call your real company auth endpoint here
    await new Promise((r) => setTimeout(r, 600));

    setLoading(false);
    router.push("/dashboard")
  }

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="tin">Company TIN</Label>
        <Input
          id="tin"
          name="tin"
          placeholder="000123456789"
          type="text"
          inputMode="numeric"
          pattern="\d*"
          required
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Verifying..." : "Continue"}
      </Button>
    </form>
  );
}
