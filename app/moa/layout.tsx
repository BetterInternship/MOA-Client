"use client";

import { usePathname } from "next/navigation";
import MoaTopbar from "@/components/moa/nav/MoaTopbar";
import { EntityAuthContextProvider } from "../providers/entity-auth-provider";
// import {
//   SidebarProvider,
//   SidebarInset,
//   SidebarTrigger,
// } from "@/components/ui/sidebar";
// import { MoaSidebar } from "@/components/sidebar/moa-sidebar";
// import { Separator } from "@/components/ui/separator";

export default function MoaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  //   const noSidebarRoutes = ["/login", "/register"];
  const noNavRoutes = ["/login", "/register"];
  const hideNav = noNavRoutes.includes(pathname);

  //   const hideSidebar = noSidebarRoutes.includes(pathname);

  //   if (hideSidebar) return <>{children}</>;

  return (
    <EntityAuthContextProvider>
      <div className="flex h-full flex-col">
        {!hideNav && <MoaTopbar />}

        {hideNav ? (
          // No classes for login/register
          <>{children}</>
        ) : (
          // Default styled container for everything else
          <main className="mx-auto flex w-4xl flex-1 flex-col gap-6 overflow-hidden p-6">
            {children}
          </main>
        )}
      </div>
    </EntityAuthContextProvider>
  );
}
