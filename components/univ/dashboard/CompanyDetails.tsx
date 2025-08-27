// components/univ/dashboard/CompanyDetails.tsx
"use client";

import CompanyHistory from "@/components/univ/shared/CompanyHistory";
import MoaDetailsCard from "./MoaDetailsCard";
import CompanyInfoCard from "./CompanyInfoCard";
import ActionsBar from "./ActionsBar";
import { Entity, MoaHistory } from "@/types/db";
import { useState } from "react";

interface MoaHistoryEntry {
  timestamp: string;
  text: string;
  effective_date: string;
  expiry_date: string;
  text: string;
  documents: string;
}

export default function CompanyDetails({
  entity,
  moaHistory,
  loadingHistory = false,
}: {
  entity: Entity;
  moaHistory: MoaHistory;
  loadingHistory?: boolean;
}) {
  const [loading, setLoading] = useState<boolean>(false);
  if (!entity || !moaHistory) return <></>;

  // Grab the latest MOA file URL from history (history already sorted desc by timestamp)
  const history = (moaHistory.history as unknown as MoaHistoryEntry[]) ?? [];
  const latest = history[0];

  return (
    <section className="h-full space-y-3 overflow-y-auto p-4">
      <MoaDetailsCard
        companyId={entity.id}
        companyName={entity.display_name ?? entity.legal_identifier}
        status={entity.moaStatus}
        validUntil={latest?.expiry_date ?? ""} // was history[0].expiry_date
        loading={loading}
        latestMoaUrl={latest?.documents ?? ""} // was history[0].documents
        validUntil={latest?.expiry_date ?? ""}
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

      <CompanyHistory history={history as any} loading={loadingHistory} />

      <ActionsBar
        onBlacklist={() => {
          /* TODO: hook up blacklist API */
        }}
      />
    </section>
  );
}
