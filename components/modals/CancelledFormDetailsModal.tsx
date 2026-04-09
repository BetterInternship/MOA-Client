"use client";

import { Button } from "../ui/button";
import useModalRegistry from "../modal-registry";

type CancelledFormDetailsModalProps = {
  rejectionReason?: string | null;
};

export const CancelledFormDetailsModal = ({ rejectionReason }: CancelledFormDetailsModalProps) => {
  const modalRegistry = useModalRegistry();

  return (
    <div className="flex w-full max-w-prose flex-col gap-4">
      <div className="bg-destructive/10 outline-destructive/30 w-full max-w-prose space-y-2 rounded-[0.33em] border border-transparent p-4">
        <p className="text-destructive w-full max-w-prose text-sm leading-6 whitespace-pre-wrap">
          {rejectionReason || "No rejection reason provided."}
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => modalRegistry.cancelledFormDetails.close()}>Close</Button>
      </div>
    </div>
  );
};
