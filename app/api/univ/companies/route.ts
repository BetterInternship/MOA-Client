// app/api/univ/companies/route.ts
import { NextResponse } from "next/server";
import { listEntities } from "@/lib/mock/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? 100);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  const { items, total } = listEntities({ q, limit, offset });
  // map camelCase -> snake_case for the UI
  const entities = items.map((e) => ({
    id: e.id,
    type: e.type,
    display_name: e.displayName,
    legal_identifier: e.legalIdentifier,
    contact_name: e.contactName ?? null,
    contact_email: e.contactEmail ?? null,
  }));
  return NextResponse.json({ total, entities }, { headers: { "Cache-Control": "no-store" } });
}
