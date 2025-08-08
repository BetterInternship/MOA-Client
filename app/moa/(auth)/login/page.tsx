import Link from "next/link";
import { CompanyAuthForm } from "@/components/auth/CompanyAuthForm";

const universityURL =
  typeof window !== "undefined"
    ? window.location.href.replace("moa", "univ").replace(/\/[^/]*$/, "/login")
    : "http://univ.localhost:3000/login";

export default function CompanyAuthPage() {
  return (
    <div className="relative grid w-full min-h-[100svh] items-stretch lg:grid-cols-2 lg:px-0">
      {/* Left panel (form) */}
      <div className="flex items-center justify-center h-full p-6 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[400px]">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Company Login
            </h1>
            <p className="text-muted-foreground text-sm">
              Start or manage your Memorandum of Agreement with <br />
              <span className="font-medium text-foreground">De La Salle University</span>
            </p>
          </div>

          <CompanyAuthForm />

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

          <p className="text-center text-sm">
            Not a company?{" "}
            <Link href={universityURL} className="underline hover:text-primary">
                Go to University login
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel - only shown on desktop (lg and up) */}
      <div className="hidden lg:flex text-primary relative flex-col p-10 border-l bg-primary/5 text-right items-end">
        <div className="relative z-20 flex items-center text-lg font-semibold text-primary">
          BetterInternship | De La Salle University
        </div>
        <div className="relative z-20 mt-auto text-muted-foreground text-sm">
          <p>Welcome to the MOA Management Platform.</p>
          <p className="mt-1">For inquiries, contact legal@dlsu.edu.ph</p>
        </div>
      </div>
    </div>
  );
}
