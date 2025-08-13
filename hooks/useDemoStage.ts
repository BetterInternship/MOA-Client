"use client";

import { useEffect, useState } from "react";
import { DemoRT } from "@/lib/demo-realtime";

type DemoState = { stage: 0 | 1 | 2; signatory: { name: string; title: string } };

export function useDemoStage(options?: { pollMs?: number }) {
  const [state, setState] = useState<DemoState>({ stage: 0, signatory: { name: "", title: "" } });
  const pollMs = options?.pollMs ?? 1500;

  async function fetchState() {
    try {
      // If corp site is on a different subdomain, keep it absolute if needed:
      // const base = process.env.NEXT_PUBLIC_UNIV_ORIGIN ?? "";
      // const res = await fetch(`${base}/api/demo/state`, { cache: "no-store" });
      const res = await fetch(`/api/demo/state`, { cache: "no-store" });
      if (!res.ok) return;
      const js = (await res.json()) as DemoState;
      setState(js);
    } catch {}
  }

  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, pollMs);
    DemoRT.onStage(() => fetchState()); // same-origin instant ping
    return () => clearInterval(id);
  }, [pollMs]);

  return state; // { stage, signatory }
}
