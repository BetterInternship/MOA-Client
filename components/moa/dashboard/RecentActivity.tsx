"use client";

import Link from "next/link";

export type RecentItem = {
  id: string;
  type: "Standard" | "Negotiated" | string;
  status: string;
  date: string; // e.g., "Aug 7, 2025"
};

export default function RecentActivity({ items }: { items: RecentItem[] }) {
  return (
    <div className="rounded-lg border bg-white p-6 lg:col-span-2">
      <div className="pb-3">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
      </div>
      <div>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No recent activity yet.</p>
        ) : (
          <div className="divide-y">
            {items.map((r) => (
              <div
                key={r.id}
                // href={`/dashboard/status/${r.id}`}
                className="flex items-center justify-between rounded-md px-2 py-3 transition"
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
