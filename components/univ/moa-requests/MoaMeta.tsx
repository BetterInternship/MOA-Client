import StatusChip from "@/components/univ/dashboard/StatusChip";
import { MoaRequest } from "@/types/moa-request";

export default function RequestMeta({ req }: { req: MoaRequest }) {
  return (
    <section className="rounded-lg border bg-white p-4">
      <div className="pb-3">
        <h2 className="text-lg font-semibold">Request</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-muted-foreground text-sm">Current Status</div>
          <div className="mt-1">
            <StatusChip status={req.status as any} />
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-sm">Requested On</div>
          <div className="mt-1 font-medium">{req.requestedAt}</div>
        </div>
      </div>
    </section>
  );
}
