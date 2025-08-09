"use client";

import { usePathname } from "next/navigation";
import MoaTopbar from "@/components/nav/MoaTopbar";
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
     <>
      {!hideNav && <MoaTopbar />}
      <main className="flex flex-col gap-6 p-6 max-w-screen-xl mx-auto">
        {children}
      </main>
    </>
    // <SidebarProvider>
    //   <MoaSidebar />
    //   <SidebarInset>
    //     <header className="flex h-16 items-center gap-2 px-4 border-b">
    //       <SidebarTrigger className="-ml-1" />
    //       <Separator
    //         orientation="vertical"
    //         className="mr-2 data-[orientation=vertical]:h-4"
    //       />
    //       <h1 className="text-lg font-semibold text-gray-700">BetterInternship</h1>
    //     </header>

    //     <main className="flex flex-col gap-6 p-6">{children}</main>
    //   </SidebarInset>
    // </SidebarProvider>
  );
}
