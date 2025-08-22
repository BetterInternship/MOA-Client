// components/univ/dashboard/CompanyDetails.tsx
"use client";

import CompanyHistory from "@/components/univ/shared/CompanyHistory";
import MoaDetailsCard from "./MoaDetailsCard";
import CompanyInfoCard from "./CompanyInfoCard";
import DocumentsCard from "./DocumentsCard";
import ActionsBar from "./ActionsBar";
import { useCompanyDetail } from "@/hooks/useCompanyDetail";
import { Entity } from "@/types/db";

export default function CompanyDetails({ company }: { company: Entity }) {
  const { loading, view, reqData } = useCompanyDetail(company);

  if (!view || !reqData) return null;

  return (
    <section className="h-full space-y-3 overflow-y-auto p-4">
      <MoaDetailsCard
        companyId={view.id}
        companyName={view.name}
        status={view.moaStatus}
        validUntil={view.validUntil}
        loading={loading}
      />

      <CompanyInfoCard
        id={view.id}
        name={view.name}
        contactPerson={view.contactPerson}
        email={view.email}
        phone={view.phone}
        address={view.address}
        type={view.type}
        legalIdentifier={view.legalIdentifier}
      />

      {/* <DocumentsCard documents={view.documents} /> */}

      <CompanyHistory req={reqData} loading={loading} />

      <ActionsBar
        onBlacklist={() => {
          /* TODO: hook up blacklist API */
        }}
      />
    </section>
  );
}
