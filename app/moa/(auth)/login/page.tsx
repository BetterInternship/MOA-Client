import Link from "next/link";
import { CompanyAuthForm } from "@/components/moa/auth/CompanyAuthForm";

export default function CompanyAuthPage() {
  return (
    <div className="relative grid min-h-[100svh] w-full items-stretch lg:grid-cols-2 lg:px-0">
      {/* Left panel (form) */}
      <div className="flex h-full items-center justify-center p-6 lg:p-8">
        <div className="mx-auto flex w-full flex-col gap-1 sm:w-[400px]">
          <div className="flex flex-col gap-4 text-left">
            <h1 className="text-3xl font-bold tracking-tight">Company Login</h1>
            <p className="text-muted-foreground text-sm">
              Start or manage your Memorandum of Agreement with <br />
              <span className="text-muted-foreground font-medium">De La Salle University</span>
            </p>
          </div>
          <br />

          <CompanyAuthForm />
          <br />

          <p className="text-muted-foreground mt-8 text-left text-xs leading-relaxed">
            By continuing, you agree to the{" "}
            <Link href="/terms" className="hover:text-primary underline underline-offset-4">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="hover:text-primary underline underline-offset-4">
              Privacy Policy
            </Link>
            .
          </p>

          <p className="text-left text-xs">
            Don't have an account?{" "}
            <Link href="/register" className="hover:text-primary underline">
              Register your company
            </Link>
          </p>
        </div>
      </div>

      {/* Right panel - only shown on desktop (lg and up) */}
      <div
        className="relative hidden flex-col items-end border-l bg-cover bg-center p-10 text-right lg:flex"
        style={{
          backgroundImage: "url('backgrounds/moa-login.jpg')",
        }}
      >
        {/* Overlay */}
        <div className="bg-primary/40 absolute inset-0" />

        <div className="relative z-20 flex items-center gap-2 text-lg font-semibold text-white">
          <img src="/betterinternship-logo.png" alt="Logo" width={28} height={28} />
          <img src="/dlsu-logo.png" alt="Logo" width={28} height={28} />
          BetterInternship | De La Salle University
        </div>

        <div className="relative z-20 mt-auto text-sm text-white/90">
          <p>Welcome to the MOA Management Platform.</p>
          <p className="mt-1">For inquiries, contact legal@dlsu.edu.ph</p>
        </div>
      </div>
    </div>
  );
}
