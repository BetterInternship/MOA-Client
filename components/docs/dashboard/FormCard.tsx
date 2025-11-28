"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "date-fns";

export interface DisplayInfo {
  "student.full-name:default"?: string;
  "student.id-number:default"?: string;
  "student.email:default"?: string;
  "student.program:default"?: string;
  "student.school:default"?: string;
  "entity.legal-name:default"?: string;
  "entity.legal-name:student-filled"?: string;
}

export interface FormCardProps {
  title: string;
  requestedAt: string | number | Date; // ISO or Date
  downloadUrl?: string;
  className?: string;
  displayInfo?: DisplayInfo;
  isCoordinator: boolean;
}

function getDisplayValue(
  info: DisplayInfo | undefined,
  section: string,
  key: string,
  preferredSuffixes: string[] = ["student-filled", "default"]
): string | undefined {
  if (!info) return undefined;
  const flat = info as Record<string, any>;

  for (const sfx of preferredSuffixes) {
    const composed = `${section}.${key}:${sfx}`;
    if (Object.prototype.hasOwnProperty.call(flat, composed) && flat[composed]) {
      return String(flat[composed]);
    }
  }

  const plain = `${section}.${key}`;
  if (Object.prototype.hasOwnProperty.call(flat, plain) && flat[plain]) {
    return String(flat[plain]);
  }

  const foundKey = Object.keys(flat).find((k) => k.startsWith(`${section}.${key}:`) && flat[k]);
  return foundKey ? String(flat[foundKey]) : undefined;
}

export default function FormCard({
  title,
  requestedAt,
  downloadUrl,
  className = "",
  displayInfo,
  isCoordinator,
}: FormCardProps) {
  const requested =
    requestedAt instanceof Date
      ? requestedAt
      : new Date(typeof requestedAt === "string" ? requestedAt : Number(requestedAt));

  const company =
    getDisplayValue(displayInfo, "entity", "legal-name", ["student-filled", "default"]) || "—";
  const requester = getDisplayValue(displayInfo, "student", "full-name", ["default"]) || "—";
  const id = getDisplayValue(displayInfo, "student", "id-number", ["default"]) || "—";
  const email = getDisplayValue(displayInfo, "student", "email", ["default"]) || "—";
  const program = getDisplayValue(displayInfo, "student", "program", ["default"]) || "—";
  const school = getDisplayValue(displayInfo, "student", "school", ["default"]) || "—";

  return (
    <Card
      className={`w-full ${className} border-border rounded-lg border transition-shadow hover:shadow-md`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1">
            {/* Title and company */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
              <h3 className="truncate text-sm font-semibold">{title}</h3>
            </div>

            {/* Requested date */}
            <div className="text-muted-foreground mt-1 text-xs">
              Requested: {formatDate(requested, "PPPp")}
            </div>

            {/* Student info grid, responsive */}
            <div className="mt-3 space-y-1 text-xs">
              <div className="flex flex-col sm:flex-row">
                <span className="text-muted-foreground w-36 tracking-wide uppercase">
                  Requester:
                </span>
                <span className="truncate font-medium sm:ml-2">{requester}</span>
              </div>
              {isCoordinator && (
                <div className="flex flex-col sm:flex-row">
                  <span className="text-muted-foreground w-36 tracking-wide uppercase">
                    Student ID Number:
                  </span>
                  <span className="truncate font-medium sm:ml-2">{id}</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row">
                <span className="text-muted-foreground w-36 tracking-wide uppercase">Email:</span>
                <span className="truncate font-medium sm:ml-2">{email}</span>
              </div>
              <div className="flex flex-col sm:flex-row">
                <span className="text-muted-foreground w-36 tracking-wide uppercase">Program:</span>
                <span className="truncate font-medium sm:ml-2">{program}</span>
              </div>
              <div className="flex flex-col sm:flex-row">
                <span className="text-muted-foreground w-36 tracking-wide uppercase">School:</span>
                <span className="truncate font-medium sm:ml-2">{school}</span>
              </div>
              {isCoordinator && (
                <div className="flex flex-col sm:flex-row">
                  <span className="text-muted-foreground w-36 tracking-wide uppercase">
                    Company Name:
                  </span>
                  <span className="truncate font-medium sm:ml-2">{company}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-2 flex flex-row items-start justify-between gap-2 sm:mt-0 sm:flex-col sm:items-end">
            {downloadUrl ? (
              <Button size="sm" onClick={() => window.open(downloadUrl, "_blank")}>
                Download
              </Button>
            ) : (
              <div className="text-muted-foreground text-xs">Pending</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
