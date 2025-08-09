"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
          <Card className="hover:border-primary/40 h-full bg-white transition hover:shadow-sm">
            <CardContent className="space-y-2 p-5">
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
                <Button variant="ghost" size="sm" className="p-2">
                  {a.cta} →
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
