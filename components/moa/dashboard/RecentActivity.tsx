"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type RecentItem = {
  id: string;
  type: "Standard" | "Negotiated" | string;
  status: string;
  date: string; // e.g., "Aug 7, 2025"
};

export default function RecentActivity({ items }: { items: RecentItem[] }) {
  return (
    <Card className="bg-white lg:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No recent activity yet.</p>
        ) : (
          <div className="divide-y">
            {items.map((r) => (
              <Link
                key={r.id}
                href={`/dashboard/status/${r.id}`}
                className="hover:bg-accent flex items-center justify-between rounded-md px-2 py-3 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{r.id}</span>
                  <span className="text-muted-foreground text-xs">• {r.type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                    {r.status}
                  </span>
                  <span className="text-muted-foreground text-xs">{r.date}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
