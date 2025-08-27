// components/moa/dashboard/MoaStatus.tsx
"use client";

import StatusBadge from "./StatusBadge";
import type { MoaStatus } from "@/types/moa";
import { MoaRequest } from "@/types/db";
import { formatWhen } from "@/lib/format";
import { useDocsControllerGetMoaSignedDocument } from "@/app/api";
import { Button } from "@/components/ui/button";
import CustomCard from "@/components/shared/CustomCard";
import { useRouter } from "next/navigation";
import { SidebarOpen } from "lucide-react";

type Props = {
  requests: MoaRequest[];
  loading?: boolean;
  title?: string;
};

const statusUpdates: Record<string, string> = {
  pending: "Your MOA is currently under review.",
  approved: "Your MOA is currently active.",
  denied: "Your MOA request has been denied. Click to review their feedback.",
  "waiting-for-entity": "The university has provided feedback on your request. Review it now.",
  "sign-approved": "Your MOA request has been approved and is in need of signing.",
};

export default function MoaStatus({ requests, loading }: Props) {
  const moa = (requests ?? []).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];
  const signedDocument = useDocsControllerGetMoaSignedDocument(moa?.id ?? "");
  const router = useRouter();

  if (!loading && !moa) return <></>;

  return (
    <section className="space-y-4">
      {loading ? (
        <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
          Loading…
        </div>
      ) : (
        <CustomCard className={"bg-white"}>
          <div className="flex flex-row items-start justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <div className="text-muted-foreground flex flex-col gap-1">
                {moa.outcome === "approved" ? (
                  <span className="">
                    Document Verification Code:{" "}
                    <pre className="inline-block rounded-[0.25em] bg-gray-200 px-2 py-1 hover:cursor-pointer">
                      {signedDocument.data?.signedDocument?.verification_code ?? "loading..."}
                    </pre>
                    <div className="mt-2 gap-2">
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
                ) : (
                  <div className="text-lg font-bold tracking-tight">
                    {statusUpdates[moa?.outcome ?? ""] ?? "-"}
                  </div>
                )}
                <span className="">
                  Requested at <span className="font-semibold">{formatWhen(moa.timestamp)}</span>
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={moa.outcome ?? ""} />
              {moa.outcome === "waiting-for-entity" || moa.outcome === "sign-approved" ? (
                <Button scheme="secondary" onClick={() => router.push("/dashboard/review")}>
                  Review Request
                  <SidebarOpen />
                </Button>
              ) : (
                <></>
              )}
              {moa.outcome === "sign-approved"}
            </div>
          </div>
        </CustomCard>
      )}
    </section>
  );
}
