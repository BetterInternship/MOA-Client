"use client";

import { Button } from "@/components/ui/button";

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
    <div
      className={[
        "group bg-background/60 relative rounded-[0.33em] border backdrop-blur-sm",
        "transition-all duration-200 hover:shadow-sm",
        "border-gray-200 dark:border-gray-800",
        className || "",
      ].join(" ")}
      role="article"
    >
      <div className="flex items-center justify-between p-3.5">
        {/* Top: icon + name + status pill */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col">
            <div className="line-clamp-1 text-sm leading-tight font-medium">{title}</div>
            <div className="text-muted-foreground text-[11px]">{requested.toLocaleString()}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="">
          {downloadUrl && (
            <Button
              size="sm"
              className="h-8 px-3"
              onClick={() => window.open(downloadUrl, "_blank")}
            >
              Download
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
