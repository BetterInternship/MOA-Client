// components/univ/dashboard/CompanyDetails.tsx
"use client";

import CompanyRequestHistory from "@/components/univ/shared/CompanyRequestHistory";
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
    <section className="h-full space-y-6 overflow-y-auto p-4">
      <MoaDetailsCard
        companyId={view.id}
        status={view.badgeStatus}
        validUntil={view.validUntil}
        loading={loading}
      />

      <CompanyInfoCard
        id={view.id}
        name={view.name}
        contactPerson={view.contactPerson}
        email={view.email}
        phone={view.phone}
      />

      {/* <DocumentsCard documents={view.documents} /> */}

      <CompanyRequestHistory req={reqData} />

      <ActionsBar
        onBlacklist={() => {
          /* TODO: hook up blacklist API */
        }}
      />
    </section>
  );
}
