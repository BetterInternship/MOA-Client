"use client";

import Header from "@/components/docs/Header";
import { Providers } from "./providers";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, X as XIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const isEditorRoute = pathname?.includes("/editor") ?? false;
  const isFieldsRoute = pathname?.endsWith("/fields") ?? false;

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/BetterInternshipLogo.ico" sizes="any" />
      </head>
      <Providers>
        <body
          className="flex h-[100svh]! w-[100vw] flex-col overflow-x-hidden bg-white"
          suppressHydrationWarning
        >
          {/* Mobile Backdrop */}
          {isMobile && isMenuOpen && (
            <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setIsMenuOpen(false)} />
          )}

          {!isEditorRoute && (
            <header className="bg-background/70 sticky top-0 z-50 border-b backdrop-blur">
              <div className="mx-auto flex h-16 items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link
                  href="/"
                  className="block flex-shrink-0 border-none text-black! outline-none focus:outline-none"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src="/betterinternship-logo.png"
                      alt="Logo"
                      width={25}
                      height={25}
                      className="flex-none"
                    />
                    <h1 className="font-display flex flex-row items-center space-x-2 text-lg font-bold text-gray-900">
                      BetterInternship
                    </h1>
                  </div>
                </Link>

                {/* Desktop Header (hidden on mobile) */}
                {!isMobile && (
                  <div className="flex flex-1 justify-end gap-2">
                    <Header />
                  </div>
                )}

                {/* Mobile Menu Button */}
                {isMobile && (
                  <button
                    type="button"
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                  >
                    {isMenuOpen ? <XIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </button>
                )}
              </div>

              {/* Mobile Menu Drawer */}
              {isMobile && isMenuOpen && (
                <div className="border-t bg-white px-4 py-3">
                  <Header />
                </div>
              )}
            </header>
          )}

          <main
            className={`mx-auto flex min-h-0 w-full flex-1 ${
              isFieldsRoute ? "overflow-hidden" : "overflow-auto"
            }`}
            style={{
              height: isEditorRoute ? "100svh" : "calc(100svh - 5rem)",
            }}
          >
            {children}
          </main>
        </body>
      </Providers>
    </html>
  );
}
