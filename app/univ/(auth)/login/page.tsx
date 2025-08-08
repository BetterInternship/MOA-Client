import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { UnivAuthForm } from "@/components/auth/UnivAuthForm";

export default function UnivLoginPage() {
  return (
    <div className="relative grid w-full min-h-[100svh] items-stretch grid-rows-[auto,1fr] lg:grid-rows-1 lg:grid-cols-2 lg:px-0">
      {/* Optional CTA for companies */}
      <Link
        href="/moa/login"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute top-4 right-4 md:top-8 md:right-8"
        )}
      >
        Company login
      </Link>

      {/* Left panel - University branding */}
      <div className="text-primary relative flex h-full flex-col p-8 lg:p-10 border-b lg:border-b-0 lg:border-r bg-primary/5">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="relative z-20 flex items-center gap-2 text-lg font-semibold text-primary">
          {/* You can replace this with your actual logo */}
          <span>BetterInternship | De La Salle University</span>
        </div>
        <div className="relative z-20 mt-auto text-muted-foreground text-sm">
          <p>Welcome to the MOA Management Portal for university accounts.</p>
          <p className="mt-1">DLSU faculty and staff only.</p>
        </div>
      </div>

      {/* Right panel - Login Form */}
      <div className="flex items-center justify-center h-full p-6 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[400px]">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              University Login
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter your university credentials to continue.
            </p>
          </div>

          <UnivAuthForm />

          <p className="text-muted-foreground px-8 text-center text-xs leading-relaxed">
            By continuing, you agree to the{" "}
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
  );
}
