"use client";

import Link from "next/link";

type FooterLink = { label: string; href: string };

const LINKS: FooterLink[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export function Footer({ links = LINKS }: { links?: FooterLink[] }) {
  const year = new Date().getFullYear();

  return (
    <footer className="px-5 py-1">
      <div className="mx-auto">
        <div className="flex justify-center gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-muted-foreground text-center text-xs md:text-left">
            © {year} BetterInternship Inc.
          </p>

          <p className="text-muted-foreground text-xs md:hidden">•</p>

          <nav aria-label="Footer" className="flex justify-center">
            <ul className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs md:gap-x-4">
              {links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-muted-foreground hover:text-primary focus:ring-ring rounded-sm focus:ring-2 focus:outline-none"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
