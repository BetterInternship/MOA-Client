import Link from "next/link";
import { UnivAuthForm } from "@/components/auth/UnivAuthForm";

const companyURL =
  typeof window !== "undefined"
    ? window.location.href.replace("univ", "moa").replace(/\/[^/]*$/, "/login")
    : "http://moa.localhost:3000/login";

export default function UnivLoginPage() {
  return (
    <div className="relative grid min-h-[100svh] w-full items-stretch lg:grid-cols-2 lg:px-0">
      {/* Left panel - University branding (hidden on mobile) */}
      <div className="text-primary bg-primary/5 relative hidden flex-col border-r p-10 lg:flex">
        <div className="bg-primary/5 absolute inset-0" />
        <div className="text-primary relative z-20 flex items-center gap-2 text-lg font-semibold">
          <span>BetterInternship | De La Salle University</span>
        </div>
        <div className="text-muted-foreground relative z-20 mt-auto text-sm">
          <p>Welcome to the MOA Management Portal for university accounts.</p>
          <p className="mt-1">DLSU faculty and staff only.</p>
        </div>
      </div>

      {/* Right panel - Login Form (keeps everything centered) */}
      <div className="flex h-full items-center justify-center p-6 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[400px]">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">University Login</h1>
            <p className="text-muted-foreground text-sm">
              Enter your university credentials to continue.
            </p>
          </div>

          <UnivAuthForm />

          <p className="text-muted-foreground px-8 text-center text-xs leading-relaxed">
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

          <p className="text-center text-sm">
            Not from DLSU?{" "}
            <Link href={companyURL} className="hover:text-primary underline">
              Go to company login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
