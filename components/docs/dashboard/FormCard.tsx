"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface FormCardProps {
  title: string;
  requestedAt: string | number | Date; // ISO or Date
  downloadUrl?: string;
  className?: string;
}

export default function FormCard({ title, requestedAt, downloadUrl, className }: FormCardProps) {
  const requested =
    requestedAt instanceof Date
      ? requestedAt
      : new Date(typeof requestedAt === "string" ? requestedAt : Number(requestedAt));

  return (
    <Card className={className}>
      <div className="flex items-center justify-between px-3">
        {/* Top: icon + name + status pill */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <div className="line-clamp-1 text-sm leading-tight font-medium">{title}</div>
            <div className="text-muted-foreground text-xs">{requested.toLocaleString()}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="">
          {downloadUrl ? (
            <Button
              size="sm"
              className="h-8 px-3"
              onClick={() => window.open(downloadUrl, "_blank")}
            >
              Download
            </Button>
          ) : (
            <div className="text-muted-foreground flex h-8 items-center px-3 text-sm">Pending</div>
          )}
        </div>
      </div>
    </Card>
  );
}
