"use client";

import { usePathname } from "next/navigation";
import MoaTopbar from "@/components/moa/nav/MoaTopbar";
import { EntityAuthContextProvider } from "../providers/entity-auth-provider";

export default function MoaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noNavRoutes = ["/login", "/register"];
  const hideNav = noNavRoutes.includes(pathname);

  return (
    <EntityAuthContextProvider>
      <div className="flex h-full flex-col">
        {!hideNav && <MoaTopbar />}

        {hideNav ? (
          // No classes for login/register
          <>{children}</>
        ) : (
          // Default styled container for everything else
          <main className="mx-auto flex max-w-screen-xl flex-col gap-6 p-6">{children}</main>
        )}
      </div>
    </EntityAuthContextProvider>
  );
}
