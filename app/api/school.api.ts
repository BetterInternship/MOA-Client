"use client";

import { useEffect, useState } from "react";
import type { Entity } from "@/types/db";

/** Shape coming from /api/univ/companies (snake_case) */
type ApiEntityRow = {
  id: string;
  type: string;
  display_name: string;
  legal_identifier: string;
  contact_name?: string | null;
  contact_email?: string | null;
};

// Support all possible response shapes:
// - { entities: [...] , total?: number }
// - { items: [...] }
// - [ ... ]
type ApiResp =
  | ApiEntityRow[]
  | {
      entities?: ApiEntityRow[];
      items?: ApiEntityRow[];
      total?: number;
    };

const mapRow = (r: ApiEntityRow): Entity => ({
  id: r.id,
  type: r.type,
  displayName: r.display_name,
  legalIdentifier: r.legal_identifier,
  contactName: r.contact_name ?? undefined,
  contactEmail: r.contact_email ?? undefined,
});

export function useEntities(params?: { q?: string; limit?: number }) {
  const q = params?.q ?? "";
  const limit = params?.limit;
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (limit) sp.set("limit", String(limit));

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/univ/companies?${sp.toString()}`, { cache: "no-store" });
        const json: ApiResp = await res.json();

        // Accept {entities}, {items}, or an array
        const rows: ApiEntityRow[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.items)
            ? json.items!
            : Array.isArray(json?.entities)
              ? json.entities!
              : [];

        const mapped = rows.map(mapRow);
        if (alive) setEntities(mapped);
      } catch (e) {
        console.error("[useEntities] fetch error:", e);
        if (alive) setEntities([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [q, limit]);

  return { entities, loading };
}
