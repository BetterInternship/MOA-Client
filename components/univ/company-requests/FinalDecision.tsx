"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Props = {
  onApprove: (note: string) => Promise<void> | void;
  onDeny: (note: string) => Promise<void> | void;
  loading?: boolean;
};

export default function FinalDecision({ onApprove, onDeny, loading }: Props) {
  const [note, setNote] = useState("");

  async function handleApprove() {
    await onApprove(note.trim());
    setNote("");
  }
  async function handleDeny() {
    await onDeny(note.trim());
    setNote("");
  }

  return (
    <section className="space-y-3 rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Final Decision</h2>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            className="gap-2 border-rose-300 text-rose-700 hover:bg-rose-50"
            disabled={!!loading}
            onClick={handleDeny}
          >
            <XCircle className="h-4 w-4" />
            {loading ? "Denying…" : "Deny"}
          </Button>
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            disabled={!!loading}
            onClick={handleApprove}
          >
            <CheckCircle2 className="h-4 w-4" />
            {loading ? "Approving…" : "Approve"}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <Textarea
          rows={3}
          placeholder="Optional note for the decision (will be included in the notification)."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              // default to approve on Cmd/Ctrl+Enter
              void handleApprove();
            }
          }}
        />
      </div>
    </section>
  );
}
