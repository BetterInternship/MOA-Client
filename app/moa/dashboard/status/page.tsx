"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useMoaRequests } from "@/app/api/entity.api";
import { useEntities } from "@/app/api/school.api";
import { Entity, MoaRequest } from "@/types/db";
import { formatWhen } from "@/lib/format";

type UiItem = {
  id: string;
  company: string;
  type: "Standard" | "Negotiated" | string;
  submitted: string; // already formatted by API
  status: "Approved" | "Pending" | "Rejected" | string;
};

function getStatusBadge(status: string) {
  switch (status) {
    case "Approved":
      return <Badge variant="success">Approved</Badge>;
    case "Pending":
      return <Badge variant="secondary">Pending</Badge>;
    case "Rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export default function StatusPage() {
  const [items, setItems] = useState<MoaRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const moaRequests = useMoaRequests();
  const entities = useEntities();

  useEffect(() => {
    setItems(moaRequests.requests ?? []);
  }, [moaRequests]);

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">MOA Status</h1>
        <p className="text-muted-foreground text-sm">
          Track the progress of your submitted Memorandum of Agreement requests.
        </p>
      </div>

      {loading ? (
        <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
          Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
          You currently have no submitted MOA requests.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.toReversed().map((moa) => (
            <Card key={moa.id}>
              <CardContent className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-foreground text-lg font-semibold">
                    {entities.entities?.find((e: Entity) => e.id === moa.entity_id)?.display_name}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Submitted on {formatWhen(moa.timestamp)}
                  </p>
                </div>
                <div>{getStatusBadge(moa.outcome ?? "")}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
