"use client";

import { useFormEditor } from "@/app/contexts/form-editor.context";
import { SubscribersPanel } from "@/components/docs/form-editor/form-layout/SubscribersPanel";

export function SubscribersTab() {
  const { formMetadata, updateSubscribers } = useFormEditor();

  if (!formMetadata) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center">
        No form loaded
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <h3 className="text-lg font-semibold">Subscribers</h3>
        <SubscribersPanel
          subscribers={formMetadata.subscribers || []}
          onSubscribersChange={updateSubscribers}
        />
      </div>
    </div>
  );
}
