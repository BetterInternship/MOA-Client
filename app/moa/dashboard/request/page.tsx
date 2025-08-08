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
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
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
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold text-foreground">Standard MOA</h2>
              <Badge variant="default">Recommended</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Use our pre-approved template for common partnerships.
            </p>
            <div className="text-xs text-muted-foreground">
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
            <h2 className="text-xl font-semibold text-foreground">Negotiated MOA</h2>
            <p className="text-sm text-muted-foreground">
              Submit custom terms for specialized partnerships requiring unique conditions.
            </p>
            <div className="text-xs text-muted-foreground">
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
