"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// Dummy data
const moaRequests = [
  {
    id: "MOA-001",
    company: "TechCorp Inc.",
    type: "Standard",
    submitted: "August 1, 2025",
    status: "Pending",
  },
];

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
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-foreground text-3xl font-semibold tracking-tight">MOA Status</h1>
        <p className="text-muted-foreground text-sm">
          Track the progress of your submitted Memorandum of Agreement requests.
        </p>
      </div>

      {moaRequests.length === 0 ? (
        <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
          You currently have no submitted MOA requests.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {moaRequests.map((moa) => (
            <Card key={moa.id}>
              <CardContent className="flex flex-col items-start justify-between gap-2 p-6 sm:flex-row sm:items-center">
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
