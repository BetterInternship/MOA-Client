"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Fragment, useMemo } from "react";
import { useSchoolAuth } from "@/app/providers/school-auth-provider";

type NavLink = {
  href: string;
  label: React.ReactNode;
  match: string[];
};

const NAV_LINKS: NavLink[] = [
  { href: "/entities", label: "Browse Entities", match: ["/entities"] },
  { href: "/entity-approval", label: "Entity Approval", match: ["/entity-approval"] },
  { href: "/moa-approval", label: "MOA Approval", match: ["/moa", "/moa-approval"] },
];

function useIsActive(pathname: string, patterns: string[]) {
  return useMemo(
    () => patterns.some((base) => pathname === base || pathname.startsWith(base + "/")),
    [pathname, patterns]
  );
}

function NavItem({ item, pathname }: { item: NavLink; pathname: string }) {
  const active = useIsActive(pathname, item.match);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative rounded-md px-3 py-1.5 text-sm transition-colors",
        "text-muted-foreground hover:text-foreground hover:bg-accent",
        active && "bg-accent text-foreground"
      )}
      data-active={active}
    >
      {item.label}
      {/* active underline */}
      <span
        className={cn(
          "pointer-events-none absolute inset-x-2 -bottom-1 h-0.5 rounded",
          active && "opacity-100"
        )}
      />
    </Link>
  );
}

export default function UnivTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useSchoolAuth();

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  return (
    <header className="bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between gap-4 px-4">
        {/* Left: Brand + Nav */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/betterinternship-logo.png" alt="Logo" width={28} height={28} />
              <span className="font-semibold">MOA Management Tool</span>
            </Link>
          </div>

          {/* Scrollable nav on mobile */}
          <nav className="ml-2 hidden gap-2 sm:flex">
            {NAV_LINKS.filter(
              (n) => auth.schoolAccount?.role === "superuser" || n.href !== "/company-registration"
            ).map((item) => (
              <Fragment key={item.href}>
                <NavItem item={item} pathname={pathname} />
              </Fragment>
            ))}
          </nav>

          <nav className="-mx-2 flex min-w-0 gap-1 overflow-x-auto px-2 sm:hidden">
            {NAV_LINKS.filter((n) => !auth.school || n.href !== "/company-registration").map(
              (item) => (
                <NavItem key={item.href} item={item} pathname={pathname} />
              )
            )}
          </nav>
        </div>

        {/* Right: User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <span className="hidden sm:inline">{auth.schoolAccount?.name ?? "Loading..."}</span>
              <ChevronDown className="mt-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            <span className="p-2 text-xs tracking-tight">{auth.schoolAccount.email}</span>
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:cursor-pointer">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
