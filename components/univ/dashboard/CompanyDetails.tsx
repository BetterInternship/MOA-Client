// components/univ/dashboard/CompanyDetails.tsx
"use client";

import CompanyHistory from "@/components/univ/shared/CompanyHistory";
import MoaDetailsCard from "./MoaDetailsCard";
import CompanyInfoCard from "./CompanyInfoCard";
import ActionsBar from "./ActionsBar";
import { Entity, MoaHistory } from "@/types/db";
import { useState } from "react";

interface MoaHistoryEntry {
  effective_date: string;
  expiry_date: string;
  comments: string;
  documents: string;
}

export default function CompanyDetails({
  entity,
  moaHistory,
}: {
  entity: Entity;
  moaHistory: MoaHistory;
}) {
  const [loading, setLoading] = useState<boolean>(false);
  if (!entity || !moaHistory) return <></>;

  // Grab the latest MOA file URL from history (history already sorted desc by timestamp)
  const history = (moaHistory.history as unknown as MoaHistoryEntry[]) ?? [];

  return (
    <section className="h-full space-y-3 overflow-y-auto p-4">
      <MoaDetailsCard
        companyId={entity.id}
        companyName={entity.display_name ?? entity.legal_identifier}
        status={"Approved"} // ! put proper moa status
        validUntil={history[0].expiry_date} // ! put proper moa expiration
        loading={loading}
        latestMoaUrl={""} // ! put actual latest moa url
      />

      <CompanyInfoCard
        id={entity.id}
        name={entity.display_name ?? entity.legal_identifier}
        contactPerson={entity.contact_name}
        phone={entity.contact_phone}
        address={entity.address}
        type={entity.type}
        legalIdentifier={entity.legal_identifier}
      />

      {/* <DocumentsCard documents={view.documents} /> */}

      <CompanyHistory history={moaHistory.history as any} loading={loading} />

      <ActionsBar
        onBlacklist={() => {
          /* TODO: hook up blacklist API */
        }}
      />
    </section>
  );
}
