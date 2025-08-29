import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, FileText, Hash, ShieldAlert, ShieldCheck, User, Stamp } from "lucide-react";
import { MetaRow } from "./MetaRow";
import { formatWhen } from "@/lib/format";
import { SignedDocument } from "@/types/db";

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

export function VerificationDetailsCard({ signedDocument }: { signedDocument: SignedDocument }) {
  const isValid = Date.parse(signedDocument.expiry_date) > new Date().getTime();

  return (
    <Card className="bg-white">
      <CardHeader className="">
        <CardTitle className="flex items-center gap-2">
          {/* Result */}
          <Badge variant={isValid ? "success" : "warning"} className="gap-1.5 text-sm">
            {isValid ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
            {isValid ? "Active Document" : "Expired"}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3">
          <MetaRow
            icon={<Hash className="h-4 w-4" />}
            label="Serial"
            value={signedDocument.verification_code}
          />
          <MetaRow
            icon={<FileText className="h-4 w-4" />}
            label="Title"
            value={"Memorandum of Agreement"}
          />
          <MetaRow
            icon={<Clock className="h-4 w-4" />}
            label="Effective Since"
            value={formatWhen(signedDocument.effective_date)}
          />
          <MetaRow
            icon={<Clock className="h-4 w-4" />}
            label="Expires On"
            value={formatWhen(signedDocument.expiry_date)}
          />
          <MetaRow
            icon={<User className="h-4 w-4" />}
            label="Signatories"
            value={<PeopleList list={signedDocument.signatories} />}
          />
          {/* <MetaRow
            icon={<Stamp className="h-4 w-4" />}
            label="Notarized By"
            value={<PeopleList list={[{ name: "Atty. Liza Mendoza", title: "Notary Public" }]} />}
          /> */}
        </div>

        {signedDocument.inputs_hash && (
          <div className="text-muted-foreground text-xs">
            SHA-256: <code className="break-all">{signedDocument.inputs_hash}</code>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
