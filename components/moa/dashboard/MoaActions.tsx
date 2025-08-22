// components/moa/dashboard/MoaActions.tsx
"use client";

import { useRouter } from "next/navigation";
import { ClipboardList, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CustomCard from "@/components/shared/CustomCard";

export default function MoaActions() {
  const router = useRouter();

  const handleStandard = () => router.push("/dashboard/request/standard");
  const handleNegotiated = () => router.push("/dashboard/request/negotiated");

  return (
    <section aria-label="Primary actions" className="flex flex-col gap-5">
      <div className="space-y-1">
        <h2 className="text-foreground text-2xl font-semibold tracking-tight">
          Request MOA Renewal
        </h2>
        <p className="text-muted-foreground text-sm">
          Choose the type of MOA that best fits your partnership needs.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Standard MOA */}
        <div className="hover:border-primary/40 h-full rounded-lg border bg-white p-6 transition hover:shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <h3 className="text-foreground flex items-center gap-2 text-xl font-semibold">
                <FileText className="h-5 w-5" /> Standard MOA
              </h3>
              <Badge type="supportive" className="font-semibold">
                Recommended
              </Badge>
            </div>

            <p className="text-muted-foreground text-sm">
              Use our pre-approved template for common partnerships.
            </p>

            <div className="text-muted-foreground flex items-center gap-1 text-sm">
              <Badge>Processing time: 1 minute</Badge>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleStandard} className="mt-auto w-fit">
                Get Started
              </Button>
            </div>
          </div>
        </div>

        {/* Negotiated MOA */}
        <CustomCard>
          <div className="flex flex-col gap-4">
            <h3 className="text-foreground flex items-center gap-2 text-xl font-semibold">
              <ClipboardList className="h-5 w-5" /> Negotiated MOA
            </h3>
            <p className="text-muted-foreground text-sm">
              Submit custom terms for specialized partnerships requiring unique conditions.
            </p>

            <div className="text-muted-foreground flex items-center gap-1 text-sm">
              <Badge>Processing time: 4 weeks</Badge>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleNegotiated} className="mt-auto w-fit">
                Get Started
              </Button>
            </div>
          </div>
        </CustomCard>
      </div>
    </section>
  );
}
