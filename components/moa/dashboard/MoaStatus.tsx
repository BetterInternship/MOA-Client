// components/moa/dashboard/MoaStatus.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import StatusBadge from "./StatusBadge";
import { cn } from "@/lib/utils";
import type { MoaStatus } from "@/types/moa";
import { MoaRequest } from "@/types/db";
import { formatWhen } from "@/lib/format";
import { useDocsControllerGetMoaSignedDocument } from "@/app/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Props = {
  requests: MoaRequest[];
  loading?: boolean;
  title?: string;
};

const statusColors: Record<MoaStatus, string> = {
  Active: "bg-emerald-50 border-emerald-200",
  Inactive: "bg-gray-50 border-gray-200",
  Approved: "bg-emerald-50 border-emerald-200",
  Rejected: "bg-rose-50 border-rose-200",
  "Needs Info": "bg-yellow-50 border-yellow-200",
  "Under Review": "bg-blue-50 border-blue-200",
  Pending: "bg-muted border-muted",
};

export default function MoaStatus({ requests, loading, title = "MOA Status" }: Props) {
  const moa = (requests ?? []).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];
  const signedDocument = useDocsControllerGetMoaSignedDocument(moa?.id ?? "");

  return (
    <section aria-label={title} className="space-y-4">
      <h2 className="text-foreground text-2xl font-semibold">{title}</h2>

      {loading ? (
        <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
          Loading…
        </div>
      ) : !moa ? (
        <div className="text-muted-foreground rounded-md border border-blue-200 bg-blue-50 p-6 text-sm">
          No MOA on file yet.
        </div>
      ) : (
        <Card className={cn(statusColors[moa.outcome as MoaStatus] || "bg-white")}>
          <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <div className="text-muted-foreground flex flex-col gap-1">
                <span className="">
                  Requested at <span className="font-semibold">{formatWhen(moa.timestamp)}</span>
                </span>
                <span className="">
                  Document Verification Code:{" "}
                  <pre className="inline-block rounded-[0.25em] bg-gray-200 px-2 py-1 hover:cursor-pointer">
                    {signedDocument.data?.signedDocument?.verification_code ?? "loading..."}
                  </pre>
                  <div className="gap-2">
                    <Button asChild>
                      <a
                        href={signedDocument.data?.signedDocument?.url ?? "/not-found"}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download MOA
                      </a>
                    </Button>
                  </div>
                </span>
              </div>
            </div>
            <StatusBadge status={moa.outcome ?? ""} className="text-base font-semibold uppercase" />
          </CardContent>
        </Card>
      )}
    </section>
  );
}
