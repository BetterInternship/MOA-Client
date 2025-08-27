"use client";

import { useState } from "react";
import { CheckCircle2, CircleX, SendHorizonal } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Props = {
  onApprove: (note: string) => Promise<void> | void;
  onDeny: (note: string) => Promise<void> | void;
  onRespond: (note: string) => Promise<void> | void;
  loading?: boolean;
};

export default function RequestResponse({ onApprove, onDeny, onRespond, loading }: Props) {
  const [note, setNote] = useState("");

  return (
    <section className="space-y-3 border-t-2 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Respond</h2>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            scheme="destructive"
            disabled={loading}
            onClick={() => onDeny(note)}
          >
            <CircleX />
            Send as Denial
          </Button>
          <Button className="" disabled={loading} onClick={() => onRespond(note)}>
            <SendHorizonal />
            Send as Clarification
          </Button>
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            disabled={loading}
            onClick={() => onApprove(note)}
          >
            <CheckCircle2 className="h-4 w-4" />
            Send as Approval
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        <Textarea
          rows={3}
          placeholder="Optional note for the decision (will be included in the notification)."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </section>
  );
}
