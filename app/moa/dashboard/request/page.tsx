"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Standard MOA */}
        <Card className="p-6 transition-shadow hover:shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <h2 className="text-foreground text-xl font-semibold">Standard MOA</h2>
              <Badge variant="default">Recommended</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Use our pre-approved template for common partnerships.
            </p>
            <div className="text-muted-foreground text-xs">
              Processing time: <span className="font-medium">1–2 business days</span>
            </div>
            <Button
              onClick={() => router.push("/standard")}
              variant="outline"
              className="mt-auto w-fit"
            >
              Get Started
            </Button>
          </div>
        </Card>

        {/* Negotiated MOA */}
        <Card className="p-6 transition-shadow hover:shadow-lg">
          <div className="flex flex-col gap-4">
            <h2 className="text-foreground text-xl font-semibold">Negotiated MOA</h2>
            <p className="text-muted-foreground text-sm">
              Submit custom terms for specialized partnerships requiring unique conditions.
            </p>
            <div className="text-muted-foreground text-xs">
              Processing time: <span className="font-medium">2–4 weeks</span>
            </div>
            <Button
              onClick={() => router.push("/negotiated")}
              variant="outline"
              className="mt-auto w-fit"
            >
              Get Started
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
