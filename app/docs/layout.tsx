import type { Metadata } from "next";
import { ModalProvider } from "../providers/modal-provider";
import Header from "@/components/docs/Header";

export const metadata: Metadata = {
  title: "Document Verification | BetterInternship × DLSU",
  description: "Public verification portal for DLSU MOA documents.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen w-[100vw] overflow-x-hidden bg-gradient-to-b from-white to-emerald-50/30">
        <header className="bg-background/70 border-b backdrop-blur">
          <div className="mx-auto flex h-16 max-w-screen-xl items-center gap-2">
            <div className="flex items-center gap-2">
              <img
                src="/betterinternship-logo.png"
                alt="Logo"
                width={28}
                height={28}
                className="flex-none"
              />
              <div className="flex items-center gap-2 font-semibold">BetterInternship</div>
            </div>
            <div className="flex flex-1 justify-end gap-2">
              <Header />
            </div>
          </div>
        </header>

        <ModalProvider>
          <main className="mx-auto">{children}</main>
        </ModalProvider>
      </body>
    </html>
  );
}
