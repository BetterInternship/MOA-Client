// app/univ/moa-requests/page.tsx
"use client";

import { useState } from "react";
import { useMoaRequests } from "@/app/api/entity.api";
import EntitySchoolConversation from "@/components/moa/review/EntitySchoolConversation";

export default function ReviewMoaRequestPage() {
  const [selectedId, setSelectedId] = useState<string>("");
  const moaRequests = useMoaRequests();
  const moa = (moaRequests.requests ?? []).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];

  return (
    <div className="flex flex-1 flex-col gap-8 border border-gray-300">
      <EntitySchoolConversation req={moa} />
    </div>
  );
}
