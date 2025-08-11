import type { Metadata } from "next";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Document Verification | BetterInternship × DLSU",
  description: "Public verification portal for DLSU MOA documents.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-gradient-to-b from-white to-emerald-50/30")}>
        {/* Topbar */}
        <header className="bg-background/70 border-b backdrop-blur">
          <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span>BetterInternship</span>
              <span className="text-muted-foreground">|</span>
              <span>De La Salle University</span>
            </div>
            <span className="bg-secondary text-secondary-foreground hidden rounded-md px-2 py-1 text-xs sm:inline">
              Public Verification
            </span>
          </div>
        </header>

        <main className="mx-auto flex max-w-screen-xl flex-col gap-6 p-6">{children}</main>

        {/* <footer className="text-muted-foreground mx-auto max-w-screen-sm px-4 pt-6 pb-10 text-center text-xs">
          By using this service, you agree to the Terms of Service and Privacy Policy.
        </footer> */}
      </body>
    </html>
  );
}
