import type { Metadata } from "next";
import Header from "@/components/docs/Header";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Document Verification | BetterInternship",
  description: "Public verification portal for BetterInternship documents.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex h-[100svh]! w-[100vw] flex-col justify-evenly overflow-x-hidden bg-white">
        <header className="bg-background/70 h-[4em] border-b backdrop-blur">
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

        <main
          className="mx-auto w-full"
          style={{
            height: "calc(100svh - 4em)",
          }}
        >
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  );
}
