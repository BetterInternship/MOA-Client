// components/docs/VerificationDetailsCard.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
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

export function VerificationDetailsCard({ result }: { result: ValidVerification }) {
  const isValid = result.status === "valid";

  const signatoriesText = result.signatories?.length
    ? result.signatories.map((s) => (s.title ? `${s.name} — ${s.title}` : s.name)).join(", ")
    : "--";

  const notarizedText = result.notarizedBy?.length
    ? result.notarizedBy.map((n) => (n.title ? `${n.name} — ${n.title}` : n.name)).join(", ")
    : "--";

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
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
        <div className="grid gap-3 sm:grid-cols-2">
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
            value={signatoriesText}
          />
          <MetaRow
            icon={<Stamp className="h-4 w-4" />}
            label="Notarized By"
            value={notarizedText}
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
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(result.meta).map(([k, v]) => (
                <MetaRow key={k} label={k} value={v} />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={result.viewUrl} target="_blank" rel="noopener">
              View Official Copy <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          {result.downloadUrl && (
            <Button asChild variant="outline">
              <Link href={result.downloadUrl} target="_blank" rel="noopener">
                Download
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
