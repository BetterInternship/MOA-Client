"use client";

import { useRequestThread } from "@/app/api/entity.api";
import { useRouter, useSearchParams } from "next/navigation";
import { validate } from "uuid";

export function MoaSigningPage() {
  const params = useSearchParams();
  const requestId = params.get("id");
  const router = useRouter();
  const requestThread = useRequestThread(requestId);

  // Check if valid id
  if (!requestId || !validate(requestId)) return router.push("/dashboard");

  return (
    <div className="flex flex-row items-center justify-center">
      <iframe
        className="h-[100%] min-h-[720px] w-full"
        src={requestThread.latestDocument?.document_url}
      ></iframe>
    </div>
  );
  // console.log(requestThread.latestDocument);
}

export default MoaSigningPage;
