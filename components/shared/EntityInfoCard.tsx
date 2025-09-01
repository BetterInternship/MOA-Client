"use client";

import Detail from "./Row";
import { Separator } from "@/components/ui/separator";

type Props = {
  id: string;
  name: string;
  legalIdentifier: string;
  contactPerson?: string | null;
  type?: string;
  address?: string | null;
  phone?: string | null;
};

export default function EntityInfoCard({
  id,
  name,
  contactPerson,
  phone,
  legalIdentifier,
  type,
  address,
}: Props) {
  return (
    <div className="rounded-[0.33em] border bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">Entity Details</h2>
      <div className="space-y-3">
        <div className="grid gap-4 sm:grid-cols-2">
          <Detail label="Entity Name" value={name} />
          <Detail label="Legal Identifier" value={legalIdentifier} />
          <Detail label="Address" value={address ?? ""} />
          <Detail label="Nature of Business" value={type} className="capitalize" />
        </div>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <Detail label="Contact Person" value={contactPerson ?? ""} />
          <Detail label="Phone" value={phone ?? ""} />
        </div>
      </div>
    </div>
  );
}
