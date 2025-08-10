// /lib/usePersistentSizes.ts
"use client";

import { useEffect, useState } from "react";

export function storageKey(userId?: string) {
  return `moa:asideWidth:${userId ?? "anon"}`;
}

export function usePersistentSizes(key: string, fallback: number[] = [26, 74]) {
  const [sizes, setSizes] = useState<number[] | null>(null);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    setSizes(raw ? JSON.parse(raw) : fallback);
  }, [key, fallback]);

  function onLayout(next: number[]) {
    setSizes(next);
    localStorage.setItem(key, JSON.stringify(next));
  }

  return { sizes, onLayout };
}
