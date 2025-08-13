import Detail from "@/components/univ/dashboard/Detail";
import { CompanyRequest } from "@/types/company-request";

export default function CompanyDetails({ req }: { req: CompanyRequest }) {
  const reason = (req as any).notes ?? req.reason ?? "";

  return (
    <section className="rounded-lg border bg-white p-4">
      <div className="pb-2">
        <h2 className="text-lg font-semibold">Company Details</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Detail label="Company Name" value={req.companyName} />
        {/* <Detail label="TIN" value={req.tin} /> */}
        <Detail label="Contact Person" value={req.contactPerson} />
        <Detail label="Email Address" value={req.email} />
        {/* <Detail label="Industry" value={req.industry} /> */}
        <Detail label="Submitted" value={req.submittedAt} />
        <div className="sm:col-span-2">
          <div className="text-muted-foreground mb-1 text-sm">Reason</div>
          <p className="text-sm">{reason.trim() || "--"}</p>
        </div>
      </div>
    </section>
  );
}
