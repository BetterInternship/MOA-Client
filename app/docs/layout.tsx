import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Document Verification | BetterInternship × DLSU",
  description: "Public verification portal for DLSU MOA documents.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-gradient-to-b from-white to-emerald-50/30",
          "w-[100vw]",
          "overflow-x-hidden"
        )}
      >
        {/* Topbar */}
        <header className="bg-background/70 border-b backdrop-blur">
          <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-2">
            <img src="/betterinternship-logo.png" alt="Logo" width={28} height={28} />
            <div className="flex items-center gap-2 font-semibold">BetterInternship</div>
          </div>
        </header>

        <main className="mx-auto">{children}</main>

        <footer className="text-muted-foreground mx-auto max-w-screen-sm px-4 pt-6 pb-10 text-center text-x flex justify-center">
          <p className="text-muted-foreground mt-8 text-left text-sm leading-relaxed">
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
        </footer>
      </body>
    </html>
  );
}
