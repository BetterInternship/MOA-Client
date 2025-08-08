import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { UserAuthForm } from "@/components/auth/user-auth-form";

export default function AuthenticationPage() {
  return (
    <>
      {/* Desktop grid */}
      <div className="relative grid w-full min-h-[100svh] items-stretch grid-rows-[auto,1fr] lg:grid-rows-1 lg:grid-cols-2 lg:px-0">
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "absolute top-4 right-4 md:top-8 md:right-8"
          )}
        >
          Login
        </Link>

        {/* Left panel */}
        <div className="text-primary relative flex h-full flex-col p-8 lg:p-10 border-b lg:border-b-0 lg:border-r">
          <div className="bg-primary/5 absolute inset-0" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            {/* TODO: Add logo */}
            BetterInternship
          </div>
        </div>

        {/* Right panel (form) */}
        <div className="flex items-center justify-center h-full p-6 lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[350px]">
            <div className="flex flex-col gap-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Create an account
              </h1>
              <p className="text-muted-foreground text-sm">
                Enter your email below to create your account
              </p>
            </div>

            <UserAuthForm />

            <p className="text-muted-foreground px-8 text-center text-sm">
              By clicking continue, you agree to our{" "}
              <Link
                href="/terms"
                className="hover:text-primary underline underline-offset-4"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="hover:text-primary underline underline-offset-4"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
