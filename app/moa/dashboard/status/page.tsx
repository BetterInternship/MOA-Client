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
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          MOA Status
        </h1>
        <p className="text-sm text-muted-foreground">
          Track the progress of your submitted Memorandum of Agreement requests.
        </p>
      </div>

      {moaRequests.length === 0 ? (
        <div className="border border-dashed rounded-md p-6 text-center text-muted-foreground text-sm">
          You currently have no submitted MOA requests.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {moaRequests.map((moa) => (
            <Card key={moa.id}>
              <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h2 className="font-semibold text-lg text-foreground">
                    {moa.company}
                  </h2>
                  <p className="text-sm text-muted-foreground">
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
