"use client";

import { useRef, useState } from "react";
import { CheckCircle2, CircleX, SendHorizonal } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileUpload, FileUploadRef } from "@/components/ui/file-upload";

type Props = {
  onApprove?: (note: string) => Promise<void>;
  onDeny?: (note: string) => Promise<void>;
  onRespond: (note: string, file?: File) => Promise<void>;
  loading?: boolean;
  allowUpload?: boolean;
};

export default function MoaRequestResponseActions({
  onApprove,
  onDeny,
  onRespond,
  loading,
  allowUpload = false,
}: Props) {
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const ref = useRef<FileUploadRef>(null);

  return (
    <section className="space-y-2 border-t-2 bg-white p-4 px-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Respond</h2>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {!!onDeny && (
            <Button
              variant="outline"
              scheme="destructive"
              disabled={loading}
              onClick={() => onDeny(note).then(() => setNote(""))}
            >
              <CircleX />
              Send as Denial
            </Button>
          )}
          <Button
            className=""
            disabled={loading}
            onClick={() =>
              onRespond(note, file ?? undefined).then(
                () => (setNote(""), setFile(null), ref.current?.clear())
              )
            }
          >
            <SendHorizonal />
            Send as Clarification
          </Button>
          {!!onApprove && (
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              disabled={loading}
              onClick={() => onApprove(note).then(() => setNote(""))}
            >
              <CheckCircle2 className="h-4 w-4" />
              Send as Approval
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-3">
        <Textarea
          rows={3}
          disabled={loading}
          placeholder="Optional note for the decision (will be included in the notification)."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {allowUpload && (
          <div className="pb-4">
            <FileUpload
              ref={ref}
              label="Revised MOA Document"
              name="revised_moa"
              accept="application/pdf"
              placeholder="Click to upload a revised version of the MOA"
              onFileSelect={(file) => {
                setFile(file);
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
