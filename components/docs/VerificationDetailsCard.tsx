import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  ExternalLink,
  FileText,
  Hash,
  ShieldAlert,
  ShieldCheck,
  User,
  Stamp,
} from "lucide-react";
import { MetaRow } from "./MetaRow";
import { formatWhen } from "@/lib/format";
import type { ValidVerification } from "@/types/docs";

function PeopleList({ list }: { list?: { name: string; title?: string }[] }) {
  if (!list || list.length === 0) return <>--</>;
  return (
    <div className="space-y-1">
      {list.map((p, i) => (
        <div key={i}>
          <span className="font-semibold">{p.name}</span>
          {p.title && (
            <>
              {" "}
              — <span className="text-muted-foreground">{p.title}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export function VerificationDetailsCard({ result }: { result: ValidVerification }) {
  const isValid = result.status === "valid";

  return (
    <Card className="bg-white">
      <CardHeader className="">
        <CardTitle className="flex items-center gap-2">
          {/* Result */}
          <Badge variant={isValid ? "success" : "warning"} className="gap-1.5 text-sm">
            {isValid ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
            {isValid ? "Authentic Document" : "Revoked / Superseded"}
          </Badge>

          <span className="bg-secondary ml-2 rounded-md px-2 py-0.5 text-xs">
            {result.status.toUpperCase()}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3">
          <MetaRow icon={<Hash className="h-4 w-4" />} label="Serial" value={result.serial} />
          <MetaRow
            icon={<FileText className="h-4 w-4" />}
            label="Title"
            value={result.documentTitle}
          />
          <MetaRow
            icon={<Clock className="h-4 w-4" />}
            label="Signed"
            value={formatWhen(result.signedAt)}
          />
          <MetaRow
            icon={<User className="h-4 w-4" />}
            label="Signatories"
            value={<PeopleList list={result.signatories} />}
          />
          <MetaRow
            icon={<Stamp className="h-4 w-4" />}
            label="Notarized By"
            value={<PeopleList list={result.notarizedBy} />}
          />
        </div>

        {result.sha256 && (
          <div className="text-muted-foreground text-xs">
            SHA-256: <code className="break-all">{result.sha256}</code>
          </div>
        )}

        {result.meta && (
          <div>
            <Separator className="my-3" />
            <div className="grid gap-2">
              {Object.entries(result.meta).map(([k, v]) => (
                <MetaRow key={k} label={k} value={v} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
