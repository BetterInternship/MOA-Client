// lib/hooks/useMoaStatus.ts  (CORP APP)
"use client";

import { useEffect, useState } from "react";

// If corp and univ are different origins, set this env var in corp:
// NEXT_PUBLIC_UNIV_ORIGIN=http://univ.localhost:3000
const UNIV_ORIGIN = (typeof process !== "undefined" && process.env.NEXT_PUBLIC_UNIV_ORIGIN) || "";

type DemoState = { stage: 0 | 1 | 2; signatory: { name: string; title: string } };

export function useMoaStatus(pollMs = 1500) {
  const [state, setState] = useState<DemoState>({
    stage: 0,
    signatory: { name: "", title: "" },
  });

  async function fetchState() {
    try {
      const base = UNIV_ORIGIN; // empty => same origin proxy
      const url = base ? `${base}/api/demo/state` : `/api/demo/state`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const js = (await res.json()) as DemoState;
      setState(js);
    } catch {
      // swallow
    }
  }

  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, pollMs);

    // same-origin instant updates (optional but cheap)
    const chan = typeof window !== "undefined" ? new BroadcastChannel("moa-demo") : null;
    const onMsg = (ev: MessageEvent) => {
      if (ev.data?.type === "stage") fetchState();
    };
    chan?.addEventListener("message", onMsg);

    return () => {
      clearInterval(id);
      chan?.removeEventListener("message", onMsg);
      chan?.close?.();
    };
  }, [pollMs]);

  const label = state.stage === 2 ? "Approved" : state.stage === 1 ? "Pending" : "Pending";
  return { ...state, label }; // label is what you can render
}
