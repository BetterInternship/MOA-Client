"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Props = {
  onSend: (msg: string) => Promise<void> | void;
  loading?: boolean;
};

export default function RequestForResponse({ onSend, loading }: Props) {
  const [message, setMessage] = useState("");

  async function handleSend() {
    const msg = message.trim();
    if (!msg || loading) return;
    await onSend(msg);
    setMessage("");
  }

  return (
    <section className="rounded-lg border bg-white p-4">
      <div className="pb-2">
        <h2 className="text-lg font-semibold">Request for Response</h2>
      </div>
      <div className="space-y-3">
        <Textarea
          rows={4}
          placeholder="Ask for missing documents or clarifications. This will be sent to the contact person."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              void handleSend();
            }
          }}
        />
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="gap-2"
            disabled={!message.trim() || !!loading}
            onClick={handleSend}
          >
            <MessageSquare className="h-4 w-4" />
            {loading ? "Sending…" : "Send Request"}
          </Button>
        </div>
      </div>
    </section>
  );
}
