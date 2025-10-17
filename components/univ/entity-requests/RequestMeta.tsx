import StatusChip from "@/components/univ/browse-entities/StatusChip";
import { formatWhen } from "@/lib/format";
import { NewEntityRequet } from "@/types/db";

export default function RequestMeta({ req }: { req: NewEntityRequet }) {
  return (
    <section className="rounded-lg border bg-white p-4">
      <div className="pb-2">
        <h2 className="text-lg font-semibold">{req.entities?.display_name}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-muted-foreground text-sm">Current Status</div>
          <div className="mt-1">
            <StatusChip status={req.outcome} />
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-sm">Submitted On</div>
          <div className="mt-1 font-medium">{formatWhen(req.timestamp)}</div>
        </div>
      </div>
    </section>
  );
}
