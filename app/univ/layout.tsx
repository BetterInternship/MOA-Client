"use client";

import { usePathname } from "next/navigation";
import UnivTopbar from "@/components/univ/nav/UnivTopbar";
import { SchoolAuthContextProvider } from "../providers/school-auth-provider";
import { SchoolAuthLoader } from "../loaders/school-auth-loader";

export default function UnivLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noNavRoutes = ["/login", "/register"];
  const hideNav = noNavRoutes.includes(pathname);

  return (
    <SchoolAuthContextProvider>
      {!hideNav && <UnivTopbar />}

      {hideNav ? (
        <>{children}</>
      ) : (
        <SchoolAuthLoader>
          <main className="mx-auto flex max-w-screen-xl flex-col gap-6 p-6">{children}</main>
        </SchoolAuthLoader>
      )}
    </SchoolAuthContextProvider>
  );
}
