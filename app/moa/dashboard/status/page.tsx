"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
  const [items, setItems] = useState<UiItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        // For mock/demo the API defaults to the first mock entity account.
        // To test a specific company: /api/moa/status?entityId=<uuid>
        const res = await fetch("/api/moa/status", { signal: ctrl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setItems(data.items ?? []);
      } catch (err) {
        if ((err as any).name !== "AbortError") console.error(err);
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

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
          {items.map((moa) => (
            <Card key={moa.id}>
              <CardContent className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-foreground text-lg font-semibold">{moa.company}</h2>
                  <p className="text-muted-foreground text-sm">
                    {moa.type} MOA &middot; Submitted on {moa.submitted}
                  </p>
                </div>
                <div>{getStatusBadge(moa.status)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
