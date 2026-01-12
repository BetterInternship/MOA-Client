import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, FileText, Hash, PaperclipIcon, ShieldAlert, User } from "lucide-react";
import { MetaRow } from "./MetaRow";
import { formatWhen } from "@/lib/format";
import { IFormSignatory } from "@betterinternship/core/forms";
import { Badge } from "../ui/badge";

interface DocResponse {
  url: string;
  signatories?: { name: string; title: string }[];
  date_made?: string;
  form_label?: string;
  uploaded_at?: string;
  code?: string;
  verification_code?: string;
}

function PeopleList({ list }: { list?: IFormSignatory[] }) {
  if (!list || list.length === 0) return <>--</>;
  return (
    <div className="space-y-1">
      {list.map((p, i) => (
        <div key={i}>
          <span className="font-semibold">
            {p.honorific ?? ""} {p.name}
          </span>
          {p.title && p.name && (
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

export function VerificationDetailsCard({ document }: { document: DocResponse }) {
  const date = document.date_made || document.uploaded_at;
  const hasSignatures = !!document.signatories?.length;

  return (
    <Card className="bg-white">
      {hasSignatures && (
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2">
            <Badge type="supportive" className="gap-1.5 text-sm">
              {hasSignatures ? (
                <ShieldAlert className="h-4 w-4" />
              ) : (
                <PaperclipIcon className="h-4 w-4" />
              )}
              {hasSignatures ? "Signed Document" : "Filled-out Document"}
            </Badge>
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className="space-y-5">
        <div className="grid gap-3">
          <MetaRow
            icon={<Hash className="h-4 w-4" />}
            label="Serial"
            value={document.verification_code ?? document.code}
          />
          <MetaRow
            icon={<FileText className="h-4 w-4" />}
            label="Title"
            value={document.form_label ?? "Unspecified Document"}
          />
          {date && (
            <MetaRow
              icon={<Clock className="h-4 w-4" />}
              label="Signed On"
              value={formatWhen(date)}
            />
          )}
          {document.signatories?.length ? (
            <MetaRow
              icon={<User className="h-4 w-4" />}
              label="Signatories"
              value={<PeopleList list={document.signatories as IFormSignatory[]} />}
            />
          ) : (
            <MetaRow
              icon={<User className="h-4 w-4" />}
              label="Signatories"
              value={<div className="italic ">No signatories</div>}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
