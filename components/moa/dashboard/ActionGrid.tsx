"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ForwardRefExoticComponent, RefAttributes } from "react";
import type { LucideProps } from "lucide-react";

export type ActionItem = {
  label: string;
  href: string;
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;
  desc: string;
  cta: string;
};

export default function ActionGrid({ actions }: { actions: ActionItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {actions.map((a) => (
        <Link key={a.label} href={a.href} className="group">
          <div className="hover:border-primary/40 h-full rounded-lg border bg-white p-6 transition hover:shadow-sm">
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 text-primary group-hover:bg-primary/20 rounded-md p-3 transition">
                  <a.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{a.label}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">{a.desc}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="bg-primary/80 hover:bg-primary p-2 text-white transition-colors hover:cursor-pointer"
                >
                  {a.cta} →
                </Button>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
