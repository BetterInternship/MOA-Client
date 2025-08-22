"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MoaActions from "@/components/moa/dashboard/MoaActions";

export default function RequestMOA() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">
          Request a Memorandum of Agreement
        </h1>
        <p className="text-muted-foreground text-sm">
          Choose the type of MOA that best fits your partnership needs.
        </p>
      </div>

      <MoaActions />
    </div>
  );
}
