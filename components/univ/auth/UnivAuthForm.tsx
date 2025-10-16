"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSchoolAuth } from "@/app/providers/school-auth-provider";

export function UnivAuthForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const auth = useSchoolAuth();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    await auth
      .signIn(email, password)
      // ! move this to inside of auth hook later on
      .then(
        (r) => (
          // console.log(r),
          r.success ? router.push("/dashboard") : alert("Invalid credentials.")
        )
      )
      .catch((e) => console.log(e));
  }

  return (
    <form className="mt-4 grid gap-5" onSubmit={onSubmit}>
      <div className="grid gap-1">
        <Label className="text-muted-foreground text-xs font-normal">University email</Label>
        <Input id="email" name="email" placeholder="student@dlsu.edu.ph" type="email" required />
        <div className="h-1"></div>
        <Label className="text-muted-foreground text-xs font-normal">Password</Label>
        <Input id="password" name="password" type="password" placeholder="••••••••" required />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="submit"
        disabled={auth.isSigningIn}
        className="w-auto justify-self-end sm:w-full md:w-auto"
      >
        {auth.isSigningIn ? "Signing in..." : "Continue"}
      </Button>
    </form>
  );
}
