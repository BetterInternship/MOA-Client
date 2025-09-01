"use client";

import { useRef, useState } from "react";
import { CircleX, SendHorizonal, SquareArrowOutUpRight } from "lucide-react";
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
            onClick={() => {
              if (!note.trim()) return alert("You cannot send an empty clarification.");
              onRespond(note, file ?? undefined).then(
                () => (setNote(""), setFile(null), ref.current?.clear())
              );
            }}
          >
            <SendHorizonal />
            Send as Clarification
          </Button>
          {!!onApprove && (
            <Button
              scheme="supportive"
              disabled={loading}
              onClick={() => onApprove(note).then(() => setNote(""))}
            >
              <SquareArrowOutUpRight className="h-4 w-4" />
              Sign and Approve
            </Button>
          )}
        </div>
      </div>
      <div className="max-w-[600px] min-w-[600px] space-y-3">
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
