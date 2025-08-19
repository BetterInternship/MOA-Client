"use client";

import { usePathname } from "next/navigation";
import UnivTopbar from "@/components/univ/nav/UnivTopbar";

export default function UnivLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noNavRoutes = ["/login", "/register"];
  const hideNav = noNavRoutes.includes(pathname);

  return (
    <>
      {!hideNav && <UnivTopbar />}

      {hideNav ? (
        <>{children}</>
      ) : (
        <main className="mx-auto flex max-w-screen-xl flex-col gap-6 p-6">{children}</main>
      )}
    </>
  );
}
