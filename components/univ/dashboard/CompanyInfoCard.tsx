// components/univ/dashboard/cards/CompanyInfoCard.tsx
"use client";

import Detail from "./Detail";

type Props = {
  name?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
};

export default function CompanyInfoCard({ name, contactPerson, email, phone }: Props) {
  return (
    <div className="rounded-[0.33em] border bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">Company Details</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Detail label="Company Name" value={name} />
        <Detail label="Contact Person" value={contactPerson} />
        <Detail label="Email Address" value={email} />
        <Detail label="Phone" value={phone} />
      </div>
    </div>
  );
}
