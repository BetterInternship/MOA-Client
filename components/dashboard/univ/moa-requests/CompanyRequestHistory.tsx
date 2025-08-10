import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoaRequest } from "@/types/moa-request";

export default function CompanyRequestHistory({ req }: { req: MoaRequest }) {
  return (
    <div className="brounded-lg border bg-white p-4">
      <div className="pb-3">
        <h2 className="text-lg font-semibold">Company Request History</h2>
      </div>
      <div>
        <ul className="space-y-4">
          {req.history.map((h, i) => (
            <li key={`${h.date}-${i}`} className="relative pl-4">
              <span className="bg-foreground/70 absolute top-2 left-0 block h-2 w-2 rounded-full" />
              <div className="text-muted-foreground text-xs">{h.date}</div>
              <div className="text-sm">{h.text}</div>
            </li>
          ))}
          {req.history.length === 0 && (
            <li className="text-muted-foreground text-sm">No history yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
