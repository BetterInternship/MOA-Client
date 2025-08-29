// components/shared/EntityInfoCard.tsx
"use client";

import Detail from "@/components/shared/Row";
import type { Entity } from "@/types/db";

type Props = {
  entity: Entity;
  title?: string;
  children?: React.ReactNode; // drop extra <Detail> rows here later
};

export default function EntityInfoCard({ entity, title = "Company Details", children }: Props) {
  const v = (x?: string | null) => (x && String(x).trim() ? String(x) : "--");
  const name = entity.display_name ?? entity.legal_identifier;
  const status = entity.is_deactivated ? "Deactivated" : "Active";

  return (
    <section className="rounded-lg border bg-white p-4">
      <div className="pb-2">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Detail label="Company Name" value={v(name)} />
        <Detail label="Legal Identifier" value={v(entity.legal_identifier)} />
        <Detail label="Type" value={v(entity.type)} />
        <Detail label="Address" value={v(entity.address)} />
        <Detail label="Contact Person" value={v(entity.contact_name)} />
        <Detail label="Contact Email" value={v(entity.contact_email)} />
        <Detail label="Contact Phone" value={v(entity.contact_phone)} />
        <Detail label="Industry" value={v(entity.industry)} />

        {/* extra rows go here */}
        {children}
      </div>
    </section>
  );
}
