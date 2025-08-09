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
          <Card className="h-full transition hover:shadow-sm hover:border-primary/40 bg-white">
            <CardContent className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="rounded-md p-3 bg-primary/10 text-primary transition group-hover:bg-primary/20">
                  <a.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{a.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{a.desc}</p>
                </div>
              </div>
              <div className="justify-end flex">
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
