"use client";

import Header from "@/components/docs/Header";
import { Providers } from "./providers";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSignatoryProfile } from "./auth/provider/signatory.ctx";

const PROTECTED_ROUTE_PREFIXES = ["/dashboard", "/forms", "/students"];
const PUBLIC_ROUTE_PREFIXES = ["/login", "/sign-in", "/auth/magic-link"];

function normalizeDocsPath(pathname: string) {
  return pathname.startsWith("/docs/") ? pathname.slice("/docs".length) : pathname;
}

function routeMatches(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function DocsAuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const profile = useSignatoryProfile();
  const normalizedPath = normalizeDocsPath(pathname ?? "/");
  const isPublicRoute = PUBLIC_ROUTE_PREFIXES.some((prefix) =>
    routeMatches(normalizedPath, prefix)
  );
  const requiresAuth =
    !isPublicRoute &&
    PROTECTED_ROUTE_PREFIXES.some((prefix) => routeMatches(normalizedPath, prefix));

  useEffect(() => {
    if (requiresAuth && !profile.loading && profile.unauthorized) {
      router.replace("/login");
    }
  }, [requiresAuth, profile.loading, profile.unauthorized, router]);

  if (requiresAuth && (profile.loading || profile.unauthorized)) return null;
  return <>{children}</>;
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEditorRoute = pathname?.includes("/editor") ?? false;
  const isFieldsRoute = pathname?.endsWith("/fields") ?? false;
  const isLoginRoute = pathname === "/login" || pathname === "/docs/login";
  const isSignRoute = pathname === "/sign" || pathname === "/docs/sign";
  const showHeader = !isEditorRoute && !isLoginRoute && !isSignRoute;

  return (
    <Providers>
      <div className="flex h-[100svh] w-screen flex-col overflow-hidden bg-white">
        {showHeader && (
          <header className="bg-background/70 sticky top-0 z-50 border-b py-2 backdrop-blur">
            <div className="mx-auto flex h-16 items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
              {/* Logo */}
              <Link
                href="/dashboard"
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

              <div className="flex flex-1 justify-end gap-2">
                <Header />
              </div>
            </div>
          </header>
        )}

        <main
          className={`mx-auto flex min-h-0 w-full flex-1 ${
            isFieldsRoute ? "overflow-hidden" : "overflow-auto"
          }`}
        >
          <DocsAuthGate>{children}</DocsAuthGate>
        </main>
      </div>
    </Providers>
  );
}
