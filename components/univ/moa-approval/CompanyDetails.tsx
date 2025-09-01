import { MoaRequest } from "@/types/db";

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className="text-sm">{value ?? "—"}</div>
    </div>
  );
}

export default function CompanyDetails({ req }: { req: MoaRequest }) {
  return (
    <section className="rounded-lg border bg-white p-4">
      <div className="pb-2">
        <h2 className="text-lg font-semibold">Company Details</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Row label="Company Name" value={req.companyName} />
        {/* <Row label="TIN" value={req.tin} /> */}
        <Row label="Contact Person" value={req.contactPerson} />
        <Row label="Email Address" value={req.email} />
        {/* <Row label="Industry" value={req.industry} /> */}
        <Row label="Notes" value={req.notes}></Row>
      </div>
    </section>
  );
}
