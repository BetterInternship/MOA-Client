import StatusChip from "@/components/univ/dashboard/StatusChip";
import { CompanyRequest } from "@/types/company-request";

export default function RequestMeta({ req }: { req: CompanyRequest }) {
  return (
    <section className="rounded-lg border bg-white p-4">
      <div className="pb-2">
        <h2 className="text-lg font-semibold">Request</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-muted-foreground text-sm">Current Status</div>
          <div className="mt-1">
            <StatusChip status={req.status} />
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-sm">Submitted On</div>
          <div className="mt-1 font-medium">{req.submittedAt}</div>
        </div>
      </div>
    </section>
  );
}
