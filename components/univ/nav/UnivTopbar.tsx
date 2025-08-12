"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

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
import Image from "next/image";

type NavLink = {
  href: string;
  label: React.ReactNode;
  match: string[];
};


const NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: <Home className="h-4 w-4 mt-0.5" />, match: ["/dashboard"] },
  { href: "/companies", label: "Browse Companies", match: ["/companies"] },
  { href: "/company-registration", label: "Company Approval", match: ["/company-registration"] },
  { href: "/moa-request", label: "MOA Approval", match: ["/moa", "/moa-request"] },
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

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <header className="bg-background/80 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between gap-4 px-4">
        {/* Left: Brand + Nav */}
        <div className="flex min-w-0 items-center gap-3">
          <Image src="/betterinternship-logo.png" alt="Logo" width={28} height={28} priority />
          <Image src="/dlsu-logo.png" alt="Logo" width={28} height={28} priority />

          <Link href="/dashboard" className="shrink-0 font-semibold">
            BetterInternship | De La Salle University
          </Link>

          {/* Scrollable nav on mobile */}
          <nav className="ml-2 hidden gap-2 sm:flex">
            {NAV_LINKS.map((item) => (
              <Fragment key={item.href}>
                <NavItem item={item} pathname={pathname} />
              </Fragment>
            ))}
          </nav>

          <nav className="-mx-2 flex min-w-0 gap-1 overflow-x-auto px-2 sm:hidden">
            {NAV_LINKS.map((item) => (
              <NavItem key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>
        </div>

        {/* Right: User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src="" alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">User</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
